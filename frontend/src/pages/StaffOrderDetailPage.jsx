import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Valid transitions map (mirrors backend)
const NEXT_STATUSES = {
  received: ['processing'],
  processing: ['ready'],
  ready: ['collected'],
  collected: [],
  rejected: [],
};

const STATUS_COLORS = {
  received: 'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  ready: 'bg-green-100 text-green-700',
  collected: 'bg-gray-100 text-gray-600',
  rejected: 'bg-red-100 text-red-700',
};

function authHeaders() {
  return { Authorization: `Bearer ${sessionStorage.getItem('staffToken')}` };
}

export default function StaffOrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Status update state
  const [newStatus, setNewStatus] = useState('');
  const [estTime, setEstTime] = useState('');

  // Rejection state
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  async function loadOrder() {
    try {
      const res = await axios.get(`/api/orders/${orderId}`, { headers: authHeaders() });
      setOrder(res.data.order);
      setNewStatus('');
    } catch (err) {
      if (err.response?.status === 404) setLoadError('Order not found.');
      else if (err.response?.status === 401) navigate('/staff/login');
      else setLoadError('Failed to load order.');
    }
  }

  useEffect(() => { loadOrder(); }, [orderId]);

  async function handleStatusUpdate(e) {
    e.preventDefault();
    if (!newStatus) return;
    setActionError(''); setActionLoading(true);
    try {
      const res = await axios.patch(
        `/api/orders/${orderId}/status`,
        { orderStatus: newStatus, estimatedCompletionTime: estTime || undefined },
        { headers: authHeaders() }
      );
      setOrder(res.data.order);
      setNewStatus('');
      setEstTime('');
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(e) {
    e.preventDefault();
    if (!rejectReason.trim()) {
      setActionError('Rejection reason is required.');
      return;
    }
    setActionError(''); setActionLoading(true);
    try {
      const res = await axios.patch(
        `/api/orders/${orderId}/status`,
        { orderStatus: 'rejected', rejectionReason: rejectReason },
        { headers: authHeaders() }
      );
      setOrder(res.data.order);
      setShowReject(false);
      setRejectReason('');
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to reject order.');
    } finally {
      setActionLoading(false);
    }
  }

  if (loadError) {
    return (
      <div className="max-w-lg mx-auto">
        <p className="text-red-600 text-sm">{loadError}</p>
        <button onClick={() => navigate('/staff/dashboard')} className="mt-4 text-indigo-500 hover:underline text-sm">
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  if (!order) {
    return <div className="text-center text-gray-400 py-12">Loading…</div>;
  }

  const nextOptions = NEXT_STATUSES[order.orderStatus] || [];
  const canAct = order.orderStatus !== 'collected' && order.orderStatus !== 'rejected';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/staff/dashboard')} className="text-sm text-indigo-500 hover:underline">
          ← Dashboard
        </button>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[order.orderStatus]}`}>
          {order.orderStatus}
        </span>
      </div>

      <h1 className="text-xl font-bold text-gray-800">Order Detail</h1>

      {actionError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{actionError}</div>
      )}

      {/* Core details */}
      <div className="bg-white rounded-xl border p-5 space-y-3 text-sm">
        <h2 className="font-semibold text-gray-700 mb-2">Student & Document</h2>
        <Row label="Token / Order ID" value={order.orderId} mono />
        <Row label="Student Name" value={order.studentName} />
        <Row label="Contact" value={order.studentContact} />
        <Row label="File Name" value={order.fileName} />
        {order.fileUrl && (
          <div className="flex justify-between">
            <span className="text-gray-500">Document</span>
            <a
              href={order.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline font-medium"
            >
              View / Download ↗
            </a>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border p-5 space-y-3 text-sm">
        <h2 className="font-semibold text-gray-700 mb-2">Printing Requirements</h2>
        <Row label="Print Type" value={order.printType === 'color' ? 'Color' : 'Black & White'} />
        <Row label="Pages" value={order.pages} />
        <Row label="Copies" value={order.copies} />
        <Row label="Binding" value={order.binding} />
        {order.specialInstructions && <Row label="Special Instructions" value={order.specialInstructions} />}
        <div className="pt-2 border-t flex justify-between font-semibold">
          <span className="text-gray-600">Total Cost</span>
          <span className="text-indigo-700 text-lg">₹{order.cost}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5 space-y-3 text-sm">
        <h2 className="font-semibold text-gray-700 mb-2">Status & Payment</h2>
        <Row label="Payment" value={order.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'} />
        <Row label="Order Status" value={order.orderStatus} />
        {order.estimatedCompletionTime && (
          <Row label="Est. Completion" value={new Date(order.estimatedCompletionTime).toLocaleString()} />
        )}
        {order.rejectionReason && <Row label="Rejection Reason" value={order.rejectionReason} />}
        <Row label="Placed" value={new Date(order.createdAt).toLocaleString()} />
        <Row label="Last Updated" value={new Date(order.updatedAt).toLocaleString()} />
      </div>

      {/* Status update form */}
      {canAct && nextOptions.length > 0 && !showReject && (
        <form onSubmit={handleStatusUpdate} className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold text-gray-700">Update Status</h2>

          {order.paymentStatus === 'pending' && (
            <div className="p-3 rounded bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs">
              ⚠️ Payment is still pending. Order cannot be moved to "processing" until payment is confirmed.
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="input flex-1"
            >
              <option value="">Select next status…</option>
              {nextOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <label className="block">
            <span className="text-sm text-gray-600">Estimated Completion (optional)</span>
            <input
              type="datetime-local"
              value={estTime}
              onChange={(e) => setEstTime(e.target.value)}
              className="input mt-1"
            />
          </label>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!newStatus || actionLoading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg transition"
            >
              {actionLoading ? 'Updating…' : 'Update Status'}
            </button>
            <button
              type="button"
              onClick={() => setShowReject(true)}
              className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-5 py-2 rounded-lg border border-red-200 transition"
            >
              Reject Order
            </button>
          </div>
        </form>
      )}

      {/* Reject form */}
      {canAct && showReject && (
        <form onSubmit={handleReject} className="bg-white rounded-xl border border-red-200 p-5 space-y-4">
          <h2 className="font-semibold text-red-700">Reject Order</h2>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Reason (required)</span>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="input mt-1 resize-none"
              placeholder="Explain why this order is being rejected…"
            />
          </label>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg transition"
            >
              {actionLoading ? 'Rejecting…' : 'Confirm Rejection'}
            </button>
            <button
              type="button"
              onClick={() => { setShowReject(false); setActionError(''); }}
              className="text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Terminal states */}
      {!canAct && (
        <div className="bg-gray-50 rounded-xl border p-4 text-sm text-gray-500 text-center">
          This order is <strong>{order.orderStatus}</strong> — no further actions available.
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className={`text-gray-800 font-medium text-right ${mono ? 'font-mono text-xs break-all' : ''}`}>{value}</span>
    </div>
  );
}
