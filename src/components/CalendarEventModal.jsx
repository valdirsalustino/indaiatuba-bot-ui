import React, { useState, useEffect } from 'react';

export default function CalendarEventModal({
    isOpen,
    onClose,
    onSave,
    onDelete,
    event,
    doctors,
    onViewTraceability,
    initialOrigin
}) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [doctorId, setDoctorId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Origin fields for new appointments (Decision 3: flexibility for presencial / sem conversa)
    const [originType, setOriginType] = useState('whatsapp'); // 'whatsapp' | 'manual'
    const [compositeId, setCompositeId] = useState('');
    const [manualReason, setManualReason] = useState('Presencial / Balcão');
    const [originNotes, setOriginNotes] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (event) {
                setTitle(event.title || event.summary || '');
                setDescription(event.description || '');
                setStartDate(event.start ? new Date(event.start.getTime() - event.start.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
                setEndDate(event.end ? new Date(event.end.getTime() - event.end.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
                setDoctorId(event.resourceId || event.doctor_id || '');
                setCompositeId('');
                setOriginNotes('');
            } else {
                setTitle(initialOrigin?.client_name ? `Consulta: ${initialOrigin.client_name}` : '');
                setDescription('');
                setStartDate('');
                setEndDate('');
                setDoctorId('');
                if (initialOrigin?.composite_id) {
                    setOriginType('whatsapp');
                    setCompositeId(initialOrigin.composite_id);
                } else {
                    setOriginType('manual');
                    setCompositeId('');
                }
                setManualReason('Presencial / Balcão');
                setOriginNotes('');
            }
        }
    }, [isOpen, event, initialOrigin]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const eventData = {
            summary: title,
            description,
            start: new Date(startDate).toISOString(),
            end: new Date(endDate).toISOString(),
            doctor_id: doctorId
        };

        if (event && event.id) {
            eventData.id = event.id;
        } else {
            // New appointment origin input
            eventData.origin_input = {
                channel: originType === 'whatsapp' ? 'whatsapp' : 'in_person',
                composite_id: originType === 'whatsapp' ? compositeId.trim() : null,
                reason: originType === 'manual' ? manualReason : null,
                notes: originNotes.trim() || null
            };
        }

        await onSave(eventData);
        setIsSubmitting(false);
    };

    const handleDelete = async () => {
        if (!event || !event.id) return;
        if (window.confirm("Tem certeza que deseja excluir este agendamento?")) {
            setIsSubmitting(true);
            await onDelete(event.id, event.resourceId || event.doctor_id);
            setIsSubmitting(false);
        }
    };

    const appointmentId = event?.appointment_id || event?.id;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none bg-black/50 p-4">
            <div className="relative w-full max-w-lg mx-auto my-6">
                <div className="relative flex flex-col w-full bg-white border-0 rounded-xl shadow-2xl outline-none focus:outline-none overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">
                                {event?.id ? 'Editar Agendamento' : 'Novo Agendamento'}
                            </h3>
                            {event?.id && appointmentId && (
                                <p className="text-xs text-gray-500">ID de Rastreabilidade: {appointmentId.slice(0, 12)}...</p>
                            )}
                        </div>
                        <button
                            className="p-1 ml-auto bg-transparent border-0 text-gray-400 hover:text-gray-600 text-2xl leading-none font-semibold outline-none focus:outline-none transition-colors"
                            onClick={onClose}
                        >
                            &times;
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="relative p-6 flex-auto max-h-[70vh] overflow-y-auto space-y-4">
                            {event?.id && onViewTraceability && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                                    <div className="text-xs text-blue-900">
                                        <span className="font-semibold">Rastreabilidade disponível:</span> veja quem agendou e acesse a conversa com os pedidos médicos.
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onClose();
                                            onViewTraceability(appointmentId);
                                        }}
                                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-sm whitespace-nowrap ml-2"
                                    >
                                        Ver Auditoria
                                    </button>
                                </div>
                            )}

                            <div>
                                <label className="block text-gray-700 text-xs font-bold mb-1" htmlFor="title">
                                    Título / Paciente
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    required
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 text-sm leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ex: Consulta: João da Silva"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 text-xs font-bold mb-1" htmlFor="doctor">
                                    Médico Responsável
                                </label>
                                <select
                                    id="doctor"
                                    required
                                    className="shadow border rounded w-full py-2 px-3 text-gray-700 text-sm leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={doctorId}
                                    onChange={(e) => setDoctorId(e.target.value)}
                                    disabled={!!(event && event.id)}
                                >
                                    <option value="" disabled>Selecione um médico</option>
                                    {doctors.map(doc => (
                                        <option key={doc.username} value={doc.username}>{doc.name || doc.username}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <label className="block text-gray-700 text-xs font-bold mb-1" htmlFor="start">
                                        Início
                                    </label>
                                    <input
                                        type="datetime-local"
                                        id="start"
                                        required
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 text-sm leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-gray-700 text-xs font-bold mb-1" htmlFor="end">
                                        Término
                                    </label>
                                    <input
                                        type="datetime-local"
                                        id="end"
                                        required
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 text-sm leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Origin Section when creating a new appointment */}
                            {!event?.id && (
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                                    <label className="block text-gray-700 text-xs font-bold">
                                        Origem do Agendamento (Rastreabilidade)
                                    </label>
                                    <div className="flex gap-4 text-xs">
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="modalOriginType"
                                                value="whatsapp"
                                                checked={originType === 'whatsapp'}
                                                onChange={() => setOriginType('whatsapp')}
                                            />
                                            Conversa WhatsApp
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="modalOriginType"
                                                value="manual"
                                                checked={originType === 'manual'}
                                                onChange={() => setOriginType('manual')}
                                            />
                                            Presencial / Telefone
                                        </label>
                                    </div>

                                    {originType === 'whatsapp' ? (
                                        <div>
                                            <input
                                                type="text"
                                                placeholder="ID da conversa (ex: 551999999999:thread_0)"
                                                value={compositeId}
                                                onChange={(e) => setCompositeId(e.target.value)}
                                                className="w-full text-xs border rounded px-2.5 py-1.5 bg-white"
                                            />
                                            <p className="text-[11px] text-gray-400 mt-0.5">
                                                Permite que o médico e secretaria cliquem para ver o pedido médico e documentos enviados.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <select
                                                value={manualReason}
                                                onChange={(e) => setManualReason(e.target.value)}
                                                className="w-full text-xs border rounded px-2.5 py-1.5 bg-white"
                                            >
                                                <option value="Presencial / Balcão">Presencial / Balcão</option>
                                                <option value="Ligação Telefônica">Ligação Telefônica</option>
                                                <option value="Encaminhamento Externo">Encaminhamento Externo</option>
                                            </select>
                                            <input
                                                type="text"
                                                placeholder="Observações da origem (opcional)"
                                                value={originNotes}
                                                onChange={(e) => setOriginNotes(e.target.value)}
                                                className="w-full text-xs border rounded px-2.5 py-1.5 bg-white"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-gray-700 text-xs font-bold mb-1" htmlFor="description">
                                    Descrição e Detalhes Clínicos
                                </label>
                                <textarea
                                    id="description"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 text-sm leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    rows="3"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Exame desejado, convênio ou particular, orientações..."
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex items-center justify-end p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl gap-2">
                            {event?.id && (
                                <button
                                    className="text-red-500 hover:text-red-700 font-bold uppercase px-4 py-2 text-xs outline-none focus:outline-none mr-auto transition-colors"
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={isSubmitting}
                                >
                                    Excluir
                                </button>
                            )}
                            <button
                                className="text-gray-500 hover:text-gray-700 font-bold uppercase px-4 py-2 text-xs outline-none focus:outline-none transition-colors"
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </button>
                            <button
                                className="bg-blue-600 text-white hover:bg-blue-700 font-bold uppercase text-xs px-5 py-2.5 rounded shadow hover:shadow-md outline-none focus:outline-none transition-all flex items-center"
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
