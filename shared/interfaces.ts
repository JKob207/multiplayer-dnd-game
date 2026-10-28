
export interface Room {
    id: string;
    users: {
        username: string;
        host: boolean;
        ready: boolean;
    }[];
    maxPlayers: number;
    status: string;
}

export interface ClientToServerEvents {
    "get-room": (
        callback: (response: {
            room: Room | undefined;
            isReady: boolean;
        }) => void
    ) => void;

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

    "toggle-ready": (
        callback: (response: {
            success: boolean;
            room: Room;
        }) => void
    ) => void;

    "leave-room": (
        callback: (response: {
            success: boolean;
        }) => void
    ) => void;
}

export interface ServerToClientEvents {
    "room-updated": (room: Room) => void;
}
