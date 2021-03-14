var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var players = [];
let WIDTH = 2000
let HEIGHT = 1252

server.listen(8080, function () {
    console.log("Server is now running...");
});

function RenderObject(width, height) {
    this.width = width;
    this.height = height;
    this.x = 100;
    this.y = 100;
    this.speedX = 0;
    this.speedY = 0;
    this.rotation = 0;
}

RenderObject.prototype.addRotation = function (t) {
    this.rotation += t;
}

RenderObject.prototype.getSpeed = function () {
    return {
        'x' : this.speedX,
        'y' : this.speedY
    };
}

RenderObject.prototype.getPosition = function () {
    return {
        'x' : this.x,
        'y' : this.y
    }
}

RenderObject.prototype.getSize = function () {
    return {
        'x' : this.width,
        'y' : this.height
    }
}

RenderObject.prototype.setSpeed = function (vec) {
    this.speedX = vec.x
    this.speedY = vec.y
}

RenderObject.prototype.act = function (time) {
    this.width += time * this.getSpeed().x;
    this.height += time * this.getSpeed().y;
    this.width = Math.min(Math.max(this.width, 0), WIDTH);
    this.height = Math.min(Math.max(this.height, 0), HEIGHT);
}

function Ship() {
    let t = new RenderObject(128, 40);
    t.x = 100;
    t.y = 100;
    return t;
}

Ship.prototype = Object.create(RenderObject.prototype);

function Ball() {
    return new RenderObject(40, 40);
}

Ball.prototype.act = function (time) {
    let vec = this.getSpeed()
    let tx = this.getPosition().x + vec.x
    let ty = this.getPosition().y + vec.y
    vec.x *=  1 - time
    vec.y *= 1 - time
    if (tx > WIDTH || tx < 0) {
        vec.x = -vec.x
    }
    if (ty > HEIGHT || ty < 0) {
        vec.y = - vec.y;
    }
    this.prototype.act(time);
}

function sqr(x) {
    return x * x;
}

Ball.prototype.push = function (obj) {
    let x = obj.getPosition().x;
    let y = obj.getPosition().y;
    let xDiff = sqr(x - this.getPosition().x);
    let yDiff = sqr(y - this.getPosition().y);
    let rad2 = sqr(this.getSize().x) / 4;
    if (xDiff + yDiff < rad2) {
        let vec = this.getSpeed()
        let pusher = obj.getSpeed()
        vec.x += pusher.x / 2;
        vec.y += pusher.y / 2;
        this.setSpeed(vec);
    }
}

Ball.prototype = Object.create(RenderObject.prototype)

let Bullet = function (x, y) {
    let t = new RenderObject(10, 10)
    t.x = x
    t.y = y
}

Bullet.prototype = Object.create(RenderObject.prototype)

io.on('connection', function (socket) {
    console.log("Player Connected!");
    socket.emit('socketID', {id: socket.id});
    socket.emit('getPlayers', players);
    socket.broadcast.emit('newPlayer', {id: socket.id});
    socket.on('playerMoved', function (data) {
        data.id = socket.id;
        socket.broadcast.emit('playerMoved', data);
        for (var i = 0; i < players.length; i++) {
            if (players[i].id == data.id) {
                players[i].x = data.x;
                players[i].y = data.y;
                players[i].rot = data.rot;
            }
        }
    });
    socket.on('disconnect', function () {
        console.log("Player Disconnected");
        socket.broadcast.emit('playerDisconnected', {id: socket.id});
        for (var i = 0; i < players.length; i++) {
            if (players[i].id == socket.id) {
                players.splice(i, 1);
            }
        }
    });
    players.push(new player(socket.id, 0, 0, 0));
});

function player(id, x, y, rot) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.rot = rot;
}