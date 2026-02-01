import { Router } from 'express';
import { createPaymentIntent, confirmPayment } from '../controllers/paymentController.js';

const router = Router();

// Create payment intent (frontend calls this before deposit)
router.post('/intent', createPaymentIntent);

// Confirm payment after frontend obtains txSignature from deposit
router.post('/confirm', confirmPayment);

export default router;