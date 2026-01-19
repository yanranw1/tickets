import React, { useState } from 'react';
import { Ticket, UserPlus } from 'lucide-react';

const Signup = ({ setView, setCurrentUser, loadEvents, showMessage }) => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        const user = await response.json();
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        setView('events');
        loadEvents();
      } else {
        showMessage('error', 'Signup failed');
      }
    } catch (error) {
      showMessage('error', 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">Create Account</h1>
        <div className="space-y-4">
          <input type="text" placeholder="Username" onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
          <input type="email" placeholder="Email" onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
          <input type="password" placeholder="Password" onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
          <button onClick={handleSignup} disabled={loading} className="w-full bg-pink-600 text-white py-3 rounded-lg flex items-center justify-center gap-2">
            <UserPlus className="w-5 h-5" /> Sign Up
          </button>
        </div>
        <button onClick={() => setView('login')} className="w-full mt-4 text-gray-600 text-sm">Back to Login</button>
      </div>
    </div>
  );
};

export default Signup;