const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);

let rooms = {}

const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ["GET", "POST"]
    }
  });
io.on("connection", (socket) => {
    console.log('Someone Connected')
    socket.on('join', room => {
        socket.join(room)
        if(!(room in rooms))
        {
            rooms[room] = 1
            socket.emit('joined', {player:0})
        }
        else if(rooms[room])
        {
            rooms[room] = 0
            socket.emit('joined', {player:1})
        }
        else
            socket.emit('full')
    })
    socket.on('play', data => socket.rooms.forEach(room => io.to(room).emit('play', data)))
});

httpServer.listen(80);