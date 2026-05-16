import * as productService from "../service/product.service.js";

function sendError(res, error) {
  const status = error?.status || 500;
  const message = error?.message || "Something went wrong";

  if (status >= 500) {
    console.error(error);
  }

  return res.status(status).json({
    success: false,
    message,
  });
}

async function create(req, res) {
  try {
    const product = await productService.createProduct(req.body, req.user?.id);

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: { product },
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function update(req, res) {
  try {
    const product = await productService.updateProduct(
      req.params.id,
      req.body,
      req.user?.id,
    );

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: { product },
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function remove(req, res) {
  try {
    const product = await productService.deleteProduct(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: { product },
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function getOne(req, res) {
  try {
    const product = await productService.getProductById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      data: { product },
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function list(req, res) {
  try {
    const result = await productService.listProducts(req.validatedQuery || req.query);

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: { products: result.items },
      meta: result.meta,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export default {
  create,
  update,
  remove,
  getOne,
  list,
};
