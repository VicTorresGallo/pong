'use strict'

// Constantes básicas del juego
const FRAME_PER_SECOND = 50;

const NUM_BALLS = 5;

const BG_COLOR = 'BLACK';

const FONT_COLOR = 'WHITE';
const FONT_FAMILY = 'impact';
const FONT_SIZE = '45px';

const NET_COLOR = 'WHITE';
const NET_WIDTH = 4;
const NET_HEIGHT = 10;
const NET_PADDING = 15;

const PADDLE_RIGHT_COLOR = 'WHITE';
const PADDLE_LEFT_COLOR = 'WHITE';
const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 100;

const BALL_COLOR = 'WHITE';
const BALL_RADIUS = 10;
const BALL_DELTA_VELOCITY = 0.5;
const BALL_VELOCITY = 5;

const gameStateEnum = {
    SYNC: 0,
    PLAY: 1,
    PAUSE: 2,
    END: 3,
};

//-----------------------------------------------------
//--------------SERVIDOR DE JUEGO----------------------
//-----------------------------------------------------

//Incluimos bibliotecas
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT||300;

// SERVIDOR WEB --------------------------------------

// Inicializamos un servidor HTTP para sevir la interfaz del juego (front-end)

function initWebServer(){
    // configuramos el servidor para servir el contenido desde la carpeta public
    app.use(express.static(__dirname + 'public'));

    // Indicamos la pagina por defecto
    app.get('/', (req,res)=>{
        res.sendFile(__dirname + '/index.html');
    });
    server.listen(port, () =>{
        console.log(`Game server running on port ${port}`);
    });
}

/// ---------------------------------------------------------
// Servidor WEBSOCKET
// ---------------------------------------------------------

//inicializamos el servidor websocket sobre el serv http
function initNetworkEngine(){
    //Definimos la interaccion

    io.on('conection', (socket) =>{
        console.log(`Nuevo Jugador`);

        socket.on('new player', ()=>{
            //Calculamos el número de jugadores a partir del objetos players
            const numberOfPlayers = Object.keys(players).length;

            //atendemos el evento
            onNewPlayer(socket, numberOfPlayers);
        });
        socket.on('move player',(data)=>{
            let player = players[socket.id] ||{};
            player.y = data; 
        });

        socket.on('disconect', ()=>{
            console.log(`Player ${socket.id} disconnected `);
            delete players[socket.id]
        })
    });
}

function sendStatus(){
    io.emit('state', {players,ball,gameState});
}

// ---------------------------------------------------------
// MOTOR DE Red (NETWORK ENGINE): Objetos del juego + Bucle del juego
// ---------------------------------------------------------
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;

// Declaramos los objetos del juego
var gameState = gameStateEnum.SYNC;
const players = {};
var ball ={};

// GENERIC HELPERS -------------------------

function getRandomDirection(){
    return Math.floor(Math.random()*2) === 0 ? -1 : 1;
}
function getPlayers(index){
    var whatPlayer = undefined;

    for(let id in players){
        if(index == 0 && players[id].x == 0) whatPlayer = players[id];
        if(index != 0 && players[id].x != 0) whatPlayer = players[id];
    }

    return players[index];
}

function onNewPlayer(socket, numberOfPlayers){

    console.log(`Solicitud de juego para el jugador ${socket.id}`);
    console.log(`por el momento habia ${numberOfPlayers} jugadores`);

    if(numberOfPlayers ===0){
        players[socket.id] ={
            x:0,
            y:CANVAS_HEIGHT/2 - PADDLE_HEIGHT/2,
            width: PADDLE_WIDTH,
            height: PADDLE_HEIGHT,
            color: PADDLE_LEFT_COLOR,
            score: 0
        }
        console.log(`Dando de alta al jugador A con indice ${numberOfPlayers}:${socket.id}`);
    }
    if(numberOfPlayers === 1){
        players[socket.id] ={
            x:CANVAS_WIDTH - PADDLE_WIDTH,
            y:CANVAS_HEIGHT/2 - PADDLE_HEIGHT/2,
            width: PADDLE_WIDTH,
            height: PADDLE_HEIGHT,
            color: PADDLE_RIGHT_COLOR,
            score: 0
        }
        console.log(`dando de alta al jugador B con indice ${numberOfPlayers}:${socket.id}`);
        console.log('ya hay 2 jugadores');
        console.log('generando nueva pelota');
        newBall(true);

        console.log('Iniciando Bucle del juego');
        initGameLoop();

    }
    if(numberOfPlayers>=2){
        console.log('Demasiados jugadores. Espere su turno');
        socket.disconnect();
    }
}
// UPDATE HELPERS ---------------------------------------
function newBall(init=false){
    // Si la pelota ya estaba definida ( es un tanto), cambiamos de dirección
    const directionX = init ? getRandomDirection() : (ball.velocityX>0 ? -1 : 1);
    ball={
        x: CANVAS_WIDTH/2,
        y: CANVAS_HEIGHT/2,
        radius: BALL_RADIUS,
        speed: BALL_VELOCITY,
        velocityX: BALL_VELOCITY * directionX,
        velocityY: BALL_VELOCITY * getRandomDirection(),
        color: BALL_COLOR
    }
}
function collision(b,p){
    // Calculamos el collider de la pelota
    b.top = b.y - b.radius;
    b.bottom = b.y + b.radius;
    b.left = b.x - b.radius;
    b.right = b.x + b.radius;

    // Calculamos el collider de la pala
    p.top = p.y;
    p.bottom = p.y + p.height;
    p.left = p.x;
    p.right = p.x + p.width;

    return b.right > p.left &&
            b.bottom > p.top &&
            b.left < p.right &&
            b.top < p.bottom;
}

// IA del juego
const COMPUTER_LEVEL = 0.1;

// function updateNPC(){
//     const npc = getPlayers(1);

//     npc.y += (ball.y - (npc.y+npc.height/2)) * COMPUTER_LEVEL;
// }

function update(){
    // Si no estamos en modo PLAY, saltamos la actualización
    if(gameState != gameStateEnum.PLAY) return;

    // Player: actualizamos la posicioón de la bola
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // IA: actualizamos la posición de la computadora
    //updateNPC();

    // Si la poelota golpea los laterales del campo, rebotará...
    if(ball.y+ball.radius > CANVAS_HEIGHT  ||  ball.y-ball.radius < 0){
        ball.velocityY = -ball.velocityY;
    }
    // Verificamos si la pelota golpea alguna pala...
    var whatPlayer = (ball.x < CANVAS_WIDTH/2) ? getPlayers(0) : getPlayers(1);
    if (collision(ball,whatPlayer)){
        // Calculamos donde golpea la pelota en la pala
        var collidePoint = ball.y - (whatPlayer.y+whatPlayer.height/2);
        // Normalizamos el punto de colisión
        collidePoint = collidePoint / (whatPlayer.height/2);
        // Calculamos el ángulo de rebote ( en radianes)
        const angleRad = collidePoint * Math.PI/4;
        // Calculamos el sentido de la pelota en la dirección x
        const direction = (ball.x < CANVAS_WIDTH/2) ? 1 : -1;
        // Calculamos la velocidad de la pelota en los ejes x e y
        ball.velocityX = direction * ball.speed * Math.cos(angleRad);
        ball.velocityY = ball.speed * Math.sin(angleRad);
        // Cada vez que la bola golpea la pala, se incrementa la velicidad
        ball.speed += BALL_DELTA_VELOCITY;
    }

    // Si la pelota se fue por la izquierda...
    if(ball.x - ball.radius < 0){
        console.log('Tanto para el jugador de la derecha');
        getPlayers(1).score++;
        newBall();
    } else if (ball.x+ball.radius > CANVAS_WIDTH){
        console.log('Tanto para el jugador de la izquierda');
        getPlayers(0).score++;
        newBall();
    }
    sendStatus();
}

function next(){
    // Si ha terminado la partida...
    if(gameState === gameStateEnum.END){
        console.log('Game Over');
        stopGameLoop();
        return;
    }
    if ((getPlayers(0).score>=NUM_BALLS) || (getPlayers(1).score>=NUM_BALLS)){
        gameState = gameStateEnum.END;
        sendStatus();
    }
}


// HELPERS para gestionar el bucle de juego

var gameLoopId; // Identificador del bucle de juego

function gameLoop(){
    update();
    next();
}

function initGameLoop(){
    gameLoopId = setInterval(gameLoop, 1000/FRAME_PER_SECOND);
    gameState = gameStateEnum.PLAY;
}

function stopGameLoop(){
    clearInterval(gameLoopId);
}


// inicialización del servidor de juego : Servidor Web + Motor de red(Servidor WebSocket)----------------
function init(){
    initWebServer();
    initNetworkEngine();
}

//punto de entrada: inicializacion del servidor de juego

init();