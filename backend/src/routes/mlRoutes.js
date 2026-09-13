/**
 * ML Pricing Model API routes
 *
 * GET  /api/ml/predict  - Returns price prediction + confidence for given order params
 * POST /api/ml/train    - Triggers training pipeline (staff auth required)
 * GET  /api/ml/status   - Returns model load status and MAE
 */

import { Router } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { validatePredictionInput } from '../ml/inputValidator.js';
import { encodeFeatures, FeatureEncodingError } from '../ml/featureEncoder.js';
import { predict } from '../ml/predictionService.js';
import { trainModel, InsufficientDataError } from '../ml/modelTrainer.js';
import { serializeModel, deserializeModel } from '../ml/modelSerializer.js';
import { calculateCost } from '../services/costCalculator.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getSupabaseClient } from '../db/supabaseClient.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACT_PATH = path.resolve(__dirname, '../../model-artifact.json');

// In-memory model state
let loadedArtifact = null;
let modelAvailable = false;

/**
 * Attempt to load the model artifact from disk at startup.
 */
export async function loadModelFromDisk() {
  try {
    const json = await fs.readFile(ARTIFACT_PATH, 'utf-8');
    loadedArtifact = deserializeModel(json);
    modelAvailable = true;
    console.log(`[ML] Model loaded. Version: ${loadedArtifact.version}, MAE: ₹${loadedArtifact.mae}`);
  } catch {
    console.warn('[ML] No model artifact found. Predictions will fall back to rule-based pricing.');
    modelAvailable = false;
  }
}

const router = Router();

/**
 * GET /api/ml/predict
 * Query params: pages, copies, printType, binding
 */
router.get('/predict', (req, res, next) => {
  try {
    const { valid, errors } = validatePredictionInput(req.query);
    if (!valid) {
      return res.status(400).json({ message: 'Invalid input.', errors });
    }

    const { pages, copies, printType, binding } = req.query;
    const ruleBasedPrice = calculateCost(printType, Number(pages), Number(copies), binding);

    if (!modelAvailable || !loadedArtifact) {
      return res.json({
        modelAvailable: false,
        predictedPrice: null,
        confidence: null,
        ruleBasedPrice,
        modelVersion: null,
      });
    }

    const featureVector = encodeFeatures({ pages: Number(pages), copies: Number(copies), printType, binding });
    const { predictedPrice, confidence } = predict(featureVector, loadedArtifact);

    return res.json({
      modelAvailable: true,
      predictedPrice,
      confidence,
      ruleBasedPrice,
      modelVersion: loadedArtifact.version,
    });
  } catch (err) {
    if (err instanceof FeatureEncodingError) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
});

/**
 * POST /api/ml/train
 * Requires staff authentication.
 */
router.post('/train', requireAuth, async (req, res, next) => {
  try {
    const { data: orders, error } = await getSupabaseClient()
      .from('orders')
      .select('*')
      .eq('orderStatus', 'collected');

    if (error) {
      const err = new Error(`Failed to fetch orders from database: ${error.message}`);
      err.status = 503;
      throw err;
    }

    const artifact = trainModel(orders || []);

    // Persist to disk
    await fs.writeFile(ARTIFACT_PATH, serializeModel(artifact), 'utf-8');

    // Update in-memory state
    loadedArtifact = artifact;
    modelAvailable = true;

    return res.json({
      success: true,
      trainingSetSize: artifact.trainingSetSize,
      mae: artifact.mae,
      message: `Model trained successfully on ${artifact.trainingSetSize} orders. MAE: ₹${artifact.mae}`,
    });
  } catch (err) {
    if (err instanceof InsufficientDataError) {
      return res.status(422).json({ success: false, message: err.message });
    }
    next(err);
  }
});

/**
 * GET /api/ml/status
 */
router.get('/status', (_req, res) => {
  if (!modelAvailable || !loadedArtifact) {
    return res.json({ modelAvailable: false, message: 'No model trained yet.' });
  }
  return res.json({
    modelAvailable: true,
    version: loadedArtifact.version,
    trainedAt: loadedArtifact.trainedAt,
    trainingSetSize: loadedArtifact.trainingSetSize,
    mae: loadedArtifact.mae,
  });
});

export default router;
