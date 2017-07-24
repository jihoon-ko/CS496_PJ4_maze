var io = require('socket.io-client');
var global = require('./global');
var game = require('./game');

var playerName;
var playerNameInput = document.getElementById('playerNameInput');
var socket;

window.onload = function() {
  var btnStart = document.getElementById('startButton');
  var btnSpectate = document.getElementById('spectateButton');
  var btnVR = document.getElementById('vrButton');
  var nickErrorText = document.querySelector('#startMenu .input-error');

  btnStart.onclick = function () {
    // check if the nick is valid
    if (validNick()) {
      startGame('player');
    } else {
      nickErrorText.style.display = 'inline';
    }
  };

  btnSpectate.onclick = function () {
    startGame('spectator');
  };

  btnVR.onclick = function () {

  };

  playerNameInput.addEventListener('keypress', function (e) {
    var key = e.which || e.keyCode;
    if (key === 13) { //KEY_ENTER
      if (validNick()) {
        startGame('player');
      } else {
        nickErrorText.style.display = 'inline';
      }
    }
  });
};

// check if nick is valid alphanumeric characters (and underscores)
function validNick() {
  var regex = /^\w*$/;
  console.log('Regex Test', regex.exec(playerNameInput.value));
  return regex.exec(playerNameInput.value) !== null;
}

function startGame(type) {
  global.playerName = playerNameInput.value.replace(/(<([^>]+)>)/ig, '').substring(0,25);
  global.playerType = type;
  document.getElementById('gameAreaWrapper').style.display = 'block';
  document.getElementById('startMenuWrapper').style.display = 'none';
  document.getElementById('myCanvas').style.display = 'block';

  socket = io();
  game.handleNetwork(socket);
  //animloop();
}

// window.requestAnimFrame = (function(){
//   return  window.requestAnimationFrame   ||
//     window.webkitRequestAnimationFrame ||
//     window.mozRequestAnimationFrame  ||
//     function( callback ){
//       window.setTimeout(callback, 1000 / 60);
//     };
// })();

//적절히 교체해야..
// function animloop(){
//   requestAnimFrame(animloop);
//   gameLoop();
// }
//
// function gameLoop() {
//   game.handleLogic();
//   game.handleGraphics();
// }
