import React, { useState, useEffect } from 'react';
import { Ticket, ShoppingCart, CheckCircle, AlertCircle, Clock } from 'lucide-react';

const App = () => {
  const [events, setEvents] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadEvents();
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const loadEvents = async () => {
    try {
      const response = await fetch('/api/events');
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      showMessage('error', 'Failed to load events');
    }
  };

  const addToCart = (event, qty) => {
    if (qty > event.available) {
      showMessage('error', `Only ${event.available} tickets available!`);
      return;
    }

    const existing = cart.find(item => item.event.id === event.id);
    if (existing) {
      const newQty = existing.quantity + qty;
      if (newQty > event.available) {
        showMessage('error', `Only ${event.available} tickets available!`);
        return;
      }
      setCart(cart.map(item => 
        item.event.id === event.id 
          ? { ...item, quantity: newQty }
          : item
      ));
    } else {
      setCart([...cart, { event, quantity: qty }]);
    }
    showMessage('success', `Added ${qty} ticket(s) to cart`);
    setSelectedEvent(null);
    setQuantity(1);
  };

  const removeFromCart = (eventId) => {
    setCart(cart.filter(item => item.event.id !== eventId));
  };

  const checkout = async () => {
    if (cart.length === 0) {
      showMessage('error', 'Cart is empty!');
      return;
    }

    setLoading(true);
    
    try {
      const items = cart.map(item => ({
        event_id: item.event.id,
        quantity: item.quantity
      }));

      const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });

      if (response.ok) {
        showMessage('success', 'Purchase successful!');
        setCart([]);
        loadEvents();
      } else {
        // 1. Refresh the event list to get latest 'available' counts
        const eventsRes = await fetch('/api/events');
        const latestEvents = await eventsRes.json();
        setEvents(latestEvents);

        // 2. Filter out items from the cart that are now sold out
        setCart(prevCart => prevCart.filter(cartItem => {
          const freshEventData = latestEvents.find(e => e.id === cartItem.event.id);
          return freshEventData && freshEventData.available > 0;
        }));

        showMessage('error', 'Purchase Failed!! Some items sold out and were removed from your cart.');
      }
    } catch (error) {
      showMessage('error', 'Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.event.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Ticket className="w-10 h-10 text-purple-600" />
              <h1 className="text-4xl font-bold text-gray-800">Ticket Queen</h1>
            </div>
            <div className="flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-full">
              <ShoppingCart className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-600">{cart.length} items</span>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">Available Events</h2>
            {events.map(event => (
              <div key={event.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{event.name}</h3>
                    <div className="flex items-center gap-2 text-gray-600 mt-2">
                      <Clock className="w-4 h-4" />
                      <span>{event.date} • {event.venue}</span>
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
                    <input
                      type="number"
                      min="1"
                      max={event.available}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="border rounded px-3 py-2 w-20"
                    />
                    <button
                      onClick={() => addToCart(event, quantity)}
                      className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEvent(null);
                        setQuantity(1);
                      }}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedEvent(event.id)}
                    disabled={event.available === 0}
                    className={`w-full py-2 rounded font-semibold transition ${
                      event.available === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                    }`}
                  >
                    {event.available === 0 ? 'Sold Out' : 'Add to Cart'}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Shopping Cart</h2>
              
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Your cart is empty</p>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    {cart.map(item => (
                      <div key={item.event.id} className="border-b pb-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800">{item.event.name}</div>
                            <div className="text-sm text-gray-600">
                              {item.quantity} × ${item.event.price}
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.event.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="font-bold text-purple-600">
                          ${(item.quantity * item.event.price).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 mb-4">
                    <div className="flex justify-between items-center text-xl font-bold">
                      <span>Total:</span>
                      <span className="text-purple-600">${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* --- Inline Message Section --- */}
                  {message && (
                    <div className={`mb-4 p-3 rounded text-sm flex items-center gap-2 animate-pulse ${
                      message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      <span>{message.text}</span>
                    </div>
                  )}

                  <button
                    onClick={checkout}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-bold hover:from-green-600 hover:to-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Complete Purchase'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Inside the Shopping Cart column, above the Checkout button */}
{message && (
  <div className={`mb-4 p-4 rounded-lg border-2 shadow-md animate-in zoom-in-95 duration-200 ${
    message.type === 'success' 
      ? 'bg-green-50 border-green-500 text-green-900' 
      : 'bg-red-50 border-red-500 text-red-900'
  }`}>
    <div className="flex items-start gap-3">
      {message.type === 'success' ? (
              <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            )}
            
            <div className="flex-1">
              <p className="font-black uppercase text-xs tracking-wider mb-1">
                {message.type === 'success' ? 'Confirmed' : 'Action Required'}
              </p>
              <p className="text-sm font-medium leading-tight">
                {message.text}
              </p>
            </div>

            <button 
              onClick={() => setMessage(null)}
              className="shrink-0 bg-white/50 hover:bg-white rounded-md p-1 transition-all border border-black/10 shadow-sm"
              title="Dismiss notification"
            >
              <span className="text-xl leading-none block w-4 h-4 flex items-center justify-center font-bold">
                &times;
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
