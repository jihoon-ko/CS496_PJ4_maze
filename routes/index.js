var express = require('express');
var router = express.Router();
 var mongoose = require('mongoose');

var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function(){
    console.log("Connected to mongod server");
});

mongoose.connect('mongodb://localhost/maze');
//
var Schema = mongoose.Schema;
var mazeSchema = new Schema({
    mp: Schema.Types.Mixed,
    record: Schema.Types.Mixed
});

var mapSchema = new Schema({
    map: Schema.Types.Mixed
});

Maze = mongoose.model('maze', mazeSchema);
Map = mongoose.model('map', mapSchema);
//
router.post('/upload', function(req, res){
    mymap = req.body.map;
    myrec = req.body.record;
    Maze.remove({}, function(err, output){
        var new_maze = new Maze();
        new_maze.mp = mymap; new_maze.record = myrec;
        new_maze.markModified('mp'); new_maze.markModified('record');
        new_maze.save(function(err){
            return res.status(204).end();
        });
   });
});

router.get('/vr', function(req, res){
    Maze.findOne({}, function(err, maze){
        return res.render('vr', {mp: JSON.stringify(maze.mp), rec: JSON.stringify(maze.record)});
    });
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

module.exports = router;
