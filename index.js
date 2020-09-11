const express = require('express');
const cors = require('cors');

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(cors());
app.use(express.json());

const rooms = new Map();

app.get('/room/:id', (req, res) => {
    const {id: roomId} = req.params;

    const dataObj = rooms.has(roomId)
        ? {
            users: [...rooms.get(roomId).get('users').values()],
            messages: [...rooms.get(roomId).get('messages').values()]
        }
        : {users: [], messages: []};

    res.json(dataObj)
});

app.post('/rooms', (req, res) => {
    const {roomId} = req.body;

    if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map([
            ['users', new Map()],
            ['messages', []]
        ]))
    }

    res.send()
});

io.on('connection', socket => {
    socket.on('ROOM:JOIN', ({roomId, userName}) => {
        socket.join(roomId);
        rooms.get(roomId).get('users').set(socket.id, userName);
        const users = [...rooms.get(roomId).get('users').values()];
        io.in(roomId).emit('ROOM:SET_USERS', users);
    });

    socket.on('ROOM:NEW_MESSAGE', ({roomId, userName, text, sendingTime}) => {
        const dataObj = {
            userName,
            text,
            sendingTime
        };

        rooms.get(roomId).get('messages').push(dataObj);
        socket.to(roomId).broadcast.emit('ROOM:NEW_MESSAGE', dataObj);
    });

    socket.on('disconnect', () => {
        rooms.forEach((value, roomId) => {
            if (value.get('users').delete(socket.id)) {
                const users = [...value.get('users').values()];
                io.in(roomId).emit('ROOM:SET_USERS', users)
            }
        })
    });

    console.log('user connected', socket.id)
});

http.listen(process.env.PORT || 3001, (err) => {
    if (err) {
        throw Error(err)
    }
    console.log('Server run');
});