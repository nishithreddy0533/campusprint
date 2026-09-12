/**
 * Calculates the total cost of a print order.
 * All pricing is server-side only — never trust client-submitted costs.
 *
 * Rates:
 *   B&W:    ₹2 per page
 *   Color:  ₹8 per page
 *   Staple: +₹5
 *   Spiral: +₹20
 *
 * @param {'bw'|'color'} printType
 * @param {number} pages - number of pages (>= 1)
 * @param {number} copies - number of copies (>= 1)
 * @param {'none'|'staple'|'spiral'} binding
 * @returns {number} total cost in ₹
 */
export function calculateCost(printType, pages, copies, binding) {
  const perPage = printType === 'color' ? 8 : 2;
  const bindingCost = binding === 'staple' ? 5 : binding === 'spiral' ? 20 : 0;
  return pages * copies * perPage + bindingCost;
}
