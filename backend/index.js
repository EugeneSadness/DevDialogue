const express = require("express");
const http = require("http");
const sequelize = require("./db.js");
const Models = require("./models/models");
const cors = require("cors");
const router = require("./routes/index");
const errorHandler = require("./middleware/ErrorHandlingMiddleware.js");
const { Server } = require("socket.io");
require("dotenv").config();

const PORT = +process.env.PORT;

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", router);
app.use(errorHandler);

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",  // Настраиваем CORS, чтобы разрешить подключения с разных источников
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log('a user connected');

    socket.on("chatMessage", async (msg) => {
        try {
            console.log("Received message data:", msg);
            
            const newMessage = {
                content: msg.content,
                senderId: msg.senderId
            };
            
            const message = await Models.Message.create(newMessage);
            
            io.emit("chat message", message);
        } catch (error) {
            console.error("Error saving message: ", error);
        }
    });

    socket.on("disconnect", () => {
        console.log("user disconnected");
    });
});

app.get("/", (req, res) => {
    res.status(200).json({ message: "Server is working!" });
});

const start = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        httpServer.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to connect to the DataBase:", error);
    }
};

start();
