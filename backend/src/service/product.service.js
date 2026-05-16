import Product from "../model/product.model.js";

function buildError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function buildSearchFilter(search) {
  if (!search) {
    return {};
  }

  const regex = new RegExp(search, "i");
  return {
    $or: [
      { name: regex },
      { brand: regex },
      { description: regex },
      { sku: regex },
      { barcode: regex },
    ],
  };
}

function buildLowStockFilter(lowStock) {
  if (!lowStock) {
    return {};
  }

  return { $expr: { $lte: ["$stock", "$lowStockThreshold"] } };
}

function normalizePagination({ page = 1, limit = 20 }) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (safePage - 1) * safeLimit;

  return { page: safePage, limit: safeLimit, skip };
}

function buildProductResponse(product) {
  if (!product) {
    return null;
  }

  const doc = product.toObject ? product.toObject() : product;
  return {
    ...doc,
    isLowStock: doc.stock <= doc.lowStockThreshold,
  };
}

async function ensureUniqueBarcode(barcode, productId) {
  if (!barcode) {
    return;
  }

  const existing = await Product.findOne({ barcode });
  if (existing && existing._id.toString() !== String(productId || "")) {
    throw buildError(409, "Barcode already exists");
  }
}

export async function createProduct(payload, userId) {
  await ensureUniqueBarcode(payload.barcode);

  const product = await Product.create({
    ...payload,
    createdBy: userId,
    updatedBy: userId,
  });

  return buildProductResponse(product);
}

export async function updateProduct(productId, payload, userId) {
  await ensureUniqueBarcode(payload.barcode, productId);

  const product = await Product.findByIdAndUpdate(
    productId,
    { ...payload, updatedBy: userId },
    { new: true, runValidators: true },
  );

  if (!product) {
    throw buildError(404, "Product not found");
  }

  return buildProductResponse(product);
}

export async function deleteProduct(productId) {
  const product = await Product.findByIdAndDelete(productId);
  if (!product) {
    throw buildError(404, "Product not found");
  }

  return buildProductResponse(product);
}

export async function getProductById(productId) {
  const product = await Product.findById(productId);
  if (!product) {
    throw buildError(404, "Product not found");
  }

  return buildProductResponse(product);
}

export async function listProducts(query) {
  const { page, limit, skip } = normalizePagination(query);
  const filters = {
    ...buildSearchFilter(query.search),
    ...(query.category ? { category: query.category } : {}),
    ...(query.itemType ? { itemType: query.itemType } : {}),
    ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    ...buildLowStockFilter(query.lowStock),
  };

  const [items, total] = await Promise.all([
    Product.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filters),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    items: items.map(buildProductResponse),
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}
