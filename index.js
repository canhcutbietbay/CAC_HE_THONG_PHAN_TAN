import express from "express"
import route from './routes/index.js'
import https from 'https';
import http from 'http';
import fs from 'fs';
import cors from "cors"
import mongoose from "mongoose";
import logger from './middleware/logger.js'
// import morgan from "morgan"

import { ErrNotFound } from './utils/error.js'
import cookieParser from 'cookie-parser'
import { initSocket } from './socket/index.js';
import { createToken } from "./utils/auth.js"

const options = {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem'),
};

const PORT = process.env.PORT || 3000
const app = express()
const server = https.createServer(options, app);
// const server = http.createServer(app);
const corsOptions = {
    origin: ['https://192.168.136.231:5173', 'https://26.200.221.212:4000', "https://26.183.233.145:5173", "https://26.183.233.145:4000/"],
    // frontend origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Liệt kê các phương thức cần dùng
    allowedHeaders: ['Content-Type', 'Authorization'], // Liệt kê các header cần dùng
    credentials: true // Nếu bạn đang sử dụng cookies         // Allows credentials (cookies, authorization headers, etc.)
};
// middleware
// app.use(morgan('dev'))
app.use(logger);
app.use(express.json());
app.use(cookieParser())
app.use(cors(corsOptions))


// database connection
const dbURI = process.env.DBURL
mongoose.connect(dbURI)
    .then((result) => server.listen(PORT, function () {
        console.log("App listen on port:", PORT)
    }))
    .catch((err) => console.log(err));

//route
app.use("/api", route)

app.get("/", async (req, res) => {
    res.send("hello world")
})

app.get("/cookie", async (req, res) => {
    id = "674584f05e2ed56d68f21a7b"
    const maxAge = 24 * 60 * 60 * 7//
    const jwtToken = await createToken(id, maxAge)
    res.cookie('jwt', jwtToken, {
        path: "/",
        httpOnly: true,
        secure: true, // Bật true nếu dùng HTTPS
        sameSite: 'None',
        maxAge: 24 * 60 * 60 * 1000 * 7,
    })
    res.status(200).send("Login success")
    res.send("hello world")
})

app.use((req, res, next) => {
    next(ErrNotFound);
});

//Error handler
app.use((err, req, res, next) => {
    res.status(err.statusCode || 500);
    res.send({
        error: {
            status: err.statusCode || 500,
            message: err.message
        }
    });
});

const io = initSocket(server);