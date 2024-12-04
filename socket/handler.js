const handler = (io, socket, rooms) => {
    console.log(`User connected: ${socket.id}`);
    // Chuyển tiếp tin nhắn giữa các client
    socket.on("joinRoom", (data, callback) => {
        console.log(`User ${socket.id} want join room ${data.group_id}`)
        socket.join(data.group_id)
        console.log(`User ${socket.id} join room ${data.group_id} success`)
        const clients = io.sockets.adapter.rooms.get(data.group_id)
        console.log(`Room ${data.group_id} has ${clients.size} user`)
        if (!rooms.has(data.group_id)) rooms.set(data.group_id, { queue: [], max: -1, member: [] })
        let { queue, max, member } = rooms.get(data.group_id)
        member.push({
            socketID: socket.id,
            user: socket.user
        })
        max = max + 1
        const newValue = {
            queue: queue, max: max, member: member
        }
        io.to(data.group_id).emit("roomStatus", member)
        console.log(member)
        rooms.set(data.group_id, newValue)
        console.log()
        console.log("-----------------------------------")
        callback({
            id: rooms.get(data.group_id).max, socketID: socket.id,
            user: socket.user // user from cookie
        })
    });
    socket.on("message", (data) => {
        try {
            console.log(data)
            let { queue, max, member } = rooms.get(data.group_id)
            let newValue = {}
            switch (data.type) {
                case "REQUEST":
                    queue.push(data)
                    newValue = { queue: queue, max: max, member: member }
                    rooms.set(data.group_id, newValue)
                    socket.broadcast.to(data.group_id).emit("message", data)
                    io.emit("dashboard", Array.from(rooms))
                    break;
                case "REPLY":
                    io.to(data.to).emit("message", data)
                    // queue.push(data)
                    // newValue = { queue: queue, max: max, member: member }
                    // rooms.set(data.group_id, newValue)
                    // io.emit("dashboard", Array.from(rooms))
                    break;
                case "RELEASE":
                    socket.broadcast.to(data.group_id).emit("message", data)
                    // queue = queue.filter(temp => temp.id != data.id)
                    queue.push(data)
                    newValue = { queue: queue, max: max, member: member }
                    rooms.set(data.group_id, newValue)
                    io.emit("dashboard", Array.from(rooms))
                    break
                case "ENTER":
                    queue.push(data)
                    newValue = { queue: queue, max: max, member: member }
                    rooms.set(data.group_id, newValue)
                    io.emit("dashboard", Array.from(rooms))
                    break
                default: break
            }
        } catch (error) {
            console.log(error)
            throw new Error("Error");
        }

    })
    socket.on("leaveRoom", (data) => {
        console.log(`User ${socket.id} leave room ${data.group_id} success`)
        socket.leave(data.group_id)
        console.log("-----------------------------------")
        io.to(data.room_id).emit("userLeaverRoom", socket.id)
        rooms.forEach(room => {
            let currentMember = room.member
            currentMember = currentMember.filter(member => member.socketID != socket.id)
            room.member = currentMember
            // let currentQueue = room.queue
            // currentQueue = currentQueue.filter(data => data.from != socket.id)
        })
        io.emit("dashboard", Array.from(rooms))
    });
    // Xử lý sự kiện ngắt kết nối
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        console.log("-----------------------------------")
        io.emit("userLeave", socket.id)
        rooms.forEach(room => {
            let currentMember = room.member
            currentMember = currentMember.filter(member => member.socketID != socket.id)
            room.member = currentMember
            // let currentQueue = room.queue
            // currentQueue = currentQueue.filter(data => data.from != socket.id)
            // console.log(currentQueue)
        })
        io.emit("dashboard", Array.from(rooms))
    });
    // on error
    socket.on("connect_error", (err) => {
        console.log(`connect_error due to ${err.message}`);
        console.log("-----------------------------------")
    });
};

export default handler