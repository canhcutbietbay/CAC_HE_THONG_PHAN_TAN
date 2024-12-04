// import bcrypt from "bcrypt"
import validator from 'validator'
import mongoose from "mongoose";
import * as bcrypt from "../utils/bcrypt.js"
import { CustomError } from "../utils/error.js";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Please enter an email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlength: [6, 'Minimum password length is 6 characters'],
    },
});

// fire a function before doc saved to db
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hashPass(this.password);
    next();
});

// static method to login user
userSchema.statics.login = async function (email, password) {
    const user = await this.findOne({ email });
    if (!user) {
        throw new CustomError('Email not found', 404);
    }
    const isMatch = await bcrypt.comparePass(password, user.password);
    if (!isMatch) {
        throw new CustomError('Incorrect password', 401);
    }

    return user;
};
userSchema.statics.signup = async function (email, password) {
    if (!validator.isEmail(email)) {
        throw new CustomError('Invalid email format', 400);
    }
    if (!validator.isLength(password, { min: 6 })) {
        throw new CustomError('Password must be at least 6 characters long', 400);
    }
    const existingUser = await this.exists({ email });
    if (existingUser) {
        throw new CustomError('Email already exists', 400);
    }
    try {
        const newUser = await this.create({ email, password });
        return newUser;
    } catch (err) {
        throw new CustomError('Error creating user', 500);
    }
};

userSchema.statics.findUser = async function (email) {
    if (!validator.isEmail(email)) {
        throw new CustomError('Invalid email format', 400);
    }
    const user = await this.findOne({ email: email })
    if (user)
        return {
            _id: user._id,
            email: user.email
        }
    else throw new CustomError("Email not match any user", 400)
}

const User = mongoose.model('User', userSchema);
export default User