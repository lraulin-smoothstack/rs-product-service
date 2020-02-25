const mysql = require("mysql");
const {
  createProduct,
  createProductWithId,
  createValuesArray,
} = require("./util");

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: "redemption_store",
});

const columns =
  "name, description, category, department, photo_url, wholesale_price_cents, retail_price_cents, discountable, stock, deleted";
const columnsWithId = "id, " + columns;

module.exports.getProductById = (id = 0, done) => {
  pool.query(
    `SELECT ${columnsWithId} FROM product WHERE id = ?`,
    [id],
    (err, result, fields) => {
      if (err) done(err, null);
      done(null, result[0]);
    },
  );
};

module.exports.getProducts = done => {
  const sql = `SELECT ${columnsWithId} FROM product WHERE deleted = 0`;

  pool.query(sql, (err, result, fields) => {
    if (err) {
      console.log("SQL error");
      console.log(err);
      done(err, null);
    }
    console.log("GET PRODUCTS: ");
    console.log(result);
    done(null, result);
  });
};

module.exports.addProduct = (product = createProduct(), done) => {
  const values = createValuesArray(product);
  const sql = `INSERT INTO product (${columns}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  pool.query(sql, values, (err, result) => {
    if (err) done(err, null);
    done(null, result);
  });
};

module.exports.bulkAddProducts = (products = [], done) => {
  const sql = `INSERT INTO product (${columns}) VALUES ?`;
  const values = products.map(p => createValuesArray(p));
  pool.query(sql, [values], err => {
    if (err) done(err, null);
    done(null, result);
  });
};

module.exports.updateProduct = (product = createProductWithId(), done) => {
  const sql =
    "UPDATE product SET name = ?, description = ?, category = ?, department = ?, photo_url = ?, wholesale_price_cents = ?, retail_price_cents = ?, discountable = ?, stock = ?, deleted = ? WHERE id = ?";
  const values = [...createValuesArray(product), product.id];

  pool.query(sql, values, (err, result) => {
    if (err) done(err, null);
    done(null, result);
  });
};

module.exports.archiveProduct = (id = 0, done) => {
  const sql = "UPDATE product SET deleted = ? WHERE id = ?";
  const values = [true, id];

  pool.query(sql, values, (err, result) => {
    if (err) done(err, null);
    done(null, result);
  });
};
