const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const fs = require('fs')
const util = require('util')

let log_file = fs.createWriteStream('/log/gomoku.log', {flags : 'w'});
console.log = d =>  log_file.write(util.format(d) + '\n')

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
    console.log(`[ ${new Date().toLocaleString()} ] Someone connected`)
    socket.on('join', room => {
        console.log(`[ ${new Date().toLocaleString()} ] Someone is trying to join room ${room}`)
        socket.join(room)
        if(!(room in rooms))
        {
            rooms[room] = 1
            socket.emit('joined', {player:-1})
        }
        else if(rooms[room])
        {
            rooms[room] = 0
            io.to(room).emit('ready')
            socket.emit('joined', {player:1})
        }
        else
            socket.emit('full')
    })
    socket.on('play', data => {
        console.log(`[ ${new Date().toLocaleString()} ] A play was sent at room ${data.room} by player ${data.player}`)
        io.to(data.room).emit('play', data)
    })
});

console.log(`[ ${new Date().toLocaleString()} ] Starting`)
httpServer.listen(3002);