require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketio = require('socket.io');


const app = express();
const server = http.createServer(app);
const io = socketio(server);
const PORT = 3001;

app.use(cors());
app.use(express.json());

const rooms = new Map();

//get the arrays of users and messages in the room by roomID
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

//create the room after roomID validation
app.post('/rooms', (req, res) => {
    const {roomId} = req.body;

    if (roomId.match('(?=.*[0-9])(?=.*[a-z])[0-9a-z]{10}') === null) {
        res.status(500).json({
            status: false,
            message: "Room ID must contains only of numbers and lowercase letters!"
        })
    } else {
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Map([
                ['users', new Map()],
                ['messages', []]
            ]))
        }

        res.send()
    }
});

io.on('connection', socket => {
    //add the user to the users list in the room
    socket.on('ROOM:JOIN', ({roomId, userName}) => {
        socket.join(roomId);
        rooms.get(roomId).get('users').set(socket.id, userName);
        const users = [...rooms.get(roomId).get('users').values()];
        io.in(roomId).emit('ROOM:SET_USERS', users);
    });

    //send the message to all users in the room
    socket.on('ROOM:NEW_MESSAGE', ({roomId, userName, text, sendingTime}) => {
        const dataObj = {
            userName,
            text,
            sendingTime
        };

        rooms.get(roomId).get('messages').push(dataObj);
        socket.to(roomId).broadcast.emit('ROOM:NEW_MESSAGE', dataObj);
    });

    //delete user from the users list after disconnecting
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

server.listen(process.env.PORT || PORT, (err) => {
    if (err) {
        throw Error(err)
    }
    console.log('Server run');
});