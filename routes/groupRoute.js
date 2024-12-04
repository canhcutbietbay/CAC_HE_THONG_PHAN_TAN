import { Router } from "express";
import * as groupController from "../controller/groupController.js"
import { requireAuth } from "../middleware/authMiddleware.js";

const route = Router()
// get all group by user (both joined and created)
route.get("/group", requireAuth, groupController.getAll)
//get 1
route.get("/group/:id", requireAuth, groupController.getOne)
//create new group
route.post("/group", requireAuth, groupController.create)
// delete group which user created
route.delete("/group/:id", requireAuth, groupController.deleteGroup)
// invite member
route.post("/group/invite", requireAuth, groupController.inviteMember)
// add member
route.post("/group/respone", requireAuth, groupController.memberRespone)

route.post("/group/remove", requireAuth, groupController.removeMember)

export default route