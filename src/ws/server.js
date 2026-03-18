import { WebSocket,  WebSocketServer} from 'ws';
import { wsArcjet } from '../arcjet.js';

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
    const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 * 1024 });

    server.on('upgrade', async (req, socket, head) => {
        if (req.url !== '/ws') {
            socket.destroy();
            return;
        }

        if (wsArcjet) {
            try {
                const decision = await wsArcjet.protect(req);
                if (decision.isDenied()) {
                    const code = decision.reason.isRateLimit() ? 1013 : 1008;
                    const reason = decision.reason.isRateLimit() ? 'Rate Limit exceeded.' : 'Access denied.';
                    socket.end(`HTTP/1.1 ${code} ${reason}\r\nConnection: close\r\n\r\n`);
                    socket.destroy();
                    return;
                }
            }
            catch (e) {
                console.error('Ws connection error:', e);
                socket.end('HTTP/1.1 1011 Server security error\r\nConnection: close\r\n\r\n');
                socket.destroy();
                return;
            }
        }

        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req);
        });
    });

    wss.on('connection', async (socket, req) => {

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