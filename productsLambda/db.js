"use strict";

/**
 * Database connection
 */
const AWS = require("aws-sdk");
const TableName = process.env["TABLE_NAME"];

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
module.exports.getProductById = (request, done) => {
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

module.exports.getProducts = (request, done) => {
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

module.exports.createProduct = (Item, done) => {
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

module.exports.bulkCreateProducts = (request, done) => {
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

module.exports.updateProduct = (request, done) => {
  // TODO
};

module.exports.archiveProduct = (request, done) => {
  // TODO
};
