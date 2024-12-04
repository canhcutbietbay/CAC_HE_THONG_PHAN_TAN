import mongoose from "mongoose";
import { CustomError, ErrInternalServer } from "../utils/error.js";
import GroupMember from "./groupMember.js";
import GroupInvite from "./groupInvite.js";
import Note from "./note.js";

const groupSchema = new mongoose.Schema({
    group_name: { type: String, required: true, unique: true, }
});

groupSchema.statics.getAll = async function (user_id) {
    return GroupMember.find({ user_id: user_id })
}

groupSchema.statics.createNew = async function (groupName, userId) {
    const existsGroup = await this.exists({ group_name: groupName })
    if (existsGroup == null) {
        try {
            const newGroup = await this.create({ group_name: groupName })
            await GroupMember.addGroupMember(newGroup._id, userId, "admin")
            await GroupInvite.create({ group_id: newGroup._id, inviting_user_id: userId, invited_user_id: userId, state: "accepted" })
            return newGroup
        } catch (error) {
            this.findByIdAndDelete(newGroup._id)
            throw ErrInternalServer
        }
    } else throw new CustomError("Group name already exists", 400)
}

groupSchema.statics.getOne = async function (id, userId) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new CustomError("Invalid Group ID", 400)
    }
    const group = await this.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(id) }, // Tìm nhóm theo groupId
        },
        {
            $lookup: {
                from: "groupmembers",               // Kết hợp với collection GroupMember
                localField: "_id",                   // Trường group_id trong collection Group
                foreignField: "group_id",            // Trường group_id trong collection GroupMember
                as: "members",                      // Kết quả sẽ được lưu vào trường "members"
            },
        },
        {
            $unwind: "$members",                   // Tách mảng members thành các phần tử riêng biệt
        },
        {
            $lookup: {
                from: "users",                       // Kết hợp với collection User
                localField: "members.user_id",       // Trường user_id trong GroupMember
                foreignField: "_id",                 // Trường _id trong collection User
                as: "members.user_details",          // Kết quả sẽ được lưu vào trường "user_details"
            },
        },
        {
            $unwind: "$members.user_details",      // Giải nén user_details
        },

        {
            $project: {                            // Lọc và chỉ chọn các trường cần thiết
                group_name: 1,
                "members.role": 1,
                "members.user_details._id": 1,      // Lấy email từ user_details
                "members.user_details.email": 1,      // Lấy email từ user_details
            },
        },
        {
            $group: {
                _id: "$_id",                         // Nhóm lại theo _id của group
                group_name: { $first: "$group_name" }, // Lấy tên nhóm
                members: {
                    $push: {                 // Đẩy các thành viên vào mảng
                        _id: "$members.user_details._id",
                        email: "$members.user_details.email", // Lấy email
                        role: "$members.role",               // Lấy role
                    }
                },
            },
        },
    ]);

    if (group) {
        const existingMember = await GroupMember.exists({ group_id: id, user_id: userId });
        if (existingMember)
            return group
        else throw new CustomError("Only member in this group can see get it", 400)
    }
    else throw new CustomError("Not found group", 404)
}

groupSchema.statics.deleteGroup = async function (id, userId) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new CustomError("Invalid Group ID", 400)
    }
    const group = await this.findById({ _id: id })
    if (group) {
        const existingMember = await GroupMember.findOne({ group_id: id, user_id: userId });
        if (existingMember == null) throw new CustomError("You are not a member", 400)
        if (existingMember.role == "admin") {
            try {
                await this.findByIdAndDelete(id)
                await GroupMember.deleteMany({ group_id: id })
                await GroupInvite.deleteMany({ group_id: id })
                await Note.deleteMany({ group_id: id })
                return true
            } catch (error) {
                throw ErrInternalServer
            }
        } else throw new CustomError("Only group admin can do this", 400)
    }
    else throw new CustomError("Not found group", 404)
}

groupSchema.statics.invite = async function (group_id, user_id, user_id_request) {
    if (!mongoose.Types.ObjectId.isValid(group_id)) {
        throw new CustomError("Invalid Group ID", 400)
    }
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
        throw new CustomError("Invalid User ID", 400)
    }
    const existsGroup = await this.exists({ _id: group_id })
    if (existsGroup === null) throw new CustomError("Not found group", 404)
    const existingGroupMember = await GroupMember.exists({ group_id: group_id, user_id: user_id_request })
    if (existingGroupMember === null) throw new CustomError("You are not member in this group", 400)
    const newInvite = await GroupInvite.createNew(group_id, user_id_request, user_id)
    return newInvite
}

groupSchema.statics.memberRespone = async function (invite_id, user_id, state) {
    if (!mongoose.Types.ObjectId.isValid(invite_id))
        throw new CustomError("Invalid Invite ID", 400)
    if (!["accepted", "rejected"].includes(state))
        throw new CustomError("Invalid State", 400)
    const existsInviting = await GroupInvite.exists({ _id: invite_id, invited_user_id: user_id, state: "none" })
    if (existsInviting === null)
        throw new CustomError("Not invite you", 400)
    try {
        const respone = await GroupInvite.findByIdAndUpdate({ _id: invite_id }, { state: state })
        if (state == "accepted")
            await GroupMember.addGroupMember(respone.group_id, user_id, "member")
        return true
    } catch (error) {
        throw ErrInternalServer
    }
}

groupSchema.statics.remove = async function (group_id, user_id, user_id_request) {
    if (!mongoose.Types.ObjectId.isValid(group_id))
        throw new CustomError("Invalid Group ID", 400)
    if (!mongoose.Types.ObjectId.isValid(user_id))
        throw new CustomError("Invalid User ID", 400)
    const existsGroup = await Group.exists({ _id: group_id })
    if (existsGroup == null)
        throw new CustomError("Not found group", 404)
    const existingMember = await GroupMember.findOne({ group_id: group_id, user_id: user_id_request })
    if (existingMember == null)
        throw new CustomError("You are not member in this group", 400)
    if (existingMember.role == "admin") {
        if (user_id === user_id_request)
            throw new CustomError("You can't remove you self, try delete group", 400)
        const existsMember = await GroupMember.exists({ group_id: group_id, user_id: user_id })
        if (existsMember) {
            await GroupMember.findByIdAndDelete(existsMember._id)
            await GroupInvite.updateOne({ group_id: group_id, invited_user_id: user_id, state: "accepted" }, { state: "removed" })
            return true
        } else throw new CustomError("User not in group", 400)
    } else throw new CustomError("Only admin can do this", 400)
}
const Group = mongoose.model("Group", groupSchema);
export default Group;