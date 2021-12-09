const User = require("../models/UserModel");

// utils
const CustomError = require("../utils/customError");
const mailHelper = require("../utils/emailHelper");

// middleware
const bigPromise = require("../middlewares/bigPromise");

const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary");
const crypto = require("crypto");

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

exports.logout = bigPromise(async (req, res, next) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });

    res.status(200).json({
        success: true,
        message: "Logout success",
    });
});

exports.forgotPassword = bigPromise(async (req, res, next) => {
    // collect email
    const { email } = req.body;

    // find user in database
    const user = await User.findOne({ email });

    // if user not found in database
    if (!user) {
        return next(new CustomError("Email not found as registered", 400));
    }

    // get token from user model methods
    const forgotToken = user.getForgotPasswordToken();

    // save user fields in DB
    await user.save({ validateBeforeSave: false });

    // create a URL
    const myUrl = `${req.protocol}://${req.get(
        "host"
    )}/api/v1/password/reset/${forgotToken}`;

    // craft a message
    const message = `Copy paste this link in your URL and hit enter \n\n ${myUrl}`;

    // attempt to send email
    try {
        await mailHelper({
            email: user.email,
            subject: "Ecom - Password reset email",
            message,
        });

        // json response if email is success
        res.status(200).json({
            success: true,
            message: "Email sent successfully",
        });
    } catch (error) {
        // reset user fields if things goes wrong
        user.forgotPasswordToken = undefined;
        user.forgotPasswordExpiry = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new CustomError(error.message, 500));
    }
});

exports.passwordReset = bigPromise(async (req, res, next) => {
    // grab the token
    const token = req.params.token;

    // convert token into encryToken
    const encryToken = crypto.createHash("sha256").update(token).digest("hex");

    // grab user by encryToken
    const user = await User.findOne({
        encryToken,
        forgotPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
        return next(new CustomError("Token is invalid or expired", 400));
    }

    // check password and confirm password are same
    if (req.body.password !== req.body.confirmPassword) {
        return next(
            new CustomError("Password and confirm password do not match", 400)
        );
    }

    // set password field to new password
    user.password = req.body.password;

    // set token and expiry are undefined
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    // save user
    await user.save();

    // send a JSON response OR send token
    const jwttoken = user.getJwtToken();

    const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_TIME * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    };

    user.password = undefined;

    res.status(200).cookie("token", token, options).json({
        success: true,
        jwttoken,
        user,
    });
});

exports.getLoggedInUserDetails = bigPromise(async (req, res, next) => {
    // grab the user
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        user,
    });
});
