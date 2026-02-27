import { WebSocket,  WebSocketServer} from 'ws';

function sendJson(socket, payLoad) {
    if(socket.readyState !== WebSocket.OPEN) return ;

    socket.send(JSON.stringify(payLoad));
}

function broadcast(wss, payLoad) {
    for(const client of wss.clients)
        {
            if(client.readyState !== WebSocket.OPEN) continue ;

            client.send(JSON.stringify(payLoad));
    }
}

export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({server, path: '/ws',
        maxPayload: 1024* 1024});

    wss.on('connection', (socket) => {
        socket.isAlive = true;

        socket.on('pong', () => { socket.isAlive = true;});

        sendJson(socket, {type: 'Welcome'});

        socket.on('error', console.error);
    });

    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (!ws.isAlive === false) {
                return ws.terminate();
            }
            wss.isAlive = false;
            ws.ping();
        })
    }, 30000);

    wss.on('close', () => clearInterval(interval));

    function broadcastMatchCreated(match) {
        broadcast(wss, {type: 'MatchCreated', data: match});
    }
    return { broadcastMatchCreated };
}