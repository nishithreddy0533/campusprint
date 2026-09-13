/**
 * Feature encoder for the ML pricing model.
 *
 * Encodes order parameters into a fixed-length numeric feature vector:
 *   [pages, copies, printTypeEncoded, bindingEncoded]
 *
 * Encoding table:
 *   printType: bw=0, color=1
 *   binding:   none=0, staple=1, spiral=2
 */

const PRINT_TYPE_MAP = { bw: 0, color: 1 };
const BINDING_MAP = { none: 0, staple: 1, spiral: 2 };

export class FeatureEncodingError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FeatureEncodingError';
    this.status = 400;
  }
}

/**
 * Encodes order parameters into a 4-element numeric feature vector.
 *
 * @param {{ pages: number, copies: number, printType: string, binding: string }} params
 * @returns {[number, number, number, number]}
 * @throws {FeatureEncodingError} if any field is invalid
 */
export function encodeFeatures(params) {
  const pages = Number(params.pages);
  const copies = Number(params.copies);

  if (!Number.isFinite(pages) || pages < 1) {
    throw new FeatureEncodingError(`Invalid pages value: ${params.pages}`);
  }
  if (!Number.isFinite(copies) || copies < 1) {
    throw new FeatureEncodingError(`Invalid copies value: ${params.copies}`);
  }

  const printTypeEncoded = PRINT_TYPE_MAP[params.printType];
  if (printTypeEncoded === undefined) {
    throw new FeatureEncodingError(`Invalid printType: "${params.printType}". Must be one of: bw, color`);
  }

  const bindingEncoded = BINDING_MAP[params.binding];
  if (bindingEncoded === undefined) {
    throw new FeatureEncodingError(`Invalid binding: "${params.binding}". Must be one of: none, staple, spiral`);
  }

  return [pages, copies, printTypeEncoded, bindingEncoded];
}

/**
 * Returns a human-readable string representation of a feature vector.
 * Used for display and round-trip testing.
 *
 * @param {number[]} vector
 * @returns {string}
 */
export function prettyPrintFeatureVector(vector) {
  return JSON.stringify({
    pages: vector[0],
    copies: vector[1],
    printType: vector[2] === 1 ? 'color' : 'bw',
    binding: ['none', 'staple', 'spiral'][vector[3]] ?? 'unknown',
    raw: vector,
  }, null, 2);
}
