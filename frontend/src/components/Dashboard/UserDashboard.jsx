import React, { useState, useEffect } from 'react';
import { User, LogOut, Ticket, Calendar, MapPin, DollarSign } from 'lucide-react';

const UserDashboard = ({ currentUser, setView, handleLogout, showMessage }) => {
  const [userTickets, setUserTickets] = useState([]);

  const loadUserTickets = async () => {
    try {
      const response = await fetch(`/api/user/${currentUser.id}/tickets`);
      const data = await response.json();
      setUserTickets(data);
    } catch (error) {
      showMessage('error', 'Failed to load tickets');
    }
  };

  useEffect(() => { loadUserTickets(); }, []);

  const markTicketAsUsed = async (id) => {
    const response = await fetch(`/api/tickets/${id}/use`, { method: 'POST' });
    if (response.ok) {
      showMessage('success', 'Ticket used!');
      loadUserTickets();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="bg-white rounded-lg p-6 mb-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <User className="w-10 h-10 text-purple-600" />
            <h1 className="text-2xl font-bold">My Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setView('events')} className="px-4 py-2 bg-purple-100 text-purple-600 rounded-lg">Browse</button>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg flex items-center gap-1"><LogOut size={18}/> Logout</button>
          </div>
        </header>

        <div className="grid gap-4">
          <h2 className="text-white text-xl font-bold">Your Tickets</h2>
          {userTickets.map(ticket => (
            <div key={ticket.id} className="bg-white p-6 rounded-lg shadow flex justify-between">
              <div>
                <h3 className="font-bold text-lg">{ticket.event_name}</h3>
                <div className="text-gray-600 text-sm space-y-1 mt-2">
                  <p className="flex items-center gap-1"><Calendar size={14}/> {ticket.event_date}</p>
                  <p className="flex items-center gap-1"><MapPin size={14}/> {ticket.venue}</p>
                </div>
              </div>
              <div className="text-right">
                {ticket.used ? 
                  <span className="text-gray-400 font-bold">USED</span> : 
                  <button onClick={() => markTicketAsUsed(ticket.id)} className="bg-green-600 text-white px-4 py-2 rounded">Use Ticket</button>
                }
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;