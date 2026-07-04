import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
    return useContext(ToastContext);
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback((message, type = 'info', action = null) => {
        setToasts((prev) => {
            // Deduplication: prevent stacking identical toasts
            if (prev.some(toast => toast.message === message)) {
                return prev;
            }
            
            const id = Date.now();
            
            // Auto remove after 60 seconds (1 minute)
            setTimeout(() => {
                removeToast(id);
            }, 60000);
            
            return [...prev, { id, message, type, action }];
        });
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div 
                        key={toast.id} 
                        className={`pointer-events-auto flex items-center justify-between p-4 rounded-lg shadow-lg min-w-[320px] max-w-[400px] text-sm transform transition-all duration-300 translate-y-0 opacity-100 ${
                            toast.type === 'alert' || toast.type === 'warning' 
                                ? 'bg-red-50 text-red-900 border-l-4 border-red-500 shadow-red-100/50' 
                                : 'bg-white text-gray-800 border border-gray-200 shadow-gray-200/50'
                        }`}
                    >
                        <span className="font-medium">{toast.message}</span>
                        <div className="flex items-center gap-2">
                            {toast.action && (
                                <button 
                                    onClick={() => {
                                        toast.action.onClick();
                                        removeToast(toast.id);
                                    }}
                                    className={`ml-3 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                                        toast.type === 'alert' || toast.type === 'warning'
                                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                    }`}
                                >
                                    {toast.action.label}
                                </button>
                            )}
                            <button 
                                onClick={() => removeToast(toast.id)} 
                                className="ml-1 p-1 text-gray-400 hover:text-gray-600 focus:outline-none rounded-md hover:bg-gray-100 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};


