import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const NEXT_STATUSES = {
  received: ['processing'],
  processing: ['ready'],
  ready: ['collected'],
  collected: [],
  rejected: [],
};

const STATUS_STYLES = {
  received: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-amber-50 text-amber-700 border-amber-200',
  ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  collected: 'bg-gray-100 text-gray-500 border-gray-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
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
  const [newStatus, setNewStatus] = useState('');
  const [estTime, setEstTime] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [mlPrediction, setMlPrediction] = useState(null);
  const [overrideLoading, setOverrideLoading] = useState(false);

  async function loadOrder() {
    try {
      const res = await axios.get(`/api/orders/${orderId}`, { headers: authHeaders() });
      setOrder(res.data.order);
      setNewStatus('');
      // Fetch ML prediction for this order's params
      try {
        const o = res.data.order;
        const ml = await axios.get('/api/ml/predict', {
          params: { pages: o.pages, copies: o.copies, printType: o.printType, binding: o.binding },
        });
        setMlPrediction(ml.data);
      } catch {
        setMlPrediction(null);
      }
    } catch (err) {
      if (err.response?.status === 404) setLoadError('Order not found.');
      else if (err.response?.status === 401) navigate('/staff/login');
      else setLoadError('Failed to load order.');
    }
  }

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function handleStatusUpdate(e) {
    e.preventDefault();
    if (!newStatus) return;
    setActionError('');
    setActionLoading(true);
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
    setActionError('');
    setActionLoading(true);
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

  async function handlePriceOverride() {
    setActionError('');
    setOverrideLoading(true);
    try {
      const res = await axios.post(
        `/api/orders/${orderId}/override-price`,
        {},
        { headers: authHeaders() }
      );
      setOrder(res.data.order);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to override price.');
    } finally {
      setOverrideLoading(false);
    }
  }

  if (loadError) {
    return (
      <div className="max-w-lg mx-auto page-enter">
        <div className="card text-center space-y-4 py-12">
          <div className="text-3xl">Warning</div>
          <p className="text-red-500 font-medium">{loadError}</p>
          <button onClick={() => navigate('/staff/dashboard')} className="btn-secondary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <svg className="w-6 h-6 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  const nextOptions = NEXT_STATUSES[order.orderStatus] || [];
  const canAct = order.orderStatus !== 'collected' && order.orderStatus !== 'rejected';
  const showML = mlPrediction?.modelAvailable && mlPrediction?.predictedPrice != null;
  const lowConfidence = showML && mlPrediction.confidence < 0.5;

  return (
    <div className="max-w-2xl mx-auto space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/staff/dashboard')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
        >
          &larr; Dashboard
        </button>
        <span className={`status-badge border capitalize text-sm px-3 py-1 ${STATUS_STYLES[order.orderStatus]}`}>
          {order.orderStatus}
        </span>
      </div>

      <h1 className="text-xl font-bold text-gray-900">Order Detail</h1>

      {actionError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{actionError}</div>
      )}

      <div className="card space-y-3 text-sm">
        <SectionTitle label="Student &amp; Document" />
        <DetailRow label="Order ID" value={order.orderId} mono />
        <DetailRow label="Student Name" value={order.studentName} />
        <DetailRow label="Contact" value={order.studentContact} />
        <DetailRow label="File Name" value={order.fileName} />
        {order.fileUrl && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Document</span>
            <a
              href={order.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              View / Download &rarr;
            </a>
          </div>
        )}
      </div>

      <div className="card space-y-3 text-sm">
        <SectionTitle label="Printing Requirements" />
        <DetailRow label="Print Type" value={order.printType === 'color' ? 'Color' : 'Black & White'} />
        <DetailRow label="Pages" value={order.pages} />
        <DetailRow label="Copies" value={order.copies} />
        <DetailRow label="Binding" value={order.binding} />
        {order.specialInstructions && <DetailRow label="Special Instructions" value={order.specialInstructions} />}
        <div className="pt-3 border-t flex justify-between font-semibold">
          <span className="text-gray-600">Total Cost</span>
          <span className="text-xl font-extrabold text-indigo-600">
            ₹{order.cost}
            {order.mlOverride && (
              <span className="ml-2 text-xs font-normal text-gray-400">(rule-based override)</span>
            )}
          </span>
        </div>
      </div>

      {/* ML Pricing Card */}
      <div className="card space-y-3 text-sm">
        <SectionTitle label="ML Price Estimate" />
        <DetailRow label="Rule-based price" value={`₹${order.cost}`} />
        {showML ? (
          <>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">ML prediction</span>
                {lowConfidence && (
                  <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-medium">
                    Low confidence
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-gray-800 font-medium">₹{mlPrediction.predictedPrice}</span>
                <p className="text-xs text-gray-400">{Math.round(mlPrediction.confidence * 100)}% confident</p>
              </div>
            </div>
            {order.orderStatus === 'received' && !order.mlOverride && (
              <button
                onClick={handlePriceOverride}
                disabled={overrideLoading}
                className="w-full mt-1 px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold text-sm hover:bg-indigo-100 transition-colors disabled:opacity-50"
              >
                {overrideLoading ? 'Applying…' : 'Override to Rule-Based Price'}
              </button>
            )}
          </>
        ) : (
          <p className="text-xs text-gray-400">
            {mlPrediction?.modelAvailable === false
              ? 'ML model not trained yet.'
              : 'ML estimate unavailable.'}
          </p>
        )}
      </div>

      <div className="card space-y-3 text-sm">
        <SectionTitle label="Status &amp; Payment" />
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Payment</span>
          {order.paymentStatus === 'paid' ? (
            <span className="status-badge bg-emerald-50 text-emerald-700 border border-emerald-100">Paid</span>
          ) : (
            <span className="status-badge bg-orange-50 text-orange-600 border border-orange-100">Pending</span>
          )}
        </div>
        <DetailRow
          label="Order Status"
          value={
            <span className={`status-badge border capitalize ${STATUS_STYLES[order.orderStatus]}`}>
              {order.orderStatus}
            </span>
          }
        />
        {order.estimatedCompletionTime && (
          <DetailRow label="Est. Completion" value={new Date(order.estimatedCompletionTime).toLocaleString()} />
        )}
        {order.rejectionReason && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-100">
            <p className="text-xs font-semibold text-red-600 mb-1">Rejection Reason</p>
            <p className="text-sm text-red-700">{order.rejectionReason}</p>
          </div>
        )}
        <DetailRow label="Placed" value={new Date(order.createdAt).toLocaleString()} />
        <DetailRow label="Last Updated" value={new Date(order.updatedAt).toLocaleString()} />
      </div>

      {canAct && nextOptions.length > 0 && !showReject && (
        <form onSubmit={handleStatusUpdate} className="card space-y-4">
          <SectionTitle label="Update Status" />
          {order.paymentStatus === 'pending' && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-xs">
              Payment is still pending. Order may not be processable until payment is confirmed.
            </div>
          )}
          <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="input">
            <option value="">Select next status&hellip;</option>
            {nextOptions.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Estimated Completion (optional)</span>
            <input
              type="datetime-local"
              value={estTime}
              onChange={(e) => setEstTime(e.target.value)}
              className="input mt-1.5"
            />
          </label>
          <div className="flex gap-3">
            <button type="submit" disabled={!newStatus || actionLoading} className="btn-primary flex-1">
              {actionLoading ? 'Updating…' : 'Update Status'}
            </button>
            <button
              type="button"
              onClick={() => setShowReject(true)}
              className="px-5 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-colors"
            >
              Reject
            </button>
          </div>
        </form>
      )}

      {canAct && showReject && (
        <form onSubmit={handleReject} className="card border-red-200 space-y-4">
          <SectionTitle label="Reject Order" />
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Reason (required)</span>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="input mt-1.5 resize-none"
              placeholder="Explain why this order is being rejected&hellip;"
            />
          </label>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={actionLoading}
              className="flex-1 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Rejecting…' : 'Confirm Rejection'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowReject(false);
                setActionError('');
              }}
              className="btn-secondary px-5"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!canAct && (
        <div className="card text-center py-8 space-y-2">
          <p className="text-gray-500 text-sm">
            This order is <span className="font-semibold capitalize">{order.orderStatus}</span> &mdash; no further
            actions available.
          </p>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ label }) {
  return <h2 className="font-semibold text-gray-800 mb-1">{label}</h2>;
}

function DetailRow({ label, value, mono }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span className={`text-gray-800 font-medium text-right ${mono ? 'font-mono text-xs break-all' : ''}`}>
        {value}
      </span>
    </div>
  );
}
