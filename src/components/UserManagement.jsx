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


export default function UserManagement({ token, apiBaseUrl, onAction, currentUser }) {
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', name: '', role: 'Social' });

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

    try {
      const response = await fetch(`${apiBaseUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create user');
      }
      setMessage(`User "${data.username}" created successfully! Password: ${data.temporary_password}`);
      setIsAdding(false);
      setNewUser({ username: '', name: '', role: 'Social' });
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
      `Are you sure you want to update user "${username}"?`,
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
        `Are you sure you want to delete the user "${username}"? This action cannot be undone.`,
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
          <div className="overflow-x-auto">
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
                          <tr key={user.username} className={`bg-white border-b ${isCurrentUser ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                              <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{user.username}</td>
                              <td className="px-6 py-4">{user.name}</td>
                              <td className="px-6 py-4">
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
                                    <option value="Social">Social</option>
                                    <option value="Administração">Administração</option>
                                    <option value="Esporte, Cultura e Artes">Esporte, Cultura e Artes</option>
                                    <option value="Admin">Admin</option>
                                </select>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  {!isCurrentUser && (
                                    <button onClick={() => handleDelete(user.username)} className="text-red-500 hover:text-red-700">
                                        <TrashIcon />
                                    </button>
                                  )}
                              </td>
                          </tr>
                        )
                      })}
                      {isAdding && (
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
                                      <option value="Social">Social</option>
                                      <option value="Administração">Administração</option>
                                      <option value="Esporte, Cultura e Artes">Esporte, Cultura e Artes</option>
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
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
}