import Group from "../models/group.js";
import { asyncHandlerError, ErrInternalServer } from "../utils/error.js";
import { decode_jwt } from "../utils/auth.js"

const getAll = asyncHandlerError(async function (req, res, next) {
    const user_id = decode_jwt(req.cookies.jwt).data
    const groups = await Group.getAll(user_id)
    if (groups) {
        res.status(200).send(groups)
    } else throw ErrInternalServer
})

const getOne = asyncHandlerError(async function (req, res, next) {
    const { id } = req.params
    const user_id = decode_jwt(req.cookies.jwt).data
    const group = await Group.getOne(id, user_id)
    if (group) {
        res.status(200).send(group)
    } else throw ErrInternalServer
})

const create = asyncHandlerError(async function (req, res, next) {
    const { group_name } = req.body
    const user_id = decode_jwt(req.cookies.jwt).data
    const newGroup = await Group.createNew(group_name, user_id)
    if (newGroup) {
        res.status(201).send(newGroup._id)
    } else throw ErrInternalServer
})

const deleteGroup = asyncHandlerError(async function (req, res, next) {
    const { id } = req.params
    const user_id = decode_jwt(req.cookies.jwt).data
    const flag = await Group.deleteGroup(id, user_id)
    if (flag) {
        res.status(200).send("remove success")
    } else throw ErrInternalServer
})
const inviteMember = asyncHandlerError(async function (req, res, next) {
    const { group_id, user_id } = req.body
    const user_id_request = decode_jwt(req.cookies.jwt).data
    const groupInvite = await Group.invite(group_id, user_id, user_id_request)
    if (groupInvite) {
        res.status(200).send(groupInvite)
    } else throw ErrInternalServer
})
// member respone (accepted, rejected)
const memberRespone = asyncHandlerError(async function (req, res, next) {
    const { invite_id, state } = req.body
    const user_id = decode_jwt(req.cookies.jwt).data
    const flag = await Group.memberRespone(invite_id, user_id, state)
    if (flag) {
        res.status(200).send("respone success")
    } else throw ErrInternalServer
})
// remove must change state in groupInvite into remove
const removeMember = asyncHandlerError(async function (req, res, next) {
    const { group_id, user_id } = req.body
    const user_id_request = decode_jwt(req.cookies.jwt).data
    const flag = await Group.remove(group_id, user_id, user_id_request)
    if (flag) {
        res.status(200).send("remove success")
    } else throw ErrInternalServg(req.body)
})

export {
    getAll, getOne,
    create,
    deleteGroup,
    inviteMember, memberRespone, removeMember,
}