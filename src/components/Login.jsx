import React, { useState } from 'react';

function SetPasswordForm({ apiBaseUrl, resetToken, onPasswordSet }) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`${apiBaseUrl}/set-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${resetToken}`,
                },
                body: JSON.stringify({ new_password: newPassword }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to set password.');
            }
            onPasswordSet();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center text-gray-700">Set Your New Password</h2>
            <p className="text-sm text-center text-gray-500">This is your first login. Please choose a secure password.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="new-password" className="text-sm font-medium text-gray-600 block">New Password</label>
                    <input
                        type="password"
                        id="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="confirm-password" className="text-sm font-medium text-gray-600 block">Confirm New Password</label>
                    <input
                        type="password"
                        id="confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                    />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div>
                    <button type="submit" disabled={isLoading} className="w-full px-4 py-2 font-bold text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:bg-blue-700 disabled:bg-blue-300">
                        {isLoading ? 'Saving...' : 'Set Password'}
                    </button>
                </div>
            </form>
        </div>
    );
}


export default function Login({ onLogin, apiBaseUrl }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');


  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${apiBaseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      if (data.access_token) {
        onLogin(data.access_token);
      } else if (data.reset_token) {
        setResetToken(data.reset_token);
        setShowPasswordReset(true);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSet = () => {
      setShowPasswordReset(false);
      setSuccessMessage("Password set successfully! Please log in with your new password.");
      setUsername('');
      setPassword('');
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
        {showPasswordReset ? (
            <SetPasswordForm
                apiBaseUrl={apiBaseUrl}
                resetToken={resetToken}
                onPasswordSet={handlePasswordSet}
            />
        ) : (
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center text-gray-700">Login do Administrador</h2>
                {successMessage && <p className="text-sm text-center text-green-600 bg-green-50 p-3 rounded-md">{successMessage}</p>}
                <form onSubmit={handleLoginSubmit} className="space-y-6">
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
                    <label htmlFor="password" className="text-sm font-medium text-gray-600 block">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                    />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div>
                    <button type="submit" disabled={isLoading} className="w-full px-4 py-2 font-bold text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:bg-blue-700 disabled:bg-blue-300">
                    {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </div>
                </form>
            </div>
        )}
    </div>
  );
}