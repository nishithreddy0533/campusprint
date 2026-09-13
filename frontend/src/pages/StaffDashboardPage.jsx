import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PAGE_SIZE = 20;
const STATUS_OPTIONS = ['', 'received', 'processing', 'ready', 'collected', 'rejected'];

const STATUS_STYLES = {
  received:   'bg-blue-50 text-blue-700 border-blue-100',
  processing: 'bg-amber-50 text-amber-700 border-amber-100',
  ready:      'bg-emerald-50 text-emerald-700 border-emerald-100',
  collected:  'bg-gray-100 text-gray-500 border-gray-200',
  rejected:   'bg-red-50 text-red-600 border-red-100',
};

const STATUS_ICONS = {
  received: '📥',
  processing: '⚙️',
  ready: '✅',
  collected: '📦',
  rejected: '❌',
};

function authHeaders() {
  return { Authorization: `Bearer ${sessionStorage.getItem('staffToken')}` };
}

export default function StaffDashboardPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await axios.get(`/api/orders?${params}`, { headers: authHeaders() });
      setOrders(res.data.orders || []);
      setPage(1);
    } catch (err) {
      if (err.response?.status === 401) navigate('/staff/login');
      else setError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, navigate]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => {
    const t = setInterval(fetchOrders, 10000);
    return () => clearInterval(t);
  }, [fetchOrders]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setSearch(searchInput);
  }

  function toggleSort(field) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  }

  const sorted = [...orders].sort((a, b) => {
    const va = (a[sortField] ?? '').toString().toLowerCase();
    const vb = (b[sortField] ?? '').toString().toLowerCase();
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Summary counts
  const counts = orders.reduce((acc, o) => {
    acc[o.orderStatus] = (acc[o.orderStatus] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 page-enter">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Order Queue</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage and process all incoming print orders</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-2xl bg-white/80 border border-indigo-100 shadow-sm">
            <span className="text-sm font-bold text-indigo-600">{orders.length}</span>
            <span className="text-sm text-gray-400 ml-1">order{orders.length !== 1 ? 's' : ''}</span>
          </div>
          <button onClick={fetchOrders} className="btn-secondary px-3.5 py-2 text-sm gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Status summary pills */}
      <div className="flex flex-wrap gap-2">
        {['received', 'processing', 'ready', 'collected', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
              statusFilter === s
                ? `${STATUS_STYLES[s]} shadow-sm scale-105`
                : 'bg-white/70 text-gray-500 border-gray-200 hover:border-indigo-200 hover:text-indigo-600'
            }`}
          >
            <span>{STATUS_ICONS[s]}</span>
            <span className="capitalize">{s}</span>
            {counts[s] ? <span className="ml-0.5 font-bold">{counts[s]}</span> : null}
          </button>
        ))}
        {statusFilter && (
          <button
            onClick={() => setStatusFilter('')}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200 bg-white/70 text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card py-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by order token or student name…"
              className="input pl-10"
            />
          </div>
          <button type="submit" className="btn-primary px-5 py-2.5 text-sm">Search</button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); }} className="btn-secondary px-4 py-2.5 text-sm">
              Clear
            </button>
          )}
        </form>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-16">
          <div className="w-10 h-10 mx-auto rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">Loading orders…</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-100/80 bg-white/80 backdrop-blur-sm premium-table">
            <table className="min-w-full text-sm">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #f8f7ff 0%, #eef2ff 100%)' }}>
                  {[
                    { field: 'orderId', label: 'Token' },
                    { field: 'studentName', label: 'Student' },
                    { field: null, label: 'File' },
                    { field: 'orderStatus', label: 'Status' },
                    { field: null, label: 'Payment' },
                    { field: null, label: 'Cost' },
                    { field: 'createdAt', label: 'Placed' },
                    { field: null, label: '' },
                  ].map(({ field, label }) => (
                    <th key={label} className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {field ? (
                        <button onClick={() => toggleSort(field)} className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
                          {label}
                          <span className="text-gray-300 text-[10px]">{sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</span>
                        </button>
                      ) : label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/80">
                {paginated.length === 0 && (
                  <tr><td colSpan={8}><EmptyState /></td></tr>
                )}
                {paginated.map((o) => (
                  <tr
                    key={o.orderId}
                    onClick={() => navigate(`/staff/orders/${o.orderId}`)}
                    className="cursor-pointer hover:bg-indigo-50/40 transition-all duration-150 group"
                  >
                    <td className="px-4 py-3.5 font-mono text-xs text-gray-400 group-hover:text-indigo-500 transition-colors">
                      {o.orderId.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-gray-800">{o.studentName}</td>
                    <td className="px-4 py-3.5 text-gray-500 max-w-[130px] truncate text-xs">{o.fileName}</td>
                    <td className="px-4 py-3.5">
                      <span className={`status-badge border capitalize ${STATUS_STYLES[o.orderStatus]}`}>
                        {STATUS_ICONS[o.orderStatus]} {o.orderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {o.paymentStatus === 'paid' ? (
                        <span className="status-badge bg-emerald-50 text-emerald-700 border border-emerald-100">✓ Paid</span>
                      ) : (
                        <span className="status-badge bg-orange-50 text-orange-600 border border-orange-100">⏳ Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-indigo-600">₹{o.cost}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-400">{new Date(o.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/staff/orders/${o.orderId}`)}
                        className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 px-3 py-1.5 rounded-xl hover:bg-indigo-50 transition-all"
                      >
                        Manage →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {paginated.length === 0 && <EmptyState />}
            {paginated.map((o) => (
              <button
                key={o.orderId}
                onClick={() => navigate(`/staff/orders/${o.orderId}`)}
                className="card card-float w-full text-left space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{o.studentName}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{o.orderId.slice(0, 16)}…</p>
                  </div>
                  <span className={`status-badge border capitalize ${STATUS_STYLES[o.orderStatus]}`}>
                    {STATUS_ICONS[o.orderStatus]} {o.orderStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="truncate max-w-[55%]">{o.fileName}</span>
                  <span className="font-extrabold text-indigo-600 text-sm">₹{o.cost}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{new Date(o.createdAt).toLocaleString()}</span>
                  {o.paymentStatus === 'paid'
                    ? <span className="text-emerald-600 font-semibold">✓ Paid</span>
                    : <span className="text-orange-500 font-semibold">⏳ Pending</span>}
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          {orders.length > PAGE_SIZE && totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">
                  ← Prev
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 space-y-3">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center text-3xl mb-2">
        📋
      </div>
      <p className="font-bold text-gray-500">No orders found</p>
      <p className="text-xs text-gray-400">Try adjusting filters or refreshing the page</p>
    </div>
  );
}
