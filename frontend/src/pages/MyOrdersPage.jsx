import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const STATUS_STYLES = {
  received:   'bg-blue-50 text-blue-700 border-blue-100',
  processing: 'bg-amber-50 text-amber-700 border-amber-100',
  ready:      'bg-emerald-50 text-emerald-700 border-emerald-100',
  collected:  'bg-gray-100 text-gray-500 border-gray-200',
  rejected:   'bg-red-50 text-red-600 border-red-100',
};

const STATUS_ICONS = {
  received: '📥', processing: '⚙️', ready: '✅', collected: '📦', rejected: '❌',
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
      {/* Header */}
      <div className="text-center mb-2">
        <h1 className="text-2xl font-extrabold text-gray-900">My Orders</h1>
        <p className="text-sm text-gray-400 mt-1">Look up your print orders by contact or token</p>
      </div>

      {/* Search by contact */}
      <div className="card space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-gray-800">Search by Contact</h2>
            <p className="text-xs text-gray-400 mt-0.5">Phone or email used when placing your order</p>
          </div>
        </div>

        <form onSubmit={handleSearchByContact} className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Phone number or email"
              className="input pl-10"
            />
          </div>
          <button type="submit" disabled={loadingHistory} className="btn-primary px-5">
            {loadingHistory ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : 'Search'}
          </button>
        </form>

        {historyError && (
          <p className="text-red-500 text-sm flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01" />
            </svg>
            {historyError}
          </p>
        )}

        {searched && orders.length === 0 && (
          <div className="text-center py-10 space-y-2">
            <div className="text-4xl">📭</div>
            <p className="text-gray-600 font-semibold text-sm">No orders found</p>
            <p className="text-xs text-gray-400">Try a different contact or check your token below</p>
          </div>
        )}

        {orders.length > 0 && (
          <div className="space-y-2.5">
            <p className="text-xs text-gray-400 font-medium">{orders.length} order{orders.length !== 1 ? 's' : ''} found</p>
            {orders.map((o) => (
              <OrderCard key={o.orderId} order={o} onClick={() => navigate(`/order/${o.orderId}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Token lookup */}
      <div className="card space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-gray-800">Look Up by Token</h2>
            <p className="text-xs text-gray-400 mt-0.5">Paste the order token from your confirmation</p>
          </div>
        </div>

        <form onSubmit={handleTokenLookup} className="flex gap-2">
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your order token here…"
            className="input flex-1 font-mono text-sm"
          />
          <button type="submit" disabled={loadingToken} className="btn-primary px-5">
            {loadingToken ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : 'Find'}
          </button>
        </form>

        {tokenError && (
          <p className="text-red-500 text-sm flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01" />
            </svg>
            {tokenError}
          </p>
        )}

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
      className="w-full text-left border border-gray-100/80 rounded-2xl p-4 hover:border-indigo-200 hover:bg-indigo-50/30 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex justify-between items-center gap-3 bg-white/60 backdrop-blur-sm"
    >
      <div className="min-w-0">
        <p className="text-sm font-bold text-gray-800 truncate">{order.fileName}</p>
        <p className="font-mono text-xs text-gray-400 truncate mt-0.5">{order.orderId.slice(0, 18)}…</p>
        <p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className={`status-badge border ${style}`}>
          {STATUS_ICONS[order.orderStatus]} {order.orderStatus}
        </span>
        <span className="text-base font-extrabold text-indigo-600">₹{order.cost}</span>
      </div>
    </button>
  );
}
