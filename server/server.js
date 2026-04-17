require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const rateLimiter = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: '*' } });

// attach io to app for controllers
app.set('io', io);
app.set('trust proxy', 1);

app.use(cors());
app.use(morgan('dev'));
app.use(rateLimiter);
app.use(bodyParser.json({ limit: '10mb' }));

// Connect DB
connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/smartpf');

// routes
app.use('/api', require('./routes/authRoutes'));
app.use('/api', require('./routes/dataRoutes'));
app.use('/api', require('./routes/controlRoutes'));
app.use('/api', require('./routes/aiRoutes'));
app.use('/api', require('./routes/exportRoutes'));
app.use('/api', require('./routes/overrideRoutes'));

// simple health
app.get('/health', (req, res) => res.json({ ok: true }));

// Socket events
io.on('connection', (socket) => {
  console.log('Socket connected', socket.id);
  socket.on('ping', (d) => socket.emit('pong', d));
  // send current system status and last control state
  (async () => {
    const LoadControl = require('./models/LoadControl');
    const last = await LoadControl.findOne().sort({ createdAt: -1 });
    if (last) socket.emit('control-update', last);
    if (last && last.disabled) socket.emit('system-status', { status: 'critical', reason: last.disableReason });
    else socket.emit('system-status', { status: 'normal' });
  })();
});

// start scheduler
const { scheduleDaily, scheduleAI } = require('./services/scheduler');
scheduleDaily(io);
scheduleAI(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
