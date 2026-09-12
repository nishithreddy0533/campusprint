import React from 'react';
import { useNavigate } from 'react-router-dom';

const features = [
  { icon: '⚡', title: 'Instant Upload', desc: 'Upload PDF, Word, or images in seconds.' },
  { icon: '🎨', title: 'B&W or Color', desc: 'Choose your print type and binding options.' },
  { icon: '📍', title: 'Live Tracking', desc: 'Track your order status in real time.' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center px-4 page-enter">
      <div className="mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold tracking-wide">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
        Campus Printing, Reimagined
      </div>

      <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
        Print Smarter,{' '}
        <span className="text-indigo-600">Skip the Queue</span>
      </h1>

      <p className="text-gray-500 text-base sm:text-lg max-w-md mb-10 leading-relaxed">
        Upload your document, pick your options, pay online and track your print — all before you even leave your desk.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mb-12">
        <button
          onClick={() => navigate('/order/new')}
          className="btn-primary flex-1 py-3 text-base"
        >
          New Order
        </button>
        <button
          onClick={() => navigate('/staff/login')}
          className="btn-secondary flex-1 py-3 text-base"
        >
          Staff Login
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mb-8">
        {features.map((f) => (
          <div key={f.title} className="card py-5 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="text-2xl mb-2">{f.icon}</div>
            <p className="font-semibold text-gray-800 text-sm">{f.title}</p>
            <p className="text-xs text-gray-400 mt-1">{f.desc}</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/my-orders')}
        className="text-sm text-indigo-500 hover:text-indigo-700 underline underline-offset-2 transition-colors"
      >
        View my past orders →
      </button>
    </div>
  );
}
