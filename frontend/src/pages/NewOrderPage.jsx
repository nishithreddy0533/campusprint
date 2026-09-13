import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PricePreview from '../components/PricePreview';

const STEPS = ['Upload', 'Specs', 'Cost', 'Payment'];

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_SIZE = 20 * 1024 * 1024;

export default function NewOrderPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef();

  const [form, setForm] = useState({
    studentName: '',
    studentContact: '',
    printType: 'bw',
    pages: 1,
    copies: 1,
    binding: 'none',
    specialInstructions: '',
  });

  const [order, setOrder] = useState(null);

  function validateFile(f) {
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError('Unsupported file type. Please upload PDF, JPEG, PNG, DOC, or DOCX.');
      return false;
    }
    if (f.size > MAX_SIZE) {
      setError('File exceeds 20 MB limit.');
      return false;
    }
    return true;
  }

  function handleFileChange(e) {
    const f = e.target.files[0];
    setError('');
    if (!f) return;
    if (validateFile(f)) setFile(f);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    setError('');
    const f = e.dataTransfer.files[0];
    if (!f) return;
    if (validateFile(f)) setFile(f);
  }

  async function handleUpload() {
    if (!file) { setError('Please select a file.'); return; }
    setLoading(true); setError('');
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await axios.post('/api/upload', data);
      setFileUrl(res.data.fileUrl);
      setFileName(res.data.fileName);
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateOrder() {
    setLoading(true); setError('');
    try {
      const res = await axios.post('/api/orders', {
        ...form,
        pages: Number(form.pages),
        copies: Number(form.copies),
        fileUrl,
        fileName,
      });
      setOrder(res.data.order);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create order.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePayment() {
    setLoading(true); setError('');
    try {
      await axios.post(`/api/orders/${order.orderId}/pay`);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto page-enter">
      {/* Page title */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">New Print Order</h1>
        <p className="text-sm text-gray-400 mt-1">Upload your document and customise your print</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                  i < step
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : i === step
                    ? 'bg-white border-indigo-600 text-indigo-600 shadow-md shadow-indigo-100'
                    : 'bg-white border-gray-200 text-gray-300'
                }`}
              >
                {i < step ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-xs mt-1 font-medium ${i === step ? 'text-indigo-600' : i < step ? 'text-indigo-400' : 'text-gray-300'}`}>
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-5 transition-all duration-300 ${i < step ? 'bg-indigo-500' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Step 0: Upload ── */}
      {step === 0 && (
        <div className="card space-y-5">
          {/* Drop zone */}
          <div
            role="button"
            tabIndex={0}
            aria-label="File upload area"
            onClick={() => fileInputRef.current.click()}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`upload-zone relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors duration-200 ${
              dragging
                ? 'border-indigo-500 bg-indigo-50'
                : file
                ? 'border-indigo-400 bg-indigo-50/50'
                : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileChange}
              className="sr-only"
            />
            {file ? (
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-800 text-sm">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB · Click to change</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto rounded-xl bg-gray-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700">Drag &amp; drop your document here</p>
                <p className="text-xs text-indigo-500 font-medium">or choose a file</p>
                <p className="text-xs text-gray-400">PDF, JPEG, PNG, DOC, DOCX &middot; Max 20 MB</p>
              </div>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="btn-primary w-full py-3"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Uploading…
              </>
            ) : (
              'Upload & Continue →'
            )}
          </button>
        </div>
      )}

      {/* ── Step 1: Print Specs ── */}
      {step === 1 && (
        <div className="card space-y-4">
          <Field label="Your Name">
            <input
              type="text"
              value={form.studentName}
              onChange={(e) => setForm({ ...form, studentName: e.target.value })}
              className="input"
              placeholder="Full name"
            />
          </Field>
          <Field label="Contact (phone / email)">
            <input
              type="text"
              value={form.studentContact}
              onChange={(e) => setForm({ ...form, studentContact: e.target.value })}
              className="input"
              placeholder="Used to look up your orders"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Print Type">
              <select value={form.printType} onChange={(e) => setForm({ ...form, printType: e.target.value })} className="input">
                <option value="bw">Black &amp; White (₹2/pg)</option>
                <option value="color">Color (₹8/pg)</option>
              </select>
            </Field>
            <Field label="Binding">
              <select value={form.binding} onChange={(e) => setForm({ ...form, binding: e.target.value })} className="input">
                <option value="none">None</option>
                <option value="staple">Staple (+₹5)</option>
                <option value="spiral">Spiral (+₹20)</option>
              </select>
            </Field>
            <Field label="Pages">
              <input type="number" min="1" value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} className="input" />
            </Field>
            <Field label="Copies">
              <input type="number" min="1" value={form.copies} onChange={(e) => setForm({ ...form, copies: e.target.value })} className="input" />
            </Field>
          </div>
          <Field label="Special Instructions (optional)">
            <textarea
              value={form.specialInstructions}
              onChange={(e) => setForm({ ...form, specialInstructions: e.target.value })}
              rows={3}
              className="input resize-none"
              placeholder="e.g., double-sided, A3 size…"
            />
          </Field>

          <PricePreview
            pages={Number(form.pages)}
            copies={Number(form.copies)}
            printType={form.printType}
            binding={form.binding}
          />

          <button onClick={handleCreateOrder} disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Processing…' : 'Get Cost Estimate →'}
          </button>
        </div>
      )}

      {/* ── Step 2: Cost Preview ── */}
      {step === 2 && order && (
        <div className="space-y-5">
          <div className="card space-y-3">
            <h2 className="font-semibold text-gray-800 text-base">Order Summary</h2>
            <SummaryRow label="Order ID" value={order.orderId} mono />
            <SummaryRow label="File" value={order.fileName} />
            <SummaryRow label="Print Type" value={order.printType === 'color' ? 'Color' : 'Black & White'} />
            <SummaryRow label="Pages × Copies" value={`${order.pages} × ${order.copies}`} />
            <SummaryRow label="Binding" value={order.binding} />
            {order.specialInstructions && <SummaryRow label="Instructions" value={order.specialInstructions} />}
            <div className="pt-3 border-t flex justify-between items-center">
              <span className="font-bold text-gray-700">Total Cost</span>
              <span className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                ₹{order.cost}
              </span>
            </div>
          </div>
          <button onClick={handlePayment} disabled={loading} className="w-full btn-primary py-3 text-base bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-200 hover:from-emerald-600 hover:to-teal-700 hover:shadow-emerald-300">
            {loading ? 'Processing…' : '💳 Pay Now (Simulated)'}
          </button>
        </div>
      )}

      {/* ── Step 3: Confirmation ── */}
      {step === 3 && order && (
        <div className="card text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Payment Confirmed!</h2>
            <p className="text-gray-500 text-sm mt-1">Your order is placed. Keep your token to track progress.</p>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <p className="text-xs text-indigo-400 mb-1 font-medium uppercase tracking-wide">Your Order Token</p>
            <p className="font-mono text-indigo-800 font-bold break-all text-sm">{order.orderId}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate(`/order/${order.orderId}`)} className="btn-primary flex-1 py-2.5">
              Track Order
            </button>
            <button onClick={() => navigate('/')} className="btn-secondary flex-1 py-2.5">
              Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function SummaryRow({ label, value, mono }) {
  return (
    <div className="flex justify-between text-sm gap-4">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span className={`text-gray-800 font-medium text-right ${mono ? 'font-mono text-xs break-all' : ''}`}>{value}</span>
    </div>
  );
}
