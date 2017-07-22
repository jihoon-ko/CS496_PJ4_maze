var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function(){
    console.log("Connected to mongod server");
});

mongoose.connect('mongodb://localhost/maze');

var Schema = mongoose.Schema;
var mazeSchema = new Schema({
    mp: Schema.Types.Mixed,
    record: Schema.Types.Mixed
});

Maze = mongoose.model('maze', mazeSchema);
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

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

router.get('/download', function(req, res){
    Maze.findOne({}, function(err, maze){
        return res.json(maze);
    });
});
module.exports = router;
