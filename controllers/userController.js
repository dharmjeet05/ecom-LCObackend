const User = require("../models/UserModel");
const BigPromise = require("../middlewares/bigPromise");

const CustomError = require("../utils/customError");
const cookieToken = require("../utils/cookieToken");

// exports.signup = BigPromise(async (req, res, next) => {
//     // Grab all the details from request
//     const { name, email, password } = req.body;

//     if (!email) {
//         return next(new CustomError("Please send email", 400));
//     }
// });

exports.signup = async (req, res, next) => {
    try {
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

        cookieToken(user, res);
    } catch (error) {
        console.log(error);
    }
};
