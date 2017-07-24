/* jslint node: true */

'use strict';

function makeMaze(x, y) {
	console.log(x);
	console.log(y);
	var n = x * y - 1;
	if (n < 0) {
		return;
	}
	var j;
	var horiz = [];for (j = 0; j < x + 1; j++) horiz[j] = [];
	var verti = [];for (j = 0; j < x + 1; j++) verti[j] = [];
	var here = [Math.floor(Math.random() * x), Math.floor(Math.random() * y)];
	var path = [here];
	var unvisited = [];
	for (j = 0; j < x + 2; j++) {
		unvisited[j] = [];
		for (var k = 0; k < y + 1; k++) unvisited[j].push(j > 0 && j < x + 1 && k > 0 && (j != here[0] + 1 || k != here[1] + 1));
	}
	while (0 < n) {
		var potential = [[here[0] + 1, here[1]], [here[0], here[1] + 1], [here[0] - 1, here[1]], [here[0], here[1] - 1]];
		var neighbors = [];
		for (j = 0; j < 4; j++) if (unvisited[potential[j][0] + 1][potential[j][1] + 1]) neighbors.push(potential[j]);
		if (neighbors.length) {
			n = n - 1;
			var next = neighbors[Math.floor(Math.random() * neighbors.length)];
			unvisited[next[0] + 1][next[1] + 1] = false;
			if (next[0] == here[0]) horiz[next[0]][(next[1] + here[1] - 1) / 2] = true;else verti[(next[0] + here[0] - 1) / 2][next[1]] = true;
			path.push(here = next);
		} else here = path.pop();
	}
	return { x: x, y: y, horiz: horiz, verti: verti };
}

function generateMaze(maze) {
	var i, r, c;
	var row = maze.x * 2 + 2;
	var col = maze.y * 2 + 1;
	var res = new Array(row);
	for (i = 0; i < row; i++) {
		res[i] = new Array(col);
	}
	// initialize with 1
	for (r = 0; r < row; r++) {
		for (c = 0; c < col; c++) {
			res[r][c] = 1;
		}
	}
	//start point
	res[1][1] = 2;
	res[row - 2][col - 1] = 0;
	for (r = 2; r < row; r++) {
		for (c = 0; c < col; c++) {
			if (r % 2 == 0) {
				if (c % 2 == 1) {
					res[r][c] = 0;
				}
			}
		}
	}
	for (r = 0; r < maze.x + 1; r++) {
		for (c = 0; c < maze.y; c++) {
			if (maze.horiz[r][c]) {
				res[r * 2 + 2][c * 2 + 2] = 0;
			}
			if (maze.verti[r][c]) {
				res[r * 2 + 3][c * 2 + 1] = 0;
			}
		}
	}
	return res;
}

exports.getNewMaze = function (x, y) {
	return generateMaze(makeMaze(x, y));
};