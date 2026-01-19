import React, { useState } from 'react';
import { Clock } from 'lucide-react';

const EventList = ({ events, setCart, cart, showMessage }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const addToCart = (event, qty) => {
    if (qty > event.available) {
      showMessage('error', `Only ${event.available} tickets available!`);
      return;
    }
    const existing = cart.find(item => item.event.id === event.id);
    if (existing) {
      setCart(cart.map(item => item.event.id === event.id ? { ...item, quantity: item.quantity + qty } : item));
    } else {
      setCart([...cart, { event, quantity: qty }]);
    }
    showMessage('success', `Added ${qty} ticket(s) to cart`);
    setSelectedEvent(null);
    setQuantity(1);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-4">Available Events</h2>
      {events.map(event => (
        <div key={event.id} className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800">{event.name}</h3>
              <div className="flex items-center gap-2 text-gray-600 mt-2">
                <Clock className="w-4 h-4" /> <span>{event.date} • {event.venue}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600">${event.price}</div>
              <div className={`text-sm ${event.available < 10 ? 'text-red-500' : 'text-gray-500'}`}>
                {event.available} / {event.total} available
              </div>
            </div>
          </div>
          {selectedEvent === event.id ? (
            <div className="flex gap-3 items-center">
              <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))} className="border rounded px-3 py-2 w-20" />
              <button onClick={() => addToCart(event, quantity)} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">Confirm</button>
              <button onClick={() => setSelectedEvent(null)} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
            </div>
          ) : (
            <button 
              onClick={() => setSelectedEvent(event.id)} 
              disabled={event.available === 0}
              className={`w-full py-2 rounded font-semibold text-white ${event.available === 0 ? 'bg-gray-300' : 'bg-gradient-to-r from-purple-600 to-pink-600'}`}
            >
              {event.available === 0 ? 'Sold Out' : 'Add to Cart'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default EventList;