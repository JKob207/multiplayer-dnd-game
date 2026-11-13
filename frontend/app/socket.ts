import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "./../../shared/interfaces.js"
const SERVER_URL = import.meta.env.VITE_SERVER_URL;

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
    auth: {
        token: localStorage.getItem("accessToken")
    },
    autoConnect: false,
});

socket.on("connect", () => {
    console.log(socket.id);
})
