/**
 * Prediction service for the ML pricing model.
 *
 * Takes a feature vector and a loaded model artifact,
 * returns a predicted price and a confidence score.
 */

/**
 * Clamps a value between min and max (inclusive).
 *
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Computes a dot product of two same-length arrays.
 *
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
function dot(a, b) {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

/**
 * Runs inference against a loaded model artifact.
 *
 * Confidence formula: 1 - clamp(residualStdDev / |predictedPrice|, 0, 1)
 * A lower residual spread relative to the predicted price = higher confidence.
 *
 * @param {number[]} featureVector - 4-element array [pages, copies, printTypeEncoded, bindingEncoded]
 * @param {object} artifact - Deserialized ModelArtifact
 * @returns {{ predictedPrice: number, confidence: number }}
 */
export function predict(featureVector, artifact) {
  if (!Array.isArray(featureVector) || featureVector.length !== 4) {
    throw new Error('predict: featureVector must be a 4-element array.');
  }
  if (!artifact || !Array.isArray(artifact.coefficients)) {
    throw new Error('predict: invalid model artifact.');
  }

  const raw = dot(featureVector, artifact.coefficients) + artifact.intercept;

  // Ensure predicted price is at least 0
  const predictedPrice = Math.max(0, parseFloat(raw.toFixed(2)));

  // Confidence: lower residual std dev relative to price = more confident
  let confidence;
  if (predictedPrice === 0) {
    confidence = 0;
  } else {
    confidence = parseFloat(
      (1 - clamp(artifact.residualStdDev / predictedPrice, 0, 1)).toFixed(4)
    );
  }

  return { predictedPrice, confidence };
}
