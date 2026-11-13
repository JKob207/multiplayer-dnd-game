import type { JwtPayload } from "jsonwebtoken";
import type { User } from "./database/models/User.js";

export interface InterServerEvents{

}

export interface SocketData{
    user: JwtPayload;
}
