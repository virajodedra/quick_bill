import { z } from "zod";

const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
});

const customerSchema = z.object({
  name: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  customer: customerSchema.optional(),
  notes: z.string().trim().optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().trim().optional(),
});

function formatError(error) {
  const message = error.issues?.[0]?.message || "Invalid request";
  return { status: 400, message };
}

export function validateCreateOrder(body) {
  const result = createOrderSchema.safeParse(body);
  if (!result.success) return { error: formatError(result.error) };
  return { value: result.data };
}

export function validateCancelOrder(body) {
  const result = cancelOrderSchema.safeParse(body);
  if (!result.success) return { error: formatError(result.error) };
  return { value: result.data };
}
