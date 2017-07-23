/*jslint bitwise: true, node: true */
var express = require('express');
var app     = express();
var http    = require('http').Server(app);
var io      = require('socket.io')(http);

var cfg  = require('../../config.json');

app.use(express.static(__dirname + '/../client'));

var players = [];
var spectators = [];
var sockets = {};

io.on('connection', function (socket) {
  console.log("Somebody connected!", socket.handshake.query.type);

  //handle events from users
  
  var type = socket.handshake.query.type;
  if(type === 'player') {

  } else { //type: spectator

  }

});

function gameLoop() {
  //handle game server logic
}

function sendUpdates () {
  //send updates to other users
}

setInterval(gameLoop, 1000/ 60);
setInterval(sendUpdates, 1000 / cfg.networkUpdateFactor);

var serverPort = process.env.PORT || cfg.port;
http.listen(serverPort, function() {
  console.log("Server is listening on port " + serverPort);
});
