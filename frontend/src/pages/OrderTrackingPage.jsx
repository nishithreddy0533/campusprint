import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const STATUS_STEPS = ['received', 'processing', 'ready', 'collected'];

const STATUS_LABELS = {
  received:   'Received',
  processing: 'Processing',
  ready:      'Ready',
  collected:  'Collected',
  rejected:   'Rejected',
};

const STATUS_STYLES = {
  received:   'bg-blue-50 text-blue-700 border-blue-100',
  processing: 'bg-amber-50 text-amber-700 border-amber-100',
  ready:      'bg-emerald-50 text-emerald-700 border-emerald-100',
  collected:  'bg-gray-100 text-gray-500 border-gray-200',
  rejected:   'bg-red-50 text-red-600 border-red-100',
};

const STEP_ICONS = ['📥', '⚙️', '✅', '📦'];

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const prevStatus = useRef(null);

  async function fetchOrder() {
    try {
      const res = await axios.get(`/api/orders/${orderId}`);
      setOrder(res.data.order);
      prevStatus.current = res.data.order.orderStatus;
    } catch (err) {
      if (err.response?.status === 404) setError('Order not found. Please check the token.');
      else setError('Unable to fetch order. Retrying…');
    }
  }

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  const stepIndex = order ? STATUS_STEPS.indexOf(order.orderStatus) : -1;

  return (
    <div className="max-w-lg mx-auto page-enter">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 transition-colors mb-5 group"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7l-7 7 7 7" />
        </svg>
        Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Order Tracking</h1>
        <p className="text-xs text-gray-400 font-mono mt-1.5 break-all bg-white/60 backdrop-blur-sm rounded-xl px-3 py-2 border border-gray-100 inline-block">
          {orderId}
        </p>
      </div>

      {/* Ready banner */}
      {order?.orderStatus === 'ready' && (
        <div
          className="mb-5 p-4 rounded-2xl flex items-center gap-3 animate-scale-in"
          style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '1px solid #a7f3d0' }}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-lg shrink-0">
            🎉
          </div>
          <div>
            <p className="font-bold text-emerald-700">Your order is ready for collection!</p>
            <p className="text-sm text-emerald-600 mt-0.5">Visit the shop to pick up your printout.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>
      )}

      {order && (
        <>
          {/* Status badge + live indicator */}
          <div className="flex items-center gap-3 mb-6">
            <span className={`status-badge border ${STATUS_STYLES[order.orderStatus]} text-sm px-3.5 py-1.5`}>
              {STATUS_LABELS[order.orderStatus] || order.orderStatus}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live · updates every 3s
            </div>
          </div>

          {/* Progress stepper */}
          {order.orderStatus !== 'rejected' && (
            <div className="card mb-6">
              <div className="flex items-center justify-between">
                {STATUS_STEPS.map((s, i) => (
                  <span key={s} className="contents">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg transition-all duration-500 ${
                          i < stepIndex
                            ? 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-200'
                            : i === stepIndex
                            ? 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200 scale-110'
                            : 'bg-gray-100'
                        }`}
                      >
                        {i <= stepIndex ? (
                          <span style={{ filter: i < stepIndex ? 'brightness(0) invert(1)' : 'none' }}>
                            {STEP_ICONS[i]}
                          </span>
                        ) : (
                          <span className="opacity-30">{STEP_ICONS[i]}</span>
                        )}
                      </div>
                      <span className={`text-[10px] mt-2 font-semibold text-center leading-tight max-w-[52px] ${
                        i === stepIndex ? 'text-indigo-600' : i < stepIndex ? 'text-indigo-400' : 'text-gray-300'
                      }`}>
                        {STATUS_LABELS[s]}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 mb-6 rounded-full transition-all duration-500 ${
                        i < stepIndex ? 'bg-gradient-to-r from-indigo-500 to-violet-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rejection notice */}
          {order.orderStatus === 'rejected' && order.rejectionReason && (
            <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200">
              <p className="font-bold text-red-700 mb-1.5">Order Rejected</p>
              <p className="text-sm text-red-600">{order.rejectionReason}</p>
            </div>
          )}

          {/* Order details card */}
          <div className="card space-y-3 text-sm">
            <h2 className="font-bold text-gray-800 mb-1">Order Details</h2>
            <Row label="Student" value={order.studentName} />
            <Row label="File" value={order.fileName} />
            <Row label="Print Type" value={order.printType === 'color' ? '🎨 Color' : '⬛ Black & White'} />
            <Row label="Pages × Copies" value={`${order.pages} × ${order.copies}`} />
            <Row label="Binding" value={order.binding} />
            <div className="flex justify-between pt-2 border-t">
              <span className="text-gray-400">Cost</span>
              <span className="font-extrabold text-indigo-600 text-base">₹{order.cost}</span>
            </div>
            <Row
              label="Payment"
              value={
                order.paymentStatus === 'paid'
                  ? <span className="text-emerald-600 font-bold">✓ Paid</span>
                  : <span className="text-orange-500 font-bold">⏳ Pending</span>
              }
            />
            {order.estimatedCompletionTime && (
              <Row label="Est. Completion" value={new Date(order.estimatedCompletionTime).toLocaleString()} />
            )}
            {order.specialInstructions && <Row label="Instructions" value={order.specialInstructions} />}
            <Row label="Placed" value={new Date(order.createdAt).toLocaleString()} />
          </div>
        </>
      )}

      {!order && !error && (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center">
              <svg className="w-5 h-5 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">Loading order…</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span className="text-gray-800 font-semibold text-right max-w-[60%]">{value}</span>
    </div>
  );
}
