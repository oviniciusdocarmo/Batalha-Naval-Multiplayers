const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

let players = [];
let games = [];
let time = [];
let tabuleiro = [];

console.log('Servidor rodando na porta 8080');

server.on('connection', (socket) => {
    players.push(socket);
    if (players.length % 2 === 1) {
        console.log(`Aguardando oponente...`);
        socket.send(`Aguardando oponente...`);
    }

    if (players.length % 2 === 0) {
        console.log(`Iniciando jogo...`);

        const player1 = players.shift();
        const player2 = players.shift();
        const gameId = games.length;
        games.push({ id: gameId, players: [player1, player2] });

        player1.send(`Você é o player1`);
        player2.send(`Você é o player2`);

        player1.on('close', function close() {
            console.log('O player 1 se desconectou');
            player2.send('O player 1 se desconectou');
        });

        player2.on('close', function close() {
            console.log('O player 2 se desconectou');
            player1.send('O player 2 se desconectou');
        });

        //momento 1: adicionando navios no tabuleiro
        player1.send('Momento 1: Adicione suas embarcações no tabuleiro');
        player2.send('Momento 1: Adicione suas embarcações no tabuleiro');
        console.log('Momento 1...');
        // Initialize tabuleiro array for the current game
        tabuleiro['player1'] = [];
        player1.on('message', (message) => {
            //armazenar as 32 posições do tabuleiro
            if (tabuleiro['player1'].length <= 32) {
                tabuleiro['player1'].push(message.toString());
            }
        });
        tabuleiro['player2'] = [];
        player2.on('message', (message) => {
            //armazenar as 32 posições do tabuleiro
            if (tabuleiro['player2'].length <= 32) {
                tabuleiro['player2'].push(message.toString());
            }
        });


        //adicionando tempo da partida
        time.push({ id: gameId, time: 0 });
        setInterval(() => {
            time[gameId].time++;
            player1.send(`Tempo da partida: ${time[gameId].time}s`, 'time');
            player2.send(`Tempo da partida: ${time[gameId].time}s`, 'time');
        }, 1000);

        // Implemente a lógica de jogo para configurar os tabuleiros e gerenciar os turnos aqui
    }
});
