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

var maze = util.getNewMaze(6,6);

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
    currentUser.time = data.time;
    currentUser.x = data.x;
    currentUser.y = data.y;
    currentUser.z = data.z;
    currentUser.cx = data.cx;
    currentUser.cy = data.cy;
    currentUser.cz = data.cz;
    currentUser.state = data.state;
  });

  socket.on('playerWins', function (potg) {
    getAllUsers.forEach(function(user) {
      user.result = (user.id === currentUser.id);
    });
    roundFinished(potg);
    //potg 업로드 할 것
  });


});

function sendUpdates () {
  //send updates to other users
  var users = getAllUsers();
  users.forEach(function (user) {
    sockets[user.id].emit(
      'serverSendsUpdates',
      players.filter(function(p) { return user.id !== p.id; }));
  });
}

function roundFinished(potg) {
  var users = getAllUsers();
  users.forEach(function (user) {
    sockets[user.id].emit('roundFinished', potg, user.result);
  });
  //potg 영상 재생 끝나는 시간 측정해서 대기한 후에: TODO
  startNewRound();
}


function startNewRound() {
  var users = getAllUsers();
  maze = util.getNewMaze(6,6);
  users.forEach(function (user) {
    sockets[user.id].emit('serverStartsNewRound', maze);
  });

}

//setInterval(gameLoop, 1000 / 60);
setInterval(sendUpdates, 1000 / cfg.networkUpdateFactor);

var serverPort = process.env.PORT || cfg.port;
http.listen(serverPort, function() {
  console.log("Server is listening on port " + serverPort);
});
