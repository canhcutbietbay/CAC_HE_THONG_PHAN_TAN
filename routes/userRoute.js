import { Router } from "express";
import * as userController from "../controller/userController.js"
const route = Router()

route.post("/login", userController.login)

route.post("/signup", userController.signUp)

route.get("/logout", userController.logout)
// get all invited with none state
route.get("/allInvited", userController.getAllInvited)
// find user with id
route.post("/findUser", userController.findUser)
export default route