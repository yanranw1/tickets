import React from 'react';

const ShoppingCart = ({ cart, setCart, currentUser, loadEvents, showMessage }) => {
  const total = cart.reduce((sum, item) => sum + (item.event.price * item.quantity), 0);
  

  const checkout = async () => {
    try {
      const items = cart.map(item => ({ event_id: item.event.id, quantity: item.quantity }));
      const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, items })
      });
      if (response.ok) {
        showMessage('success', '🎉 Purchase successful!');
        setCart([]);
        loadEvents();
      } else {
        console.log("error0")
        loadEvents();
        showMessage('error', 'Purchase failed! The ticket you selected is sold out.');
      }
    } catch (error) {
        console.log("error1")
        loadEvents();
        showMessage('error', 'Connection error');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Cart</h2>
      {cart.length === 0 ? <p className="text-gray-500">Empty</p> : (
        <>
          {cart.map(item => (
            <div key={item.event.id} className="border-b py-3 flex justify-between">
              <div>
                <p className="font-bold">{item.event.name}</p>
                <p className="text-sm">{item.quantity} x ${item.event.price}</p>
              </div>
              <button onClick={() => setCart(cart.filter(i => i.event.id !== item.event.id))} className="text-red-500 text-xs">Remove</button>
            </div>
          ))}
          <div className="text-xl font-bold mt-4 flex justify-between">
            <span>Total:</span> <span>${total.toFixed(2)}</span>
          </div>
          <button onClick={checkout} className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg font-bold">Checkout</button>
        </>
      )}
    </div>
  );
};

export default ShoppingCart;