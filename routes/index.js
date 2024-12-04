import { Router } from "express";
import userRoute from "./userRoute.js"
import groupRoute from "./groupRoute.js"
import noteRoute from "./noteRoute.js"

const route = Router()

route.use(userRoute)
route.use(groupRoute)
route.use(noteRoute)

export default route