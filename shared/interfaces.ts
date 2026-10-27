
export interface Room {
    id: string;
    users: {
        id: string; // socket.id
        username: string;
        host: boolean;
        ready: boolean;
    }[];
    maxPlayers: number;
    status: string;
}

export interface ClientToServerEvents {
    "create-room": (
        callback: (response: {
            success: boolean;
            room?: Room;
        }) => void
    ) => void;

    "join-room": (
        roomId: string,
        callback: (response: {
            success: boolean;
            room?: Room;
            message?: string;
        }) => void
    ) => void;

    "set-ready": (
        ready: boolean,
        callback: (response: {
            success: boolean;
            room?: Room;
            message?: string;
        }) => void
    ) => void;

    "start-game": (
        callback: (response: {
            success: boolean;
            message?: string;
        }) => void
    ) => void;
}

export interface ServerToClientEvents {
    "room-updated": (room: Room) => void;
}
