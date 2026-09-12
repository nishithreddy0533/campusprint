import { getSupabaseClient } from '../db/supabaseClient.js';
import { calculateCost } from './costCalculator.js';
import {
  createOrderObject,
  VALID_TRANSITIONS,
  PRINT_TYPES,
  BINDING_TYPES,
} from '../models/order.js';

const TABLE = 'orders';

export function validateOrderInput(data) {
  const errors = [];
  if (!data.studentName || !String(data.studentName).trim()) errors.push('studentName is required.');
  if (!data.studentContact || !String(data.studentContact).trim()) errors.push('studentContact is required.');
  if (!data.fileUrl || !String(data.fileUrl).trim()) errors.push('fileUrl is required.');
  if (!data.fileName || !String(data.fileName).trim()) errors.push('fileName is required.');
  if (!PRINT_TYPES.includes(data.printType)) errors.push(`printType must be one of: ${PRINT_TYPES.join(', ')}.`);
  if (!BINDING_TYPES.includes(data.binding)) errors.push(`binding must be one of: ${BINDING_TYPES.join(', ')}.`);
  const pages = Number(data.pages);
  const copies = Number(data.copies);
  if (!Number.isInteger(pages) || pages < 1) errors.push('pages must be an integer >= 1.');
  if (!Number.isInteger(copies) || copies < 1) errors.push('copies must be an integer >= 1.');
  return errors;
}

export async function createOrder(data) {
  const errors = validateOrderInput(data);
  if (errors.length > 0) {
    const err = new Error(errors.join(' '));
    err.status = 400;
    err.details = errors;
    throw err;
  }

  const cost = calculateCost(data.printType, Number(data.pages), Number(data.copies), data.binding);
  const order = createOrderObject({ ...data, cost });

  const { error } = await getSupabaseClient().from(TABLE).insert(order);
  if (error) throw new Error(error.message);

  return order;
}

export async function getOrderById(orderId) {
  const { data, error } = await getSupabaseClient()
    .from(TABLE)
    .select('*')
    .eq('orderId', orderId)
    .single();
  if (error) return null;
  return data;
}

export async function getOrdersByContact(studentContact) {
  const { data, error } = await getSupabaseClient()
    .from(TABLE)
    .select('*')
    .eq('studentContact', studentContact)
    .order('createdAt', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getAllOrders({ status, search } = {}) {
  let query = getSupabaseClient().from(TABLE).select('*').order('createdAt', { ascending: false });

  if (status) query = query.eq('orderStatus', status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let items = data || [];

  if (search) {
    const term = search.toLowerCase();
    items = items.filter(
      (o) =>
        o.orderId.toLowerCase().includes(term) ||
        (o.studentName && o.studentName.toLowerCase().includes(term))
    );
  }

  return items;
}

export async function confirmPayment(orderId) {
  const order = await getOrderById(orderId);
  if (!order) {
    const err = new Error('Order not found.');
    err.status = 404;
    throw err;
  }
  if (order.paymentStatus === 'paid') {
    const err = new Error('Order is already paid.');
    err.status = 400;
    throw err;
  }

  const now = new Date().toISOString();
  const { error } = await getSupabaseClient()
    .from(TABLE)
    .update({ paymentStatus: 'paid', updatedAt: now })
    .eq('orderId', orderId);
  if (error) throw new Error(error.message);

  return { ...order, paymentStatus: 'paid', updatedAt: now };
}

export async function updateOrderStatus(orderId, newStatus, extra = {}) {
  const order = await getOrderById(orderId);
  if (!order) {
    const err = new Error('Order not found.');
    err.status = 404;
    throw err;
  }

  const currentStatus = order.orderStatus;

  if (newStatus === 'rejected') {
    const reason = extra.rejectionReason;
    if (!reason || !String(reason).trim()) {
      const err = new Error('rejectionReason is required when rejecting an order.');
      err.status = 400;
      throw err;
    }
    const now = new Date().toISOString();
    const { error } = await getSupabaseClient()
      .from(TABLE)
      .update({ orderStatus: 'rejected', rejectionReason: reason.trim(), updatedAt: now })
      .eq('orderId', orderId);
    if (error) throw new Error(error.message);
    return { ...order, orderStatus: 'rejected', rejectionReason: reason.trim(), updatedAt: now };
  }

  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    const err = new Error(
      `Invalid status transition: "${currentStatus}" → "${newStatus}". Allowed: ${allowed.length ? allowed.join(', ') : 'none'}.`
    );
    err.status = 400;
    throw err;
  }

  if (newStatus === 'processing' && order.paymentStatus !== 'paid') {
    const err = new Error('Cannot move to processing: payment not confirmed.');
    err.status = 400;
    throw err;
  }

  const now = new Date().toISOString();
  const updates = { orderStatus: newStatus, updatedAt: now };
  if (extra.estimatedCompletionTime) updates.estimatedCompletionTime = extra.estimatedCompletionTime;

  const { error } = await getSupabaseClient()
    .from(TABLE)
    .update(updates)
    .eq('orderId', orderId);
  if (error) throw new Error(error.message);

  return { ...order, ...updates };
}
