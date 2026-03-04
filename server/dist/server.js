"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const db_1 = __importDefault(require("./config/db"));
const path_1 = __importDefault(require("path"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Route imports
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const incidentRoutes_1 = __importDefault(require("./routes/incidentRoutes"));
const watchAreaRoutes_1 = __importDefault(require("./routes/watchAreaRoutes"));
const sosRoutes_1 = __importDefault(require("./routes/sosRoutes"));
const safeWalkRoutes_1 = __importDefault(require("./routes/safeWalkRoutes"));
const communityRoutes_1 = __importDefault(require("./routes/communityRoutes"));
const lostFoundRoutes_1 = __importDefault(require("./routes/lostFoundRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
dotenv_1.default.config();
(0, db_1.default)();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: '*', // Allow all for MVP, restrict in production
        methods: ['GET', 'POST', 'PATCH', 'DELETE']
    }
});
app.set('socketio', io);
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const __dirname = path_1.default.resolve();
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '/uploads')));
// Rate Limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/incidents', incidentRoutes_1.default);
app.use('/api/watch-areas', watchAreaRoutes_1.default);
app.use('/api/sos', sosRoutes_1.default);
app.use('/api/safe-walk', safeWalkRoutes_1.default);
app.use('/api/community', communityRoutes_1.default);
app.use('/api/lost-found', lostFoundRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/analytics', analyticsRoutes_1.default);
// Basic Route
app.get('/', (req, res) => {
    res.send('Community Safety API is running - All Premium Features Enabled! 🚀');
});
// Socket.IO Connection
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    // Join user-specific room for notifications
    socket.on('join_user_room', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${socket.id} joined room: user_${userId}`);
    });
    // Join location-based room for nearby alerts
    socket.on('join_location', (data) => {
        const gridId = `grid_${Math.floor(data.lat * 100)}_${Math.floor(data.lng * 100)}`;
        socket.join(gridId);
        console.log(`User ${socket.id} joined location room: ${gridId}`);
    });
    // Safe walk tracking
    socket.on('track_walk', (walkId) => {
        socket.join(`safe_walk_${walkId}`);
        console.log(`User ${socket.id} tracking walk: ${walkId}`);
    });
    socket.on('untrack_walk', (walkId) => {
        socket.leave(`safe_walk_${walkId}`);
    });
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
