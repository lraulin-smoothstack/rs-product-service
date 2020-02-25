const express = require("express");
const serverless = require("serverless-http");
const bodyParser = require("body-parser");
const accepts = require("accepts");
const js2xmlparser = require("js2xmlparser");
const db = require("./db");
const app = express();

const mysql = require("mysql");
require("dotenv").config();

const connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: "redemption_store",
});

module.exports = connection;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const columns =
  "name, description, category, department, photo_url, wholesale_price_cents, retail_price_cents, discountable, stock, deleted";

app.get("/products", (request, response) => {
  const accept = accepts(request);
  db.query("SELECT * FROM product", (error, results) => {
    if (error) {
      response.status(404);
      response.send();
    } else {
      switch (accept.type(["json", "xml"])) {
        case "json":
          response.setHeader("Content-Type", "application/json");
          response.status(200);
          response.send(results);
          break;
        case "xml":
          response.setHeader("Content-Type", "application/xml");
          response.status(200);
          response.send(js2xmlparser.parse("coupons", results));
          break;
        default:
          response.status(406);
          response.send();
          break;
      }
    }
  });
});

app.get("/products/:id", (request, response) => {
  const accept = accepts(request);
  db.query(
    "SELECT * FROM product where code = ?",
    [request.params.id],
    (error, results) => {
      if (error || results.length == 0) {
        response.status(404);
        response.send();
      } else {
        switch (accept.type(["json", "xml"])) {
          case "json":
            response.setHeader("Content-Type", "application/json");
            response.status(200);
            response.send(results);
            break;
          case "xml":
            response.setHeader("Content-Type", "application/xml");
            response.status(200);
            response.send(js2xmlparser.parse("coupons", results));
            break;
          default:
            response.status(406);
            response.send();
            break;
        }
      }
    },
  );
});

app.post("/products", (request, response) => {
  db.query(
    `INSERT INTO product (${columns}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      request.body.name,
      request.body.description,
      request.body.category,
      request.body.department,
      request.body.photo_url,
      request.body.wholesale_price_cents,
      request.body.retail_price_cents,
      request.body.discountable,
      request.body.stock,
      false,
    ],
    (error, results) => {
      if (error || results.affectedRows == 0) {
        response.status(400);
        response.send();
      } else {
        response.status(201);
        response.send();
      }
    },
  );
});

app.put("/products/:id", (request, response) => {
  const sql =
    "UPDATE product SET name = ?, description = ?, category = ?, department = ?, photo_url = ?, wholesale_price_cents = ?, retail_price_cents = ?, discountable = ?, stock = ? WHERE id = ?";
  const values = [
    request.body.name,
    request.body.description,
    request.body.category,
    request.body.department,
    request.body.photo_url,
    request.body.wholesale_price_cents,
    request.body.retail_price_cents,
    request.body.discountable,
    request.body.stock,
    request.params.id,
  ];

  db.query(sql, values, (error, results) => {
    if (error || results.affectedRows == 0) {
      response.status(400);
      response.send();
    } else {
      response.status(204);
      response.send();
    }
  });
});

app.delete("/products/:id", (request, response) => {
  db.query(
    "UPDATE product SET deleted = ? WHERE id = ?",
    [current, request.params.id],
    (error, results) => {
      if (error || results.affectedRows == 0) {
        response.status(400);
        response.send();
      } else {
        response.status(204);
        response.send();
      }
    },
  );
});

module.exports.handler = serverless(app);
