import { z } from "zod";

const MAX_PRICE = 100000000;

const stationerySchema = z
  .object({
    color: z.string().trim().optional(),
    size: z.string().trim().optional(),
    material: z.string().trim().optional(),
    pages: z.number().int().min(1).optional(),
    gsm: z.number().int().min(1).optional(),
    inkColor: z.string().trim().optional(),
  })
  .strict();

const electronicsSchema = z
  .object({
    model: z.string().trim().optional(),
    warrantyMonths: z.number().int().min(0).optional(),
    voltage: z.string().trim().optional(),
    power: z.string().trim().optional(),
    serialNumber: z.string().trim().optional(),
  })
  .strict();

const specsSchema = z
  .object({
    stationery: stationerySchema.optional(),
    electronics: electronicsSchema.optional(),
  })
  .strict()
  .optional();

const baseSchema = z
  .object({
    name: z.string().trim().min(1),
    brand: z.string().trim().optional(),
    category: z.string().trim().optional(),
    itemType: z.enum(["stationery", "electronics"]),
    description: z.string().trim().optional(),
    sku: z.string().trim().optional(),
    barcode: z.string().trim().optional(),
    unit: z.string().trim().optional(),
    price: z.number().min(0).max(MAX_PRICE),
    costPrice: z.number().min(0).max(MAX_PRICE).optional(),
    taxRate: z.number().min(0).max(100).optional(),
    stock: z.number().int().min(0).optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
    imageUrl: z.string().trim().optional(),
    specs: specsSchema,
  })
  .strict()
  .refine(
    (data) => data.costPrice === undefined || data.costPrice <= data.price,
    {
      message: "Cost price cannot exceed selling price",
      path: ["costPrice"],
    },
  );

const updateSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    brand: z.string().trim().optional(),
    category: z.string().trim().optional(),
    itemType: z.enum(["stationery", "electronics"]).optional(),
    description: z.string().trim().optional(),
    sku: z.string().trim().optional(),
    barcode: z.string().trim().optional(),
    unit: z.string().trim().optional(),
    price: z.number().min(0).max(MAX_PRICE).optional(),
    costPrice: z.number().min(0).max(MAX_PRICE).optional(),
    taxRate: z.number().min(0).max(100).optional(),
    stock: z.number().int().min(0).optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
    imageUrl: z.string().trim().optional(),
    specs: specsSchema,
  })
  .strict()
  .refine(
    (data) =>
      data.costPrice === undefined ||
      data.price === undefined ||
      data.costPrice <= data.price,
    {
      message: "Cost price cannot exceed selling price",
      path: ["costPrice"],
    },
  );

const querySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().trim().optional(),
    category: z.string().trim().optional(),
    itemType: z.enum(["stationery", "electronics"]).optional(),
    lowStock: z.coerce.boolean().optional(),
    isActive: z.coerce.boolean().optional(),
  })
  .strict();

function formatError(error) {
  if (!error) {
    return null;
  }

  const message = error.issues?.[0]?.message || "Invalid request";
  return { status: 400, message };
}

export function validateCreateProduct(body) {
  const result = baseSchema.safeParse(body);
  if (!result.success) {
    return { error: formatError(result.error) };
  }

  return { value: result.data };
}

export function validateUpdateProduct(body) {
  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return { error: formatError(result.error) };
  }

  return { value: result.data };
}

export function validateProductQuery(query) {
  const result = querySchema.safeParse(query);
  if (!result.success) {
    return { error: formatError(result.error) };
  }

  return { value: result.data };
}
