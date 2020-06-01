// dotenv loads parameters (port and database config) from .env
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { check, validationResult } = require("express-validator");
const connection = require("./db");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// READ users:
app.get("/api/users", (req, res) => {
  const sql = "SELECT * FROM user";
  connection.query(sql, (err, results) => {
    if (err) {
      res.status(500).json({
        error: err.message,
        sql: err.sql,
      });
    } else {
      res.json(results);
    }
  });
});

// CREATE new user with POST with NO EXPRESS-VALIDATORS
/*
app.post('/api/users', (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(422).json({
      error: 'at least one of the required fields is missing',
    });
  }
  const emailRegex = /[a-z0-9._]+@[a-z0-9-]+\.[a-z]{2,3}/;
  if (!emailRegex.test(email)) {
    return res.status(422).json({
      error: 'Invalid email',
    });
  }

  if (password.length < 8) {
    return res.status(422).json({
      error: 'Password too short (8 characters min.)',
    });
  }

  connection.query('INSERT INTO user SET ?', req.body, (err, results) => {
    if (err) {
      res.status(500).json({
        error: err.message,
        sql: err.sql,
      });
    } else {
      res.status(200).json(results);
    }
  });
});
*/

// CREATE new user with POST with EXPRESS-VALIDATORS
// https://express-validator.github.io/docs/index.html#basic-guide
/*
app.post('/api/users', [
  // email must be valid
  check('email').isEmail(),
  // password must be at least 8 chars long
  check('password').isLength({ min: 8 }),
  // let's assume a name should be 2 chars long
  check('name').isLength({ min: 2 }),
],
(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  // send an SQL query to get all users
  return connection.query('INSERT INTO user SET ?', req.body, (err, results) => {
    if (err) {
      // If an error has occurred, then the client is informed of the error
      return res.status(500).json({
        error: err.message,
        sql: err.sql,
      });
    }
    // If everything went well, we send the result of the SQL query as JSON
    return res.json(results);
  });
});
*/

// CREATE new user with POST with EXPRESS-VALIDATORS && Return an adequate response
// https://express-validator.github.io/docs/index.html#basic-guide
const userValidationMiddlewares = [
  // email must be valid
  check("email").isEmail(),
  // password must be at least 8 chars long
  check("password").isLength({ min: 8 }),
  // let's assume a name should be 2 chars long
  check("name").isLength({ min: 2 }),
];

app.post("/api/users", userValidationMiddlewares, (req, res) => {
  const sql = "INSERT INTO user SET ?";
  const sqlValidation = "SELECT * FROM user WHERE id = ?";
  const formData = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  // send an SQL query to get all users
  return connection.query(sql, formData, (err, results) => {
    if (err) {
      // MySQL reports a duplicate entry -> 409 Conflict
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          error: "Email already exists",
        });
      }
      // If an error has occurred, then the client is informed of the error
      return res.status(500).json({
        error: err.message,
        sql: err.sql,
      });
    }
    // We use the insertId attribute of results to build the WHERE clause
    return connection.query(
      sqlValidation,
      results.insertId,
      (err2, records) => {
        if (err2) {
          return res.status(500).json({
            error: err2.message,
            sql: err2.sql,
          });
        }
        // If all went well, records is an array, from which we use the 1st item
        const insertedUser = records[0];
        // Extract all the fields *but* password as a new object (user)
        const { password, ...user } = insertedUser;
        // Get the host + port (localhost:3000) from the request headers
        const host = req.get("host");
        // Compute the full location, e.g. http://localhost:3000/api/users/132
        // This will help the client know where the new resource can be found!
        const location = `http://${host}${req.url}/${user.id}`;
        return res.status(201).set("Location", location).json(user);
      }
    );
  });
});

// Implementing the road in LUP;
app.put("/api/users/:id", userValidationMiddlewares, (req, res) => {
  const sql = "UPDATE user SET ? WHERE id = ?";
  const sqlValidation = "SELECT * FROM user WHERE id = ?";
  const idUser = req.params.id;
  const formData = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  return connection.query(sql, [formData, idUser], (err, results) => {
    if (err) {
      // If an error has occurred, then the client is informed of the error
      return res.status(500).json({
        error: err.message,
        sql: err.sql,
      });
    }
    return connection.query(sqlValidation, idUser, (err2, records) => {
      if (err2) {
        return res.status(500).json({
          error: err2.message,
          sql: err2.sql,
        });
      }
      // If all went well, records is an array, from which we use the 1st item
      const insertedUser = records[0];
      // Extract all the fields *but* password as a new object (user)
      const { password, ...user } = insertedUser;
      // Get the host + port (localhost:3000) from the request headers
      const host = req.get("host");
      // Compute the full location, e.g. http://localhost:3000/api/users/132
      // This will help the client know where the new resource can be found!
      const location = `http://${host}${req.url}/${user.id}`;
      // req.url = /api/users/1
      return res.status(200).set("Location", location).json(user);
    });
  });
});

app.listen(process.env.PORT, (err) => {
  if (err) {
    throw new Error("Something bad happened...");
  }
  console.log(`Server is listening on ${process.env.PORT}`);
});
