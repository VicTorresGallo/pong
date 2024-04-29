'use strict'

// Constantes básicas del juego
const FRAME_PER_SECOND = 50; //50 por defecto

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
const BALL_WIDTH = 5;
const BALL_HEIGHT = 5;

const gameStateEnum = {
    SYNC: 0,
    PLAY: 1,
    PAUSE: 2,
    END: 3,
};

//-------------------------------------------------------------------
//--------------------------GRAPHICS ENGINE--------------------------
//-------------------------------------------------------------------


//recuperar canvas
const cvs = document.getElementById('pong_canvas');
const ctx = cvs.getContext('2d');

//layer 0: BASIC CANVAS DRAW HELPERS----------------------
function drawRect(x,y,w,h,color) {
    ctx.fillStyle = color;
    ctx.fillRect(x,y,w,h);
}

function drawCircle(x,y,r,color){
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x,y,r,0, 2*Math.PI,false); //pos 50, 60, radio = 10
    ctx.closePath();
    ctx.fill();
}
function drawText(text,x,y,color=FONT_COLOR,fontSize=FONT_SIZE, fontFamily = FONT_FAMILY){
    ctx.fillStyle = color;
    ctx.font = `${fontSize} ${fontFamily}`;
    ctx.fillText(text,x,y);
}

function clearCanvas(){
    drawRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT,BG_COLOR);
}
//layer 1: BASIC CANVAS PONG HELPERS----------------------

function drawNet(){
    const net = {
        x:CANVAS_WIDTH/2-NET_WIDTH/2,
        y : 0,
        width: NET_WIDTH,
        height: NET_HEIGHT,
        padding: NET_PADDING,
        color: NET_COLOR
    }
    for(let i=0;i<=CANVAS_HEIGHT;i+=net.padding){
        drawRect(net.x, net.y+i, net.width, net.height, net.color);
    }
}
function drawBoard(){
    clearCanvas();
    drawNet();
}

function drawScore(players){
    for(let id in players){
        drawText(players[id].score,(players[id].x === 0 ? 1:3)*CANVAS_WIDTH/4, CANVAS_HEIGHT/5);
    }
}


const CANVAS_WIDTH = cvs.width;
const CANVAS_HEIGHT= cvs.height;

//declaramos los objetos del juego
function drawPaddle(paddle){
    drawRect(paddle.x,paddle.y,paddle.width,paddle.height,paddle.color);
}

function drawBall(ball){
    drawCircle(ball.x,ball.y,ball.radio,ball.color);
}
//-------------------------------------------------------------------
//--------------------------Motor de Juego --------------------------
//-------------------------------------------------------------------
//Declaramos los objetos del juego

var gameState = gameStateEnum.SYNC;
const players = {};
var ball = {};
const localPlayer = {};
//------GENERIC HELPERS------

function getRandomDirection(){
    return Math.floor(Math.random() * 2) === 0 ? -1 : 1;
}

function getPlayer(index){
    return players[index];
}

function initGameObjects(){
    players[0]={
        x:0,
        y:CANVAS_HEIGHT/2-PADDLE_HEIGHT/2,
        width:PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        color:PADDLE_LEFT_COLOR,
        score:0
    }
    players[1]={
        x:CANVAS_WIDTH-PADDLE_WIDTH,
        y:CANVAS_HEIGHT/2-PADDLE_HEIGHT/2,
        width:PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        color:PADDLE_RIGHT_COLOR,
        score:0
    }
    ball = {
        x:BALL_WIDTH/2,
        y:BALL_HEIGHT/2,
        radius:BALL_RADIUS,
        speed:BALL_VELOCITY,
        velocityX:BALL_VELOCITY * getRandomDirection(),
        velocityY:BALL_VELOCITY * getRandomDirection(),
        color:BALL_COLOR
    }

    localplayer =getPlayer(0);
}   
//------------------Update Helpers ------------------------
function newBall(init = false){
    //Si la pelota ya estaba definida (es un tanto), cambiamos direccion
    const directionX = init? getRandomDirection() : (ball.velocityX > 0? -1 : 1);

    ball = {
        x:BALL_WIDTH/2,
        y:BALL_HEIGHT/2,
        radius:BALL_RADIUS,
        speed:BALL_VELOCITY,
        velocityX:BALL_VELOCITY * getRandomDirection(),
        velocityY:BALL_VELOCITY * getRandomDirection(),
        color:BALL_COLOR
    }
}

function collision(b,p){
    //calculamos el collider de la pelota
    b.top = b.y - b.radius;
    b.bottom = b.y + b.radius;
    b.left = b.x -b.radius;
    b.right = b.x + b.radius;

    //Calcular collider pala
    p.top = p.y;
    p.bottom = p.y + p.height;
    p.left = p.x ;
    p.right = p.x + p.width;

    return  b.right     > p.left &&
            b.bottom    > p.top &&
            b.left      < p.left &&
            b.top       < p.bottom;
} 
//IA Del juego
const cCOMPUTER_LEVEL = 0.1;

function updateNPC(){
    const npc = getPlayer(1);

    npc.i += (ball.i - (npc.y+npc.height/2)) * cCOMPUTER_LEVEL;


}


function update(){
    //SI NO ESTAMOS EN PLAY, saltamos la actualizacion
    if(gameState!= gameState.PLAY) return;

    //pLAYER: ACTUALIZAMOS LA POS DE LA PELOTA
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;
    //IA: Actualizamos la pos de la computadora
    updateNPC();
    //Si la pelota golpea los laterales del campo rebotará;
    if(ball.y + ball.radius > CANVAS_HEIGHT  || ball.y - ball.radius < 0) {
        ball.velocityY = -ball.velocityY;
    }
//verificamos si la pelota golpea alguna pala;
    var whatPlayer = (ball.x < CANVAS_WIDTH/2) ? getPlayer(0) : getPlayer(1);
    if(collision(ball, whatPlayer)){
        // calculamos donde golpea la pelota en la pala;
        var collidePoint = ball.y - (whatPlayer.y + whatPlayer.height/2);
        // normalizamos el punto de colision
        collidePoint = collidePoint / (whatPlayer.height/2);
        // calculamos el agngulo de rebote (en radianes)
        const angleRad = collidePoint * Math.PI/4
        // Calculamos el sentido de la pelota en la direccion x
        const direction = (ball.x < CANVAS_HEIGHT.BALL_WIDTH/2) ? 1: -1; 
        // Calculamos la velocidad de la pelota en los ejes X e Y
        ball.velocityX = direction * ball.speed * Math.cos(angleRad);
        ball.velocityY = ball.speed * Math.sin(angleRad);
        // Cada vez que la pelota choca con la pala la velocidad incrementa
        ball.speed += BALL_DELTA_VELOCITY;
    }

    //Si la pelota se fue por la izquierda
    if(ball.x - ball.radius < 0){
        console.log("tanto para el jugador de la derecha");
        getPlayer(1).score++;
        newBall();
    }
    //Si la pelota se fue por la derecha
    if(ball.x + ball.radius < CANVAS_WIDTH){
        console.log("tanto para el jugador de la izquierda");
        getPlayer(0).score++;
        newBall();
    }
    
}
function render(){    
    if(gameState === gameStateEnum.PAUSE){
        drawText("PAUSA", CANVAS_WIDTH/4, CANVAS_HEIGHT/2, "GREEN");
        return;
    }   

    if(gameState === gameStateEnum.SYNC){
        drawText("Esperando rival...", CANVAS_WIDTH/4, CANVAS_HEIGHT/2, "GREEN");
        return;
    } 

    drawBoard();
    drawScore(players);
    drawPaddle(getPlayer(0));
    drawPaddle(getPlayer(1));
    drawBall(ball);

    if(gameState === gameStateEnum.END){
        drawText("GAME OVER", CANVAS_WIDTH/3, CANVAS_HEIGHT/2, "RED");
    }     

}

function next(){
    //si ha terminado la partida
    if(gameState === gameStateEnum.END){
        console.log("GAMEOVER");
        stopGameLoop();
        return;
    }
    if((getPlayer(0).score >=NUM_BALLS ||getPlayer(1).score >=NUM_BALLS)){
        gameState = gameStateEnum.END;
    }

}

//HELPERS para gestionar l bucle del juego
var gameLoopId; //identificar el bucle del juego

function gameLoop(){
    update();
    render();
    next();
}

function initGameLoop(){
    gameLoopId = setInterval(gameLoop, 1000/FRAME_PER_SECOND);
    gameState = gameStateEnum.PLAY;
}

function stopGameLoop(){
    clearInterval(gameLoopId);
}

//Inicializador global del motor de juego

//captura los movimientos del jugador a traves del eje Y del raton
function initPaddleMovements(){
    cvs.addEventListener("mousemove", (event) => {
        if(gameState !== gameStateEnum.PLAY){
            return;
        }else{
            const rect = cvs.getBoundingClientRect();
            localPlayer.y = event.clientY - rect.top - localPlayer.height/2;
        }
    });
}

function init(){
    initGameObjects();
    drawBoard();
    initGameLoop();
}

//Inicializacion del juego
init();