const express = require("express");
require("dotenv").config();

const app = express();

// routes
const homeRoute = require("./routes/homeRoute");

// router middleware
app.use(`/api/${process.env.VERSION}`, homeRoute);

// export app js
module.exports = app;
