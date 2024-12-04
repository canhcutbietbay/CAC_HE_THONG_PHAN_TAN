import jwt from "jsonwebtoken"

//decode jwt
const decode_jwt = jwtString => {
    return jwt.verify(jwtString, process.env.privateKey)
}

// hash pass
const hashPass = async (plainPass) => {
    const salt = await bcrypt.genSalt(10)  //round = 10
    const hashPass = await bcrypt.hash(plainPass, salt)
    return hashPass
}

// create new jwt token
const createToken = (data, maxAge) => {
    return jwt.sign({ data }, process.env.privateKey, {
        expiresIn: maxAge
    })
}

export {
    decode_jwt, hashPass, createToken
}