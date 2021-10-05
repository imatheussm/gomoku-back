const express = require("express");
const { createServer } = require("https");

const { Server } = require("socket.io");
const fs = require('fs')
const util = require('util')

let log_file = fs.createWriteStream('/log/gomokuws.log', {flags : 'w'});
console.log = d =>  log_file.write(util.format(d) + '\n')

const options = {
  key: fs.readFileSync("/etc/letsencrypt/live/gomokuws.ygarasab.com/privkey.pem"),
  cert: fs.readFileSync("/etc/letsencrypt/live/gomokuws.ygarasab.com/fullchain.pem")
};

const app = express();
app.get('/', (_, r) =>r.send( "hello world"))
const httpServer = createServer(options, app);

let rooms = {}

const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ["GET", "POST"]
    }
  });
io.on("connection", (socket) => {
    console.log(`[ ${new Date().toLocaleString()} ] Someone connected`)
    socket
      .on('join', room => {
        console.log(`[ ${new Date().toLocaleString()} ] Someone is trying to join room ${room}`)
     
        if(!(room in rooms))
        {
            socket.join(room);
            rooms[room] = 1
            socket.emit('joined', {player:-1})
        }
        else if(rooms[room])
        {
	    socket.join(room)
            rooms[room] = 0
            io.to(room).emit('ready')
            socket.emit('joined', {player:1})
        }
        else
            socket.emit('full')
     })
      .on('play', data => {
        console.log(`[ ${new Date().toLocaleString()} ] A play was sent at room ${data.room} by player ${data.player}`)
	        io.to(data.room).emit('play', data)
    })
      .on('disconnect', data => {
	console.log(`[ ${new Date().toLocaleString()} ] A player disconnected`);
    	for(room in rooms){
		if(io.sockets.adapter.rooms.get(room) === undefined) delete rooms[room]
		else if(rooms[room] === 0 && io.sockets.adapter.rooms.get(room).size === 1){
			let clients = io.sockets.adapter.rooms.get(room)
			io.to(room).emit('left')
			for(let client of clients) io.sockets.sockets.get(client).leave(room)
			delete rooms[room]
			console.log(`[ ${new Date().toLocaleString()} ] Room ${room} deleted`);
		}
	}
    })
});

console.log(`[ ${new Date().toLocaleString()} ] Starting`)

httpServer.listen(3002);
