"use strict";

const AWS = require("aws-sdk");

// Get "product" Dynamo table name.  Replace DEFAULT_VALUE
// with the actual table name from your stack.
const productDBArn =
  process.env["product_DB"] || "cccc-ProductTable-1V8RPWH4LL6SE"; //'Mark-productTable-1234567';
const productDBArnArr = productDBArn.split("/");
const productTableName = productDBArnArr[productDBArnArr.length - 1];

// Generate a unique id
const CUSTOMEPOCH = 1300000000000; // artificial epoch
const generateRowId = () => {
  let ts = new Date().getTime() - CUSTOMEPOCH; // limit to recent
  const randid = Math.floor(Math.random() * 512);
  ts = ts * 64; // bit-shift << 6
  return ts * 512 + (randid % 512);
};

// handleHttpRequest is the entry point for Lambda requests
exports.handleHttpRequest = (request, context, done) => {
  try {
    // const userId = request.pathParameters.userId;
    let response = {
      headers: {},
      body: "",
      statusCode: 200,
    };

    switch (request.httpMethod) {
      case "GET": {
        console.log("GET");
        const dynamo = new AWS.DynamoDB();
        // Call DynamoDB to read the items from the table
        const scanResults = dynamo.scan(productTableName);
        response.body = JSON.stringify(scanResults);
        break;
      }
      case "POST": {
        console.log("POST");
        // TODO: check that department is valid before insert
        const bodyJSON = JSON.parse(request.body || "{}");
        for (let key of Object.keys(bodyJSON)) {
          if (typeof bodyJSON[key] == "number") {
            bodyJSON[key] = bodyJSON[key].toString();
          }
        }
        console.log("???????? REQUEST BODY ????????");
        console.log(bodyJSON);
        // const documentClient = new AWS.DynamoDB.DocumentClient();
        const dynamo = new AWS.DynamoDB();

        const params = {
          TableName: productTableName,
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
        console.log("READY...........");
        console.log(params);
        dynamo.putItem(params, (error, data) => {
          if (error) {
            console.log("*********ERROR*********");
            console.log(error);
          } else {
            response.body = JSON.stringify(data);
            console.log("!!!!!!!!HEY!!!!!!!!!");
            console.log(response);
            done(null, response);
          }
        });
        break;
      }
    }
  } catch (e) {
    console.log("$$$$$$$FINAL CATCH$$$$$$$$");
    console.log(e);
    done(e, null);
  }
};
