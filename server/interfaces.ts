import type { JwtPayload } from "jsonwebtoken";

export interface ClientToServerEvents{

}

export interface ServerToClientEvents{

}

export interface InterServerEvents{

}

export interface SocketData{
    user: string | JwtPayload | undefined;
}