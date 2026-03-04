import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db';
import path from 'path';
import rateLimit from 'express-rate-limit';

// Route imports
import authRoutes from './routes/authRoutes';
import incidentRoutes from './routes/incidentRoutes';
import watchAreaRoutes from './routes/watchAreaRoutes';
import sosRoutes from './routes/sosRoutes';
import safeWalkRoutes from './routes/safeWalkRoutes';
import communityRoutes from './routes/communityRoutes';
import lostFoundRoutes from './routes/lostFoundRoutes';
import notificationRoutes from './routes/notificationRoutes';
import analyticsRoutes from './routes/analyticsRoutes';

dotenv.config();

connectDB();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*', // Allow all for MVP, restrict in production
        methods: ['GET', 'POST', 'PATCH', 'DELETE']
    }
});

app.set('socketio', io);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/watch-areas', watchAreaRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/safe-walk', safeWalkRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.send('Community Safety API is running - All Premium Features Enabled! 🚀');
});

// Socket.IO Connection
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join user-specific room for notifications
    socket.on('join_user_room', (userId: string) => {
        socket.join(`user_${userId}`);
        console.log(`User ${socket.id} joined room: user_${userId}`);
    });

    // Join location-based room for nearby alerts
    socket.on('join_location', (data: { lat: number; lng: number }) => {
        const gridId = `grid_${Math.floor(data.lat * 100)}_${Math.floor(data.lng * 100)}`;
        socket.join(gridId);
        console.log(`User ${socket.id} joined location room: ${gridId}`);
    });

    // Safe walk tracking
    socket.on('track_walk', (walkId: string) => {
        socket.join(`safe_walk_${walkId}`);
        console.log(`User ${socket.id} tracking walk: ${walkId}`);
    });

    socket.on('untrack_walk', (walkId: string) => {
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
