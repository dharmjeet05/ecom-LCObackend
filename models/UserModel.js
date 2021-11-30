const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please provide a name"],
        maxlength: [40, "Name should be under 40 characters"],
    },
    email: {
        type: String,
        required: [true, "Please provide an email"],
        validate: [validator.isEmail, "Please enter email in correct format"],
        unique: true,
    },
    password: {
        type: String,
        required: [true, "Please provide a password"],
        minlength: [6, "Password should be atleast 6 char.."],
        select: false,
    },
    role: {
        type: String,
        default: "user",
    },
    photo: {
        id: {
            type: String,
            required: true,
        },
        secure_url: {
            type: String,
            required: true,
        },
    },
    forgotPasswordToken: {
        type: String,
    },
    forgotPasswordExpiry: {
        type: Date,
    },
    createAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("User", userSchema);