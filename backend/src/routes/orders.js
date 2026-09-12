import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  createOrder,
  getOrderById,
  getOrdersByContact,
  getAllOrders,
  confirmPayment,
  updateOrderStatus,
} from '../services/orderService.js';

const router = Router();

// POST /api/orders — create order (student)
router.post('/', async (req, res, next) => {
  try {
    const order = await createOrder(req.body);
    return res.status(201).json({ orderId: order.orderId, cost: order.cost, order });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ message: err.message, details: err.details });
    next(err);
  }
});

// POST /api/orders/:orderId/pay — simulate payment (student)
router.post('/:orderId/pay', async (req, res, next) => {
  try {
    const order = await confirmPayment(req.params.orderId);
    return res.status(200).json({ order });
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ message: err.message });
    if (err.status === 400) return res.status(400).json({ message: err.message });
    next(err);
  }
});

// GET /api/orders — student history OR staff queue depending on query params + auth
// - ?studentContact=  → student history (no auth)
// - ?status=&search=  → staff queue (requires auth)
router.get('/', async (req, res, next) => {
  try {
    const { studentContact, status, search } = req.query;

    // Student history query
    if (studentContact) {
      const orders = await getOrdersByContact(studentContact);
      return res.status(200).json({ orders });
    }

    // Staff queue — require authentication
    requireAuth(req, res, async () => {
      try {
        const orders = await getAllOrders({ status, search });
        return res.status(200).json({ orders });
      } catch (err) {
        next(err);
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:orderId — fetch single order (student or staff)
router.get('/:orderId', async (req, res, next) => {
  try {
    const order = await getOrderById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    return res.status(200).json({ order });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:orderId/status — update status or reject (staff only)
router.patch('/:orderId/status', requireAuth, async (req, res, next) => {
  try {
    const { orderStatus, rejectionReason, estimatedCompletionTime } = req.body || {};

    if (!orderStatus) {
      return res.status(400).json({ message: 'orderStatus is required.' });
    }

    const order = await updateOrderStatus(req.params.orderId, orderStatus, {
      rejectionReason,
      estimatedCompletionTime,
    });
    return res.status(200).json({ order });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ message: err.message });
    if (err.status === 404) return res.status(404).json({ message: err.message });
    next(err);
  }
});

export default router;
