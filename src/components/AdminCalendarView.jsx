import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import CalendarEventModal from './CalendarEventModal.jsx';
import { useRealtime, useRealtimeSubscription } from '../context/RealtimeContext.jsx';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// A small predefined palette for assigning stable colors to doctors
const colorPalette = [
    '#3182ce', // blue-500
    '#38a169', // green-500
    '#d69e2e', // yellow-500
    '#e53e3e', // red-500
    '#805ad5', // purple-500
    '#dd6b20', // orange-500
    '#319795', // teal-500
    '#d53f8c', // pink-500
];

const REALTIME_REFETCH_DEBOUNCE_MS = 400;

export default function AdminCalendarView({ token, apiBaseUrl, currentUser }) {
    const [events, setEvents] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Date range state (default to current month roughly)
    const [currentDate, setCurrentDate] = useState(new Date());

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const { connectionEpoch } = useRealtime();
    const isFirstConnectRef = useRef(true);
    const debounceTimeoutRef = useRef(null);

    // Compute loaded time window [start, end] around currentDate
    const loadedWindow = useMemo(() => {
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
        return { start, end };
    }, [currentDate]);

    // Fetch doctors (users with role 'Médico')
    const fetchDoctors = useCallback(async () => {
        if (currentUser.role === 'Médico') {
            setDoctors([{ username: currentUser.username, name: currentUser.name || currentUser.username, role: 'Médico' }]);
            return;
        }
        
        try {
            const response = await fetch(`${apiBaseUrl}/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const onlyDoctors = data.filter(u => u.role === 'Médico');
                setDoctors(onlyDoctors);
            }
        } catch (err) {
            console.error("Failed to fetch doctors:", err);
        }
    }, [apiBaseUrl, token, currentUser]);

    // Fetch calendar events
    const fetchEvents = useCallback(async ({ silent = false } = {}) => {
        if (!silent) {
            setIsLoading(true);
        }
        setError(null);
        
        const start = loadedWindow.start.toISOString();
        const end = loadedWindow.end.toISOString();

        try {
            const response = await fetch(`${apiBaseUrl}/calendar/events?time_min=${start}&time_max=${end}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                throw new Error("Falha ao carregar agendamentos");
            }
            
            const data = await response.json();
            
            // Map to react-big-calendar format
            const formattedEvents = data.map(e => ({
                id: e.id,
                title: e.summary,
                description: e.description,
                start: new Date(e.start),
                end: new Date(e.end),
                resourceId: e.doctor_id,
                provider: e.provider
            }));
            
            setEvents(formattedEvents);
        } catch (err) {
            if (!silent) {
                setError(err.message);
            } else {
                console.error("Silent calendar refresh failed:", err);
            }
        } finally {
            if (!silent) {
                setIsLoading(false);
            }
        }
    }, [apiBaseUrl, token, loadedWindow]);

    const scheduleSilentRefresh = useCallback(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
            fetchEvents({ silent: true });
        }, REALTIME_REFETCH_DEBOUNCE_MS);
    }, [fetchEvents]);

    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        fetchDoctors();
        fetchEvents();
    }, [fetchDoctors, fetchEvents]);

    // Real-time subscription: refresh immediately when an appointment is created/updated/deleted
    useRealtimeSubscription('calendar_changed', (payload) => {
        const info = payload?.data;
        if (info?.start && info?.end) {
            const eventStart = new Date(info.start);
            const eventEnd = new Date(info.end);
            if (!isNaN(eventStart) && !isNaN(eventEnd)) {
                if (eventEnd < loadedWindow.start || eventStart > loadedWindow.end) {
                    return; // Outside loaded range
                }
            }
        }
        scheduleSilentRefresh();
    });

    // Re-sync after a WebSocket drop & reconnect
    useEffect(() => {
        if (connectionEpoch === 0) return;
        if (isFirstConnectRef.current) {
            isFirstConnectRef.current = false;
            return;
        }
        scheduleSilentRefresh();
    }, [connectionEpoch, scheduleSilentRefresh]);

    // Re-sync when browser tab becomes visible again
    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                scheduleSilentRefresh();
            }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    }, [scheduleSilentRefresh]);

    // Map doctor_ids to a consistent color from the palette
    const doctorColorMap = useMemo(() => {
        const map = {};
        doctors.forEach((doc, index) => {
            map[doc.username] = colorPalette[index % colorPalette.length];
        });
        return map;
    }, [doctors]);

    const eventStyleGetter = (event) => {
        const backgroundColor = doctorColorMap[event.resourceId] || '#cbd5e0'; // fallback gray
        return {
            style: {
                backgroundColor,
                borderRadius: '4px',
                opacity: 0.9,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    // --- Event Handlers ---
    
    const handleSelectSlot = ({ start, end }) => {
        // Create new event
        setSelectedEvent({ start, end });
        setIsModalOpen(true);
    };

    const handleSelectEvent = (event) => {
        // Edit existing event
        setSelectedEvent(event);
        setIsModalOpen(true);
    };

    const handleSaveEvent = async (eventData) => {
        const isUpdate = !!eventData.id;
        const url = isUpdate 
            ? `${apiBaseUrl}/calendar/events/${eventData.id}` 
            : `${apiBaseUrl}/calendar/events`;
        
        try {
            const response = await fetch(url, {
                method: isUpdate ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(eventData)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Falha ao salvar agendamento.');
            }

            // Refresh events
            setIsModalOpen(false);
            fetchEvents();
        } catch (err) {
            alert(`Erro: ${err.message}`);
        }
    };

    const handleDeleteEvent = async (eventId, doctorId) => {
        try {
            const response = await fetch(`${apiBaseUrl}/calendar/events/${eventId}?doctor_id=${doctorId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Falha ao excluir agendamento.');
            }

            setIsModalOpen(false);
            fetchEvents();
        } catch (err) {
            alert(`Erro: ${err.message}`);
        }
    };

    const messages = {
        allDay: 'Dia todo',
        previous: 'Anterior',
        next: 'Próximo',
        today: 'Hoje',
        month: 'Mês',
        week: 'Semana',
        day: 'Dia',
        agenda: 'Agenda',
        date: 'Data',
        time: 'Hora',
        event: 'Evento',
        noEventsInRange: 'Não há eventos neste período.',
        showMore: total => `+ mais ${total}`
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Agenda Unificada</h1>
                    <p className="text-sm text-gray-500 mt-1">Gerencie agendamentos de todos os médicos.</p>
                </div>
                
                {/* Doctor Legend */}
                <div className="flex flex-wrap gap-3 items-center">
                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider mr-2">Médicos:</span>
                    {doctors.map(doc => (
                        <div key={doc.username} className="flex items-center space-x-1">
                            <span 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: doctorColorMap[doc.username] }}
                            ></span>
                            <span className="text-sm text-gray-600">{doc.name || doc.username}</span>
                        </div>
                    ))}
                    {doctors.length === 0 && <span className="text-sm text-gray-400 italic">Nenhum médico encontrado</span>}
                </div>
            </header>

            <div className="flex-1 p-6 overflow-hidden relative">
                {isLoading && (
                    <div className="absolute top-4 right-4 z-10 bg-white px-3 py-1 rounded shadow text-sm font-medium text-blue-600 flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sincronizando...
                    </div>
                )}
                
                {error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded mb-4 border border-red-200">
                        {error}
                    </div>
                )}

                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    culture="pt-BR"
                    messages={messages}
                    selectable
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    onNavigate={(newDate) => setCurrentDate(newDate)}
                    eventPropGetter={eventStyleGetter}
                    views={['month', 'week', 'day', 'agenda']}
                    defaultView="week"
                    popup
                />
            </div>

            <CalendarEventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveEvent}
                onDelete={handleDeleteEvent}
                event={selectedEvent}
                doctors={doctors}
            />
        </div>
    );
}
