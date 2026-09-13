import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

/**
 * PricePreview component
 *
 * Displays an ML-predicted price estimate alongside the rule-based price.
 * Debounces API calls by 300ms. Degrades gracefully if the endpoint is unavailable.
 *
 * Props:
 *   pages      {number}
 *   copies     {number}
 *   printType  {'bw'|'color'}
 *   binding    {'none'|'staple'|'spiral'}
 */
export default function PricePreview({ pages, copies, printType, binding }) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const debounceRef = useRef(null);

  // Rule-based cost computed client-side for instant display
  const ruleBasedPrice = computeRuleBasedPrice(printType, Number(pages), Number(copies), binding);

  useEffect(() => {
    // Only fetch if all params are valid
    if (!pages || !copies || Number(pages) < 1 || Number(copies) < 1) {
      setPrediction(null);
      return;
    }

    // Debounce 300ms
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setUnavailable(false);
      try {
        const res = await axios.get('/api/ml/predict', {
          params: { pages, copies, printType, binding },
        });
        setPrediction(res.data);
      } catch {
        setUnavailable(true);
        setPrediction(null);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [pages, copies, printType, binding]);

  const showML = prediction?.modelAvailable && prediction?.predictedPrice != null;
  const lowConfidence = showML && prediction.confidence < 0.5;

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Price Estimate</span>
        {loading && (
          <svg className="w-3.5 h-3.5 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
      </div>

      {/* Rule-based price — always shown */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Standard price</span>
        <span className="text-lg font-bold text-gray-800">₹{ruleBasedPrice}</span>
      </div>

      {/* ML prediction */}
      {showML && (
        <div className="flex items-center justify-between border-t border-indigo-100 pt-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-indigo-700 font-medium">ML estimate</span>
            {lowConfidence && (
              <span
                data-testid="low-confidence-indicator"
                className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-medium"
              >
                Low confidence
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-indigo-700">₹{prediction.predictedPrice}</span>
            <p className="text-xs text-gray-400">{Math.round(prediction.confidence * 100)}% confident</p>
          </div>
        </div>
      )}

      {/* No model trained yet */}
      {!showML && !loading && prediction?.modelAvailable === false && (
        <p className="text-xs text-gray-400 border-t border-indigo-100 pt-3">
          ML estimate unavailable — model not trained yet.
        </p>
      )}

      {/* Endpoint unreachable */}
      {unavailable && (
        <p className="text-xs text-gray-400 border-t border-indigo-100 pt-3">
          ML estimate currently unavailable.
        </p>
      )}
    </div>
  );
}

/**
 * Client-side rule-based price calculation (mirrors backend costCalculator).
 * Used for instant display without waiting for the API.
 */
function computeRuleBasedPrice(printType, pages, copies, binding) {
  if (!pages || !copies || pages < 1 || copies < 1) return 0;
  const perPage = printType === 'color' ? 8 : 2;
  const bindingCost = binding === 'staple' ? 5 : binding === 'spiral' ? 20 : 0;
  return pages * copies * perPage + bindingCost;
}
