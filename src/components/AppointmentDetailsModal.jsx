import React, { useState, useEffect } from 'react';

export default function AppointmentDetailsModal({
    isOpen,
    onClose,
    appointmentId,
    apiBaseUrl,
    token,
    onOpenConversation,
    addToast
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [isLinking, setIsLinking] = useState(false);
    const [linkType, setLinkType] = useState('manual'); // 'manual' | 'conversation'
    const [manualReason, setManualReason] = useState('Presencial / Balcão');
    const [manualNotes, setManualNotes] = useState('');
    const [inputCompositeId, setInputCompositeId] = useState('');
    const [submittingLink, setSubmittingLink] = useState(false);

    const fetchDetails = async () => {
        if (!appointmentId || !token) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${apiBaseUrl}/appointments/${appointmentId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || 'Não foi possível carregar os dados de rastreabilidade.');
            }
            const result = await res.json();
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && appointmentId) {
            fetchDetails();
            setIsLinking(false);
        } else {
            setData(null);
            setError(null);
        }
    }, [isOpen, appointmentId]);

    if (!isOpen) return null;

    const appt = data?.appointment;
    const audits = data?.audit_trail || [];

    const handleCopyLink = () => {
        const link = `${window.location.origin}/appointments/${appointmentId}`;
        navigator.clipboard.writeText(link);
        if (addToast) {
            addToast('Link de rastreabilidade copiado!', 'success');
        }
    };

    const handleSaveOrigin = async (e) => {
        e.preventDefault();
        setSubmittingLink(true);
        try {
            const payload = {
                channel: linkType === 'conversation' ? 'whatsapp' : 'in_person',
                composite_id: linkType === 'conversation' ? inputCompositeId.trim() : null,
                reason: linkType === 'manual' ? manualReason : null,
                notes: manualNotes.trim() || null
            };

            const res = await fetch(`${apiBaseUrl}/appointments/${appointmentId}/origin`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || 'Erro ao vincular origem.');
            }

            if (addToast) addToast('Origem atualizada com sucesso!', 'success');
            setIsLinking(false);
            await fetchDetails();
        } catch (err) {
            if (addToast) addToast(err.message, 'error');
        } finally {
            setSubmittingLink(false);
        }
    };

    const formatDateTime = (isoStr) => {
        if (!isoStr) return '-';
        try {
            const d = new Date(isoStr);
            return d.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return isoStr;
        }
    };

    const getActionBadge = (action) => {
        switch (action) {
            case 'created':
                return <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded font-medium">Criado</span>;
            case 'updated':
                return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-medium">Atualizado</span>;
            case 'deleted':
                return <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded font-medium">Cancelado</span>;
            case 'linked':
                return <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded font-medium">Conversa Vinculada</span>;
            default:
                return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded font-medium">{action}</span>;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none bg-black/50 p-4">
            <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Rastreabilidade do Agendamento</h3>
                            <p className="text-xs text-gray-500">Origem, responsável e auditoria da consulta</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <span className="text-2xl leading-none">&times;</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-gray-700">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                            <p>Carregando informações de auditoria...</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {!loading && !error && appt && (
                        <>
                            {/* Summary Card */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                    <h4 className="text-base font-semibold text-blue-900">{appt.summary}</h4>
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider ${
                                        appt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                        appt.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {appt.status === 'confirmed' ? 'Confirmado' : appt.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-600">
                                    <div>
                                        <span className="font-semibold text-gray-700">Médico:</span> {appt.doctor_id}
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-700">Data/Hora:</span> {formatDateTime(appt.start)} até {formatDateTime(appt.end)}
                                    </div>
                                </div>
                            </div>

                            {/* Origin & Responsibility Card */}
                            <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm space-y-4">
                                <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                                    <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Responsabilidade e Canal de Origem
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Who created */}
                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <p className="text-xs text-gray-500 font-medium mb-1">Agendado por</p>
                                        <div className="flex items-center gap-2">
                                            {appt.created_by?.type === 'assistant' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    {appt.created_by.display} (Bot WhatsApp)
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-800">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    {appt.created_by?.display} ({appt.created_by?.role || 'Secretaria'})
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-gray-400 mt-1">
                                            Em {formatDateTime(appt.created_at)}
                                        </p>
                                    </div>

                                    {/* Channel */}
                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <p className="text-xs text-gray-500 font-medium mb-1">Canal de Atendimento</p>
                                        <div>
                                            {appt.origin?.conversation ? (
                                                <div>
                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                                                        WhatsApp: {appt.origin.conversation.phone_number}
                                                    </span>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                                        Thread: {appt.origin.conversation.thread_id}
                                                    </p>
                                                </div>
                                            ) : appt.origin?.reason ? (
                                                <span className="text-xs font-medium text-gray-700 bg-gray-200 px-2 py-0.5 rounded">
                                                    {appt.origin.reason}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Sem conversa vinculada</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action to open conversation or link */}
                                <div className="pt-2 flex flex-wrap gap-2 items-center justify-between border-t border-gray-100">
                                    {data?.conversation_composite_id && data?.can_view_conversation ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onClose();
                                                if (onOpenConversation) {
                                                    onOpenConversation(data.conversation_composite_id);
                                                }
                                            }}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            Abrir Conversa do Paciente (Validar Documentos)
                                        </button>
                                    ) : (
                                        !isLinking && (
                                            <button
                                                type="button"
                                                onClick={() => setIsLinking(true)}
                                                className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center gap-1"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                </svg>
                                                Vincular / Atualizar Origem
                                            </button>
                                        )
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleCopyLink}
                                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 ml-auto"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Copiar Link
                                    </button>
                                </div>

                                {/* Form to link origin */}
                                {isLinking && (
                                    <form onSubmit={handleSaveOrigin} className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                                        <p className="text-xs font-semibold text-gray-700">Atualizar Origem do Agendamento</p>
                                        <div className="flex gap-4 text-xs">
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="linkType"
                                                    value="manual"
                                                    checked={linkType === 'manual'}
                                                    onChange={() => setLinkType('manual')}
                                                />
                                                Presencial / Telefone / Sem Conversa
                                            </label>
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="linkType"
                                                    value="conversation"
                                                    checked={linkType === 'conversation'}
                                                    onChange={() => setLinkType('conversation')}
                                                />
                                                Conversa do WhatsApp
                                            </label>
                                        </div>

                                        {linkType === 'manual' ? (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Motivo / Canal</label>
                                                <select
                                                    value={manualReason}
                                                    onChange={(e) => setManualReason(e.target.value)}
                                                    className="w-full text-xs border rounded px-2 py-1.5 bg-white"
                                                >
                                                    <option value="Presencial / Balcão">Presencial / Balcão</option>
                                                    <option value="Ligação Telefônica">Ligação Telefônica</option>
                                                    <option value="E-mail / Outro">E-mail / Outro</option>
                                                </select>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">ID da Conversa (ex: 551999999999:thread_0)</label>
                                                <input
                                                    type="text"
                                                    placeholder="551999999999:thread_0"
                                                    value={inputCompositeId}
                                                    onChange={(e) => setInputCompositeId(e.target.value)}
                                                    required
                                                    className="w-full text-xs border rounded px-2 py-1.5 bg-white"
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Observações Adicionais</label>
                                            <input
                                                type="text"
                                                placeholder="Ex: Documentos recebidos pessoalmente"
                                                value={manualNotes}
                                                onChange={(e) => setManualNotes(e.target.value)}
                                                className="w-full text-xs border rounded px-2 py-1.5 bg-white"
                                            />
                                        </div>

                                        <div className="flex justify-end gap-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => setIsLinking(false)}
                                                className="px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={submittingLink}
                                                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
                                            >
                                                {submittingLink ? 'Salvando...' : 'Salvar'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>

                            {/* Audit Trail Timeline */}
                            <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm space-y-3">
                                <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                                    <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Trilha de Auditoria (Append-Only)
                                </h4>

                                {audits.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">Nenhum evento de auditoria registrado.</p>
                                ) : (
                                    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                                        {audits.map((a, idx) => (
                                            <div key={idx} className="relative text-xs space-y-1">
                                                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white"></div>
                                                <div className="flex items-center gap-2">
                                                    {getActionBadge(a.action)}
                                                    <span className="font-semibold text-gray-700">
                                                        {a.actor?.display || a.actor?.id}
                                                    </span>
                                                    {a.actor?.role && (
                                                        <span className="text-[10px] text-gray-400">({a.actor.role})</span>
                                                    )}
                                                    <span className="text-[11px] text-gray-400 ml-auto">
                                                        {formatDateTime(a.at)}
                                                    </span>
                                                </div>
                                                {a.note && (
                                                    <p className="text-gray-600 bg-gray-50 px-2 py-1 rounded text-[11px]">
                                                        {a.note}
                                                    </p>
                                                )}
                                                {a.changes && Object.keys(a.changes).length > 0 && (
                                                    <div className="text-[11px] text-gray-500 pl-1">
                                                        {Object.entries(a.changes).map(([k, v]) => (
                                                            <div key={k}>
                                                                <span className="font-medium text-gray-600">{k}:</span> {JSON.stringify(v[0])} &rarr; {JSON.stringify(v[1])}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
