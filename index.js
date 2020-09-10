const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const cors = require('cors');

const rooms = new Map();

app.use(cors());

app.get('/room/:id', (req, res) => {
    rooms.set('hello', '');
    res.json(rooms)
});

io.on('connection', socket => {
    console.log('user connected', socket.id)
});

http.listen(process.env.PORT || 3001, (err) => {
    if (err) {
        throw Error(err)
    }
    console.log('Server run');
});