"use strict";

/**
 * Product factory function for documentation and type inference.
 */
module.exports.departments = ["mens", "womens", "kids"];

module.exports.createProduct = ({
  id = 0,
  name = "",
  description = "",
  department = this.departments[0],
  category = "",
  photo_url = "",
  wholesale_price = 0,
  retail_price = 0,
  stock = 0,
  discountable = false,
  archived = false,
} = {}) => ({
  id,
  name,
  description,
  department,
  category,
  photo_url,
  wholesale_price,
  retail_price,
  stock,
  discountable,
  archived,
});
