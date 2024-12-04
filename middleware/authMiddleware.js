import jwt from "jsonwebtoken"
import { ErrTokenInvalid } from "../utils/error.js"

const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt
    if (token) {
        jwt.verify(token, process.env.privateKey, (err, decode) => {
            if (err) {
                throw ErrTokenInvalid
            } else {
                next();
            }
        })
    }
    else throw ErrTokenInvalid
}

export {
    requireAuth
}