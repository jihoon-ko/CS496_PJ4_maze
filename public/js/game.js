var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 105, window.innerWidth/window.innerHeight, 0.001, 100 );

var cvs = document.getElementById('myCanvas');
var renderer = new THREE.WebGLRenderer({canvas: cvs});
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor(0xaaccff);

// about rendered Object
var plane_texture;
var Bottom, Sphere;
var wall;

// constant value
var y_val = 1;
var gravity = 9.8;
var moveScale = {move: 6, deg: 2};
var block_size = 5;
var block_height = 5;
var server_url = "http://52.78.113.241:3000";

// about controlling
var coor, moving, press;
var cursor_now;
var jump;
var prev_time;

//about game
var save_view = [];
var max_frame = 30000;
var finished = false;
var ctx, planeCanvas;
var show_minimap = false;

// about maps
var maze;
var row, col;

// about socket.io
var who_am_i;
var other_players = [];
var mySocket;

var AndroidGeometry, AndroidMaterial;
var android;
var ambientLight;

document.body.appendChild( renderer.domElement );
window.addEventListener( 'resize', onWindowResize, false );

function restartGame(){
  initModel();
  initValue();
  initMap();
  initObject();
}

function initGame(){
  planeCanvas = document.getElementById('plane');
  ctx = planeCanvas.getContext('2d');
  window.addEventListener( 'keyup', onKeyUp, true);
  window.addEventListener( 'keydown', onKeyDown, true);
  window.addEventListener( 'mousemove', onMouseMove, true);
  window.addEventListener( 'mousedown', onMouseDown, true);
  initModel();
  initValue();
  initMap();
  initObject();
  animate();
}

function initModel(){
  var jsonLoader = new THREE.JSONLoader();
  jsonLoader.load("/js/android-animations.js", addModelToScene); 
}
function addModelToScene(geometry, materials){
  for(var i=0;i<materials.length;i++){
    materials[i].morphTargets = true;
  }
  AndroidGeometry = geometry;
  AndroidMaterial = new THREE.MeshFaceMaterial(materials);
  android = new Array(20);
  for(var j=0;j<20;j++){
    android[j] = new THREE.Mesh(AndroidGeometry, AndroidMaterial);
    android[j].scale.set(0.1, 0.1, 0.1);
    android[j].position.set(0,-1000,0);
    scene.add(android[j]);
  }
  ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambientLight);
}
function initValue(){
  coor = {x: 0, y: y_val, z: 0, deg: -Math.PI, ydeg: 0, frame: 0, v_x: 0, v_z: 0};
  moving = {doing: false, ori_x: 0, ori_y: 0, ori_deg: 0};
  press = {left: false, right: false, up: false, down: false};
  cursor_now = {x: 0, y: 0};
  jump = {jumping: false, time: 0};
  prev_time = new Date().getTime();
}


/*
function initMap(){
  try{
    var myJson = JSON.parse(httpRequest.responseText);
    maze = myJson.map;
    console.log(myJson.map.length);
    row = maze.length;
    col = maze[0].length;
    coor.x = (row-2) * block_size;
    coor.z = block_size;
    for(var i=0;i<row;i++){
      for(var j=0;j<col;j++){
        if(maze[i][j] == 2){
          coor.x = j * block_size;
          coor.z = i * block_size;
          maze[i][j] = 0;
        }
      }
    }
  }catch(err){
  }
}
*/
function initMap(){
  row = maze.length;
  col = maze[0].length;
  coor.x = (row-2) * block_size;
  coor.z = block_size;
  for(var i=0;i<row;i++){
    for(var j=0;j<col;j++){
      if(maze[i][j] == 2){
        coor.x = j * block_size;
        coor.z = i * block_size;
        maze[i][j] = 0;
      }
    }
  }
}

function initObject(){
  while(scene.children.length > 0){
    scene.remove(scene.children[0]);
  }
  var loadTexture = function(){
    var loader = new THREE.TextureLoader();
    texture = loader.load( "assets/UV_Grid_Sm.jpg" );
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 0.008, 0.008 );
  };
  var drawBottom = function(){
    var sqPts = [];
    sqPts.push(new THREE.Vector2(-col * block_size, -row * block_size));
    sqPts.push(new THREE.Vector2( col * block_size, -row * block_size));
    sqPts.push(new THREE.Vector2( col * block_size,  row * block_size));
    sqPts.push(new THREE.Vector2(-col * block_size,  row * block_size));
    sqPts.push(new THREE.Vector2(-col * block_size, -row * block_size));
    var square = new THREE.Shape(sqPts);
    var Bottom = new THREE.Mesh(new THREE.ShapeBufferGeometry(square), new THREE.MeshBasicMaterial( {map: texture} ));
    Bottom.position.set(0, 0, 0);
    Bottom.rotation.x = -Math.PI/2;
    scene.add(Bottom);
    var geometry = new THREE.SphereGeometry( 0.007, 32, 32 );
    var material = new THREE.MeshBasicMaterial( {color: 0xff0000} );
    Sphere = new THREE.Mesh( geometry, material );
    //scene.add( Sphere );
  };
  var makemaze = function(){
    wall = new Array(row);
    for(var i=0;i<row;i++){
      wall[i] = new Array(col);
      for(var j=0;j<col;j++){
        if(maze[i][j] == 1){
          var wall_geometry = new THREE.BoxGeometry( block_size, block_height, block_size );
          var material = new THREE.MeshNormalMaterial( {color: 0xff00ff} );
          wall[i][j] = new THREE.Mesh(wall_geometry, material);
          wall[i][j].position.set(j * block_size, block_height / 2, i * block_size);
          scene.add(wall[i][j]); 
        }
      }
    }
  };
  loadTexture();
  drawBottom();
  makemaze();
}
function alertContents(){
  console.log(httpRequest.status);
}
function animate(){
  //console.log(mySocket);
  // mySocket.emit('test', (function () {
  //   console.log('test emitted');
  //   return "test";
  // })());
  
  var width = window.innerWidth; var height = window.innerHeight;
  var movingTask = function(){
    requestAnimationFrame( animate );
    camera.position.x = coor.x;
    camera.position.z = coor.z;
    var plus_y = 0;
    var now_time = new Date().getTime();
    var delta_time = (now_time - prev_time) / 1000.0;
    prev_time = now_time;
    if(press.up || press.down || press.left || press.right) coor.frame += 1;
    if(jump.jumping){
      var jump_time = (now_time - jump.time) / 1000.0;
      if(jump_time > 2.0 * Math.PI / 9.8){
        jump.jumping = false;
      }else{       
        plus_y = Math.PI * jump_time - 0.5 * gravity * jump_time * jump_time;
      }
    }
    coor.v_x = 0; coor.v_z = 0;
    if(press.up){
      coor.v_z -= moveScale.move * Math.cos(coor.deg);
      coor.v_x += moveScale.move * Math.sin(coor.deg);  
    }
    if(press.down){
      coor.v_z += moveScale.move * Math.cos(coor.deg);
      coor.v_x -= moveScale.move * Math.sin(coor.deg);
    }
    if(press.left){
      coor.v_x -= moveScale.move * Math.cos(coor.deg) / 2;
      coor.v_z -= moveScale.move * Math.sin(coor.deg) / 2;
    }
    if(press.right){
      coor.v_x += moveScale.move * Math.cos(coor.deg) / 2;
      coor.v_z += moveScale.move * Math.sin(coor.deg) / 2;    
    }
    //console.log(delta_time, coor.v_x, coor.v_z);
    var prev_x = coor.x, prev_z = coor.z;
    coor.x += delta_time * coor.v_x; coor.z += delta_time * coor.v_z;
    var rr = Math.floor((coor.z / block_size) + 0.5);
    var cc = Math.floor((coor.x / block_size) + 0.5);
    //console.log(rr,cc, maze[rr][cc]);
    if(maze[rr][cc] == 1){
      coor.x = prev_x * 1.03 - coor.x * 0.03; coor.z = prev_z * 1.03 - coor.z * 0.03;
    }
    if(moving.doing && maze[rr][cc] === undefined){
      finished = true;
      console.log("SUCCESS!!!!");
      press.left = false; press.right = false; press.up = false; press.down = false;
      moving.doing = false;
      console.log(save_view);
      httpRequest = new XMLHttpRequest();
      httpRequest.onreadystatechange = alertContents;
      httpRequest.open('POST', server_url + '/upload');
      httpRequest.setRequestHeader("Content-type", "application/json");
      httpRequest.send(JSON.stringify({map: maze, record: save_view}));
    }
    //press.up = false; press.down = false; press.left = false; press.right = false;
    var real_y = (y_val - 0.1) + 0.1 * Math.cos(coor.frame / 6.0);
    camera.position.y = real_y + plus_y;
    var xx = coor.x + 100 * Math.sin(coor.deg);
    var yy = (((y_val + real_y * 9) / 10) + plus_y) + 100 * Math.sin(coor.ydeg);
    var zz = coor.z - 100 * Math.cos(coor.deg);
    camera.lookAt(new THREE.Vector3(xx, yy, zz));
    //console.log(other_players.length);
    
    for(var i=0;i<20;i++){
      if(android && android[i]){
        if(other_players.length <= i){
          android[i].position.set(0, -1000, 0);
        }else{
          android[i].position.x = other_players[i].x;
          android[i].position.y = other_players[i].y - 1;
          android[i].position.z = other_players[i].z;
          var xdeg = Math.atan2(other_players[i].cx - other_players[i].x, other_players[i].cz - other_players[i].z);
          android[i].rotation.y = xdeg;
          for(var j=0;j<20;j++){
            android[i].morphTargetInfluences[j] = 0;
          }
          android[i].morphTargetInfluences[other_players[i].state] = 1;
        }
      }
    }
    if(ambientLight){
      ambientLight.position.x = xx;
      ambientLight.position.y = camera.position.y;
      ambientLight.position.z = zz;
    }
    if(moving.doing && save_view.length < max_frame){
      save_view.push({x: camera.position.x, y: camera.position.y, z: camera.position.z, cx: xx, cy: yy, cz: zz, map: show_minimap});
    }
    mySocket.emit('playerSendsUpdates', {time: now_time, x: camera.position.x, y: camera.position.y, z: camera.position.z, cx: xx, cy: yy, cz: zz, state: (coor.frame % 20)});
    if(moving.doing) document.body.style.cursor = "none";
    else document.body.style.cursor = "default";
    if(moving.doing){
      if(cursor_now.x <= 0.02 * width){
        moving.ori_deg -= moveScale.deg * Math.PI / 180.0;
        coor.deg -= moveScale.deg * Math.PI / 180.0;
      }if(cursor_now.x >= 0.98 * width){
        moving.ori_deg += moveScale.deg * Math.PI / 180.0;
        coor.deg += moveScale.deg * Math.PI / 180.0;
      }
    }
  };
  var planeTask = function(){
    planeCanvas.width = width;
    planeCanvas.height = height;
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle="#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(width/2 - 10, height/2);
    ctx.lineTo(width/2 - 2, height/2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width/2 + 10, height/2);
    ctx.lineTo(width/2 + 2, height/2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width/2, height/2 - 10);
    ctx.lineTo(width/2, height/2 - 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width/2, height/2 + 10);
    ctx.lineTo(width/2, height/2 + 2);
    ctx.stroke();
    if(finished){
      ctx.fillStyle = '#777777';
      ctx.fillRect(width / 2 -150, height / 2 - 20, 300, 40);
      ctx.font="30px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Congraturations!", width/2, height/2 + 10);
    }else{
      if(!moving.doing || show_minimap){
        ctx.fillStyle = '#777777';
        ctx.fillRect(width / 2 - 240, height / 2 - 240, 480, 480);
        var rr = Math.floor((coor.z / block_size) + 0.5);
        var cc = Math.floor((coor.x / block_size) + 0.5);
        for(var i=-5;i<=5;i++){
          for(var j=-5;j<=5;j++){
            if(rr + i < 0 || cc + j < 0 || rr + i >= row || cc + j >= col){
              continue;
            }else if(maze[rr + i][cc + j] === 1){
              ctx.fillStyle = '#000000';
            }else if(maze[rr + i][cc + j] === 0){
              if(i == 0 && j == 0){
                ctx.fillStyle = '#FFFF00';
              }else{
                ctx.fillStyle = '#FFFFFF';
              }
            }
            ctx.fillRect(width / 2 - 20  + 40 * j + 2, height / 2 - 20 + 40 * i + 2, 36, 36);
          }
        }
      }
    }
  };
  movingTask();
  planeTask();
  renderer.render(scene, camera);

}
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}
function onMouseMove(e){
  cursor_now.x = e.clientX;
  cursor_now.y = e.clientY;
  if(moving.doing){
    //console.log(e.clientX, e.clientY);
    var new_x = e.clientX, new_y = e.clientY;
    var width = window.innerWidth; var height = window.innerHeight;
    coor.ydeg = Math.PI * Math.min(0.5, Math.max(-0.5, (moving.ori_y - new_y)/ height));
    coor.deg = moving.ori_deg - Math.PI  * Math.min(0.5, Math.max(-0.5, (moving.ori_x - new_x)/ width));
    //console.log(coor.ydeg);
  }
}
function onMouseDown(e){
  if(!moving.doing && !finished){
    moving.doing = true;
    var width = window.innerWidth; var height = window.innerHeight;
    moving.ori_x = 0.5 * width;//e.clientX;
    moving.ori_y = 0.5 * height;
    moving.ori_deg = coor.deg;
  }
}
function onKeyDown(e){
  //console.log("keydown", e.keyCode);
  if(moving.doing){
    // Up
    if(e.keyCode == 38 || e.keyCode == 87){
      if(!(press.up)){
        press.up = true;
      }
    }
    // Down
    if(e.keyCode == 40 || e.keyCode == 83){
      if(!(press.down)){  
        press.down = true;
      }
    }
    // Left
    if(e.keyCode == 37 || e.keyCode == 65){
      if(!(press.left)){
        press.left = true;
      }
      //coor.deg -= moveScale.deg * Math.PI / 180.0;
    }
    // Right
    if(e.keyCode == 39 || e.keyCode == 68){
      if(!(press.right)){
        press.right = true;
      }
    }
    // Esc
    if(e.keyCode == 27){
      moving.doing = false;
    }
    // Space
    if(e.keyCode == 32){
      if(!jump.jumping){
        jump.jumping = true;
        jump.time = new Date().getTime();
      }
    }
    if(e.keyCode == 70){
      coor.deg += Math.PI;
    }
  }
  if(e.keyCode == 81){
    show_minimap = true;
  }
}
function onKeyUp(e){
  //console.log("keyup", e.keyCode);
  if(moving.doing){
    // Up
    if(e.keyCode == 38 || e.keyCode == 87){
      if((press.up)){
        press.up = false;
      }
    }
    // Down
    if(e.keyCode == 40 || e.keyCode == 83){
      if((press.down)){
        press.down = false;
      }
    }
    // Left
    if(e.keyCode == 37 || e.keyCode == 65){
      if((press.left)){
        press.left = false;
      }
      //coor.deg -= moveScale.deg * Math.PI / 180.0;
    }
    // Right
    if(e.keyCode == 39 || e.keyCode == 68){
      if((press.right)){
        press.right = false;
      }
    }
  }
  if(e.keyCode == 81){
    show_minimap = false;
  }
}

function initSpectator() {

}

function handleNetwork(socket) {
  console.log('game.handleNetwork started');
  console.log('socket: ', socket);
  
  socket.emit('userRequiresGame', playerName, playerType);

  socket.on('serverAcceptsPlayer', function(_maze, _player) {
    mySocket = socket;
    maze = _maze;
    who_am_i = _player;
    initGame();
  });
  socket.on('serverAcceptsSpectator', function(_maze, _spectator) {
    maze = _maze;
  });
  socket.on('serverSendsUpdates', function(players) {
    other_players = players;
    console.log(players);
  });
  socket.on('serverStartsNewRound', function(maze) {
    maze = _maze;
    restartGame();
  });

  socket.on('testEvent', function (testString) {
    console.log('testEvent: ' + testString);
  });
  socket.on('error', function(error){
    console.log(error);
  });
  socket.on('disconnected', function(){
    console.log("!!!");
  });

  console.log("end of handleNetwork");
}

/*
//불필요?
function handleLogic() {
  console.log('Game is running');
  // This is where you update your game logic
}

function handleGraphics() {

}
*/


/*
module.exports.handleLogic = handleLogic;
module.exports.handleGraphics = handleGraphics;
*/