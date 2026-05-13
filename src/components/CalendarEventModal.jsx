import React, { useState, useEffect } from 'react';

export default function CalendarEventModal({ isOpen, onClose, onSave, onDelete, event, doctors }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [doctorId, setDoctorId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (event) {
                setTitle(event.title || '');
                setDescription(event.description || '');
                // Format for datetime-local input
                setStartDate(event.start ? new Date(event.start.getTime() - event.start.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
                setEndDate(event.end ? new Date(event.end.getTime() - event.end.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
                setDoctorId(event.resourceId || '');
            } else {
                setTitle('');
                setDescription('');
                setStartDate('');
                setEndDate('');
                setDoctorId('');
            }
        }
    }, [isOpen, event]);

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
        }

        await onSave(eventData);
        setIsSubmitting(false);
    };

    const handleDelete = async () => {
        if (!event || !event.id) return;
        if (window.confirm("Tem certeza que deseja excluir este agendamento?")) {
            setIsSubmitting(true);
            await onDelete(event.id, event.resourceId);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
            <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
            <div className="relative w-full max-w-lg mx-auto my-6">
                <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none">
                    <div className="flex items-start justify-between p-5 border-b border-solid rounded-t border-blueGray-200">
                        <h3 className="text-xl font-semibold text-gray-800">
                            {event?.id ? 'Editar Agendamento' : 'Novo Agendamento'}
                        </h3>
                        <button
                            className="p-1 ml-auto bg-transparent border-0 text-gray-400 float-right text-3xl leading-none font-semibold outline-none focus:outline-none hover:text-gray-600 transition-colors"
                            onClick={onClose}
                        >
                            <span className="block w-6 h-6 text-2xl outline-none focus:outline-none">×</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="relative p-6 flex-auto">
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                                    Título
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    required
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ex: Consulta Dr. João"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="doctor">
                                    Médico Responsável
                                </label>
                                <select
                                    id="doctor"
                                    required
                                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={doctorId}
                                    onChange={(e) => setDoctorId(e.target.value)}
                                    disabled={!!(event && event.id)} // Usually cannot change calendar owner of existing event
                                >
                                    <option value="" disabled>Selecione um médico</option>
                                    {doctors.map(doc => (
                                        <option key={doc.username} value={doc.username}>{doc.name || doc.username}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-4 mb-4">
                                <div className="w-1/2">
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="start">
                                        Início
                                    </label>
                                    <input
                                        type="datetime-local"
                                        id="start"
                                        required
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="end">
                                        Término
                                    </label>
                                    <input
                                        type="datetime-local"
                                        id="end"
                                        required
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                                    Descrição
                                </label>
                                <textarea
                                    id="description"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    rows="3"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Detalhes adicionais..."
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex items-center justify-end p-6 border-t border-solid rounded-b border-blueGray-200">
                            {event?.id && (
                                <button
                                    className="text-red-500 hover:text-red-700 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-auto mb-1 ease-linear transition-all duration-150"
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={isSubmitting}
                                >
                                    Excluir
                                </button>
                            )}
                            <button
                                className="text-gray-500 hover:text-gray-700 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </button>
                            <button
                                className="bg-blue-500 text-white hover:bg-blue-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150 flex items-center"
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Salvando...
                                    </>
                                ) : 'Salvar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
