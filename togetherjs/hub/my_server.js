"use strict";

var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app, {log: false})
  , fs = require('fs')
  , readline = require('readline')

var port = process.argv[2];

if (!port) {
	console.log("Usage: node my-server.js <port-number>");
	process.exit();
} else {
	console.log("Server running on port " + port);
	app.listen(port);
}

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

var connectionsId = [];

function handler (req, res) {
  	fs.readFile(__dirname + '/index.html',
  	function (err, data) {
    	if (err) {
      		res.writeHead(500);
      		return res.end('Error loading index.html');
    	}
    	res.writeHead(200);
    	res.end(data);
  	});
}

rl.on('line', function (cmd) {
	if (cmd == "exit") {
		console.log("Received shut down signal");
		process.exit();
	} else if (cmd == "time") {
		var time = process.uptime();
		var h = (time - time % 3600) / 3600;
		time -= h * 3600;
		var min = (time - time % 60) / 60;
		time -= min * 60;
		if (h === 0) {
			if (min === 0) {
				console.log("Up time: " + time + " seconds");
			} else {
				console.log("Up time: " + min + " minutes and " + time + " seconds");
			}
		} else {
			console.log("Up time: " + h + "hours, " + min + " minutes and " + time + " seconds");
		}
	} else if (cmd == "clients") {
		console.log("Connected clients: " + _getNumberOfConnections());
		for (var i = connectionsId.length - 1; i >= 0; i--) {
			console.log("Client " + i + " id: " + connectionsId[i]);
		};
	}
});

io.sockets.on('connection', function (socket) {

	console.log('Connection from socket: ' + socket.id);
	var idAlreadyInList = 0;
	for (var i = connectionsId.length - 1; i >= 0; i--) {
		if (connectionsId[i] === socket.id) {
			idAlreadyInList = 1;
		}
	};
	if (idAlreadyInList === 0) {
		connectionsId.push(socket.id);
	}

	_sendOwnClientId(socket, 'yourId');

	_sendNewClientIdToConnected(socket, socket.id, 'newConnectionId');

  	socket.on('disconnect', function () {
  		var socketIndex = connectionsId.indexOf(socket.id);
  		console.log('Socket ' + socket.id + ' disconnect');
  		if (socketIndex > -1) {
  			connectionsId.splice(socketIndex, 1);
  		}
  		console.log(_getNumberOfConnections());

  	});

  	socket.on('chatMessage', function (data) {
  		var msg = data.trim();
  		if (msg.substr(0,3) == '/w ') {
  			msg = msg.substr(3);
  			var ind = msg.indexOf(' ');
  			if (ind != -1) {
  				var name = msg.substr(0, ind);
  				var content = msg.substr(ind + 1);
  				for (var i = connectionsId.length - 1; i >= 0; i--) {
  					if (name == connectionsId[i]) {
  						_sendTospecificClient(name, content, 'chatMessage');
  					}
  				}
  			}
  		} else {
  			_sendToAllClients(data, 'chatMessage');
  		}
  	});

  	socket.on('documentModification', function (data) {
  		socket.broadcast.emit('documentModification', data);
  	});

  	console.log(_getNumberOfConnections());
});

function _getNumberOfConnections() {
	return connectionsId.length;
}

//send to current request socket client
function _sendToSingleClient(socket, msg, eventType) {
	socket.emit(eventType, msg);
}

//sending to all clients, include sender
function _sendToAllClients(msg, eventType) {
	io.sockets.emit(eventType, msg);
}

//sending to all clients except sender
function _sendToAllClientsExceptSender(socket, msg, eventType) {
	socket.broadcast.emit(eventType, msg);
}

//Notify client of his id
function _sendOwnClientId(socket, eventType) {
	socket.emit(eventType, socket.id);
}

//Notify clients of someone else connection
function _sendNewClientIdToConnected(socket, data, eventType) {
	socket.broadcast.emit(eventType, data);
}

//Send to a specific client
function _sendTospecificClient(socketId, msg, eventType) {
	io.sockets.socket(socketId).emit(eventType, msg);
}

