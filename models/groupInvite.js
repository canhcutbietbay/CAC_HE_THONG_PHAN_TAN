import mongoose from "mongoose";
import { CustomError, ErrInternalServer } from "../utils/error.js";

const groupInviteSchema = new mongoose.Schema({
    group_id: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    inviting_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    invited_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    invite_time: { type: Date, default: Date.now },
    state: { type: String, enum: ["accepted", "rejected", "none"], default: "none", required: true }
});

groupInviteSchema.statics.createNew = async function (group_id, inviting_user_id, invited_user_id) {
    const existsInvite = await this.exists({ group_id, invited_user_id, state: "none" })
    if (existsInvite) throw new CustomError("User already invited", 400)
    const existsACcepted = await this.exists({ group_id, invited_user_id, state: "accepted" })
    if (existsACcepted) throw new CustomError("User already accepted", 400)
    try {
        const newInvite = await this.create({ group_id, inviting_user_id, invited_user_id })
        return newInvite
    } catch (error) {
        throw ErrInternalServer
    }
}
groupInviteSchema.statics.getAllInvited = async function (invited_user_id) {
    return this.aggregate([
        {
            $match: {
                invited_user_id: new mongoose.Types.ObjectId(invited_user_id),
                state: "none"
            },
        },
        {
            $lookup: {
                from: "groups",
                localField: "group_id",
                foreignField: "_id",
                as: "group_details",
            },
        },
        {
            $unwind: "$group_details",                   // Tách mảng members thành các phần tử riêng biệt
        },
        {
            $lookup: {
                from: "users",
                localField: "inviting_user_id",
                foreignField: "_id",
                as: "user_invite",
            },
        },
        {
            $unwind: "$user_invite",                   // Tách mảng members thành các phần tử riêng biệt
        },
        {
            $project: {
                "user_invite.password": 0,      // Lấy email từ user_details
            },
        },
    ])
}
const GroupInvite = mongoose.model("GroupInvite", groupInviteSchema);
export default GroupInvite;
