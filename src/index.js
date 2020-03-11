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

const statusCodes = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  NOT_ACCEPTABLE: 406,
};

const sendResponseWithJsonOrXml = ({ request, response, xmlRoot, payload }) => {
  const accept = accepts(request);

  switch (accept.type(["json", "xml"])) {
    case "json":
      response.setHeader("Content-Type", "application/json");
      response.status(statusCodes.OK);
      response.send(payload);
      break;
    case "xml":
      response.setHeader("Content-Type", "application/xml");
      response.status(statusCodes.OK);
      response.send(js2xmlparser.parse(xmlRoot, payload));
      break;
    default:
      response.status(statusCodes.NOT_ACCEPTABLE);
      response.send();
      break;
  }
};

const getUserFromEmailSql =
  "SELECT id, email, address, first_name, last_name, password, phone, role FROM user WHERE email = ?";

app.post("/login", (request, response) => {
  console.log("POST /login");
  console.log(request.body);
  console.log(request.email);
  db.query(getUserFromEmailSql, [request.body.email], (error, results) => {
    if (error) {
      console.log("Failed login attempt due to error:");
      console.log(error);
      response.status(statusCodes.UNAUTHORIZED);
      response.send(error);
    } else if (results.length == 0) {
      const message =
        "Failed login attempt: user " + request.body.email + " not found.";
      console.log(message);
      response.status(statusCodes.UNAUTHORIZED);
      response.send({ message });
    } else if (results[0].password != request.body.password) {
      const message =
        "Failed login attempt: Incorrect password for user " +
        request.body.email;
      response.status(statusCodes.UNAUTHORIZED);
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
  });
});

app.post("/register", (request, response) => {
  const { email, password } = request.body;
  const roles = {
    CUSTOMER: 1,
    CLERK: 2,
    ACCOUNTANT: 3,
    ADMIN: 4,
  };
  const deleted = {
    FALSE: 0,
    TRUE: 1,
  };

  // First check to make sure email is not already registered
  db.query(getUserFromEmailSql, [email], (error, checkEmailResults) => {
    if (error) {
      response.status(statusCodes.UNAUTHORIZED);
      response.send(error);
      return;
    }
    if (Array.isArray(checkEmailResults) && checkEmailResults[0]) {
      const message = `Email '${email}' is already registered!`;
      console.log(message);
      response.status(statusCodes.BAD_REQUEST);
      response.send(message);
      return;
    }

    // Email doesn't exist; insert new user
    const insertUserSql =
      "INSERT INTO user (email, password, role, deleted) VALUES (?, ?, ?, ?)";
    db.query(
      insertUserSql,
      [email, password, roles.CUSTOMER, deleted.TRUE],
      (error, insertResults) => {
        if (error) {
          console.log(error);
          return;
        }
        if (insertResults.affectedRows === 0) {
          response.status(statusCodes.BAD_REQUEST);
          response.send(error);
          return;
        }

        // Get and return details from newly created user
        db.query(getUserFromEmailSql, [email], (error, selectResults) => {
          if (error) {
            console.log(error);
          }
          if (!Array.isArray(selectResults) || !selectResults[0]) {
            const message = "Newly registered user not found in database!";
            console.log(message);
            response.status(status.BAD_REQUEST);
            response.send(message);
          }

          const token = jwt.sign(
            {
              email: email,
              role: selectResults[0].role,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" },
          );

          delete selectResults[0].password;
          const payload = {
            ...selectResults[0],
            jwt: token,
          };

          sendResponseWithJsonOrXml({
            request,
            response,
            xmlRoot: "user",
            payload,
          });
        });
      },
    );
  });
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
        response.status(statusCodes.NOT_FOUND);
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
  const { id } = request.params;
  db.query("SELECT * FROM product where id = ?", [id], (error, results) => {
    if (error || results.length == 0) {
      response.status(statusCodes.NOT_FOUND);
      response.send(error || { message: `Product with id ${id}` });
    } else {
      sendResponseWithJsonOrXml({
        request,
        response,
        xmlRoot: "products",
        payload: results,
      });
    }
  });
});

app.post("/products", (request, response) => {
  db.query(
    `INSERT INTO product (${productTableColumns}) VALUES (${placeHolders(
      productTableColumns,
    )})`,
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
        response.status(statusCodes.BAD_REQUEST);
        response.send(error);
      } else {
        response.status(statusCodes.OK);
        response.send(results);
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
      response.status(statusCodes.BAD_REQUEST);
      response.send(error);
    } else {
      response.status(statusCodes.OK);
      response.send(results);
    }
  });
});

app.delete("/products/:id", (request, response) => {
  db.query(
    "UPDATE product SET deleted = ? WHERE id = ?",
    [1, request.params.id],
    (error, results) => {
      if (error || results.affectedRows == 0) {
        response.status(statusCodes.BAD_REQUEST);
        response.send(error);
      } else {
        response.status(statusCodes.OK);
        response.send(results);
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

const tokenRxResult = t =>
  /[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/.exec(t);

const getToken = authorizationToken =>
  tokenRxResult(authorizationToken) && tokenRxResult(authorizationToken)[0];

app.put("/users/:id", (request, response) => {
  const { id } = request.params;
  const { email, address, first_name, last_name, phone } = request.body;
  const token = getToken(request.headers.authorization);

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const tokenEmail = decoded.email;

  if (email !== tokenEmail) {
    response.status(statusCodes.UNAUTHORIZED);
    response.send({ message: "Email does not match authorization token." });
    return;
  }

  const sql =
    "UPDATE user SET address = ?, first_name = ?, last_name = ?, phone = ? WHERE id = ?";
  const values = [email, address, first_name, last_name, phone, id];

  db.query(sql, values, (error, results) => {
    if (error || results.affectedRows == 0) {
      response.status(statusCodes.BAD_REQUEST);
      response.send(error);
    } else {
      response.status(statusCodes.OK);
      response.send(results);
    }
  });
});

module.exports.handler = serverless(app);
