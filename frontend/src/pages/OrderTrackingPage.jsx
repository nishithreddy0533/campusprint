import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const STATUS_STEPS = ['received', 'processing', 'ready', 'collected'];

const STATUS_LABELS = {
  received:   'Received',
  processing: 'Processing',
  ready:      'Ready for Collection',
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

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [notified, setNotified] = useState(false);
  const prevStatus = useRef(null);

  async function fetchOrder() {
    try {
      const res = await axios.get(`/api/orders/${orderId}`);
      const o = res.data.order;
      setOrder(o);
      if (o.orderStatus === 'ready' && !notified) setNotified(true);
      prevStatus.current = o.orderStatus;
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
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-5">
        &larr; Back
      </button>

      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Order Tracking</h1>
        <p className="text-xs text-gray-400 font-mono mt-1 break-all">{orderId}</p>
      </div>

      {order?.orderStatus === 'ready' && (
        <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
          <span className="text-2xl mt-0.5">🎉</span>
          <div>
            <p className="font-bold text-emerald-700">Your order is ready!</p>
            <p className="text-sm text-emerald-600 mt-0.5">Please visit the shop to collect your printout.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>
      )}

      {order && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <span className={`status-badge border ${STATUS_STYLES[order.orderStatus]}`}>
              {STATUS_LABELS[order.orderStatus] || order.orderStatus}
            </span>
            <span className="text-xs text-gray-400">Auto-refreshing every 3s</span>
          </div>

          {order.orderStatus !== 'rejected' && (
            <div className="flex items-center mb-8">
              {STATUS_STEPS.map((s, i) => (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                      i < stepIndex
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : i === stepIndex
                        ? 'bg-white border-indigo-600 text-indigo-600 shadow-md shadow-indigo-100'
                        : 'bg-white border-gray-200 text-gray-300'
                    }`}>
                      {i < stepIndex ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : i + 1}
                    </div>
                    <span className="text-xs text-gray-500 mt-1 text-center leading-tight max-w-[56px]">
                      {STATUS_LABELS[s]}
                    </span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 mb-5 transition-all duration-300 ${i < stepIndex ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {order.orderStatus === 'rejected' && order.rejectionReason && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200">
              <p className="font-semibold text-red-700 mb-1">Order Rejected</p>
              <p className="text-sm text-red-600">{order.rejectionReason}</p>
            </div>
          )}

          <div className="card space-y-3 text-sm">
            <h2 className="font-semibold text-gray-800">Order Details</h2>
            <Row label="Student" value={order.studentName} />
            <Row label="File" value={order.fileName} />
            <Row label="Print Type" value={order.printType === 'color' ? 'Color' : 'B&W'} />
            <Row label="Pages x Copies" value={`${order.pages} x ${order.copies}`} />
            <Row label="Binding" value={order.binding} />
            <Row label="Cost" value={`Rs.${order.cost}`} />
            <Row label="Payment" value={order.paymentStatus === 'paid' ? 'Paid' : 'Pending'} />
            {order.estimatedCompletionTime && (
              <Row label="Est. Completion" value={new Date(order.estimatedCompletionTime).toLocaleString()} />
            )}
            {order.specialInstructions && <Row label="Instructions" value={order.specialInstructions} />}
            <Row label="Placed at" value={new Date(order.createdAt).toLocaleString()} />
          </div>
        </>
      )}

      {!order && !error && (
        <div className="flex items-center justify-center min-h-[30vh]">
          <svg className="w-6 h-6 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span className="text-gray-800 font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}
