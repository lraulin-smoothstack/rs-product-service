"use strict";

module.exports.createProduct = ({
  name = "",
  description = "",
  category = "",
  department = "",
  photo_url = "",
  wholesale_price_cents = 0,
  retail_price_cents = 0,
  discountable = false,
  stock = 0,
  deleted = false,
} = {}) => ({
  name,
  description,
  category,
  department,
  photo_url,
  wholesale_price_cents,
  retail_price_cents,
  discountable,
  stock,
  deleted,
});

module.exports.createProductWithId = ({
  id = 0,
  name = "",
  description = "",
  category = "",
  department = "",
  photo_url = "",
  wholesale_price_cents = 0,
  retail_price_cents = 0,
  discountable = false,
  stock = 0,
  deleted = false,
} = {}) => ({
  id,
  name,
  description,
  category,
  department,
  photo_url,
  wholesale_price_cents,
  retail_price_cents,
  discountable,
  stock,
  deleted,
});

module.exports.createValuesArray = (
  product = module.exportscreateProduct(),
) => [
  product.name,
  product.description,
  product.category,
  product.department,
  product.photo_url,
  product.wholesale_price_cents,
  product.retail_price_cents,
  product.discountable,
  product.stock,
  product.deleted,
];

module.exports.createProductFromArray = arr =>
  createProduct({
    name: arr[0],
    description: arr[1],
    category: arr[2],
    department: arr[3],
    photo_url: arr[4],
    wholesale_price_cents: arr[5],
    retail_price_cents: arr[6],
    discountable: arr[7],
    stock: arr[8],
    deleted: arr[9],
  });

module.exports.createProductWithIdFromArray = arr =>
  module.exports.createProduct({
    id: arr[0],
    name: arr[0],
    description: arr[1],
    category: arr[2],
    department: arr[3],
    photo_url: arr[4],
    wholesale_price_cents: arr[5],
    retail_price_cents: arr[6],
    discountable: arr[7],
    stock: arr[8],
    deleted: arr[9],
  });
