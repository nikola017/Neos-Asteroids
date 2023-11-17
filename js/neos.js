var myGameArea = {
    canvas: document.createElement("canvas"),
    startTime:null,
    elapsedTime: 0,
    lastAsteroidTime: 0, // time when the last asteroid was added
    asteroidAddInterval: 3000, // interval to add new asteroids (3000ms = 3s)
    start: function() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.frameNo = 0;
        this.interval = setInterval(updateGameArea, 20); // call updateGameArea every 20ms
        this.startTime = Date.now(); // set the start time when the game start

        window.addEventListener('keydown', function (e) {
            myGameArea.keys = (myGameArea.keys || []);
            myGameArea.keys[e.keyCode] = true;
        })
        window.addEventListener('keyup', function (e) {
            myGameArea.keys[e.keyCode] = false;
        })
        window.addEventListener('resize', function() {
            myGameArea.canvas.width = window.innerWidth;
            myGameArea.canvas.height = window.innerHeight;
        });
    },
    clear: function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

function player(width, height, x, y) {
    this.width = width;
    this.height = height; // the size of the player
    this.x = x;
    this.y = y; // the position of the player
    this.speed = 5; // the speed of the player
    this.color = "red";
    this.shadowOffset = 3;

    this.newPos = function() {
        // player controls (arrows or wasd)
        if (myGameArea.keys && myGameArea.keys[37] || myGameArea.keys && myGameArea.keys[65]) {this.x -= this.speed; } // left
        if (myGameArea.keys && myGameArea.keys[39] || myGameArea.keys && myGameArea.keys[68]) {this.x += this.speed; } // right
        if (myGameArea.keys && myGameArea.keys[38] || myGameArea.keys && myGameArea.keys[87]) {this.y -= this.speed; } // up
        if (myGameArea.keys && myGameArea.keys[40] || myGameArea.keys && myGameArea.keys[83]) {this.y += this.speed; } // down

        // if the player crosses the border, the player is repladed on the opposite side
        if (this.x < 0 - this.width) { this.x = myGameArea.canvas.width; } // right side
        else if (this.x > myGameArea.canvas.width) { this.x = 0 - this.width; } // left side
        if (this.y < 0 - this.height) { this.y = myGameArea.canvas.height; } // top side
        else if (this.y > myGameArea.canvas.height) { this.y = 0 - this.height; } // bottom side
    }

    this.update = function() {
        ctx = myGameArea.context;
        // draw shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // semi-transparent black
        ctx.fillRect(this.x + this.shadowOffset, this.y + this.shadowOffset, this.width, this.height);
        // draw the player
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

function Asteroid(width, height, x, y) {
    var minSpeed = 1; // lowest speed possible
    var maxSpeed = 3; // highest speed possible
    var grayValue = Math.random() * 155 + 200;
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.color = `rgb(${grayValue}, ${grayValue}, ${grayValue})`; // different shades of gray
    this.shadowOffset = 3;
    
    // randomize direction based on starting position
    if (x <= 0) { // starting from left
        this.xSpeed = Math.random() * (maxSpeed - minSpeed) + minSpeed;
    } else { // starting from right
        this.xSpeed = -(Math.random() * (maxSpeed - minSpeed) + minSpeed);
    }
    if (y <= 0) { // starting from top
        this.ySpeed = Math.random() * (maxSpeed - minSpeed) + minSpeed;
    } else { // starting from bottom
        this.ySpeed = -(Math.random() * (maxSpeed - minSpeed) + minSpeed);
    }

    // calculates the new position
    this.newPos = function() {
        this.x += this.xSpeed;
        this.y += this.ySpeed;

        // check if the asteroid is out of the canvas bounds
        if (this.x < 0 - this.width) { this.x = myGameArea.canvas.width; } // right side
        else if (this.x > myGameArea.canvas.width) { this.x = 0 - this.width; } // left side
        if (this.y < 0 - this.height) { this.y = myGameArea.canvas.height; } // top side
        else if (this.y > myGameArea.canvas.height) { this.y = 0 - this.height; } // bottom side
    }

    // draws on the new position
    this.update = function() {
        ctx = myGameArea.context;
        // draw shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // semi-transparent black
        ctx.fillRect(this.x + this.shadowOffset, this.y + this.shadowOffset, this.width, this.height);
        // draw the asteroid
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

function formatTime(time) {
    var minutes = Math.floor(time / 60000);
    var seconds = Math.floor((time % 60000) / 1000);
    var milliseconds = time % 1000;

    return minutes.toString().padStart(2, '0') + ":" +
           seconds.toString().padStart(2, '0') + ":" +
           milliseconds.toString().padStart(3, '0');
}

// funtcion that draws timer on canvas
function drawTimer() {
    var ctx = myGameArea.context;
    ctx.font = "16px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "right";

    var currentTime = formatTime(myGameArea.elapsedTime);
    ctx.fillText("Vrijeme: " + currentTime, myGameArea.canvas.width - 10, 50);

    // best time (if local storage is empty, it will not draw best time on canvas)
    if (myGameArea.bestTime !== null) {
        var bestTimeFormatted = formatTime(myGameArea.bestTime);
        ctx.fillText("Najbolje vrijeme: " + bestTimeFormatted, myGameArea.canvas.width - 10, 30);
    }
}

// funtcion to retrieve the best time from local storage
function getBestTime() {
    var bestTime = localStorage.getItem('bestTime');
    return bestTime ? parseInt(bestTime) : null;
}


// function that checks if the collision happened
function checkCollision(player, asteroid) {
    return player.x < asteroid.x + asteroid.width &&
           player.x + player.width > asteroid.x &&
           player.y < asteroid.y + asteroid.height &&
           player.y + player.height > asteroid.y;
}

function addNewAsteroid() {
    var size = Math.random() * 40 + 40; // random size between 40 and 80

    // determine the starting edge (random): 0 = top, 1 = right, 2 = bottom, 3 = left
    var edge = Math.floor(Math.random() * 4);
    var x, y;
    // from which od the four sides does an asteroid appear
    switch(edge) {
            case 0: // top
                x = Math.random() * window.innerWidth;
                y = -20;
                break;
            case 1: // right
                x = window.innerWidth + 20;
                y = Math.random() * window.innerHeight;
                break;
            case 2: // bottom
                x = Math.random() * window.innerWidth;
                y = window.innerHeight + 20;
                break;
            case 3: // left
                x = -20;
                y = Math.random() * window.innerHeight;
                break;
        }

    var asteroid = new Asteroid(size, size, x, y);
    myGameArea.asteroids.push(asteroid);
}

function startGame() {
    // clear existing intervals if any (to prevent multiple intervals running)
    if (myGameArea.interval) {
        clearInterval(myGameArea.interval);
    }
    // keep the best time from local storage
    myGameArea.bestTime = getBestTime();
    // reset the start time and elapsed time for the timer
    myGameArea.startTime = Date.now();
    myGameArea.elapsedTime = 0;

    // player position at the beginning
    var startX = window.innerWidth / 2 - 15; // 15 is half the width of the cube
    var startY = window.innerHeight / 2 - 15; // 15 is half the height of the cube
    myGamePiece = new player(60, 60, startX, startY);

    // add asteroids at the beginning
    myGameArea.asteroids = [];
    for (var i = 0; i < 5; i++) {
        addNewAsteroid();
    }

    myGameArea.start();
}

// is called every 20ms
function updateGameArea() {
    // calculate the elapsed time
    if (myGameArea.startTime) {
        myGameArea.elapsedTime = Date.now() - myGameArea.startTime;
    }

    myGameArea.clear();
    myGamePiece.newPos(); // calculates the new position
    myGamePiece.update(); // draws on the new position

    // check if it is time to add a new asteroid
    var currentTime = Date.now();
    if (currentTime - myGameArea.lastAsteroidTime > myGameArea.asteroidAddInterval) {
        addNewAsteroid();
        // update the time for the last asteroid
        myGameArea.lastAsteroidTime = currentTime;
    }

    var collision = false;
    // update the position of asteroid
    for (var i = 0; i < myGameArea.asteroids.length; i++) {
        myGameArea.asteroids[i].newPos(); // calculates the new position
        myGameArea.asteroids[i].update(); // draws on the new position

        // checks if the collision happened
        if (checkCollision(myGamePiece, myGameArea.asteroids[i])) {
            collision = true;
            break;
        }
    }

    if (collision) {
        // check if current time is better than best time
        if (myGameArea.bestTime === null || myGameArea.elapsedTime > myGameArea.bestTime) {
            myGameArea.bestTime = myGameArea.elapsedTime;
            localStorage.setItem('bestTime', myGameArea.bestTime);
        }

        // reset the game
        startGame();
    }

    drawTimer();
}
