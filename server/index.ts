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
import { generateDungeon, printDungeon } from "./functions/MapGenerator.js";
import type { GeneratedDungeon } from "./functions/MapGenerator.js";
//import combat states
import type { CombatState, AttackResult, MonsterState } from "../shared/interfaces.js";
import { monsterDefinitions } from "./monsters/definitions.js";

const app = express();
dotenv.config();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
await initDb();
app.use(express.json());
app.use(cors())
const httpServer = createServer(app);
const rooms = new Map<string, Room>();
//store player positions, so we can check for encounters
const playerPositions = new Map<
    string,
    Map<string, { x: number; y: number }>
>();
//monsters storage
const roomMonsters = new Map<string, Map<string, MonsterState>>();

const userRoomIndex = new Map<string, string>();

// track all combats happening
const combats = new Map<string, CombatState>();

// Tracks which players have finished dodging this enemy turn.
const dodgeFinished = new Map<string, Set<string>>();

// Tracks players already hit during this enemy turn.
const dodgeHit = new Map<string, Set<string>>();

// Prevents an enemy turn from getting stuck forever.
const dodgeTimers = new Map<string, ReturnType<typeof setTimeout>>();


const roomDungeonSeeds = new Map<string, number>();


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

        const seed = Math.floor(Math.random() * 2147483647);

        roomDungeonSeeds.set(roomId, seed);

        const monsters = new Map<string, MonsterState>();

        monsters.set("zombie_01", {
            id: "zombie_01",
            type: "zombie",
            x: 300,
            y: 300,
            angle: 0,
            hp: 100,
            maxHp: 100,
            mode: "idle",
        });

        roomMonsters.set(roomId, monsters);

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
            roomDungeonSeeds.delete(roomId);
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
    const username = socket.data.user.name;
    const roomId = userRoomIndex.get(username);

    if (!roomId) return;

    if (!playerPositions.has(roomId)) {
        playerPositions.set(roomId, new Map());
    }

    playerPositions.get(roomId)!.set(username, { x, y });

    socket.to(roomId).emit("player-pos-update", username, { x, y });

    // Check every monster in this room.
    const monsters = roomMonsters.get(roomId);
    if (!monsters || combats.has(roomId)) return;

    for (const monster of monsters.values()) {
        if (monster.mode !== "idle") continue;

        const definition = monsterDefinitions[monster.type];
        if (!definition) continue;

        const detected = canMonsterSeePlayer(
            monster,
            { x, y },
            definition.visionRange,
            definition.visionAngle
        );

        if (detected) {
            startMonsterCombat(roomId, monster);
            break;
        }
    }
    
});
socket.on("get-dungeon-seed", (callback) => {
    console.log("SERVER: get-dungeon-seed received");

    const username = socket.data.user.name;
    const roomId = userRoomIndex.get(username);

    console.log("SERVER: username:", username);
    console.log("SERVER: roomId:", roomId);
    // console.log("SERVER: seed:", roomDungeonSeeds.get(roomId));

    if (!roomId) {
        callback({ seed: undefined });
        return;
    }

    callback({
        seed: roomDungeonSeeds.get(roomId)
    });

    console.log("SERVER: callback sent");
});

    //COMBAT HANDLERS
        // Start combat for the current room.
    socket.on("start-combat", () => {
        const username = socket.data.user.name;
        const roomId = userRoomIndex.get(username);
        if (!roomId) return;

        const room = rooms.get(roomId);
        if (!room) return;

        // Only the host can start combat.
        const currentUser = room.users.find(
            user => user.username === username
        );

        if (!currentUser?.host || combats.has(roomId)) return;

        const players: CombatState["players"] = {};

        for (const user of room.users) {
            players[user.username] = {
                hp: 100,
                maxHp: 100,
                mana: 30,
                maxMana: 30,
                hasActed: false,
                isAlive: true,
            };
        }

        const state: CombatState = {
            id: roomId,
            roomId,
            phase: "player-turn",
            players,
            enemy: {
                name: "Cave Slime",
                hp: 100,
                maxHp: 100,
                isAlive: true,
            },
        };

        combats.set(roomId, state);
        io.to(roomId).emit("combat-started", state);
    });

    // Send the current combat state to a reconnecting client.
    socket.on("get-combat-state", callback => {
        const username = socket.data.user.name;
        const roomId = userRoomIndex.get(username);

        callback({
            state: roomId ? combats.get(roomId) : undefined,
        });
    });

    // Submit one attack result per player turn.
    socket.on("combat-attack", (result: AttackResult) => {
        const username = socket.data.user.name;
        const roomId = userRoomIndex.get(username);
        if (!roomId) return;

        const state = combats.get(roomId);
        if (!state || state.phase !== "player-turn") return;

        const player = state.players[username];
        if (!player || !player.isAlive || player.hasActed) return;

        if (!["PERFECT", "GOOD", "MISS"].includes(result)) return;

        player.hasActed = true;

        const damage = {
            PERFECT: 30,
            GOOD: 15,
            MISS: 0,
        }[result];

        state.enemy.hp -= damage;

        if (state.enemy.hp <= 0) {
            state.enemy.hp = 0;
            state.enemy.isAlive = false;

            endCombat(roomId, "victory");
            return; // Important: don't continue into the enemy-turn logic
        }

        emitCombatUpdate(roomId, state);

        const livingPlayers = Object.entries(state.players)
            .filter(([, player]) => player.isAlive);

        if (livingPlayers.every(([, player]) => player.hasActed)) {
            startEnemyTurn(roomId);
}
    });

    // Record a hit during this player's dodge arena.
    socket.on("combat-dodge-hit", () => {
        const username = socket.data.user.name;
        const roomId = userRoomIndex.get(username);
        if (!roomId) return;

        const state = combats.get(roomId);
        if (!state || state.phase !== "enemy-turn") return;

        const player = state.players[username];
        if (!player || !player.isAlive) return;

        const hitPlayers = dodgeHit.get(roomId);
        if (!hitPlayers || hitPlayers.has(username)) return;

        hitPlayers.add(username);

        player.hp = Math.max(0, player.hp - 15);
        player.isAlive = player.hp > 0;

        emitCombatUpdate(roomId, state);

        if (Object.values(state.players).every(p => !p.isAlive)) {
            endCombat(roomId, "defeat");
        }
    });

    // Mark this player's dodge arena as finished.
    socket.on("combat-dodge-finished", () => {
        const username = socket.data.user.name;
        const roomId = userRoomIndex.get(username);
        if (!roomId) return;

        const state = combats.get(roomId);
        if (!state || state.phase !== "enemy-turn") return;

        const player = state.players[username];
        if (!player || !player.isAlive) return;

        const finishedPlayers = dodgeFinished.get(roomId);
        if (!finishedPlayers) return;

        finishedPlayers.add(username);

        const livingPlayers = Object.entries(state.players)
            .filter(([, player]) => player.isAlive);

        const allFinished = livingPlayers.every(
            ([name]) => finishedPlayers.has(name)
        );

        if (allFinished) {
            finishEnemyTurn(roomId);
        }
    });
})

// combat helper functions
function emitCombatUpdate(roomId: string, state: CombatState) {
    io.to(roomId).emit("combat-updated", state);
}

function endCombat(roomId: string, result: "victory" | "defeat") {
    const state = combats.get(roomId);
    if (!state) return;

    state.phase = "ended";
    state.result = result;

    console.log("[SERVER] Ending combat:", roomId, result);

    const timer = dodgeTimers.get(roomId);
    if (timer) clearTimeout(timer);

    dodgeTimers.delete(roomId);
    dodgeFinished.delete(roomId);
    dodgeHit.delete(roomId);

    io.to(roomId).emit("combat-ended", state);
}

function startEnemyTurn(roomId: string) {
    const state = combats.get(roomId);
    if (!state || state.phase === "ended") return;

    state.phase = "enemy-turn";

    dodgeFinished.set(roomId, new Set());
    dodgeHit.set(roomId, new Set());

    io.to(roomId).emit("combat-phase-changed", state);

    // Safety timeout: don't let disconnected players stall combat.
    const timer = setTimeout(() => {
        finishEnemyTurn(roomId);
    }, 12000);

    dodgeTimers.set(roomId, timer);
}

function finishEnemyTurn(roomId: string) {
    const state = combats.get(roomId);
    if (!state || state.phase !== "enemy-turn") return;

    const timer = dodgeTimers.get(roomId);
    if (timer) clearTimeout(timer);
    dodgeTimers.delete(roomId);

    const livingPlayers = Object.entries(state.players)
        .filter(([, player]) => player.isAlive);

    if (livingPlayers.length === 0) {
        endCombat(roomId, "defeat");
        return;
    }

    state.phase = "player-turn";

    for (const [, player] of livingPlayers) {
        player.hasActed = false;
    }

    dodgeFinished.delete(roomId);
    dodgeHit.delete(roomId);

    io.to(roomId).emit("combat-phase-changed", state);
}
function canMonsterSeePlayer(
    monster: MonsterState,
    player: { x: number; y: number },
    visionRange: number,
    visionAngle: number
): boolean {
    const dx = player.x - monster.x;
    const dy = player.y - monster.y;

    const distance = Math.hypot(dx, dy);

    if (distance > visionRange) return false;

    const angleToPlayer = Math.atan2(dy, dx);

    const difference = Math.abs(
        Math.atan2(
            Math.sin(angleToPlayer - monster.angle),
            Math.cos(angleToPlayer - monster.angle)
        )
    );

    return difference <= visionAngle;
}
function startMonsterCombat(roomId: string, monster: MonsterState) {
    // Only one encounter per room for now.
    if (combats.has(roomId)) return;

    const room = rooms.get(roomId);
    const definition = monsterDefinitions[monster.type];

    if (!room || !definition) return;

    const players: CombatState["players"] = {};

    for (const user of room.users) {
        players[user.username] = {
            hp: 100,
            maxHp: 100,
            mana: 30,
            maxMana: 30,
            hasActed: false,
            isAlive: true,
        };
    }

    const state: CombatState = {
        id: `${roomId}_${monster.id}`,
        roomId,
        phase: "player-turn",
        players,
        enemy: {
            name: definition.name,
            hp: monster.hp,
            maxHp: monster.maxHp,
            isAlive: monster.hp > 0,
        },
    };

    monster.mode = "engaged";

    combats.set(roomId, state);

    io.to(roomId).emit("combat-started", state);
}



httpServer.listen(port, () => {
    console.log(`http://localhost:${port}`)
})