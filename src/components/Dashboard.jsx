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

const formatTime = (minutesValue) => {
    if (minutesValue == null || isNaN(minutesValue)) return '0 min';
    const minutes = Number(minutesValue);
    if (minutes < 60) {
        // Keeps one decimal place if it's not a whole number to match original behavior, or just integer
        return `${Number(minutes.toFixed(1))} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (mins === 0) {
        return `${hours}h`;
    }
    return `${hours}h ${mins} min`;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#8dd1e1', '#a4de6c', '#d0ed57', '#ffc658'];

const ALL_STATUSES = [
    { id: 'open', label: 'Aberto' },
    { id: 'closed_by_timeout', label: 'Fechado por Inatividade' },
    { id: 'closed_by_assistant', label: 'Fechado pelo Assistente' },
    { id: 'closed_by_user', label: 'Fechado pelo Usuário' }
];

const CustomCountTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const topicName = label || payload[0].name || payload[0].payload.topic;
        const count = payload[0].value;

        return (
            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md font-sans">
                <p className="font-bold text-gray-800">{topicName}</p>
                <p className="text-gray-600 mt-1">
                    {count} {count === 1 ? 'conversa' : 'conversas'}
                </p>
            </div>
        );
    }
    return null;
};

export default function Dashboard({ onClose, apiBaseUrl, token }) {
    const [countChartType, setCountChartType] = useState('bar');
    const [timeChartType, setTimeChartType] = useState('bar');
    const [waitChartType, setWaitChartType] = useState('bar');

    const [selectedStatuses, setSelectedStatuses] = useState(ALL_STATUSES.filter(s => s.id !== 'open').map(s => s.id));
    const [data, setData] = useState([]);
    const [waitData, setWaitData] = useState([]);

    // Novos estados para armazenar os totais absolutos (sem filtros)
    const [absoluteTotalTopics, setAbsoluteTotalTopics] = useState(0);
    const [absoluteTotalWait, setAbsoluteTotalWait] = useState(0);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!token || !apiBaseUrl) return;
        setLoading(true);
        setError(null);
        try {
            // Query para os dados filtrados
            const statusQuery = selectedStatuses.length > 0 ? `?statuses=${selectedStatuses.join(',')}` : '?statuses=none';
            // Query para buscar TUDO (necessário para calcular a porcentagem total)
            const allStatusesQuery = `?statuses=${ALL_STATUSES.map(s => s.id).join(',')}`;

            // Realiza as buscas em paralelo para dados filtrados e totais globais
            const [topicsRes, waitTimesRes, allTopicsRes, allWaitTimesRes] = await Promise.all([
                fetch(`${apiBaseUrl}/analytics/topics${statusQuery}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${apiBaseUrl}/analytics/wait-times${statusQuery}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${apiBaseUrl}/analytics/topics${allStatusesQuery}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${apiBaseUrl}/analytics/wait-times${allStatusesQuery}`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!topicsRes.ok || !waitTimesRes.ok || !allTopicsRes.ok || !allWaitTimesRes.ok) {
                throw new Error('Falha ao buscar dados analíticos');
            }

            const topicsResult = await topicsRes.json();
            const waitTimesResult = await waitTimesRes.json();
            const allTopicsResult = await allTopicsRes.json();
            const allWaitTimesResult = await allWaitTimesRes.json();

            // Atualiza os dados filtrados dos gráficos
            setData(topicsResult.map(d => ({
                ...d,
                avg_duration_minutes: Number((d.avg_duration_minutes || 0).toFixed(2)),
                stderr_minutes: Number((d.stderr_minutes || 0).toFixed(2))
            })));

            setWaitData(waitTimesResult.map(d => ({
                ...d,
                avg_wait_minutes: Number((d.avg_wait_minutes || 0).toFixed(2)),
                stderr_minutes: Number((d.stderr_minutes || 0).toFixed(2))
            })));

            // Calcula e salva os totais absolutos no estado
            setAbsoluteTotalTopics(allTopicsResult.reduce((sum, item) => sum + (item.count || 0), 0));
            setAbsoluteTotalWait(allWaitTimesResult.reduce((sum, item) => sum + (item.count || 0), 0));

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

    // Cálculos dos totais filtrados e porcentagens correspondentes
    const totalConversations = data.reduce((sum, item) => sum + (item.count || 0), 0);

    // 2. Total exclusivo para o gráfico de Tempo de Espera (waitData)
    // Assume que a API retorna o "count" apenas dos atendimentos fechados pelo assistente
    const totalWaitConversations = waitData.reduce((sum, item) => sum + (item.count || 0), 0);

    const percTopics = absoluteTotalTopics > 0 ? Math.round((totalConversations / absoluteTotalTopics) * 100) : 0;
    const percWait = absoluteTotalWait > 0 ? Math.round((totalWaitConversations / absoluteTotalWait) * 100) : 0;

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
                <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-gray-100" title="Fechar Dashboard">
                    <CloseIcon />
                </button>
            </header>

            {/* Filters */}
            <div className="p-4 border-b border-gray-200 bg-white shrink-0 shadow-sm z-10 relative">
                <div className="max-w-7xl mx-auto flex flex-col space-y-2">
                    <span className="text-sm font-semibold text-gray-700">Filtrar por Status da Conversa:</span>
                    <div className="flex flex-wrap items-center gap-3">
                        {ALL_STATUSES.map(status => (
                            <label key={status.id} className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer hover:text-gray-800 transition-colors select-none">
                                <input type="checkbox" checked={selectedStatuses.includes(status.id)} onChange={() => handleStatusToggle(status.id)} className="w-4 h-4 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 cursor-pointer" />
                                <span>{status.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto w-full p-6">
                <div className="max-w-7xl mx-auto space-y-8 flex flex-col items-center justify-start min-h-full pb-8">

                    {error && (
                        <div className="w-full flex flex-col items-center justify-center text-red-500 bg-red-50 rounded-xl border border-red-100 p-6 text-center">
                            <p className="font-semibold">{error}</p>
                            <button onClick={fetchData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded shadow text-sm hover:bg-red-700 transition">Tentar Novamente</button>
                        </div>
                    )}

                    {!loading && !error && data.length === 0 && (
                        <div className="w-full flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300 p-10 text-center">
                            <p className="text-gray-500 mb-1 font-medium">Nenhum dado encontrado para os filtros selecionados.</p>
                        </div>
                    )}

                    {/* Chart 1: Topic Count */}
                    {(loading || data.length > 0) && (
                        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[500px] flex flex-col relative">
                            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                                {/* Header 1 atualizado */}
                                <h2 className="text-lg font-bold text-gray-800">
                                    Volume de Conversas por Tópico - Total {totalConversations} de {absoluteTotalTopics} conversas ({percTopics}%)
                                </h2>
                                <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
                                    <button onClick={() => setCountChartType('bar')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${countChartType === 'bar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}>Barras</button>
                                    <button onClick={() => setCountChartType('pie')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${countChartType === 'pie' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}>Pizza</button>
                                </div>
                            </div>
                            <div className="flex-1 w-full relative pb-8">
                                {!loading && data.length > 0 && (
                                    <ResponsiveContainer width="100%" height="100%">
                                        {countChartType === 'bar' ? (
                                            <BarChart data={data} margin={{ top: 30, right: 30, left: 20, bottom: 80 }} style={{ fontFamily: "'Inter', sans-serif" }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                <XAxis dataKey="topic" angle={-45} textAnchor="end" height={100} tick={{ fill: '#4B5563', fontSize: 12 }} interval={0} />
                                                <YAxis tick={{ fill: '#4B5563', fontSize: 12 }} />
                                                <Tooltip content={<CustomCountTooltip />} cursor={{ fill: 'transparent' }} />
                                                <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]}>
                                                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                </Bar>
                                            </BarChart>
                                        ) : (
                                            <PieChart style={{ fontSize: '12px' }}>
                                                <Pie data={data} cx="50%" cy="50%" label={({ topic, percent }) => `${topic} (${(percent * 100).toFixed(0)}%)`} outerRadius={120} dataKey="count" nameKey="topic">
                                                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip content={<CustomCountTooltip />} />
                                                <Legend verticalAlign="bottom" />
                                            </PieChart>
                                        )}
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Chart 2: Average Time (Topics) */}
                    {(loading || data.length > 0) && (
                        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[500px] flex flex-col relative">
                            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                                {/* Header 2 atualizado */}
                                <h2 className="text-lg font-bold text-gray-800">
                                    Tempo Médio de Conversa (por Tópico) em {totalConversations} de {absoluteTotalTopics} conversas ({percTopics}%)
                                </h2>
                                <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
                                    <button onClick={() => setTimeChartType('bar')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${timeChartType === 'bar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}>Barras</button>
                                    <button onClick={() => setTimeChartType('pie')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${timeChartType === 'pie' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}>Pizza</button>
                                </div>
                            </div>
                            <div className="flex-1 w-full relative pb-8">
                                {!loading && data.length > 0 && (
                                    <ResponsiveContainer width="100%" height="100%">
                                        {timeChartType === 'bar' ? (
                                            <BarChart data={data} margin={{ top: 30, right: 30, left: 20, bottom: 80 }} style={{ fontFamily: "'Inter', sans-serif" }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                <XAxis dataKey="topic" angle={-45} textAnchor="end" height={100} tick={{ fill: '#4B5563', fontSize: 12 }} interval={0} />
                                                <YAxis tick={{ fill: '#4B5563', fontSize: 12 }} label={{ value: 'Minutos', angle: -90, position: 'insideLeft', offset: -10 }} />
                                                {/* Tooltip Atualizado com formatter */}
                                                <Tooltip formatter={(value) => [formatTime(value), 'Tempo médio']} />
                                                <Bar dataKey="avg_duration_minutes" fill="#10B981" radius={[6, 6, 0, 0]}>
                                                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                    <ErrorBar dataKey="stderr_minutes" width={4} strokeWidth={2} stroke="#374151" direction="y" />
                                                </Bar>
                                            </BarChart>
                                        ) : (
                                            <PieChart style={{ fontSize: '12px' }}>
                                                <Pie data={data} cx="50%" cy="50%" label={({ topic, avg_duration_minutes }) => `${topic} (${formatTime(avg_duration_minutes)})`} outerRadius={120} dataKey="avg_duration_minutes" nameKey="topic">
                                                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                </Pie>
                                                {/* Tooltip Atualizado com formatter */}
                                                <Tooltip formatter={(value, name, props) => [`${formatTime(value)} (±${formatTime(props.payload.stderr_minutes)})`, 'Tempo médio']} />
                                                <Legend verticalAlign="bottom" />
                                            </PieChart>
                                        )}
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Chart 3: Wait Time (Departments) */}
                    {(loading || waitData.length > 0) && (
                        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[500px] flex flex-col relative">
                            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                                {/* Header 3 atualizado */}
                                <h2 className="text-lg font-bold text-gray-800">
                                    Tempo de Espera para Atendimento (por Setor) em {totalWaitConversations} de {absoluteTotalWait} conversas ({percWait}%)
                                </h2>
                                <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
                                    <button onClick={() => setWaitChartType('bar')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${waitChartType === 'bar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}>Barras</button>
                                    <button onClick={() => setWaitChartType('pie')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${waitChartType === 'pie' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}>Pizza</button>
                                </div>
                            </div>
                            <div className="flex-1 w-full relative pb-8">
                                {!loading && waitData.length > 0 && (
                                    <ResponsiveContainer width="100%" height="100%">
                                        {waitChartType === 'bar' ? (
                                            <BarChart data={waitData} margin={{ top: 30, right: 30, left: 20, bottom: 80 }} style={{ fontFamily: "'Inter', sans-serif" }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} tick={{ fill: '#4B5563', fontSize: 12 }} interval={0} />
                                                <YAxis tick={{ fill: '#4B5563', fontSize: 12 }} label={{ value: 'Minutos', angle: -90, position: 'insideLeft', offset: -10 }} />
                                                {/* Tooltip Atualizado com formatter */}
                                                <Tooltip formatter={(value) => [formatTime(value), 'Tempo de espera']} />
                                                <Bar dataKey="avg_wait_minutes" fill="#F59E0B" radius={[6, 6, 0, 0]}>
                                                    {waitData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />)}
                                                    <ErrorBar dataKey="stderr_minutes" width={4} strokeWidth={2} stroke="#374151" direction="y" />
                                                </Bar>
                                            </BarChart>
                                        ) : (
                                            <PieChart style={{ fontSize: '12px' }}>
                                                <Pie data={waitData} cx="50%" cy="50%" label={({ department, avg_wait_minutes }) => `${department} (${formatTime(avg_wait_minutes)})`} outerRadius={120} dataKey="avg_wait_minutes" nameKey="department">
                                                    {waitData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />)}
                                                </Pie>
                                                {/* Tooltip Atualizado com formatter */}
                                                <Tooltip formatter={(value, name, props) => [`${formatTime(value)} (±${formatTime(props.payload.stderr_minutes)})`, 'Tempo de espera']} />
                                                <Legend verticalAlign="bottom" />
                                            </PieChart>
                                        )}
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Chart 4: Histograms per Department */}
                    {(loading || waitData.length > 0) && (
                        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[460px] flex flex-col relative">
                            <div className="mb-6 border-b border-gray-100 pb-4">
                                <h2 className="text-lg font-bold text-gray-800">
                                    Distribuição do Tempo de Espera por Setor em {totalWaitConversations} de {absoluteTotalWait} conversas ({percWait}%)
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Frequência do tempo de espera (histogramas) para analisar a concentração dos atrasos.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                                {!loading && waitData.map((deptData, index) => (
                                    <div key={`hist-${deptData.department}`} className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col h-[400px]">
                                        <h3 className="text-sm font-bold text-gray-700 text-center mb-2">
                                            {deptData.department}
                                        </h3>
                                        <div className="flex-1 w-full relative">
                                            {deptData.histogram && deptData.histogram.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={deptData.histogram}
                                                        margin={{ top: 10, right: 10, left: -20, bottom: 90 }}
                                                        barCategoryGap={1}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                        <XAxis
                                                            dataKey="bin"
                                                            angle={-45}
                                                            textAnchor="end"
                                                            height={130}
                                                            tickFormatter={(value, index) => {
                                                                const deptDataObj = waitData.find(d => d.department === deptData.department);
                                                                if (deptDataObj && deptDataObj.histogram && deptDataObj.histogram[index]) {
                                                                    const item = deptDataObj.histogram[index];
                                                                    if (item.min != null && item.max != null) {
                                                                        return `${formatTime(item.min)} - ${formatTime(item.max)}`;
                                                                    }
                                                                }
                                                                return value;
                                                            }}
                                                            tick={{ fill: '#4B5563', fontSize: 10 }}
                                                            interval={0}
                                                        />
                                                        <YAxis tick={{ fill: '#4B5563', fontSize: 10 }} />
                                                        <Tooltip
                                                            formatter={(value) => [value, 'Conversas']}
                                                            labelFormatter={(label, payload) => {
                                                                if (payload && payload.length > 0) {
                                                                    const item = payload[0].payload;
                                                                    if (item.min != null && item.max != null) {
                                                                        return `Tempo: ${formatTime(item.min)} a ${formatTime(item.max)}`;
                                                                    }
                                                                }
                                                                return `Tempo: ${label}`;
                                                            }}
                                                            cursor={{ fill: '#E5E7EB' }}
                                                        />
                                                        <Bar
                                                            dataKey="count"
                                                            fill={COLORS[(index + 4) % COLORS.length]}
                                                            radius={[2, 2, 0, 0]}
                                                        />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-400 text-xs text-center px-4">
                                                    Dados de distribuição (bins) não disponíveis na API.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}