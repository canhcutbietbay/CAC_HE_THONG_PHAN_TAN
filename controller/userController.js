import User from "../models/user.js";
import { asyncHandlerError, CustomError, ErrInternalServer } from "../utils/error.js";
import { createToken, decode_jwt } from "../utils/auth.js"
import groupInvite from "../models/groupInvite.js"
// time life jwt token
const maxAge = 24 * 60 * 60 * 7// 1 day

const login = asyncHandlerError(async function (req, res, next) {
    const { email, password } = req.body
    const user = await User.login(email, password)
    if (user) {
        const jwtToken = await createToken(user._id, maxAge)
        res.cookie('jwt', jwtToken, {
            path: "/",
            httpOnly: true,
            secure: true, // Bật true nếu dùng HTTPS
            sameSite: 'None',
            maxAge: 24 * 60 * 60 * 1000 * 7,
        })
        res.status(200).send("Login success")
    }
    else throw ErrInternalServer
})

const logout = asyncHandlerError(async function (req, res, next) {
    res.cookie('jwt', "", {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 1,
    })
    res.status(200).send("Logout success")
})

const signUp = asyncHandlerError(async function (req, res, next) {
    const { email, password } = req.body
    const user = await User.signup(email, password)
    if (user)
        res.send(user._id)
    else throw ErrInternalServer
})
// none state
const getAllInvited = asyncHandlerError(async function (req, res, next) {
    const user_id = decode_jwt(req.cookies.jwt).data
    const allInvited = await groupInvite.getAllInvited(user_id)
    if (allInvited) {
        res.status(200).send(allInvited)
    } else throw ErrInternalServer
})
// find user
const findUser = asyncHandlerError(async function (req, res, next) {
    const { email } = req.body
    const user = await User.findUser(email)
    if (user) {
        res.status(200).send(user)
    } else throw ErrInternalSe
})

export {
    login, logout, signUp, getAllInvited, findUser
}