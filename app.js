var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');

var app = express();
var server = app.listen(3000);
var io = require('socket.io').listen(server);
var util = require('./lib/util');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser({limit: '50mb'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


var players = [];
var spectators = [];
var players_dead = [];
function getAllUsers() {
  return players_dead.concat(players.concat(spectators));
}
var sockets = {};

function loadMaze(){
  return util.getNewMaze(4,4);
}

var maze = loadMaze();
var round_finished = false;

io.on('connection', function (socket) {
  console.log("Somebody connected!", socket.id);

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
      console.log('user required game', players);
      socket.emit('serverAcceptsPlayer', maze, currentUser);
    } else if(userType === 'spectator') {
      //init spectator data
      spectators.push(currentUser);
      socket.emit('serverAcceptsSpectator', maze, currentUser);
    } else {
      console.log('user type error');
    }
  });

  socket.on('playerRequiresRevive', function () {
    for(var i=0;i<players_dead.length;i++){
      if(players_dead[i].id == currentUser.id){
        players_dead.splice(i, 1);
        break;
      }
    }
    if(players.findIndex(function(player) { return player.id === currentUser.id; }) == -1) {
      players.push(currentUser);
    }
    console.log('user required revive', players);
  });

  socket.on('playerSendsUpdates', function (data) {
    //console.log("Hell Update");
    currentUser.time = data.time;
    currentUser.x = data.x;
    currentUser.y = data.y;
    currentUser.z = data.z;
    currentUser.cx = data.cx;
    currentUser.cy = data.cy;
    currentUser.cz = data.cz;
    currentUser.map = data.map;
    currentUser.state = data.state;
    currentUser.otherPeople = data.otherPeople;
  });

  socket.on('playerWins', function (potg) {
    if(round_finished) return;
    round_finished = true;
    var users = getAllUsers();
    users.forEach(function(user) {
      user.result = (user.id === currentUser.id);
    });
    winner = currentUser.name;
    console.log(winner);
    roundFinished(potg, winner);
  });

  socket.on('disconnect', function (reason) {
    console.log('disconnected', socket.id, reason);
    if (currentUser.type === 'player') {
      players = players.filter(function (p) {
        return p.id !== currentUser.id;
      });
      players_dead = players_dead.filter(function (p) {
        return p.id !== currentUser.id;
      });
      console.log(players);
    } else {
      spectators = spectators.filter(function (s) {
        return s.id !== currentUser.id;
      });
      console.log(spectators);
    }

  });

  socket.on('playerShoots', function (beam) {
    //testBeam(beam);
    console.log('beam shot',  beam, '\n');
    io.emit('serverBroadcastsBeam', beam);

    if(beam.victim) {
      sockets[beam.victim.id].emit('youAreDead', { killer: currentUser });
      sockets[beam.victim.id].broadcast.emit('playerDies', { killer: currentUser, victim: beam.victim });
      players = players.filter(function (p) {
        return (p.id !== beam.victim.id);
      });
      if(players_dead.findIndex(function(player) { return player.id === currentUser.id; }) == -1) {
        players_dead.push(currentUser);
      }
    }
  });

  socket.on('disconnecting', function (reason) {
    console.log('disconnecting', socket.id, reason);
  });

  socket.on('error', function (error) {
    console.log(error);
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
  //io.sockets.emit('serverSendsUpdates', players);
}

function roundFinished(potg, winner) {
  var users = getAllUsers();
  users.forEach(function (user) {
    sockets[user.id].emit('roundFinished', potg, user.result, winner);
  });
  setTimeout(function(){ startNewRound(); }, 3000 + (potg.length * 1000 / 60));//potg 영상 재생 끝나는 시간 측정해서 대기한 후에: TODO
}


function startNewRound() {
  var users = getAllUsers();
  maze = loadMaze();
  users.forEach(function (user) {
    sockets[user.id].emit('serverStartsNewRound', maze);
  });
  round_finished = false;
}
//
// function testBeam(beam) {
//   players.forEach(function (player) {
//     var hitBox;
//     if(false) { //test collision
//       sockets[player.id].emit('youAreDead', { killer: beam.shooter });
//       sockets[player.id].broadcast.emit('playerDies', { killer: beam.shooter, victim: player });
//     }
//   });
//
// }

setInterval(sendUpdates, 1000 / 40);



app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
