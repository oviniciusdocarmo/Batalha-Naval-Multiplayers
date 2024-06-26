const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

const LENGTH_EMBARCACOES = 32;
let players = [];
let games = [];
let time = [];
let tabuleiro = [];

console.log('Servidor rodando na porta 8080');

server.on('connection', (socket) => {
    players.push(socket);
    if (players.length % 2 === 1) {
        console.log(`Aguardando oponente...`);
        //enviar json
        socket.send(JSON.stringify({ message: `Aguardando oponente...`}));
    }

    if (players.length % 2 === 0) {
        console.log(`Iniciando jogo...`);

        const player1 = players.shift();
        const player2 = players.shift();
        const gameId = games.length;
        games.push({ id: gameId, players: [player1, player2] });

        player2.send(JSON.stringify({ message: `Você é o player2`}));
        player1.send(JSON.stringify({ message: `Você é o player1`}));

        player1.on('close', function close() {
            console.log('O player 1 se desconectou');
            player2.send(JSON.stringify({ message: 'O player 1 se desconectou'}));
            player1.close();
            player2.close();
            //remover o jogo da lista de jogos
            games = games.filter(game => game.id !== gameId);
            //remover o tempo da partida
            time = time.filter(t => t.id !== gameId);
        });

        player2.on('close', function close() {
            console.log('O player 2 se desconectou');
            player1.send(JSON.stringify({ message: 'O player 2 se desconectou'}));
            player1.close();
            player2.close();
            //remover o jogo da lista de jogos
            games = games.filter(game => game.id !== gameId);
            //remover o tempo da partida
            time = time.filter(t => t.id !== gameId);
        });

        //momento 1: adicionando navios no tabuleiro
        player1.send(JSON.stringify({ message: 'Momento 1: Adicione suas embarcações no tabuleiro'}));
        player2.send(JSON.stringify({ message: 'Momento 1: Adicione suas embarcações no tabuleiro'}));
        console.log('Momento 1...');
        // Initialize tabuleiro array for the current game
        tabuleiro['player1'] = [];
        player1.on('message', (message) => {
            //armazenar as LENGTH_EMBARCACOES posições do tabuleiro
            if (tabuleiro['player1'].length <= LENGTH_EMBARCACOES) {
                tabuleiro['player1'].push(message.toString());
                if (tabuleiro['player1'].length == LENGTH_EMBARCACOES) {
                    startMomento2();
                }
            }
        });
        tabuleiro['player2'] = [];
        player2.on('message', (message) => {
            //armazenar as LENGTH_EMBARCACOES posições do tabuleiro
            if (tabuleiro['player2'].length <= LENGTH_EMBARCACOES) {
                tabuleiro['player2'].push(message.toString());
                if (tabuleiro['player2'].length == LENGTH_EMBARCACOES) {
                    startMomento2();
                }
            }
        });
        //momento 2: atirar no tabuleiro
        let player1_acertos = 0;
        let player2_acertos = 0;
        function startMomento2() {
            if (!(tabuleiro['player1'].length === LENGTH_EMBARCACOES)) {
                player2.send(JSON.stringify({ message: 'Aguarde o oponente adicionar suas embarcações'}));
                return;
            }
            if (!(tabuleiro['player2'].length === LENGTH_EMBARCACOES)) {
                player1.send(JSON.stringify({ message: 'Aguarde o oponente adicionar suas embarcações'}));
                return;
            }

            //momento 2: atirar no tabuleiro
            if (tabuleiro['player1'].length === LENGTH_EMBARCACOES && tabuleiro['player2'].length === LENGTH_EMBARCACOES) {
                console.log('Momento 2...');
                player1.send(JSON.stringify({ message: 'Momento 2: Atire no tabuleiro do oponente', currentPlayer: 'player1'}));
                player2.send(JSON.stringify({ message: 'Momento 2: Atire no tabuleiro do oponente', currentPlayer: 'player1'}));
                player1.on('message', (message) => {
                    if (tabuleiro['player2'].includes(message.toString())) {
                        player1.send(JSON.stringify({ message: 'Acertou!', currentPlayer: 'player1'}));
                        player2.send(JSON.stringify({ message: 'Você foi atingido!', currentPlayer: 'player1'}));
                        player1_acertos++;
                    } else {
                        player1.send(JSON.stringify({ message: 'Errou!', currentPlayer: 'player2'}));
                        player2.send(JSON.stringify({ message: 'Você escapou!', currentPlayer: 'player2'}));
                    }
                    if (player1_acertos === LENGTH_EMBARCACOES) {
                        startMomento3('player1');
                    }
                });
                player2.on('message', (message) => {
                    if (tabuleiro['player1'].includes(message.toString())) {
                        player2.send(JSON.stringify({ message: 'Acertou!', currentPlayer: 'player2'}));
                        player1.send(JSON.stringify({ message: 'Você foi atingido!', currentPlayer: 'player2'}));
                        player2_acertos++;
                    } else {
                        player2.send(JSON.stringify({ message: 'Errou!', currentPlayer: 'player1'}));
                        player1.send(JSON.stringify({ message: 'Você escapou!', currentPlayer: 'player1'}));
                    }
                    if (player2_acertos === LENGTH_EMBARCACOES) {
                        startMomento3('player2');
                    }
                });
            }
        };
        //adicionando tempo da partida
        time.push({ id: gameId, time: 0 });
        setInterval(() => {
            if (time[gameId]) {
                time[gameId].time++;
                player1.send(JSON.stringify({ message: `Tempo da partida: ${time[gameId].time}s`}), 'time');
                player2.send(JSON.stringify({ message: `Tempo da partida: ${time[gameId].time}s`}), 'time');
            }
        }, 1000);

        //momento 3: finalizar jogo
        function startMomento3(vencendor) {
            console.log('Momento 3...');
            player1.send(JSON.stringify({ message: `Fim de jogo! O vencedor é o ${vencendor}`}));
            player2.send(JSON.stringify({ message: `Fim de jogo! O vencedor é o ${vencendor}`}));
            player1.close();
            player2.close();
            //remover o jogo da lista de jogos
            games = games.filter(game => game.id !== gameId);
            //remover o tempo da partida
            time = time.filter(t => t.id !== gameId);
        };
    }
});
