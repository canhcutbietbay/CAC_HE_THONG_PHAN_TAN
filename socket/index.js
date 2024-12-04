import { Server } from 'socket.io';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import handler from './handler.js';
import User from "../models/user.js"

export const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: ['https://192.168.136.231:5173', 'https://26.200.221.212:4000', "https://26.183.233.145:5173", "https://26.183.233.145:4000"],
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    // Middleware xác thực JWT từ cookie
    io.use(async (socket, next) => {
        try {
            // console.log(socket.handshake.headers.cookie)
            const cookies = cookie.parse(socket.handshake.headers.cookie || '');
            const token = cookies.jwt; // Lấy JWT từ cookie có tên "jwt"
            if (!token) {
                throw new Error('Authentication token not found');
            }
            const userID = jwt.verify(token, process.env.privateKey);
            const user = await User.findById({ _id: userID.data })
            socket.user = {
                id: user._id,
                email: user.email
            };
            next();
        } catch (err) {
            console.error('Authentication error:', err.message);
            next(new Error('Authentication failed'));
        }
    });
    let rooms = new Map()

    // Gắn các handlers khi kết nối
    io.on('connection', (socket) => {
        handler(io, socket, rooms); // Định nghĩa logic tại đây
    });

    console.log('Socket.IO initialized');
    return io;
};
