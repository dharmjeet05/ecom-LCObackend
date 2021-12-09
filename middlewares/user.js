const User = require("../models/UserModel");

// utils
const CustomError = require("../utils/customError");

// middleware
const bigPromise = require("../middlewares/bigPromise");

// packages
const jwt = require("jsonwebtoken");

exports.isLoggedIn = bigPromise(async (req, res, next) => {
    // grab the token
    const token =
        req.cookies.token || req.header("Authorization").replace("Bearer ", "");

    if (!token) {
        return next(new CustomError("Login first to access this page", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    next();
});
