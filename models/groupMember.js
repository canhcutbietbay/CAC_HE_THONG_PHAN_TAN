import mongoose from "mongoose";
import { CustomError } from "../utils/error.js";

const groupMemberSchema = new mongoose.Schema({
    group_id: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["admin", "member"], required: true }
});

groupMemberSchema.statics.addGroupMember = async function (groupId, userId, role) {
    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new CustomError("Invalid group_id or user_id", 400);
    }

    if (!["admin", "member"].includes(role)) {
        throw new CustomError("Invalid role. Allowed values are 'admin' or 'member'.", 400);
    }

    const existingMember = await this.exists({ group_id: groupId, user_id: userId });
    if (existingMember) {
        throw new CustomError("User is already a member of the group.", 400);
    }

    const newMember = await this.create({
        group_id: groupId,
        user_id: userId,
        role,
    });

    return newMember;
}

const GroupMember = mongoose.model("GroupMember", groupMemberSchema);
export default GroupMember;
