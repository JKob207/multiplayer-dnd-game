import { io } from "socket.io-client";

export const socket = io("http://localhost:3000", {
    auth: {
        token: localStorage.getItem("accessToken")
    },
    autoConnect: false,
});

socket.on("connect", () => {
    console.log(socket.id);
})