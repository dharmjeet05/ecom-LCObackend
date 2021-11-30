const User = require("../models/UserModel");

const CustomError = require("../utils/customError");
const cookieToken = require("../utils/cookieToken");
const bigPromise = require("../middlewares/bigPromise");

exports.signup = bigPromise(async (req, res, next) => {
    // Grab all the details from request
    const { name, email, password } = req.body;

    if (!email || !name || !password) {
        return next(
            new CustomError("Name, Email and Password are required", 400)
        );
    }

    const user = await User.create({
        name,
        email,
        password,
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
