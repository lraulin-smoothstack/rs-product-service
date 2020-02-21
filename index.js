"use strict";

const AWS = require("aws-sdk");

// Get "product" Dynamo table name.  Replace DEFAULT_VALUE
// with the actual table name from your stack.
const productDBArn =
  process.env["product_DB"] || "test2-productTable-5ZFKMXTN6BDO"; //'Mark-productTable-1234567';
const productDBArnArr = productDBArn.split("/");
const productTableName = productDBArnArr[productDBArnArr.length - 1];

// Generate a unique id
const CUSTOMEPOCH = 1300000000000; // artificial epoch
const generateRowId()=> {
  const ts = new Date().getTime() - CUSTOMEPOCH; // limit to recent
  const randid = Math.floor(Math.random() * 512);
  ts = (ts * 64);   // bit-shift << 6
  return (ts * 512) + (randid % 512);
}

const scanTable = async tableName => {
  const params = {
    TableName: tableName,
  };

  let scanResults = [];
  let items;
  do {
    items = await documentClient.scan(params).promise();
    items.Items.forEach(item => scanResults.push(item));
    params.ExclusiveStartKey = items.LastEvaluatedKey;
  } while (typeof items.LastEvaluatedKey != "undefined");

  return scanResults;
};

// handleHttpRequest is the entry point for Lambda requests
exports.handleHttpRequest = async (request, context, done) => {
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
        const scanResults = await scan(productTableName);
        response.body = JSON.stringify(scanResults);
        break;
      }
      case "POST": {
        console.log("POST");
        // TODO: check that department is valid before insert
        const bodyJSON = JSON.parse(request.body || "{}");
        console.log(bodyJSON);
        // const dynamo = new AWS.DynamoDB();
        // const params = {
        //   TableName: productTableName,
        //   Item: {
        //     id: { N: generateRowId() },
        //     name: { S: bodyJSON["name"] },
        //     description: { S: bodyJSON["description"] },
        //     department: { S: bodyJSON["department"] },
        //     category: { S: bodyJSON["category"] },
        //     photo_url: { S: bodyJSON["photo_url"] },
        //     wholesale_price: { N: bodyJSON["wholesale_price"] },
        //     retail_price: { N: bodyJSON["retail_price"] },
        //     stock: { N: bodyJSON["stock"] },
        //     discountable: { BOOL: bodyJSON["discountable"] },
        //   },
        // };
        // dynamo.putItem(params, (error, data) => {
        //   if (error) throw `Dynamo Error (${error})`;
        //   else done(null, response);
        // });
        break;
      }
    }
  } catch (e) {
    done(e, null);
  }
};
