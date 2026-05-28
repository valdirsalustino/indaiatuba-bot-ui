import React, { useState, useEffect } from 'react';

// Corrected AddUserIcon SVG data
const AddUserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        {/* The plus sign coordinates are now fully inside the 24x24 viewbox */}
        <line x1="21" y1="11" x2="21" y2="17"></line>
        <line x1="18" y1="14" x2="24" y2="14"></line>
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

const SaveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
);

const CancelIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const getDefaultWorkingHours = () => ({
  Monday: { active: false, start_time: "09:00", end_time: "17:00" },
  Tuesday: { active: false, start_time: "09:00", end_time: "17:00" },
  Wednesday: { active: false, start_time: "09:00", end_time: "17:00" },
  Thursday: { active: false, start_time: "09:00", end_time: "17:00" },
  Friday: { active: false, start_time: "09:00", end_time: "17:00" },
  Saturday: { active: false, start_time: "09:00", end_time: "13:00" },
  Sunday: { active: false, start_time: "09:00", end_time: "13:00" },
});

const WorkingHoursEditor = ({ workingHours, onChange }) => {
  const daysInPortuguese = {
    Monday: 'Segunda-feira',
    Tuesday: 'Terça-feira',
    Wednesday: 'Quarta-feira',
    Thursday: 'Quinta-feira',
    Friday: 'Sexta-feira',
    Saturday: 'Sábado',
    Sunday: 'Domingo'
  };

  return (
    <div className="p-4 bg-gray-50 border rounded-md">
      <h4 className="font-semibold text-gray-700 mb-3">Horário de Atendimento</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-y-4 gap-x-6">
        {Object.entries(workingHours || getDefaultWorkingHours()).map(([day, schedule]) => (
          <div key={day} className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-2 min-w-[130px]">
              <input 
                type="checkbox" 
                checked={schedule.active}
                onChange={(e) => onChange({ ...workingHours, [day]: { ...schedule, active: e.target.checked } })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 font-medium">{daysInPortuguese[day]}</span>
            </div>
            {schedule.active && (
              <div className="flex items-center space-x-2 bg-white px-2 py-1 rounded border shadow-sm">
                <input 
                  type="time" 
                  value={schedule.start_time}
                  onChange={(e) => onChange({ ...workingHours, [day]: { ...schedule, start_time: e.target.value } })}
                  className="text-sm border-none bg-transparent p-0 focus:ring-0 w-[70px]"
                />
                <span className="text-sm text-gray-400">até</span>
                <input 
                  type="time" 
                  value={schedule.end_time}
                  onChange={(e) => onChange({ ...workingHours, [day]: { ...schedule, end_time: e.target.value } })}
                  className="text-sm border-none bg-transparent p-0 focus:ring-0 w-[70px]"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const ProfessionalDetailsEditor = ({ userDetails, onChange }) => {
  return (
    <div className="p-4 bg-gray-50 border rounded-md mb-4">
      <h4 className="font-semibold text-gray-700 mb-3">Informações Profissionais</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
        <div>
            <label className="block text-sm font-medium text-gray-700">Especialidade</label>
            <input 
                type="text" 
                value={userDetails?.specialty || ''}
                onChange={(e) => onChange({ ...userDetails, specialty: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-2 py-1 border"
                placeholder="Ex: Ortopedista e Cirurgião"
            />
        </div>
        <div className="flex space-x-2">
            <div className="w-1/3">
                <label className="block text-sm font-medium text-gray-700">Tipo de Registro</label>
                <input 
                    type="text" 
                    value={userDetails?.professional_id?.description || ''}
                    onChange={(e) => onChange({ ...userDetails, professional_id: { ...(userDetails?.professional_id || {}), description: e.target.value } })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-2 py-1 border"
                    placeholder="Ex: CRM"
                />
            </div>
            <div className="w-2/3">
                <label className="block text-sm font-medium text-gray-700">Número do Registro</label>
                <input 
                    type="text" 
                    value={userDetails?.professional_id?.value || ''}
                    onChange={(e) => onChange({ ...userDetails, professional_id: { ...(userDetails?.professional_id || {}), value: e.target.value } })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-2 py-1 border"
                    placeholder="Ex: 12345-SP"
                />
            </div>
        </div>
      </div>
    </div>
  );
};
export default function UserManagement({ token, apiBaseUrl, onAction, currentUser, departments = [] }) {
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newUser, setNewUser] = useState({ 
    username: '', 
    name: '', 
    role: '', 
    working_hours: getDefaultWorkingHours(),
    specialty: '',
    professional_id: { description: '', value: '' }
  });
  const [editingDetailsFor, setEditingDetailsFor] = useState(null);
  const [editingDetails, setEditingDetails] = useState(null);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch users');
      }
      setUsers(data);
    } catch (err) {
      setMessage(err.message);
      setIsError(true);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async () => {
    setIsLoading(true);
    setMessage('');
    setIsError(false);

    if (!newUser.username || !newUser.name || !newUser.role) {
      setMessage('Por favor, preencha todos os campos.');
      setIsError(true);
      setIsLoading(false);
      return;
    }

    try {
      const payload = { ...newUser };
      if (payload.role !== 'Médico') {
          delete payload.working_hours;
          delete payload.specialty;
          delete payload.professional_id;
      } else {
          if (!payload.professional_id?.description && !payload.professional_id?.value) {
              delete payload.professional_id;
          }
      }

      const response = await fetch(`${apiBaseUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create user');
      }
      setMessage(`User "${data.username}" created successfully! Password: ${data.temporary_password}`);
      setIsAdding(false);
      setNewUser({ 
        username: '', 
        name: '', 
        role: '', 
        working_hours: getDefaultWorkingHours(),
        specialty: '',
        professional_id: { description: '', value: '' }
      });
      fetchUsers(); // Refresh the user list
    } catch (err) {
      setMessage(err.message);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = (username, data) => {
    onAction(
      `Tem certeza que deseja atualizar o usuário "${username}"?`,
      async () => {
        try {
          const response = await fetch(`${apiBaseUrl}/users/${encodeURIComponent(username)}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          });
          const responseData = await response.json();
          if (!response.ok) {
            throw new Error(responseData.detail || 'Failed to update user');
          }
          fetchUsers(); // Refresh the user list
        } catch (err) {
          setMessage(err.message);
          setIsError(true);
          // If the update fails, we should refetch to ensure the UI is consistent
          fetchUsers();
        }
      }
    );
  };

  const handleDelete = (username) => {
    onAction(
        `Tem certeza que deseja remover o usuário "${username}"? Esta ação não pode ser desfeita.`,
        async () => {
            try {
                const response = await fetch(`${apiBaseUrl}/users/${encodeURIComponent(username)}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.detail || 'Failed to delete user');
                }
                fetchUsers(); // Refresh the user list
            } catch (err) {
                setMessage(err.message);
                setIsError(true);
            }
        }
    );
  };

  return (
    <div className="flex-grow flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-700">User Management</h2>
            <button onClick={() => setIsAdding(true)} className="text-blue-500 hover:text-blue-700 p-1 rounded-full border border-transparent hover:border-blue-300">
                <AddUserIcon />
            </button>
          </div>
          {message && (
            <p className={`text-sm text-center font-semibold mb-4 ${isError ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </p>
          )}
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                          <th scope="col" className="px-6 py-3">Username</th>
                          <th scope="col" className="px-6 py-3">Name</th>
                          <th scope="col" className="px-6 py-3">Role</th>
                          <th scope="col" className="px-6 py-3 text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody>
                      {users.map(user => {
                        const isCurrentUser = user.username === currentUser.username;
                        return (
                          <React.Fragment key={user.username}>
                          <tr className={`bg-white border-b ${isCurrentUser ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                              <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{user.username}</td>
                              <td className="px-6 py-4">{user.name}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                  <select
                                      value={user.role}
                                      onChange={(e) => handleUpdateUser(user.username, { role: e.target.value })}
                                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5"
                                      disabled={isCurrentUser}
                                      onFocus={(e) => e.target.defaultValue = e.target.value} // Store original value on focus
                                      onBlur={(e) => { // Revert if no confirmation
                                          if (document.querySelector('.fixed.inset-0.bg-black')) {
                                            e.target.value = e.target.defaultValue;
                                          }
                                      }}
                                  >
                                      {departments.map(dep => {
                                          const depName = typeof dep === 'object' ? dep.name : dep;
                                          return <option key={depName} value={depName}>{depName}</option>;
                                      })}
                                      <option value="Admin">Admin</option>
                                  </select>
                                  {user.role === 'Médico' && (
                                      <button 
                                          onClick={() => {
                                              if (editingDetailsFor === user.username) {
                                                  setEditingDetailsFor(null);
                                              } else {
                                                  setEditingDetails({
                                                      working_hours: user.working_hours || getDefaultWorkingHours(),
                                                      specialty: user.specialty || '',
                                                      professional_id: user.professional_id || { description: '', value: '' }
                                                  });
                                                  setEditingDetailsFor(user.username);
                                              }
                                          }} 
                                          className="text-blue-500 hover:text-blue-700 shrink-0"
                                          title="Editar Detalhes Profissionais"
                                      >
                                          <ClockIcon />
                                      </button>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end space-x-2">
                                      {!isCurrentUser && (
                                        <button onClick={() => handleDelete(user.username)} className="text-red-500 hover:text-red-700" title="Remover Usuário">
                                            <TrashIcon />
                                        </button>
                                      )}
                                  </div>
                              </td>
                          </tr>
                          {editingDetailsFor === user.username && (
                              <tr key={`${user.username}-details`} className="bg-gray-50 border-b">
                                  <td colSpan="4" className="px-6 py-4">
                                      <ProfessionalDetailsEditor 
                                          userDetails={editingDetails} 
                                          onChange={setEditingDetails} 
                                      />
                                      <WorkingHoursEditor 
                                          workingHours={editingDetails.working_hours} 
                                          onChange={(wh) => setEditingDetails({...editingDetails, working_hours: wh})} 
                                      />
                                      <div className="flex justify-end mt-4 space-x-2">
                                          <button 
                                              onClick={() => setEditingDetailsFor(null)} 
                                              className="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                                          >
                                              Cancelar
                                          </button>
                                          <button 
                                              onClick={() => {
                                                  const updatePayload = { ...editingDetails };
                                                  if (!updatePayload.professional_id?.description && !updatePayload.professional_id?.value) {
                                                      updatePayload.professional_id = null;
                                                  }
                                                  handleUpdateUser(user.username, updatePayload);
                                                  setEditingDetailsFor(null);
                                              }} 
                                              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                                          >
                                              Salvar Detalhes
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          )}
                          </React.Fragment>
                        )
                      })}
                      {isAdding && (
                          <React.Fragment>
                          <tr className="bg-blue-50 border-b">
                              <td className="px-6 py-4">
                                  <input
                                      type="text"
                                      value={newUser.username}
                                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                                      className="w-full px-2 py-1 border rounded-md"
                                      placeholder="New username"
                                  />
                              </td>
                              <td className="px-6 py-4">
                                  <input
                                      type="text"
                                      value={newUser.name}
                                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                                      className="w-full px-2 py-1 border rounded-md"
                                      placeholder="Full Name"
                                  />
                              </td>
                              <td className="px-6 py-4">
                                  <select
                                      value={newUser.role}
                                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                                      className="w-full p-1.5 border rounded-md"
                                  >
                                     <option value="" disabled>Selecione um papel</option>
                                      {departments.map(dep => {
                                          const depName = typeof dep === 'object' ? dep.name : dep;
                                          return <option key={depName} value={depName}>{depName}</option>;
                                      })}
                                      <option value="Admin">Admin</option>
                                  </select>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <button onClick={handleAddUser} disabled={isLoading} className="text-green-500 hover:text-green-700 mr-2">
                                      <SaveIcon />
                                  </button>
                                  <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-gray-700">
                                      <CancelIcon />
                                  </button>
                              </td>
                          </tr>
                          {newUser.role === 'Médico' && (
                              <tr className="bg-blue-50 border-b">
                                  <td colSpan="4" className="px-6 py-4">
                                      <ProfessionalDetailsEditor 
                                          userDetails={newUser} 
                                          onChange={setNewUser} 
                                      />
                                      <WorkingHoursEditor 
                                          workingHours={newUser.working_hours} 
                                          onChange={(wh) => setNewUser({ ...newUser, working_hours: wh })} 
                                      />
                                  </td>
                              </tr>
                          )}
                          </React.Fragment>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
}