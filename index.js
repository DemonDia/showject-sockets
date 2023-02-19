const express = require("express")
const app = express()
const cors = require("cors");
require("dotenv").config();

app.use(cors());

app.get("/", (req, res) => {
    res.send("OK");
});

const server = app.listen(8900,
    console.log("listening")
    )

const io = require("socket.io")(server, {
    cors: process.env.FRONTEND_URL,
});


let users = [];

const addUser = (userId, socketId) => {
    console.log("userId, socketId", userId, socketId);
    // only add unique
    if (
        userId &&
        !users.some((user) => user.Id == userId || user.socketId == socketId)
    ) {
        users.push({ userId, socketId });
    }
};

const removeUser = (socketId) => {
    users = users.filter((user) => {
        return user.socketId !== socketId;
    });
};

const getUser = (userId) => {
    return users.find((user) => user.userId == userId);
};

io.on("connection", (socket) => {
    console.log("user connected");
    console.log(socket.id);

    // connect new user
    socket.on("addUser", (userId) => {
        addUser(userId, socket.id);
        io.emit("getUsers", users);
    });

    // remove user
    socket.on("disconnect", () => {
        console.log("user disconnected");
        removeUser(socket.id);
        io.emit("getUsers", users);
    });

    // send & get msg
    socket.on("sendMessage", (sentMessage) => {
        const { message, receiverId } = sentMessage;
        io.to(socket.id).emit("getMessage", message);
        const user = getUser(receiverId);
        if (user) {
            io.to(user.socketId).emit("getMessage", message);
        }
    });
});
