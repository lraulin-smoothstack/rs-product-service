"use strict";

/**
 * Database connection
 */
const TableName = process.env["TABLE_NAME"];
const AWS = require("aws-sdk");
// TODO: Get region from env
AWS.config.update({
  region: "us-east-1",
});
const documentClient = new AWS.DynamoDB.DocumentClient({
  httpOptions: {
    timeout: 5000,
  },
});

/**
 * Utility functions
 */
const createResponse = responseBody => ({
  statusCode: 200,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(responseBody),
  isBase64Encoded: false,
});

/**
 * CRUD functions
 */
const getProductById = (request, done) => {
  const params = {
    TableName,
    Key: { id: request.pathParameters.product_id },
  };

  documentClient.get(params, (err, data) => {
    if (err) {
      console.log("getAllProducts--ERROR");
      console.log(err);
      done(err, null);
    } else {
      done(null, createResponse(data.Item));
    }
  });
};

const getProducts = (request, done) => {
  const params = {
    TableName,
  };

  documentClient.scan(params, (err, data) => {
    if (err) {
      console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    } else {
      console.log("Query succeeded.");
      const products = data.Items;
      console.log(products);
      done(null, createResponse(products));
    }
  });
};

const createProduct = (Item, done) => {
  const params = {
    TableName,
    Item,
    ConditionExpression: "attribute_not_exists(id)",
  };

  documentClient.put(params, (error, data) => {
    if (error) {
      console.log(error);
      done(error, null);
    } else {
      console.log("createProduct: SUCCESS!");
      done(null, createResponse(data));
    }
  });
};

const bulkCreateProducts = (request, done) => {
  const products = JSON.parse(request.body);

  const createPutRequest = Item => ({
    PutRequest: {
      Item,
    },
  });

  const params = {
    RequestItems: {
      [TableName]: products.map(p => createPutRequest(p)),
    },
  };

  console.log("* * * * bulkCreateProducts: params * * * *");
  console.log(JSON.stringify(params));

  // const processItemsCallback = function(err, data) {
  //   if (err) {
  //     console.log(err);
  //     done(err, null);
  //   } else {
  //     const params = {};
  //     params.RequestItems = data.UnprocessedItems;
  //     if (Object.keys(params.RequestItems).length !== 0) {
  //       db.batchWriteItem(params, processItemsCallback);
  //     } else {
  //       console.log(data);
  //       done(null, createResponse(data));
  //     }
  //   }
  // };

  documentClient.batchWrite(params, (err, data) => {
    if (err) {
      console.log(err);
      done(err, null);
    } else {
      console.log(data);
      done(null, createResponse(data));
    }
  });
};

// GET /products
const isGetProductsRequest = request =>
  request.httpMethod === "GET" && request.resource === "/products";

// GET /products/{product_id}
const isGetProductByIdRequest = request =>
  request.httpMethod === "GET" && request.resource === "/products/{product_id}";

// POST /products
const isPostProductsRequest = request =>
  request.httpMethod === "POST" && request.resource === "/products";

// handleHttpRequest is the entry point for Lambda requests
exports.handleHttpRequest = (request, context, done) => {
  console.log("!!! REQUEST !!!");
  console.log(JSON.stringify(request));
  try {
    if (isGetProductsRequest(request)) {
      console.log("GET /products");
      getProducts(request, done);
    }
    if (isGetProductByIdRequest(request)) {
      console.log("GET /products/{product_id}");
      getProductById(request, done);
    }
    if (isPostProductsRequest(request)) {
      console.log("POST /products");
      bulkCreateProducts(request, done);
    }
  } catch (e) {
    done(e, null);
  }
};
