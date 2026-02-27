import { WebSocket,  WebSocketServer} from 'ws';

function sendJson(socket, payLoad) {
    if(socket.readyState !== WebSocket.OPEN) return ;

    socket.send(JSON.stringify(payLoad));
}

function broadcast(wss, payLoad) {
    for(const client of wss.clients)
        {
            if(client.readyState !== WebSocket.OPEN) return ;

            client.send(JSON.stringify(payLoad));
    }
}

export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({server, path: '/ws',
        maxPayload: 1024* 1024});

    wss.on('connection', (socket) => {
        sendJson(socket, {type: 'Welcome'});

        socket.on('error', console.error);
    });

    function broadcastMatchCreated(match) {
        broadcast(wss, {type: 'MatchCreated', data: match});
    }
    return { broadcastMatchCreated };
}