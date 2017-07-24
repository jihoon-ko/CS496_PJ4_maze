/*jslint bitwise: true, node: true */
'use strict';

var express = require('express');
var app     = express();
var http    = require('http').Server(app);
var io      = require('socket.io')(http);

var util = require('./lib/util');
var cfg  = require('../../config.json');

app.use(express.static(__dirname + '/../client'));

var players = [];
var spectators = [];
function getAllUsers() {
  return players.concat(spectators);
}
var sockets = {};

var maze = [[1,1,1,1,1],[1,2,1,1,1],[1,0,0,0,1],[1,0,1,0,1],[1,0,1,0,0],[1,1,1,1,1]];

io.on('connection', function (socket) {
  console.log("Somebody connected!");

  //handle events from users
  var currentUser = {
    id: socket.id
  };
  socket.on('userRequiresGame', function (userName, userType) {
    currentUser.name = userName;
    currentUser.type = userType;
    sockets[currentUser.id] = socket;

    if(userType === 'player') {
      //init player data: location, angle etc ...
      players.push(currentUser);
      socket.emit('serverAcceptsPlayer', maze, currentUser);
    } else if(userType === 'spectator') {
      //init spectator data
      spectators.push(currentUser);
      socket.emit('serverAcceptsSpectator', maze, currentUser);
    } else {
      console.log('user type error');
    }
  });

  socket.on('playerSendsUpdates', function (data) {

  });

  socket.on('spectatorSendsUpdates', function (data) {

  });


});

function gameLoop() {
  //handle game server logic
}

function sendUpdates () {
  //send updates to other users
  var users = getAllUsers();
  users.forEach(function (user) {
    sockets[user.id].emit('serverSendsUpdates', players); //needs filtering
  });
}

function roundFinished() {
  var users = getAllUsers();
  var potg;
  users.forEach(function (user) {
    sockets[user.id].emit('roundFinished', potg);
  });
}


function startNewRound() {
  var users = getAllUsers();
  generateMaze();
  users.forEach(function (user) {
    sockets[user.id].emit('serverStartsNewRound', maze);
  });

}

function generateMaze() {

}

setInterval(gameLoop, 1000 / 60);
setInterval(sendUpdates, 1000 / cfg.networkUpdateFactor);

var serverPort = process.env.PORT || cfg.port;
http.listen(serverPort, function() {
  console.log("Server is listening on port " + serverPort);
});
