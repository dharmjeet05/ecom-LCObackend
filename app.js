require("dotenv").config();

const express = require("express");
const app = express();

// Packages
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");

// for swagger documentation
const swaggerUi = require("swagger-ui-express");
const yaml = require("yamljs");
const swaggerDocument = yaml.load("./swagger.yaml");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// regular middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// cookies and file upload middlewares
app.use(cookieParser());
app.use(fileUpload());

// morgan middlewares
app.use(morgan("tiny"));

// routes
const homeRoute = require("./routes/homeRoute");
const userRoute = require("./routes/userRoute");

app.use(`/api/${process.env.VERSION}`, homeRoute);
app.use(`/api/${process.env.VERSION}`, userRoute);

// export app js
module.exports = app;
