/**
 * Model trainer for the ML pricing model.
 * Uses MultivariateLinearRegression from ml-regression to fit a pricing model
 * on historical completed orders.
 */

import { MultivariateLinearRegression } from 'ml-regression';
import { encodeFeatures } from './featureEncoder.js';
import { calculateCost } from '../services/costCalculator.js';

export class InsufficientDataError extends Error {
  constructor(message = 'Insufficient training data: fewer than 10 collected orders.') {
    super(message);
    this.name = 'InsufficientDataError';
    this.status = 422;
  }
}

const MIN_TRAINING_SAMPLES = 10;

/**
 * Filters an array of orders to only those with orderStatus === 'collected'.
 *
 * @param {object[]} orders
 * @returns {object[]}
 */
export function filterCollectedOrders(orders) {
  return orders.filter((o) => o.orderStatus === 'collected');
}

/**
 * Trains a multivariate linear regression model on collected orders.
 *
 * @param {object[]} orders - Raw order objects (may include any status)
 * @returns {object} ModelArtifact
 * @throws {InsufficientDataError} if fewer than MIN_TRAINING_SAMPLES collected orders
 */
export function trainModel(orders) {
  const collected = filterCollectedOrders(orders);

  if (collected.length < MIN_TRAINING_SAMPLES) {
    throw new InsufficientDataError();
  }

  // Build feature matrix X and target vector y
  const X = [];
  const y = [];

  for (const order of collected) {
    const features = encodeFeatures({
      pages: order.pages,
      copies: order.copies,
      printType: order.printType,
      binding: order.binding,
    });
    // Use rule-based cost as the training label — the model learns this function
    const cost = typeof order.cost === 'number'
      ? order.cost
      : calculateCost(order.printType, order.pages, order.copies, order.binding);

    X.push(features);
    y.push([cost]);
  }

  const regression = new MultivariateLinearRegression(X, y);
  const json = regression.toJSON();

  // Extract coefficients (first 4 weights) and intercept (last weight)
  const weights = json.weights.map((w) => w[0]);
  const coefficients = weights.slice(0, 4);
  const intercept = weights[4] ?? 0;

  // Compute MAE on training set
  let totalAbsError = 0;
  const residuals = [];
  for (let i = 0; i < X.length; i++) {
    const predicted = regression.predict(X[i])[0];
    const actual = y[i][0];
    const absError = Math.abs(predicted - actual);
    totalAbsError += absError;
    residuals.push(predicted - actual);
  }

  const mae = parseFloat((totalAbsError / X.length).toFixed(4));

  // Compute residual standard deviation for confidence scoring
  const meanResidual = residuals.reduce((s, r) => s + r, 0) / residuals.length;
  const variance = residuals.reduce((s, r) => s + (r - meanResidual) ** 2, 0) / residuals.length;
  const residualStdDev = parseFloat(Math.sqrt(variance).toFixed(4));

  console.log(`[ML] Training complete. Samples: ${collected.length}, MAE: ₹${mae}, ResidualStdDev: ${residualStdDev}`);

  return {
    version: '1.0',
    trainedAt: new Date().toISOString(),
    coefficients,
    intercept,
    residualStdDev,
    trainingSetSize: collected.length,
    mae,
  };
}
