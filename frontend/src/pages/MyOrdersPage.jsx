import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const STATUS_STYLES = {
  received:   'bg-blue-50 text-blue-700 border-blue-100',
  processing: 'bg-amber-50 text-amber-700 border-amber-100',
  ready:      'bg-emerald-50 text-emerald-700 border-emerald-100',
  collected:  'bg-gray-100 text-gray-500 border-gray-200',
  rejected:   'bg-red-50 text-red-600 border-red-100',
};

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const [contact, setContact] = useState('');
  const [orders, setOrders] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const [token, setToken] = useState('');
  const [tokenOrder, setTokenOrder] = useState(null);
  const [loadingToken, setLoadingToken] = useState(false);
  const [tokenError, setTokenError] = useState('');

  async function handleSearchByContact(e) {
    e.preventDefault();
    if (!contact.trim()) return;
    setLoadingHistory(true); setHistoryError('');
    try {
      const res = await axios.get(`/api/orders?studentContact=${encodeURIComponent(contact.trim())}`);
      setOrders(res.data.orders || []);
      setSearched(true);
    } catch {
      setHistoryError('Failed to fetch orders. Please try again.');
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleTokenLookup(e) {
    e.preventDefault();
    if (!token.trim()) return;
    setLoadingToken(true); setTokenError(''); setTokenOrder(null);
    try {
      const res = await axios.get(`/api/orders/${token.trim()}`);
      setTokenOrder(res.data.order);
    } catch (err) {
      setTokenError(err.response?.status === 404 ? 'Order not found.' : 'Lookup failed.');
    } finally {
      setLoadingToken(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-sm text-gray-400 mt-1">Look up your orders by contact or token</p>
      </div>

      {/* Search by contact */}
      <div className="card space-y-4">
        <div>
          <h2 className="font-semibold text-gray-800">Search by Contact</h2>
          <p className="text-xs text-gray-400 mt-0.5">Enter the phone or email you used when placing your order</p>
        </div>
        <form onSubmit={handleSearchByContact} className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Phone number or email"
              className="input pl-9"
            />
          </div>
          <button type="submit" disabled={loadingHistory} className="btn-primary px-5">
            {loadingHistory ? '…' : 'Search'}
          </button>
        </form>

        {historyError && <p className="text-red-500 text-sm">{historyError}</p>}

        {searched && orders.length === 0 && (
          <div className="text-center py-8 space-y-2">
            <div className="text-3xl">📭</div>
            <p className="text-gray-500 text-sm font-medium">No orders found</p>
            <p className="text-xs text-gray-400">Try a different contact or check your token</p>
          </div>
        )}

        {orders.length > 0 && (
          <div className="space-y-2">
            {orders.map((o) => (
              <OrderCard key={o.orderId} order={o} onClick={() => navigate(`/order/${o.orderId}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Token lookup */}
      <div className="card space-y-4">
        <div>
          <h2 className="font-semibold text-gray-800">Look Up by Token</h2>
          <p className="text-xs text-gray-400 mt-0.5">Paste the order token from your confirmation</p>
        </div>
        <form onSubmit={handleTokenLookup} className="flex gap-2">
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your order token"
            className="input flex-1 font-mono text-sm"
          />
          <button type="submit" disabled={loadingToken} className="btn-primary px-5">
            {loadingToken ? '…' : 'Find'}
          </button>
        </form>

        {tokenError && <p className="text-red-500 text-sm">{tokenError}</p>}

        {tokenOrder && (
          <OrderCard order={tokenOrder} onClick={() => navigate(`/order/${tokenOrder.orderId}`)} />
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, onClick }) {
  const style = STATUS_STYLES[order.orderStatus] || 'bg-gray-50 text-gray-600 border-gray-200';
  return (
    <button
      onClick={onClick}
      className="w-full text-left border border-gray-100 rounded-xl p-4 hover:border-indigo-200 hover:bg-indigo-50/40 hover:shadow-sm transition-all duration-150 flex justify-between items-center gap-3"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{order.fileName}</p>
        <p className="font-mono text-xs text-gray-400 truncate mt-0.5">{order.orderId.slice(0, 16)}…</p>
        <p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className={`status-badge border ${style}`}>
          {order.orderStatus}
        </span>
        <span className="text-sm font-bold text-indigo-600">₹{order.cost}</span>
      </div>
    </button>
  );
}
