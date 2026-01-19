import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

const MessageAlert = ({ message }) => {
  if (!message) return null;
  return (
    <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 shadow-lg border-2 ${
      message.type === 'success' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'
    }`}>
      {message.type === 'success' ? <CheckCircle className="w-6 h-6 flex-shrink-0" /> : <AlertCircle className="w-6 h-6 flex-shrink-0" />}
      <span className="font-semibold">{message.text}</span>
    </div>
  );
};

export default MessageAlert;