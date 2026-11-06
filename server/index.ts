import express from "express"
import { initDb } from "./database/database.js";
import { User } from "./database/models/User.js";
import { Op } from "sequelize";
import { compare, genSalt, hash } from "bcrypt-ts";
import dotenv from "dotenv";
import jwt, { type JwtPayload, type VerifyErrors } from "jsonwebtoken";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import type { InterServerEvents, SocketData } from "./interfaces.js";
import type { ClientToServerEvents, Room, ServerToClientEvents } from "./../shared/interfaces.js"
import cors from "cors";
import genUniqueLobbyCode from "./functions/genLobbyCode.js";

const app = express();
dotenv.config();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
await initDb();
app.use(express.json());
app.use(cors())
const httpServer = createServer(app);
const rooms = new Map<string, Room>();
const userRoomIndex = new Map<string, string>();

app.post("/register", async (req, res) => {
    let message = "Something went wrong with the server. We are sorry.";
    try {

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            message = "Bad request.";
            throw new Error("Some params are missing.");
        }

        if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
            message = "Bad request.";
            throw new Error("Some params are the wrong type.");
        }


        const existsEmail = await User.findOne({
            where: {
                email: email,
            }
        })

        if (existsEmail !== null) {
            message = "Someone with this email already exists.";
            throw new Error("Someone with this email already exists.")
        }

        const existsName = await User.findOne({
            where: {
                name: name,
            }
        })


        if (existsName !== null) {
            message = "This username is taken.";
            throw new Error("Someone with this username already exists.")
        }


        const salt = await genSalt(10);
        const hashed = await hash(password, salt);

        await User.create({
            name: name,
            email: email,
            password: hashed,
        })

        res.status(201).json({
            success: true,
            message: "New user created successfully."
        })

    } catch (e) {
        console.log((e as Error).message);
        res.status(400).json({
            success: false,
            message: message,
        })
    }
})

app.post("/login", async (req, res) => {

    let message = "Something went wrong with the server. We are sorry.";

    try {
        const { login, password } = req.body;

        if (!login || !password) {
            message = "Bad request.";
            throw new Error("Some params are missing.");
        }

        if (typeof login !== "string" || typeof password !== "string") {
            message = "Bad request.";
            throw new Error("Some params are the wrong type.");
        }

        const fetchUser = await User.findOne({
            where: {
                [Op.or]: [
                    { name: login },
                    { email: login },
                ]
            }
        })

        if (!fetchUser) {
            message = "Login or password are incorrect.";
            throw new Error("Incorrect login.");
        }

        const passCheck = await compare(password, fetchUser.password);

        if (!passCheck) {
            message = "Login or password are incorrect.";
            throw new Error("Incorrect password.");
        }

        const JWTsecret = process.env.JWT_SECRET as string;

        const token = jwt.sign(
            { data: fetchUser },
            JWTsecret,
            { expiresIn: "24h" }
        )

        res.status(200).json({
            success: true,
            message: "Successfully logged in.",
            token: token,
        })
        console.log("Successfully logged in with token: " + token);
    } catch (e) {
        console.log(e);
        res.status(400).json({
            success: false,
            message: message,
        })
    }
})

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});


io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    try {
        if (!token) {
            return next(new Error("Token is missing."));
        }

        const JWTsecret = process.env.JWT_SECRET ? process.env.JWT_SECRET : "";
        jwt.verify(token, JWTsecret, (err: VerifyErrors | null, decoded: string | JwtPayload | undefined) => {
            if (err) return next(new Error("Invalid token."));
            if (decoded && typeof decoded !== "string") {
                socket.data.user = decoded.data;
            }
            next();
        });
    } catch (e) {
        console.log(e);
        next(new Error("Something went wrong with the server."))
    }


})

io.use((socket, next) => {
    const roomId = userRoomIndex.get(socket.data.user.name);
    const room = rooms.get(roomId || "");
    if(!roomId || !room) return next();
    

    socket.join(roomId);
    next();
})

io.on("connection", (socket) => {
    console.log("established websocket connection:  " + socket.id);

    const roomId = userRoomIndex.get(socket.data.user.name);
    const room = rooms.get(roomId || "");

    if(room && roomId){
        socket.to(roomId).emit("room-updated", room);
    }

    socket.on("get-room", (callback) => {
        const currentRoomId = userRoomIndex.get(socket.data.user.name);
        const currentRoom = rooms.get(currentRoomId || "");
        const currentUser = currentRoom?.users.find(user => user.username === socket.data.user.name);
        callback({ room: currentRoom});
    });

    socket.on("get-isReady", (callback) => {
        const currentRoomId = userRoomIndex.get(socket.data.user.name);
        const currentRoom = rooms.get(currentRoomId || "");
        const currentUser = currentRoom?.users.find(user => user.username === socket.data.user.name);
        callback({ isReady: currentUser?.ready ?? false });
    })

    socket.on("get-name", (callback) => {
        callback({ name:  socket.data.user.name });
    })

    socket.on("create-room", (callback) => {
        if (socket.rooms.size >= 2) return;
        const roomId = genUniqueLobbyCode(rooms);
        const room: Room = {
            id: roomId,
            users: [{ username: socket.data.user.name, host: true, ready: false }],
            maxPlayers: 4,
            status: "in-lobby",
        }

        rooms.set(roomId, room);
        userRoomIndex.set(socket.data.user.name, roomId);
        socket.join(roomId);

        callback({ success: true, room });
        io.to(roomId).except(socket.id).emit("room-updated", room);
    })

    socket.on("join-room", (roomId, callback) => {
        const room = rooms.get(roomId);
        if (room && !room.users.some(user => user.username === socket.data.user.name) && room.users.length < room.maxPlayers) {
            const updated: Room = {
                id: roomId,
                users: [...room.users.values(), { username: socket.data.user.name, host: false, ready: false }],
                maxPlayers: room.maxPlayers,
                status: room.status,
            }

            rooms.set(roomId, updated);
            userRoomIndex.set(socket.data.user.name, roomId);
            socket.join(roomId);

            callback({ success: true, room: updated });
            socket.to(roomId).emit("room-updated", updated);
        } else {
            callback({ success: false, message: `Room with room id: ${roomId} is full or does not exist.` })
        }
    })

    socket.on("toggle-ready", (callback) => {
        const rs = Array.from(socket.rooms);
        const roomId = rs.find(id => id !== socket.id);

        if (!roomId) return;
        const room = rooms.get(roomId)
        if (!room) return;

        const updatedUsers = room.users.map(user => {
            if (user.username === socket.data.user.name) {
                return { ...user, ready: !user.ready }
            }
            return user;
        })

        const allReady = updatedUsers.every(user => user.ready);
        

        const updated: Room = {
            id: roomId,
            users: updatedUsers,
            maxPlayers: room.maxPlayers,
            status: allReady ? "Starting the game" : room.status,
        }

        rooms.set(roomId, updated);

        callback({ success: true, room: updated });
        socket.to(roomId).emit("room-updated", updated);
        if (allReady) io.to(roomId).emit("start-game");
    });

    socket.on("leave-room", (callback) => {
        const rs = Array.from(socket.rooms);
        const roomId = rs.find(id => id !== socket.id);

        if (!roomId) return;
        const room = rooms.get(roomId);
        if (!room) return;

        let updatedUsers = room.users.filter(user => user.username !== socket.data.user.name);
        socket.leave(roomId);
        userRoomIndex.delete(socket.data.user.name);

        if (updatedUsers.length === 0) {
            rooms.delete(roomId);
            callback({ success: true });
            return;
        }

        const haveHost = updatedUsers.some(user => user.host);

        if (!haveHost) {
            if (updatedUsers[0]) updatedUsers[0].host = true;
        }

        const allReady = updatedUsers.every(user => user.ready);

        const updated: Room = {
            id: roomId,
            users: updatedUsers,
            maxPlayers: room.maxPlayers,
            status: allReady ? "Starting the game" : room.status,
        }

        rooms.set(roomId, updated);

        callback({ success: true });
        io.to(roomId).emit("room-updated", updated);
    })

    socket.on("send-location", (x, y) => {
        const rs = Array.from(socket.rooms);
        const roomId = rs.find(id => id !== socket.id) as string;
        const name = socket.data.user.name as string;

        socket.to(roomId).emit("player-pos-update", name, {x, y});
    })
})



httpServer.listen(port, () => {
    console.log(`http://localhost:${port}`)
})