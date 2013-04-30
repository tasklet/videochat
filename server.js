/*global console*/
var yetify = require('yetify'),
    config = require('getconfig'),
    uuid = require('node-uuid'),
    io = require('socket.io').listen(config.server.port,"0.0.0.0");

var grooms = [];

io.sockets.on('connection', function (client) {
	// pass a message
	client.on('message', function (details) {
		var otherClient = io.sockets.sockets[details.to];

		if (!otherClient) {
		    return;
		}
		delete details.to;
		details.from = client.id;
		otherClient.emit('message', details);
	    });

	client.on('join', function (name) {
		client.join(name);
		io.sockets.in(name).emit('joined', {
			room: name,
			    id: client.id
			    });
	    });

	function leave() {
	    var rooms = io.sockets.manager.roomClients[client.id];

	    for (var name in rooms) {
		if (name) {
		    io.sockets.in(name.slice(1)).emit('left', {
			    room: name,
				id: client.id
				});
		}
	    }

	    delete grooms[client.id];
	}

	client.on('disconnect', leave);
	client.on('leave', leave);

	client.on('showbundle',function(){
		//var rooms = io.sockets.manager.roomClients[client.id];
		//console.log('rooms is' + grooms);
		var rooms = [];
		for(var name in grooms) {
			rooms.push(grooms[name]);
		}
		var param = rooms.join("|");

		client.emit('enableChatList',param);
	});

	client.on('create', function (name, cb) {
		if (arguments.length == 2) {
		    cb = (typeof cb == 'function') ? cb : function () {};
		    name = name || uuid();
		} else {
		    cb = name;
		    name = uuid();
		}
		// check if exists
		if (io.sockets.clients(name).length) {
		    cb('taken');
		} else {
			grooms[client.id] = name;
		    client.join(name);
		    if (cb) cb(null, name);
		}
	    });
    });

if (config.uid) process.setuid(config.uid);
console.log(yetify.logo() + ' -- signal master is running at: http://localhost:' + config.server.port);