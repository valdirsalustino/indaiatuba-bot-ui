import React, { useState, useEffect } from 'react';

export default function ClientConfigurations({ apiBaseUrl, token }) {
    const [activeTab, setActiveTab] = useState('systemPrompt');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [loadingPrompt, setLoadingPrompt] = useState(false);
    const [promptError, setPromptError] = useState('');
    const [isEditingPrompt, setIsEditingPrompt] = useState(false);
    const [savingPrompt, setSavingPrompt] = useState(false);

    const [newsUrl, setNewsUrl] = useState('');
    const [loadingNewsUrl, setLoadingNewsUrl] = useState(false);
    const [newsUrlError, setNewsUrlError] = useState('');
    const [isEditingNewsUrl, setIsEditingNewsUrl] = useState(false);
    const [savingNewsUrl, setSavingNewsUrl] = useState(false);

    const [sportsUrls, setSportsUrls] = useState([]);
    const [loadingSportsUrls, setLoadingSportsUrls] = useState(false);
    const [sportsUrlsError, setSportsUrlsError] = useState('');
    const [editingSportsUrlIndex, setEditingSportsUrlIndex] = useState(null);
    const [savingSportsUrlIndex, setSavingSportsUrlIndex] = useState(null);
    const [originalUrlToEdit, setOriginalUrlToEdit] = useState(null);

    useEffect(() => {
        if (activeTab === 'systemPrompt' && apiBaseUrl && token) {
            const fetchSystemPrompt = async () => {
                setLoadingPrompt(true);
                setPromptError('');
                try {
                    const url = `${apiBaseUrl}/system-prompt`;
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setSystemPrompt(data.prompt || '');
                    } else if (response.status !== 404) { // 404 is ok, just means no prompt yet
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.detail || `Erro ao carregar prompt: Status ${response.status}`);
                    } else {
                        setSystemPrompt(''); // Explicitly clear on 404
                    }
                } catch (error) {
                    setPromptError(error.message || 'Falha ao conectar com o servidor.');
                } finally {
                    setLoadingPrompt(false);
                }
            };
            fetchSystemPrompt();
        } else if (activeTab === 'newsUrl' && apiBaseUrl && token) {
            const fetchNewsUrl = async () => {
                setLoadingNewsUrl(true);
                setNewsUrlError('');
                try {
                    const url = `${apiBaseUrl}/news-url`;
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setNewsUrl(data.url || '');
                    } else if (response.status !== 404) { // 404 is ok, just means no URL yet
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.detail || `Erro ao carregar URL de notícias: Status ${response.status}`);
                    } else {
                        setNewsUrl(''); // Explicitly clear on 404
                    }
                } catch (error) {
                    setNewsUrlError(error.message || 'Falha ao conectar com o servidor.');
                } finally {
                    setLoadingNewsUrl(false);
                }
            };
            fetchNewsUrl();
        } else if (activeTab === 'sportsUrls' && apiBaseUrl && token) {
            const fetchSportsUrls = async () => {
                setLoadingSportsUrls(true);
                setSportsUrlsError('');
                try {
                    const url = `${apiBaseUrl}/sports-urls`;
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setSportsUrls(Array.isArray(data) ? data : []);
                    } else if (response.status !== 404) { // 404 is ok, just means no URLs yet
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.detail || `Erro ao carregar URLs de esportes: Status ${response.status}`);
                    } else {
                        setSportsUrls([]); // Explicitly clear on 404
                    }
                } catch (error) {
                    setSportsUrlsError(error.message || 'Falha ao conectar com o servidor.');
                } finally {
                    setLoadingSportsUrls(false);
                }
            };
            fetchSportsUrls();
        }
    }, [activeTab, apiBaseUrl, token]);

    const handleSavePrompt = async () => {
        setSavingPrompt(true);
        setPromptError('');
        try {
            const url = `${apiBaseUrl}/system-prompt`;
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: systemPrompt })
            });

            if (response.ok) {
                setIsEditingPrompt(false);
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Erro ao salvar prompt: Status ${response.status}`);
            }
        } catch (error) {
            setPromptError(error.message || 'Falha ao salvar prompt.');
        } finally {
            setSavingPrompt(false);
        }
    };

    const handleSaveNewsUrl = async () => {
        setSavingNewsUrl(true);
        setNewsUrlError('');
        try {
            const url = `${apiBaseUrl}/news-url`;
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: newsUrl })
            });

            if (response.ok) {
                setIsEditingNewsUrl(false);
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Erro ao salvar URL de notícias: Status ${response.status}`);
            }
        } catch (error) {
            setNewsUrlError(error.message || 'Falha ao salvar URL de notícias.');
        } finally {
            setSavingNewsUrl(false);
        }
    };

    const handleSaveSportsUrl = async (index) => {
        setSavingSportsUrlIndex(index);
        setSportsUrlsError('');
        const currentUrl = sportsUrls[index];

        try {
            const url = `${apiBaseUrl}/sports-urls`;

            const payload = { url: currentUrl };
            if (originalUrlToEdit && originalUrlToEdit !== '') {
                payload.old_url = originalUrlToEdit;
            }
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setEditingSportsUrlIndex(null);
                setOriginalUrlToEdit(null);
            } else {
                const errorData = await response.json().catch(() => ({}));
                let errorMessage = errorData.detail || `Erro ao salvar URL de esportes: Status ${response.status}`;
                if (response.status === 400) {
                    errorMessage = `URL inválida ou inacessível: ${currentUrl}`;
                }
                setSportsUrlsError(errorMessage);
            }
        } catch (error) {
            setSportsUrlsError(error.message || 'Falha ao salvar URL de esportes.');
        } finally {
            setSavingSportsUrlIndex(null);
        }
    };

    const handleSportsUrlChange = (index, value) => {
        const newSportsUrls = [...sportsUrls];
        newSportsUrls[index] = value;
        setSportsUrls(newSportsUrls);
    };

    const handleAddSportsUrl = () => {
        setSportsUrls([...sportsUrls, '']);
        setEditingSportsUrlIndex(sportsUrls.length);
        setOriginalUrlToEdit(''); // A new item has no original URL
    };

    const handleRemoveSportsUrl = async (indexToRemove) => {
        const urlToRemove = sportsUrls[indexToRemove];
        setSportsUrlsError('');
        try {
            const url = `${apiBaseUrl}/sports-urls`;
            const response = await fetch(url, {
                method: 'DELETE', // Change to DELETE
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: urlToRemove }) // Send the specific URL to delete
            });

            if (response.ok) {
                // Update the UI state after successful backend deletion
                const updatedUrls = sportsUrls.filter((_, index) => index !== indexToRemove);
                setSportsUrls(updatedUrls);
                setEditingSportsUrlIndex(null);
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Erro ao remover URL de esportes: Status ${response.status}`);
            }
        } catch (error) {
            setSportsUrlsError(error.message || 'Falha ao remover URL de esportes.');
        }
    };

    return (
        <div className="flex-grow flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-700 mb-6">Configurações de Cliente</h2>

                <div className="border-b border-gray-200 mb-4">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('systemPrompt')}
                            className={`${
                                activeTab === 'systemPrompt'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Prompt do sistema
                        </button>
                        <button
                            onClick={() => setActiveTab('newsUrl')}
                            className={`${
                                activeTab === 'newsUrl'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            URL de notícias
                        </button>
                        <button
                            onClick={() => setActiveTab('sportsUrls')}
                            className={`${
                                activeTab === 'sportsUrls'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            URL de esportes
                        </button>
                    </nav>
                </div>

                {activeTab === 'systemPrompt' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-700">Prompt do Sistema</h3>
                            {!loadingPrompt && (
                                <div>
                                    {!isEditingPrompt ? (
                                        <button
                                            onClick={() => setIsEditingPrompt(true)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
                                        >
                                            Editar
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSavePrompt}
                                            disabled={savingPrompt}
                                            className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none ${savingPrompt ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {savingPrompt ? 'Salvando...' : 'Salvar'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {loadingPrompt && <p className="text-blue-500">Carregando prompt...</p>}
                        {promptError && <p className="text-red-500">{promptError}</p>}
                        {!loadingPrompt && !promptError && (
                            <textarea
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                                readOnly={!isEditingPrompt}
                                className={`w-full h-64 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-y overflow-auto ${!isEditingPrompt ? 'bg-gray-100' : ''}`}
                                placeholder="Nenhum prompt do sistema encontrado."
                            />
                        )}
                    </div>
                )}

                {activeTab === 'newsUrl' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-700">URL de Notícias</h3>
                            {!loadingNewsUrl && (
                                <div>
                                    {!isEditingNewsUrl ? (
                                        <button
                                            onClick={() => setIsEditingNewsUrl(true)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
                                        >
                                            Editar
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSaveNewsUrl}
                                            disabled={savingNewsUrl}
                                            className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none ${savingNewsUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {savingNewsUrl ? 'Salvando...' : 'Salvar'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {loadingNewsUrl && <p className="text-blue-500">Carregando URL...</p>}
                        {newsUrlError && <p className="text-red-500">{newsUrlError}</p>}
                        {!loadingNewsUrl && !newsUrlError && (
                            <input
                                type="text"
                                value={newsUrl}
                                onChange={(e) => setNewsUrl(e.target.value)}
                                readOnly={!isEditingNewsUrl}
                                className={`w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${!isEditingNewsUrl ? 'bg-gray-100' : ''}`}
                                placeholder="Nenhuma URL de notícias encontrada."
                            />
                        )}
                    </div>
                )}

                {activeTab === 'sportsUrls' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-700">URLs de Esportes</h3>
                            <button
                                onClick={handleAddSportsUrl}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
                            >
                                Adicionar URL
                            </button>
                        </div>

                        {loadingSportsUrls && <p className="text-blue-500">Carregando URLs...</p>}
                        {sportsUrlsError && <p className="text-red-500">{sportsUrlsError}</p>}
                        {!loadingSportsUrls && !sportsUrlsError && (
                            <div className="space-y-4">
                                {sportsUrls.length === 0 && !editingSportsUrlIndex && (
                                    <p className="text-gray-500">Nenhuma URL de esportes encontrada.</p>
                                )}
                                {sportsUrls.map((url, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            value={url}
                                            onChange={(e) => handleSportsUrlChange(index, e.target.value)}
                                            readOnly={editingSportsUrlIndex !== index}
                                            className={`flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${editingSportsUrlIndex !== index ? 'bg-gray-100' : ''}`}
                                            placeholder="Adicione uma URL de esportes"
                                        />
                                        {editingSportsUrlIndex === index ? (
                                            <button
                                                onClick={() => handleSaveSportsUrl(index)}
                                                disabled={savingSportsUrlIndex === index}
                                                className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none ${savingSportsUrlIndex === index ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {savingSportsUrlIndex === index ? 'Salvando...' : 'Salvar'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {setEditingSportsUrlIndex(index); setOriginalUrlToEdit(url);}}
                                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
                                            >
                                                Editar
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleRemoveSportsUrl(index)}
                                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none"
                                        >
                                            Remover
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}