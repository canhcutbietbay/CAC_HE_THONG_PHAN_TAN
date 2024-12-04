import mongoose from "mongoose";
import Group from "./group.js";
import { CustomError } from "../utils/error.js";
import GroupMember from "./groupMember.js";

const noteSchema = new mongoose.Schema({
    group_id: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    content: { type: String, required: true },
    last_modified_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});

noteSchema.statics.createNew = async function (group_id, content, user_id) {
    if (!mongoose.Types.ObjectId.isValid(group_id)) {
        throw new CustomError("Invalid Group ID", 400)
    }
    const existsGroup = await Group.exists({ _id: group_id })
    if (existsGroup == null)
        throw new CustomError("Not found group", 404)
    const existingMember = await GroupMember.findOne({ group_id: group_id, user_id: user_id })
    if (existingMember == null)
        throw new CustomError("You are not member in this group", 400)
    if (existingMember.role == "admin") {
        return this.create({ group_id: group_id, content: content, last_modified_by: user_id })
    } else throw new CustomError("Only admin can do this", 400)
}

noteSchema.statics.deleteNote = async function (note_id, user_id) {
    if (!mongoose.Types.ObjectId.isValid(note_id)) {
        throw new CustomError("Invalid Note ID", 400)
    }
    const existsNote = await this.findOne({ _id: note_id })
    if (existsNote == null)
        throw new CustomError("Not found note", 404)
    const existingMember = await GroupMember.findOne({ group_id: existsNote.group_id, user_id: user_id })
    if (existingMember == null)
        throw new CustomError("You are not member in this group", 400)
    if (existingMember.role == "admin") {
        await this.findByIdAndDelete({ _id: note_id })
        return true
    } else throw new CustomError("Only admin can do this", 400)
}

noteSchema.statics.getAllGroupNote = async function (group_id, user_id) {
    if (!mongoose.Types.ObjectId.isValid(group_id)) {
        throw new CustomError("Invalid Group ID", 400)
    }
    const existsGroup = await Group.exists({ _id: group_id })
    if (existsGroup == null)
        throw new CustomError("Not found group", 404)
    const existingMember = await GroupMember.exists({ group_id: group_id, user_id: user_id })
    if (existingMember == null)
        throw new CustomError("You are not member in this group", 400)
    else {
        return this.aggregate([
            {
                $match: {
                    group_id: new mongoose.Types.ObjectId(group_id),
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "last_modified_by",
                    foreignField: "_id",
                    as: "user_details",
                },
            },
            {
                $unwind: "$user_details",                   // Tách mảng members thành các phần tử riêng biệt
            },
            {
                $project: {
                    "user_details.password": 0,
                },
            },
        ])
    }
}

noteSchema.statics.updateNote = async function (note_id, content, user_id) {
    if (!mongoose.Types.ObjectId.isValid(note_id))
        throw new CustomError("Invalid Note ID", 400)
    if (!content)
        throw new CustomError("Missing Content", 400)
    const existsNote = await this.findOne({ _id: note_id })
    if (existsNote == null)
        throw new CustomError("Not found note", 404)
    else {
        const existingMember = await GroupMember.exists({ group_id: existsNote.group_id, user_id: user_id })
        if (existingMember == null)
            throw new CustomError("You are not member in this group", 400)
        else
            return this.findByIdAndUpdate({ _id: note_id }, { content: content, last_modified_by: user_id })
    }
}

noteSchema.statics.getOne = async function (id, user_id) {
    if (!mongoose.Types.ObjectId.isValid(id))
        throw new CustomError("Invalid Note ID", 400)
    const existsNote = await this.findOne({ _id: id })
    if (existsNote == null)
        throw new CustomError("Not found note", 404)
    else {
        const existingMember = await GroupMember.exists({ group_id: existsNote.group_id, user_id: user_id })
        if (existingMember == null)
            throw new CustomError("You are not member in this group", 400)
        else
            return this.findById({ _id: id })
    }
}

const Note = mongoose.model("Note", noteSchema);
export default Note;
