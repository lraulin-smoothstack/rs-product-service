const accepts = require("accepts");
const cors = require("cors");
const express = require("express");
const js2xmlparser = require("js2xmlparser");
const jwt = require("jsonwebtoken");
const serverless = require("serverless-http");

const db = require("./db");

const app = express();

app.use(cors());
app.use(express.urlencoded());
app.use(express.json());

const sendResponseWithJsonOrXml = ({ request, response, xmlRoot, payload }) => {
  const accept = accepts(request);

  switch (accept.type(["json", "xml"])) {
    case "json":
      response.setHeader("Content-Type", "application/json");
      response.status(200);
      response.send(payload);
      break;
    case "xml":
      response.setHeader("Content-Type", "application/xml");
      response.status(200);
      response.send(js2xmlparser.parse(xmlRoot, payload));
      break;
    default:
      response.status(406);
      response.send();
      break;
  }
};

app.post("/login", (request, response) => {
  db.query(
    "SELECT id, email, address, first_name, last_name, password, role FROM user WHERE email = ?",
    [request.body.email],
    (error, results) => {
      if (error) {
        console.log("Failed login attempt due to error:");
        console.log(error);
        response.status(401);
        response.send(error);
      } else if (results.length == 0) {
        const message =
          "Failed login attempt: user " + request.body.email + " not found.";
        console.log(message);
        response.status(401);
        response.send({ message });
      } else if (results[0].password != request.body.password) {
        const message =
          "Failed login attempt: Incorrect password for user " +
          request.body.email;
        response.status(401);
        response.send({ message });
      } else {
        delete results[0].password;

        const userInfo = {
          ...results[0],
          jwt: jwt.sign(
            {
              email: request.body.email,
              role: results[0].role,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" },
          ),
        };

        sendResponseWithJsonOrXml({
          request,
          response,
          xmlRoot: "user",
          payload: userInfo,
        });
      }
    },
  );
});

// All product table columns (except id) for insert
const productTableColumns =
  "name, description, category, department, photo_url, wholesale_price_cents, retail_price_cents, discountable, stock, deleted";

// All order table columns (except id) for insert
const orderTableColumns =
  "product_id, user_id, coupon_code, quantity, in_store, date, ship_date, status, deleted";

const placeHolders = (columns = "") =>
  columns
    .split(", ")
    .map(x => "?")
    .join(", ");

app.get("/products", (request, response) => {
  const category = request.query.category || "%";
  const department = request.query.department || "%";
  db.query(
    "SELECT * FROM product WHERE department LIKE ? AND category LIKE ? AND deleted = 0;",
    [department, category],
    (error, results) => {
      if (error) {
        response.status(404);
        response.send();
      } else {
        sendResponseWithJsonOrXml({
          request,
          response,
          xmlRoot: "products",
          payload: results,
        });
      }
    },
  );
});

app.get("/products/:id", (request, response) => {
  db.query(
    "SELECT * FROM product where id = ?",
    [request.params.id],
    (error, results) => {
      if (error || results.length == 0) {
        response.status(404);
        response.send();
      } else {
        sendResponseWithJsonOrXml({
          request,
          response,
          xmlRoot: "products",
          payload: results,
        });
      }
    },
  );
});

app.post("/products", (request, response) => {
  db.query(
    `INSERT INTO product (${productTableColumns}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    [1, request.params.id],
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

app.post("/orders", (request, response) => {
  console.log("POST /orders");
  console.log(request.body);
  console.log(request.body.product_id);
  console.log(request.body.user_id);
  console.log(request.body.quantity);
  const sql = `INSERT INTO redemption_store.order (${orderTableColumns}) VALUES (${placeHolders(
    orderTableColumns,
  )})`;
  console.log(sql);
  db.query(
    sql,
    [
      request.body.product_id,
      request.body.user_id,
      request.body.coupon_code,
      request.body.quantity,
      request.body.in_store,
      request.body.date,
      request.body.ship_date,
      request.body.status,
      false,
    ],
    (error, results) => {
      if (error || results.affectedRows == 0) {
        console.log(error);
        response.status(400);
        response.send();
      } else {
        console.log(results);
        response.status(201);
        response.send(results);
      }
    },
  );
});

module.exports.handler = serverless(app);
