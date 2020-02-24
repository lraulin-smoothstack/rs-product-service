"use strict";

const db = require("./db");

/**
 * Request evaluators.
 */

// GET /products
const isGetProductsRequest = request =>
  request.httpMethod === "GET" && request.resource === "/products";

// POST /products
const isPostProductsRequest = request =>
  request.httpMethod === "POST" && request.resource === "/products";

// GET /products/{product_id}
const isGetProductByIdRequest = request =>
  request.httpMethod === "GET" && request.resource === "/products/{product_id}";

// PUT /products/{product_id}
const isPutProductByIdRequest = request =>
  request.httpMethod === "PUT" && request.resource === "/products/{product_id}";

// DELETE /products/{product_id}
const isDeleteProductByIdRequest = request =>
  request.httpMethod === "DELETE" &&
  request.resource === "/products/{product_id}";

/**
 * Entry point.
 */
exports.handleHttpRequest = (request, context, done) => {
  try {
    if (isGetProductsRequest(request)) {
      console.log("GET /products");
      db.getProducts(request, done);
    }
    if (isPostProductsRequest(request)) {
      console.log("POST /products");
      db.bulkCreateProducts(request, done);
    }
    if (isGetProductByIdRequest(request)) {
      console.log("GET /products/{product_id}");
      db.getProductById(request, done);
    }
    if (isPutProductByIdRequest(request)) {
      console.log("PUT /products/{product_id}");
      db.updateProduct(request, done);
    }
    if (isDeleteProductByIdRequest(request)) {
      console.log("DELETE /products/{product_id}");
      db.archiveProduct(request, done);
    }
  } catch (e) {
    done(e, null);
  }
};
