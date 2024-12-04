import { asyncHandlerError, ErrInternalServer } from "../utils/error.js";
import Note from "../models/note.js";
import { decode_jwt } from "../utils/auth.js"

const create = asyncHandlerError(async function (req, res, next) {
    const { group_id, content } = req.body
    const user_id = decode_jwt(req.cookies.jwt).data
    const note = await Note.createNew(group_id, content, user_id)
    if (note)
        res.status(201).send(note)
    else throw ErrInternalServer
})

const deleteNote = asyncHandlerError(async function (req, res, next) {
    const { note_id } = req.body
    const user_id = decode_jwt(req.cookies.jwt).data
    const note = await Note.deleteNote(note_id, user_id)
    if (note)
        res.status(200).send("delete success")
    else throw ErrInternalServer
})

const getAllGroupNote = asyncHandlerError(async function (req, res, next) {
    const { group_id } = req.body
    const user_id = decode_jwt(req.cookies.jwt).data
    const notes = await Note.getAllGroupNote(group_id, user_id)
    if (notes)
        res.status(200).send(notes)
    else throw ErrInternalServer
})

const updateNote = asyncHandlerError(async function (req, res, next) {
    const { note_id, content } = req.body
    const user_id = decode_jwt(req.cookies.jwt).data
    const flag = await Note.updateNote(note_id, content, user_id)
    if (flag)
        res.status(200).send("update success")
    else throw ErrInternalServer
})
const getOne = asyncHandlerError(async function (req, res, next) {
    const { id } = req.params
    const user_id = decode_jwt(req.cookies.jwt).data
    const note = await Note.getOne(id, user_id)
    if (note)
        res.status(200).send(note)
    else throw ErrInternalServer
})
export {
    create, deleteNote,
    getAllGroupNote, updateNote, getOne,

}
