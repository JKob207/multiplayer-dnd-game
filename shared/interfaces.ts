
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
        }) => void
    ) => void;

    "get-isReady": (
        callback: (response: {
            isReady: boolean;
        }) => void
    ) => void;

    "get-name": (
        callback: (response: {
            name: string;
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

    "send-location": (
        x: number,
        y: number,
    ) => void;
}

export interface ServerToClientEvents {
    "room-updated": (room: Room) => void;
    "start-game": () => void;
    "player-pos-update": (
        name: string,
        position: {
            x: number,
            y: number
        }
    ) => void;
}
