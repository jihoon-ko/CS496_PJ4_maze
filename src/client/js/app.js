var playerName;
var playerNameInput = document.getElementById('playerNameInput');
var socket;

// var screenWidth = window.innerWidth;
// var screenHeight = window.innerHeight;

var c = document.getElementById('cvs');
var canvas = c.getContext('2d');
c.width = screenWidth; c.height = screenHeight;

var KEY_ENTER = 13;

var game = new Game();

window.onload = function() {
  'use strict';

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
    if (key === KEY_ENTER) {
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
  socket = io({
    query: {type: type}
  });
  setupSocket(socket);
  animloop();
}

function setupSocket(socket) {
  game.handleNetwork(socket);
}

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame   ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame  ||
    function( callback ){
    window.setTimeout(callback, 1000 / 60);
    };
})();

function animloop(){
  requestAnimFrame(animloop);
  gameLoop();
}

function gameLoop() {
  game.handleLogic();
  game.handleGraphics(canvas);
}

window.addEventListener('resize', function() {
  screenWidth = window.innerWidth;
  screenHeight = window.innerHeight;
  c.width = screenWidth;
  c.height = screenHeight;
}, true);
