import { WebSocket,  WebSocketServer} from 'ws';
import { wsArcjet } from '../arcjet.js';

const matchSubscribers = new Map();

function subscribe(matchId, socket) {
    if (!matchSubscribers.has(matchId))
    {
        matchSubscribers.set(matchId, new Set());
    }

    matchSubscribers.get(matchId).add(socket);
}

function unSubscribe(matchId, socket) {
    const subscribers = matchSubscribers.get(matchId);

    if (!subscribers) return;

    subscribers.delete(socket);
    if(subscribers.size ===0)
    {
    matchSubscribers.delete(matchId);
    }
}

function cleanUpSubscriptions(socket) {
    for(const matchId of socket.subscriptions)
    {
        unSubscribe(matchId, socket);
    }
}



function sendJson(socket, payLoad) {
    if(socket.readyState !== WebSocket.OPEN) return ;

    socket.send(JSON.stringify(payLoad));
}

function broadcastToAll(wss, payLoad) {
    for(const client of wss.clients)
        {
            if(client.readyState !== WebSocket.OPEN) continue ;

            client.send(JSON.stringify(payLoad));
    }
}

function broadcastToMatch(matchId, payLoad) {
    const subscribers = matchSubscribers.get(matchId);

    if (!subscribers || subscribers.size === 0) return;

    const message = JSON.stringify(payLoad);
    for(const client of subscribers)
    {
        if(client.readyState === WebSocket.OPEN)
        {
            client.send(message);
        }
    }
}

function handleMessage(socket, data) {
    let message;
    try {
        message = JSON.parse(data.toString());
    }
    catch(e) {
        sendJson(socket, {type: 'error', message: 'Invalid JSON'});
    }

    if(message?.type === 'subscribe' && Number.isInteger(message.matchId))
    {
        subscribe(message.matchId, socket);
        socket.subscriptions.add(message.matchId);
        sendJson(socket, {type: 'subscribed', matchId: message.matchId});
        return;
    }

    if(message?.type === 'unsubscribe' && Number.isInteger(message.matchId))
    {
        unSubscribe(message.matchId, socket);
        socket.subscriptions.delete(message.matchId);
        sendJson(socket, {type: 'unsubscribed', matchId: message.matchId});
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

        socket.subscriptions = new Set();

        sendJson(socket, {type: 'Welcome'});

        socket.on('message', (data) => handleMessage(socket, data));
        socket.on('error', () => socket.terminate());

        socket.on('close', () => {
            cleanUpSubscriptions(socket);
        });

        socket.on('error', console.error);
    });

    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) {
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        })
    }, 30000);

    wss.on('close', () => clearInterval(interval));

    function broadcastMatchCreated(match) {
        broadcastToAll(wss, {type: 'MatchCreated', data: match});
    }
    function broadcastCommentary(matchId, comment) {
        broadcastToMatch(matchId, {type: 'Commentary', data: comment});
    }

    return { broadcastMatchCreated, broadcastCommentary };
}
