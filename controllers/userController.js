const User = require("../models/UserModel");

// utils
const CustomError = require("../utils/customError");

// middleware
const bigPromise = require("../middlewares/bigPromise");

const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary");

exports.signup = bigPromise(async (req, res, next) => {
    if (!req.files) {
        return next(new CustomError("photo is required for signup", 400));
    }

    // Grab all the details from request
    const { name, email, password } = req.body;

    if (!email || !name || !password) {
        return next(
            new CustomError("Name, Email and Password are required", 400)
        );
    }

    let file = req.files.photo;

    const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
        folder: "users",
        width: 150,
        crop: "scale",
    });

    const user = await User.create({
        name,
        email,
        password,
        photo: {
            id: result.public_id,
            secure_url: result.secure_url,
        },
    });

    const token = user.getJwtToken();

    const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_TIME * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    };

    user.password = undefined;

    res.status(200).cookie("token", token, options).json({
        success: true,
        token,
        user,
    });
});

exports.login = bigPromise(async (req, res, next) => {
    const { email, password } = req.body;

    // check for presence of email and password
    if (!email || !password) {
        return next(new CustomError("please provide email and password", 400));
    }

    // get user from DB
    const user = await User.findOne({ email }).select("+password");

    // check that user is exist on db or not
    if (!user) {
        return next(
            new CustomError("Email or password does not match or exist", 400)
        );
    }

    // check password is correct or not
    const isPasswordCorrect = await user.isValidPassword(password);
    if (!isPasswordCorrect) {
        return next(
            new CustomError("Email or password does not match or exist", 400)
        );
    }

    // provide token to the user
    const token = user.getJwtToken();

    const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_TIME * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    };

    user.password = undefined;

    res.status(200).cookie("token", token, options).json({
        success: true,
        token,
        user,
    });
});
