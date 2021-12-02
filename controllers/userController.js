const User = require("../models/UserModel");

const CustomError = require("../utils/customError");
const cookieToken = require("../utils/cookieToken");
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

    // cookieToken(user, res);

    const token = user.getJwtToken();

    const options = {
        expores: new Date(
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
