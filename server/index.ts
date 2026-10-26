import express from "express"
import { initDb } from "./database/database.js";
import { User } from "./database/models/User.js";
import { Op } from "sequelize";
import { compare, genSalt, hash } from "bcrypt-ts";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

const app = express();
const port = 3000;
dotenv.config();
await initDb();
app.use(express.json());


app.post("/register", async (req, res) => {
    let message = "Something went wrong with the server. We are sorry.";
    try {

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            message = "Bad request.";
            throw Error("Some params are missing.");
        }

        if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
            message = "Bad request.";
            throw Error("Some params are the wrong type.");
        }


        const existsEmail = await User.findOne({
            where: {
                email: email,
            }
        })

        if (existsEmail !== null) {
            message = "Someone with this email already exists.";
            throw Error("Someone with this email already exists.")
        }

        const existsName = await User.findOne({
            where: {
                name: name,
            }
        })


        if (existsName !== null) {
            message = "This username is taken.";
            throw Error("Someone with this username already exists.")
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
            throw Error("Some params are missing.");
        }

        if (typeof login !== "string" || typeof password !== "string") {
            message = "Bad request.";
            throw Error("Some params are the wrong type.");
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
            throw Error("Incorrect login.");
        }

        const passCheck = await compare(password, fetchUser.password);

        if (!passCheck) {
            message = "Login or password are incorrect.";
            throw Error("Incorrect password.");
        }

        const JWTsecret = process.env.JWTsecret as string;

        const token = jwt.sign(
            { userId: fetchUser.id, name: fetchUser.name },
            JWTsecret,
            { expiresIn: "24h" }
        )

        res.status(200).json({
            success: true,
            message: "Successfully logged in.",
            token: token,
        })
    } catch (e) {
        console.log(e);
        res.status(400).json({
            success: false,
            message: message,
        })
    }
})

app.listen(port, () => {
    console.log(`http://localhost:${port}`)
})