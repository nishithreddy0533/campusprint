/**
 * Serializer for the ML model artifact.
 * Uses plain JSON so the round-trip property is verifiable without a binary parser.
 *
 * Model Artifact shape:
 * {
 *   version: string,
 *   trainedAt: string,       // ISO timestamp
 *   coefficients: number[],  // regression weights [w0, w1, w2, w3]
 *   intercept: number,
 *   residualStdDev: number,  // for confidence scoring
 *   trainingSetSize: number,
 *   mae: number              // mean absolute error on training set
 * }
 */

/**
 * Serializes a model artifact to a JSON string.
 *
 * @param {object} artifact
 * @returns {string}
 */
export function serializeModel(artifact) {
  if (!artifact || typeof artifact !== 'object') {
    throw new Error('serializeModel: artifact must be a non-null object.');
  }
  return JSON.stringify(artifact);
}

/**
 * Deserializes a JSON string back into a model artifact.
 *
 * @param {string} json
 * @returns {object} ModelArtifact
 * @throws if the JSON is invalid or missing required fields
 */
export function deserializeModel(json) {
  let artifact;
  try {
    artifact = JSON.parse(json);
  } catch {
    throw new Error('deserializeModel: invalid JSON string.');
  }

  const required = ['version', 'coefficients', 'intercept', 'residualStdDev', 'trainingSetSize', 'mae'];
  for (const field of required) {
    if (artifact[field] === undefined) {
      throw new Error(`deserializeModel: missing required field "${field}".`);
    }
  }

  if (!Array.isArray(artifact.coefficients)) {
    throw new Error('deserializeModel: coefficients must be an array.');
  }

  return artifact;
}

/**
 * Returns a formatted, human-readable JSON string of the artifact.
 * Used for display and debugging.
 *
 * @param {object} artifact
 * @returns {string}
 */
export function prettyPrintArtifact(artifact) {
  return JSON.stringify(artifact, null, 2);
}
