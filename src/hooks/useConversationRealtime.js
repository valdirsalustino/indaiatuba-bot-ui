import { useEffect, useRef } from 'react';
import { useRealtime, useRealtimeSubscription } from '../context/RealtimeContext.jsx';
import { inferContentTypeFromUrl } from '../utils/mediaUtils.js';

const LIFECYCLE_EVENTS = [
    'new_handoff_request',
    'conversation_resolved',
    'supervision_type_changed',
    'conversation_taken_over',
    'conversation_closed',
    'conversation_reopened',
];

function playNotificationSound() {
    try {
        const pingSound = new Audio('/ping.mp3');
        pingSound.play().catch((err) => {
            console.warn('Navegador bloqueou a reprodução de áudio. O usuário precisa interagir com a página primeiro.', err);
        });
    } catch (err) {
        console.error('Erro ao tentar tocar o áudio:', err);
    }
}

function formatAppointmentTime(isoStart, isoEnd) {
    if (!isoStart) return '';
    try {
        const start = new Date(isoStart);
        const dateStr = start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const startTimeStr = start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        if (isoEnd) {
            const end = new Date(isoEnd);
            const endTimeStr = end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            return ` para ${dateStr} das ${startTimeStr} às ${endTimeStr}`;
        }
        return ` para ${dateStr} às ${startTimeStr}`;
    } catch {
        return '';
    }
}

/**
 * Handles all conversation-level and global notification realtime events.
 * Keeps `App.jsx` focused on view state and layout while delegating calendar
 * view refreshes to `AdminCalendarView` via `RealtimeContext`.
 */
export function useConversationRealtime({
    conversationsRef,
    setConversations,
    authFetch,
    apiBaseUrl,
    fetchConversations,
    addToast,
    setActiveView,
    setActiveTab,
    handleSelectConversation,
    currentUser,
}) {
    const { connectionEpoch } = useRealtime();
    const isFirstConnectRef = useRef(true);

    // Re-sync conversations if the WebSocket dropped and reconnected
    useEffect(() => {
        if (connectionEpoch === 0) return;
        if (isFirstConnectRef.current) {
            isFirstConnectRef.current = false;
            return;
        }
        fetchConversations(0, false);
    }, [connectionEpoch, fetchConversations]);

    // 1. New message in a thread
    useRealtimeSubscription('new_message', (data) => {
        if (!data.data) return;

        const isKnownConversation = conversationsRef.current.some(
            (c) => c.composite_id === data.composite_id
        );

        if (!isKnownConversation) {
            authFetch(`${apiBaseUrl}/conversations/${data.composite_id}`)
                .then((res) => {
                    if (res.ok) return res.json();
                    throw new Error('Failed to fetch new conversation');
                })
                .then((newConv) => {
                    setConversations((prev) => {
                        if (prev.some((c) => c.composite_id === newConv.composite_id)) return prev;

                        const reset24hWindow = newConv.is_within_24h_window;
                        const updatedPrev = prev.map((c) => {
                            if (reset24hWindow && c.phone_number === newConv.phone_number) {
                                return { ...c, is_within_24h_window: true };
                            }
                            return c;
                        });

                        return [newConv, ...updatedPrev];
                    });
                })
                .catch((err) => console.error('Error fetching new conversation:', err));
            return;
        }

        setConversations((prevConversations) => {
            const targetIndex = prevConversations.findIndex(
                (c) => c.composite_id === data.composite_id
            );

            if (targetIndex === -1) return prevConversations;

            const targetConv = prevConversations[targetIndex];
            const currentMessages = targetConv.messages || [];

            const incomingCleanMedia = data.data.media_url ? data.data.media_url.split('?')[0] : '';
            const isDuplicate = currentMessages.some((msg) => {
                if (data.data.message_id && msg.message_id) {
                    return msg.message_id === data.data.message_id;
                }
                const msgCleanMedia = msg.media_url ? msg.media_url.split('?')[0] : '';
                return (
                    msg.text === data.data.text &&
                    msg.timestamp === data.data.timestamp &&
                    msgCleanMedia === incomingCleanMedia
                );
            });
            if (isDuplicate) return prevConversations;

            const contentType = data.data.media_url
                ? inferContentTypeFromUrl(data.data.media_url)
                : 'text';

            const newMessage = {
                text: data.data.text,
                sender: data.data.sender,
                timestamp: data.data.timestamp,
                media_url: data.data.media_url,
                download_url: data.data.download_url || data.data.media_url,
                filename: data.data.filename,
                content_type: contentType,
                message_id: data.data.message_id,
                is_edited: data.data.is_edited,
                edited_at: data.data.edited_at,
                status: data.data.status,
            };

            const previewText =
                newMessage.text ||
                (contentType !== 'text'
                    ? `[${contentType.charAt(0).toUpperCase() + contentType.slice(1)}]`
                    : targetConv.last_message);

            const updatedConv = {
                ...targetConv,
                messages: [...currentMessages, newMessage],
                last_message: previewText,
                last_updated: newMessage.timestamp,
                ...(data.data.human_supervision !== undefined && {
                    human_supervision: data.data.human_supervision,
                }),
            };

            const reset24hWindow = newMessage.sender === 'user';
            if (reset24hWindow) {
                updatedConv.is_within_24h_window = true;
            }

            const otherConvs = [
                ...prevConversations.slice(0, targetIndex),
                ...prevConversations.slice(targetIndex + 1),
            ].map((c) => {
                if (reset24hWindow && c.phone_number === targetConv.phone_number) {
                    return { ...c, is_within_24h_window: true };
                }
                return c;
            });

            return [updatedConv, ...otherConvs];
        });
    });

    // 2. In-place message edits
    useRealtimeSubscription('message_edited', (data) => {
        if (!data.data) return;
        setConversations((prevConversations) =>
            prevConversations.map((conv) => {
                if (conv.composite_id !== data.composite_id) return conv;
                return {
                    ...conv,
                    messages: conv.messages.map((msg) => {
                        if (msg.message_id !== data.data.message_id) return msg;
                        return {
                            ...msg,
                            text: data.data.new_text,
                            is_edited: true,
                            edited_at: data.data.edited_at,
                        };
                    }),
                };
            })
        );
    });

    // 3. Message delivery status updates + proactive conversation triggers
    useRealtimeSubscription('status_changed', (data) => {
        if (data.data && data.data.message_id) {
            setConversations((prevConversations) =>
                prevConversations.map((conv) => {
                    const hasMessage = conv.messages?.some(
                        (msg) => msg.message_id === data.data.message_id
                    );
                    if (!hasMessage) return conv;
                    return {
                        ...conv,
                        messages: conv.messages.map((msg) => {
                            if (msg.message_id !== data.data.message_id) return msg;
                            return { ...msg, status: data.data.status };
                        }),
                    };
                })
            );
        } else if (data.composite_id) {
            fetchConversations(0, false);
        }
    });

    // 4. Thread lifecycle changes (handoffs, resolutions, closures, etc.)
    useRealtimeSubscription(LIFECYCLE_EVENTS, (data) => {
        if (data.update === 'new_handoff_request') {
            playNotificationSound();

            addToast('Um cliente solicitou atendimento humano', 'alert', {
                label: 'Acessar',
                onClick: async () => {
                    setActiveView('conversations');
                    setActiveTab('Novos');
                    if (data.composite_id) {
                        const targetConv = conversationsRef.current.find(
                            (c) => c.composite_id === data.composite_id
                        );
                        if (targetConv) {
                            handleSelectConversation(targetConv);
                        } else {
                            try {
                                const res = await authFetch(
                                    `${apiBaseUrl}/conversations/${data.composite_id}`
                                );
                                if (res.ok) {
                                    const newConv = await res.json();
                                    setConversations((prev) => {
                                        if (prev.some((c) => c.composite_id === newConv.composite_id)) {
                                            return prev;
                                        }
                                        return [newConv, ...prev];
                                    });
                                    handleSelectConversation(newConv);
                                }
                            } catch (err) {
                                console.error('Failed to fetch handoff conversation', err);
                            }
                        }
                    }
                },
            });
        }
        fetchConversations(0, false);
    });

    // 5. Real-time toast + sound alert when the virtual assistant books a new appointment
    useRealtimeSubscription('calendar_changed', (payload) => {
        const info = payload?.data;
        if (!info || info.action !== 'created' || info.source !== 'assistant') return;
        if (!currentUser) return;

        // Doctors only receive events for their own calendar (enforced server-side and verified here)
        if (currentUser.role === 'Médico' && info.doctor_id && info.doctor_id !== currentUser.username) {
            return;
        }

        playNotificationSound();
        const timeDescription = formatAppointmentTime(info.start, info.end);
        addToast(
            `Novo agendamento realizado pelo assistente${timeDescription}`,
            'info',
            {
                label: 'Ver agenda',
                onClick: () => setActiveView('adminCalendar'),
            }
        );
    });
}
