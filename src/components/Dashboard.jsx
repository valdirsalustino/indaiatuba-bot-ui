import React, { useState, useEffect, useCallback } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ErrorBar
} from 'recharts';

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#8dd1e1', '#a4de6c', '#d0ed57', '#ffc658'];

const ALL_STATUSES = [
    { id: 'open', label: 'Aberto' },
    { id: 'closed_by_timeout', label: 'Fechado por Inatividade' },
    { id: 'closed_by_assistant', label: 'Fechado pelo Assistente' },
    { id: 'closed_by_user', label: 'Fechado pelo Usuário' }
];

export default function Dashboard({ onClose, apiBaseUrl, token }) {
    const [countChartType, setCountChartType] = useState('bar');
    const [timeChartType, setTimeChartType] = useState('bar');
    
    // Default to excluding 'open' out of convenience since we want to measure duration of closed items
    const [selectedStatuses, setSelectedStatuses] = useState(ALL_STATUSES.filter(s => s.id !== 'open').map(s => s.id));
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!token || !apiBaseUrl) return;
        setLoading(true);
        setError(null);
        try {
            const statusQuery = selectedStatuses.length > 0 ? `?statuses=${selectedStatuses.join(',')}` : '?statuses=none';
            const response = await fetch(`${apiBaseUrl}/analytics/topics${statusQuery}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || 'Falha ao buscar dados analíticos');
            }
            const result = await response.json();
            // Format floats for clean UI
            const formattedResult = result.map(d => ({
                ...d,
                avg_duration_minutes: Number((d.avg_duration_minutes || 0).toFixed(2)),
                stderr_minutes: Number((d.stderr_minutes || 0).toFixed(2))
            }));
            setData(formattedResult);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [apiBaseUrl, token, selectedStatuses]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleStatusToggle = (statusId) => {
        setSelectedStatuses(prev => 
            prev.includes(statusId) 
                ? prev.filter(s => s !== statusId)
                : [...prev, statusId]
        );
    };

    return (
        <div className="flex-1 flex flex-col bg-gray-50 h-full overflow-hidden">
            {/* Header */}
            <header className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shrink-0 shadow-sm">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10"></line>
                            <line x1="12" y1="20" x2="12" y2="4"></line>
                            <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-800">Dashboard Analítico</h1>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-gray-100"
                    title="Fechar Dashboard"
                >
                    <CloseIcon />
                </button>
            </header>

            {/* Filters/Controls Placeholder */}
            <div className="p-4 border-b border-gray-200 bg-white shrink-0 shadow-sm z-10 relative">
                <div className="max-w-7xl mx-auto flex flex-col space-y-2">
                    <span className="text-sm font-semibold text-gray-700">Filtrar por Status da Conversa:</span>
                    <div className="flex flex-wrap items-center gap-3">
                        {ALL_STATUSES.map(status => (
                            <label key={status.id} className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer hover:text-gray-800 transition-colors select-none">
                                <input
                                    type="checkbox"
                                    checked={selectedStatuses.includes(status.id)}
                                    onChange={() => handleStatusToggle(status.id)}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 cursor-pointer"
                                />
                                <span>{status.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="flex-1 overflow-y-auto w-full p-6">
                <div className="max-w-7xl mx-auto space-y-8 flex flex-col items-center justify-start h-full">
                    
                    {error && (
                        <div className="w-full flex flex-col items-center justify-center text-red-500 bg-red-50 rounded-xl border border-red-100 p-6 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="font-semibold">{error}</p>
                            <button onClick={fetchData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded shadow text-sm hover:bg-red-700 transition">
                                Tentar Novamente
                            </button>
                        </div>
                    )}

                    {!loading && !error && data.length === 0 && (
                        <div className="w-full flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300 p-10 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </div>
                            <p className="text-gray-500 mb-1 font-medium">Nenhum dado encontrado para os filtros selecionados.</p>
                            <p className="text-xs text-gray-400">Tente alterar os status da conversa acima para ver os resultados.</p>
                        </div>
                    )}

                    {/* Chart 1: Topic Count */}
                    {(loading || data.length > 0) && (
                        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[500px] flex flex-col relative">
                            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center">
                                    Volume de Conversas por Tópico
                                    {!loading && data.length > 0 && (
                                        <span className="ml-2 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
                                            {data.reduce((acc, curr) => acc + curr.count, 0)} total
                                        </span>
                                    )}
                                </h2>
                                <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
                                    <button onClick={() => setCountChartType('bar')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${countChartType === 'bar' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}>Barras</button>
                                    <button onClick={() => setCountChartType('pie')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${countChartType === 'pie' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}>Pizza</button>
                                </div>
                            </div>
                            
                            <div className="flex-1 w-full relative pb-8">
                                {loading && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-70 z-10 rounded-xl">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-2"></div>
                                        <p className="text-sm text-gray-500 font-medium">Carregando dados...</p>
                                    </div>
                                )}
                                {!loading && data.length > 0 && (
                                    <ResponsiveContainer width="100%" height="100%">
                                        {countChartType === 'bar' ? (
                                            <BarChart data={data} margin={{ top: 30, right: 30, left: 20, bottom: 80 }} style={{ fontFamily: "'Inter', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif" }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                <XAxis dataKey="topic" angle={-45} textAnchor="end" height={100} tick={{ fill: '#4B5563', fontSize: 12, fontWeight: 500 }} interval={0} tickMargin={10} />
                                                <YAxis tick={{ fill: '#4B5563', fontSize: 12 }} allowDecimals={false} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px' }} cursor={{ fill: '#F3F4F6' }} formatter={(value, name) => [`${value} conversas`, name]} labelStyle={{ fontWeight: '600', color: '#1F2937', marginBottom: '4px' }} />
                                                <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} maxBarSize={60}>
                                                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                </Bar>
                                            </BarChart>
                                        ) : (
                                            <PieChart style={{ fontFamily: "'Inter', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif", fontSize: '12px' }}>
                                                <Pie data={data} cx="50%" cy="50%" labelLine={{ stroke: '#9CA3AF', strokeWidth: 1 }} label={({ topic, percent }) => `${topic} (${(percent * 100).toFixed(0)}%)`} outerRadius={120} fill="#8884d8" dataKey="count" nameKey="topic" paddingAngle={2}>
                                                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip formatter={(value, name) => [`${value} conversas`, name]} contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '10px' }} itemStyle={{ color: '#4B5563', fontWeight: '500', fontSize: '13px' }} />
                                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
                                            </PieChart>
                                        )}
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Chart 2: Average Time */}
                    {(loading || data.length > 0) && (
                        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[500px] flex flex-col relative">
                            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center">
                                    Tempo Médio de Conversa
                                </h2>
                                <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
                                    <button onClick={() => setTimeChartType('bar')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${timeChartType === 'bar' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}>Barras</button>
                                    <button onClick={() => setTimeChartType('pie')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${timeChartType === 'pie' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}>Pizza</button>
                                </div>
                            </div>
                            
                            <div className="flex-1 w-full relative pb-8">
                                {loading && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-70 z-10 rounded-xl">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-2"></div>
                                        <p className="text-sm text-gray-500 font-medium">Carregando dados...</p>
                                    </div>
                                )}
                                {!loading && data.length > 0 && (
                                    <ResponsiveContainer width="100%" height="100%">
                                        {timeChartType === 'bar' ? (
                                            <BarChart data={data} margin={{ top: 30, right: 30, left: 20, bottom: 80 }} style={{ fontFamily: "'Inter', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif" }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                <XAxis dataKey="topic" angle={-45} textAnchor="end" height={100} tick={{ fill: '#4B5563', fontSize: 12, fontWeight: 500 }} interval={0} tickMargin={10} />
                                                <YAxis tick={{ fill: '#4B5563', fontSize: 12 }} allowDecimals={true} axisLine={false} tickLine={false} label={{ value: 'Minutos', angle: -90, position: 'insideLeft', offset: -10, style: {fill: '#6B7280', fontSize: '12px'} }} />
                                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px' }} cursor={{ fill: '#F3F4F6' }} formatter={(value, name) => [`${value} minutos`, name]} labelStyle={{ fontWeight: '600', color: '#1F2937', marginBottom: '4px' }} />
                                                <Bar dataKey="avg_duration_minutes" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={60}>
                                                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                    <ErrorBar dataKey="stderr_minutes" width={4} strokeWidth={2} stroke="#374151" direction="y" />
                                                </Bar>
                                            </BarChart>
                                        ) : (
                                            <PieChart style={{ fontFamily: "'Inter', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif", fontSize: '12px' }}>
                                                <Pie data={data} cx="50%" cy="50%" labelLine={{ stroke: '#9CA3AF', strokeWidth: 1 }} label={({ topic, avg_duration_minutes }) => `${topic} (${avg_duration_minutes} min)`} outerRadius={120} fill="#10B981" dataKey="avg_duration_minutes" nameKey="topic" paddingAngle={2}>
                                                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip formatter={(value, name, props) => {
                                                    const stderr = props.payload.stderr_minutes;
                                                    return [`${value} minutos (±${stderr})`, name]
                                                }} contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '10px' }} itemStyle={{ color: '#4B5563', fontWeight: '500', fontSize: '13px' }} />
                                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
                                            </PieChart>
                                        )}
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
