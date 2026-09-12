import { v4 as uuidv4 } from 'uuid';

/**
 * Valid values for orderStatus and paymentStatus.
 */
export const ORDER_STATUSES = ['received', 'processing', 'ready', 'collected', 'rejected'];
export const PAYMENT_STATUSES = ['pending', 'paid'];
export const PRINT_TYPES = ['bw', 'color'];
export const BINDING_TYPES = ['none', 'staple', 'spiral'];

/**
 * Valid forward transitions for orderStatus.
 * 'rejected' is always allowed as a separate action.
 */
export const VALID_TRANSITIONS = {
  received: ['processing'],
  processing: ['ready'],
  ready: ['collected'],
  collected: [],
  rejected: [],
};

/**
 * Factory that creates a new Order object with generated id and timestamps.
 *
 * @param {object} data
 * @returns {object} Order
 */
export function createOrderObject(data) {
  const now = new Date().toISOString();
  return {
    orderId: uuidv4(),
    studentName: data.studentName,
    studentContact: data.studentContact,
    fileName: data.fileName,
    fileUrl: data.fileUrl,
    printType: data.printType,
    pages: Number(data.pages),
    copies: Number(data.copies),
    binding: data.binding,
    specialInstructions: data.specialInstructions || '',
    cost: data.cost,
    paymentStatus: 'pending',
    orderStatus: 'received',
    estimatedCompletionTime: data.estimatedCompletionTime || null,
    rejectionReason: null,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Serializes an Order object to a human-readable JSON string.
 * Used for display and round-trip testing.
 *
 * @param {object} order
 * @returns {string}
 */
export function prettyPrintOrder(order) {
  return JSON.stringify(order, null, 2);
}
