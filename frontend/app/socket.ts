import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "./../../shared/interfaces.js"

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io("http://localhost:3000", {
    auth: {
        token: localStorage.getItem("accessToken")
    },
    autoConnect: false,
});

socket.on("connect", () => {
    console.log(socket.id);
})