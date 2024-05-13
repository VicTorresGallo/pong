'use strict'

// INICIALIZACIÓN DEL MOTOR DE JUEGO
// CAPTURA LOS MOVIMIENTOS DEL JUGADOR ( A TRAVÉS DEL EJE Y DEL RATÓN)
function initPaddleMovement(){
    cvs.addEventListener("mousemove",(event) =>{
        if (gameState !== gameStateEnum.PLAY){
            return;
        }
        const rect = cvs.getBoundingClientRect();
        localPlayer.y = event.clientY - rect.top - localPlayer.height/2;
    });
}

function init(){
    initGameObjects();
    drawBoard();
    initPaddleMovement()
    initGameLoop();
}

// Inicialización del juego
init();