import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function computeRuleBasedPrice(printType, pages, copies, binding) {
  if (!pages || !copies || pages < 1 || copies < 1) return 0;
  const perPage = printType === 'color' ? 8 : 2;
  const bindingCost = binding === 'staple' ? 5 : binding === 'spiral' ? 20 : 0;
  return pages * copies * perPage + bindingCost;
}

function ConfidencePill({ confidence }) {
  if (confidence == null) return null;
  const pct = Math.round(confidence * 100);
  if (confidence >= 0.75) return (
    <span className="confidence-high status-badge border text-[11px]">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 inline-block" />
      {pct}% High confidence
    </span>
  );
  if (confidence >= 0.5) return (
    <span className="confidence-medium status-badge border text-[11px]">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1 inline-block" />
      {pct}% Medium confidence
    </span>
  );
  return (
    <span
      data-testid="low-confidence-indicator"
      className="confidence-low status-badge border text-[11px]"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1 inline-block" />
      {pct}% Low confidence
    </span>
  );
}

export default function PricePreview({ pages, copies, printType, binding }) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [priceKey, setPriceKey] = useState(0);
  const debounceRef = useRef(null);

  const ruleBasedPrice = computeRuleBasedPrice(printType, Number(pages), Number(copies), binding);

  useEffect(() => {
    if (!pages || !copies || Number(pages) < 1 || Number(copies) < 1) {
      setPrediction(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setUnavailable(false);
      try {
        const res = await axios.get('/api/ml/predict', {
          params: { pages, copies, printType, binding },
        });
        setPrediction(res.data);
        setPriceKey((k) => k + 1);
      } catch {
        setUnavailable(true);
        setPrediction(null);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [pages, copies, printType, binding]);

  const showML = prediction?.modelAvailable && prediction?.predictedPrice != null;

  return (
    <div className="price-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
          </div>
          <span className="text-sm font-bold text-gray-700">Price Estimate</span>
        </div>
        {loading && (
          <div className="flex items-center gap-1.5 text-indigo-400 text-xs">
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Calculating…</span>
          </div>
        )}
      </div>

      {/* Rule-based price — always shown */}
      <div className="flex items-center justify-between bg-white/60 rounded-xl px-4 py-3 border border-white/80">
        <div>
          <p className="text-xs text-gray-400 font-medium">Standard Price</p>
          <p className="text-xs text-gray-400 mt-0.5">Rule-based calculation</p>
        </div>
        <span
          key={`rule-${ruleBasedPrice}`}
          className="text-2xl font-extrabold text-gray-800 number-pop"
        >
          ₹{ruleBasedPrice}
        </span>
      </div>

      {/* ML prediction */}
      {showML && (
        <div
          className="flex items-center justify-between rounded-xl px-4 py-3 border border-indigo-200/60"
          style={{ background: 'linear-gradient(135deg, rgba(238,242,255,0.8) 0%, rgba(245,243,255,0.8) 100%)' }}
        >
          <div>
            <p className="text-xs font-bold text-indigo-700">ML Prediction</p>
            <div className="mt-1">
              <ConfidencePill confidence={prediction.confidence} />
            </div>
          </div>
          <span
            key={`ml-${priceKey}`}
            className="text-2xl font-extrabold gradient-text number-pop"
          >
            ₹{prediction.predictedPrice}
          </span>
        </div>
      )}

      {/* No model */}
      {!showML && !loading && prediction?.modelAvailable === false && (
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/50 rounded-xl px-4 py-3">
          <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          ML estimate unavailable — no model trained yet. Showing rule-based price.
        </div>
      )}

      {/* Endpoint down */}
      {unavailable && (
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/50 rounded-xl px-4 py-3">
          <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          ML estimate unavailable. Showing standard price.
        </div>
      )}
    </div>
  );
}
