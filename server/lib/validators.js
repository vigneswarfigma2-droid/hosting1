import { z } from 'zod';
import { SUPPORTED_DURATIONS } from './plans.js';

export const createOrderSchema = z.object({
    planId: z.string().min(1, 'planId required').max(64),
    durationMonths: z.coerce
        .number()
        .int()
        .refine((n) => SUPPORTED_DURATIONS.includes(n), {
            message: `durationMonths must be one of ${SUPPORTED_DURATIONS.join(', ')}`,
        }),
    customer: z
        .object({
            email: z.string().email().optional(),
            name: z.string().max(120).optional(),
            phone: z.string().max(20).optional(),
        })
        .partial()
        .optional(),
    notes: z.record(z.string().max(256)).optional(),
});

export const verifyPaymentSchema = z.object({
    razorpay_order_id: z.string().min(1).max(64),
    razorpay_payment_id: z.string().min(1).max(64),
    razorpay_signature: z.string().min(1).max(256),
});
