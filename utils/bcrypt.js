import bcrypt from "bcrypt"

const hashPass = async (plainPass) => {
    const salt = await bcrypt.genSalt(10)  //round = 10
    const hashPass = await bcrypt.hash(plainPass, salt)
    return hashPass
}

const comparePass = (plainPass, hashPass) => {
    return bcrypt.compareSync(plainPass, hashPass)
}

export {
    hashPass, comparePass
}