import React, { useState, useEffect, useCallback } from 'react';
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
    let va = (a[sortField] ?? '').toString().toLowerCase();
    let vb = (b[sortField] ?? '').toString().toLowerCase();
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Queue</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage and update all incoming print orders</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Order count badge */}
          <div className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100">
            <span className="text-xs font-semibold text-indigo-600">
              {orders.length} order{orders.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={fetchOrders}
            className="btn-secondary px-3 py-1.5 text-xs gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card py-4 flex flex-col sm:flex-row gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input sm:w-44"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>

        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by token or student name…"
              className="input pl-9"
            />
          </div>
          <button type="submit" className="btn-primary px-4 py-2 text-sm">Search</button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); }}
              className="btn-secondary px-3 py-2 text-sm"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>
      )}

      {loading && (
        <div className="text-center py-16">
          <svg className="w-6 h-6 animate-spin text-indigo-400 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-gray-400 text-sm mt-3">Loading orders…</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    { field: 'orderId', label: 'Token' },
                    { field: 'studentName', label: 'Student' },
                    { field: null, label: 'File' },
                    { field: 'orderStatus', label: 'Status' },
                    { field: null, label: 'Payment' },
                    { field: null, label: 'Cost' },
                    { field: null, label: 'Est. Completion' },
                    { field: 'createdAt', label: 'Placed' },
                    { field: null, label: '' },
                  ].map(({ field, label }) => (
                    <th key={label} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {field ? (
                        <button onClick={() => toggleSort(field)} className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
                          {label}
                          <span className="text-gray-300">{sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</span>
                        </button>
                      ) : label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={9}>
                      <EmptyState />
                    </td>
                  </tr>
                )}
                {paginated.map((o) => (
                  <tr
                    key={o.orderId}
                    className="hover:bg-indigo-50/40 transition-colors duration-100 cursor-pointer"
                    onClick={() => navigate(`/staff/orders/${o.orderId}`)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{o.orderId.slice(0, 8)}…</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{o.studentName}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[140px] truncate">{o.fileName}</td>
                    <td className="px-4 py-3">
                      <span className={`status-badge border capitalize ${STATUS_STYLES[o.orderStatus]}`}>
                        {o.orderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {o.paymentStatus === 'paid' ? (
                        <span className="status-badge bg-emerald-50 text-emerald-700 border border-emerald-100">Paid</span>
                      ) : (
                        <span className="status-badge bg-orange-50 text-orange-600 border border-orange-100">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-indigo-600">₹{o.cost}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {o.estimatedCompletionTime
                        ? new Date(o.estimatedCompletionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(o.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/staff/orders/${o.orderId}`)}
                        className="text-indigo-500 hover:text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
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
                className="card w-full text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{o.studentName}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{o.orderId.slice(0, 16)}…</p>
                  </div>
                  <span className={`status-badge border capitalize ${STATUS_STYLES[o.orderStatus]}`}>
                    {o.orderStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="truncate max-w-[60%]">{o.fileName}</span>
                  <span className="font-bold text-indigo-600">₹{o.cost}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{new Date(o.createdAt).toLocaleString()}</span>
                  {o.paymentStatus === 'paid' ? (
                    <span className="text-emerald-600 font-semibold">✓ Paid</span>
                  ) : (
                    <span className="text-orange-500 font-semibold">⏳ Pending</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          {orders.length > PAGE_SIZE && totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary px-4 py-1.5 text-sm disabled:opacity-40"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary px-4 py-1.5 text-sm disabled:opacity-40"
                >
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
    <div className="text-center py-16 space-y-3">
      <div className="text-4xl">📋</div>
      <p className="font-semibold text-gray-500">No orders found</p>
      <p className="text-xs text-gray-400">Try adjusting filters or refreshing the page</p>
    </div>
  );
}
