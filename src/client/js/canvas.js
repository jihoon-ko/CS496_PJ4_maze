/*jslint esversion: 6*/
var global = require('./global');

class Canvas {
  constructor(params) {
    this.socket = global.socket;
    var self = this;
    this.cv = document.getElementById('cvs');
    this.cv.width = global.screenWidth;
    this.cv.height = global.screenHeight;
    this.cv.addEventListener('keydown', function(e) {
      self.updateKeyStatus(e);
    }, false);
    this.cv.addEventListener('keyup', function(e) {
      self.updateKeyStatus(e);
    }, false);
    global.canvas = this;
  }
}


module.exports = Canvas;
