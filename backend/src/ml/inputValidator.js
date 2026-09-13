/**
 * Input validator for the ML prediction endpoint.
 * Validates raw request body fields before they reach the feature encoder.
 */

const VALID_PRINT_TYPES = ['bw', 'color'];
const VALID_BINDINGS = ['none', 'staple', 'spiral'];

/**
 * Validates the body of a prediction request.
 *
 * @param {object} body - Raw request body
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePredictionInput(body) {
  const errors = [];

  // pages: must be an integer >= 1
  const pages = Number(body?.pages);
  if (body?.pages === undefined || body?.pages === null || body?.pages === '') {
    errors.push('pages is required.');
  } else if (!Number.isInteger(pages) || pages < 1) {
    errors.push('pages must be an integer >= 1.');
  }

  // copies: must be an integer >= 1
  const copies = Number(body?.copies);
  if (body?.copies === undefined || body?.copies === null || body?.copies === '') {
    errors.push('copies is required.');
  } else if (!Number.isInteger(copies) || copies < 1) {
    errors.push('copies must be an integer >= 1.');
  }

  // printType: must be one of the valid values
  if (!body?.printType || !VALID_PRINT_TYPES.includes(body.printType)) {
    errors.push(`printType must be one of: ${VALID_PRINT_TYPES.join(', ')}.`);
  }

  // binding: must be one of the valid values
  if (body?.binding === undefined || body?.binding === null || !VALID_BINDINGS.includes(body.binding)) {
    errors.push(`binding must be one of: ${VALID_BINDINGS.join(', ')}.`);
  }

  return { valid: errors.length === 0, errors };
}
