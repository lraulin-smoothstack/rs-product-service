"use strict";

// Get table name
const productDBArn = process.env["Product_DB"]; //'Mark-productTable-1234567';
const productDBArnArr = productDBArn.split("/");
const TableName = productDBArnArr[productDBArnArr.length - 1];

// Create connection
const AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
});

const dynamoDB = new AWS.DynamoDB({ apiVersion: "2012-08-10" });
const documentClient = new AWS.DynamoDB.DocumentClient({
  httpOptions: {
    timeout: 5000,
  },
});

const createResponse = ({
  headers = {},
  body = "",
  statusCode = 200,
} = {}) => ({
  headers,
  body,
  statusCode,
});

const getAllProducts = done => {
  const params = {
    TableName,
    Key: { id: 2 },
  };

  documentClient.get(params, (err, data) => {
    if (err) {
      console.log("Error", err);
      done(err, null);
    } else {
      console.log("Success", data.Item);
      done(null, createResponse({ body: data.Item }));
    }
  });
};

// handleHttpRequest is the entry point for Lambda requests
exports.handleHttpRequest = (request, context, done) => {
  try {
    switch (request.httpMethod) {
      case "GET": {
        console.log("GET");

        getAllProducts(done);

        break;
      }
      case "POST": {
        console.log("POST");
        // TODO: check that department is valid before insert

        // There has to be a better way, but...
        const bodyJSON = JSON.parse(request.body || "{}");
        for (let key of Object.keys(bodyJSON)) {
          if (typeof bodyJSON[key] == "number") {
            bodyJSON[key] = bodyJSON[key].toString();
          }
        }
        const dynamo = new AWS.DynamoDB();

        const params = {
          TableName,
          Item: {
            id: { N: bodyJSON.id },
            name: { S: bodyJSON.name },
            description: { S: bodyJSON.description },
            department: { S: bodyJSON.department },
            category: { S: bodyJSON.category },
            photo_url: { S: bodyJSON.photo_url },
            wholesale_price: { N: bodyJSON.wholesale_price },
            retail_price: { N: bodyJSON.retail_price },
            stock: { N: bodyJSON.stock },
            discountable: { BOOL: bodyJSON.discountable },
          },
        };
        dynamo.putItem(params, (error, data) => {
          if (error) {
            console.log(error);
          } else {
            done(null, createResponse({ body: data }));
          }
        });
        break;
      }
    }
  } catch (e) {
    done(e, null);
  }
};
