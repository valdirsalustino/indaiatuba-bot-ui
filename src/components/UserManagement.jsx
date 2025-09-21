import React, { useState } from 'react';

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

export default function UserManagement({ token, apiBaseUrl }) {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('Social');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState(null); // To store new user credentials

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setIsError(false);
    setCreatedUser(null);

    try {
      const response = await fetch(`${apiBaseUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ username, role }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create user');
      }
      setMessage(`User "${data.username}" created successfully!`);
      setCreatedUser({ username: data.username, tempPassword: data.temporary_password });
      setUsername('');
      setRole('Social');
    } catch (err) {
      setMessage(err.message);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-700 flex items-center justify-center">
            <UserIcon />
            Create New User
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="text-sm font-medium text-gray-600 block">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="role" className="text-sm font-medium text-gray-600 block">Role</label>
            <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
                <option value="Social">Social</option>
                <option value="Financeiro">Financeiro</option>
                <option value="Esportes">Esportes</option>
                <option value="Admin">Admin</option>
            </select>
          </div>

          {message && (
            <p className={`text-sm text-center font-semibold ${isError ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </p>
          )}

          {createdUser && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-sm">
                <p className="font-bold text-gray-800">Share these credentials with the new user:</p>
                <p className="mt-2 text-gray-700"><strong>Username:</strong> {createdUser.username}</p>
                <p className="text-gray-700"><strong>Temporary Password:</strong> <span className="font-mono bg-gray-200 px-1 rounded">{createdUser.tempPassword}</span></p>
                <p className="mt-2 text-xs text-gray-500">They will be required to set a new password on their first login.</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 font-bold text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:bg-blue-700 disabled:bg-blue-300"
            >
              {isLoading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}