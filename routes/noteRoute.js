import { Router } from "express";
import * as noteController from "../controller/noteController.js"
const route = Router()
// create new note in group
route.post("/note", noteController.create)
// delete note
route.delete("/note", noteController.deleteNote)

route.post("/note/getAllGroupNote", noteController.getAllGroupNote)

route.put("/note", noteController.updateNote)

route.get("/note/:id", noteController.getOne)

export default route