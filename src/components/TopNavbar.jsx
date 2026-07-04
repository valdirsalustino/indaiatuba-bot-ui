import React from 'react';

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
);

const ManageUsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
);

const DashboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
);

const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);

export default function TopNavbar({
    onLogout,
    isAdmin,
    isDoctor,
    isCalendarEnabled,
    onShowUserManagement,
    onShowClientConfigs,
    onShowDashboard,
    onShowConversations,
    onShowCalendar,
    onShowAdminCalendar,
    currentUser,
    clientName,
    activeView
}) {
    const NavButton = ({ onClick, icon, label, isActive, title }) => (
        <button 
            onClick={onClick} 
            title={title}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm
                ${isActive 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );

    return (
        <nav className="w-full h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 shadow-sm z-10">
            <div className="flex items-center space-x-8">
                {/* Logo Area */}
                <div className="flex items-center space-x-2 cursor-pointer" onClick={onShowConversations}>
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
                        {clientName ? clientName.charAt(0).toUpperCase() : 'H'}
                    </div>
                    <span className="font-bold text-xl text-gray-800 tracking-tight">
                        {clientName || 'Helena'}
                    </span>
                </div>

                {/* Main Navigation Links */}
                <div className="hidden md:flex items-center space-x-2">
                    <NavButton 
                        onClick={onShowConversations} 
                        icon={<ChatIcon />} 
                        label="Atendimentos" 
                        title="Central de atendimentos e conversas."
                        isActive={activeView === 'conversations'}
                    />
                    
                    {isAdmin && (
                        <NavButton 
                            onClick={onShowDashboard} 
                            icon={<DashboardIcon />} 
                            label="Indicadores" 
                            title="Métricas e estatísticas de desempenho."
                            isActive={activeView === 'dashboard'}
                        />
                    )}

                    {isCalendarEnabled && (
                        <NavButton 
                            onClick={onShowAdminCalendar} 
                            icon={<CalendarIcon />} 
                            label="Agenda" 
                            title="Calendário e agendamentos."
                            isActive={activeView === 'adminCalendar'}
                        />
                    )}

                    {isAdmin && (
                        <NavButton 
                            onClick={onShowClientConfigs} 
                            icon={<SettingsIcon />} 
                            label="Ajustes" 
                            title="Configurações gerais do sistema."
                            isActive={activeView === 'clientConfigurations'}
                        />
                    )}
                </div>
            </div>

            {/* Right Side Actions & User */}
            <div className="flex items-center space-x-4">
                {isAdmin && (
                    <button 
                        onClick={onShowUserManagement} 
                        className="text-gray-500 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                        title="Gerenciar Usuários"
                    >
                        <ManageUsersIcon />
                    </button>
                )}
                
                {isDoctor && isCalendarEnabled && (
                     <button 
                        onClick={onShowCalendar} 
                        className="text-gray-500 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                        title="Configurações do Calendário"
                    >
                        <SettingsIcon />
                    </button>
                )}

                <div className="h-6 w-px bg-gray-300 mx-2"></div>

                {currentUser && (
                    <div className="flex items-center space-x-3 group cursor-pointer">
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-semibold text-gray-800">{currentUser.name || currentUser.username}</span>
                            <span className="text-xs text-gray-500">{currentUser.role}</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center border-2 border-transparent group-hover:border-indigo-300 transition-all">
                            {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : currentUser.username.charAt(0).toUpperCase()}
                        </div>
                    </div>
                )}
                
                <button 
                    onClick={onLogout} 
                    className="ml-2 text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                    title="Sair"
                >
                    <LogoutIcon />
                </button>
            </div>
        </nav>
    );
}
