const { Server } = require("socket.io");
const messageHandler = require("./handlers/messageHandler.js");

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("chatMessage", (msg) => {
      messageHandler.handleMessage(io, msg);
    });

    socket.off("disconnect", () => {
      console.log("A user disconnected");
    });
  });

  return io;
}

module.exports = setupSocket;
