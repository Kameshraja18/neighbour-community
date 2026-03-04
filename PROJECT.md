# SafetyNet — Neighbourhood Community Safety Platform

A full-stack, real-time community safety application designed to help neighbours report incidents, trigger emergencies, track safe walks, and engage with their local community — all on an interactive map.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Data Models](#data-models)
- [API Endpoints](#api-endpoints)
- [Client Components](#client-components)
- [Real-Time (Socket.IO)](#real-time-socketio)
- [Authentication & Authorization](#authentication--authorization)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)

---

## Overview

SafetyNet empowers neighbourhoods by providing a centralized platform where residents can:

- **Report safety incidents** (crime, poor lighting, stray animals, road hazards, etc.)
- **Trigger SOS alerts** that notify nearby users and emergency contacts in real time
- **Track safe walks** with live GPS, check-ins, and emergency escalation
- **Browse a lost & found** board with a claim/reward workflow
- **Join community groups & events** for neighbourhood watch, meetups, and emergency response
- **View safety analytics** — heatmaps, safety scores, and trends on an interactive Leaflet map

Everything updates in real time via **Socket.IO**, and location data leverages **MongoDB geospatial indexes** for proximity-based queries.

---

## Tech Stack

| Layer | Technology |
| ----------- | ------------------------------------------------------------ |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4, Framer Motion |
| **Maps** | Leaflet + React-Leaflet, leaflet.heat (heatmap) |
| **Backend** | Node.js, Express 5, TypeScript |
| **Database** | MongoDB (Mongoose ODM) with 2dsphere geospatial indexes |
| **Real-Time**| Socket.IO (WebSockets) |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **Upload** | Multer (file uploads for photos/evidence) |
| **Security** | Helmet, CORS, express-rate-limit (100 req / 15 min) |
| **DevOps** | Docker & Docker Compose (3-service stack) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Docker Compose                        │
│                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐ │
│  │   Client      │   │   Server     │   │   MongoDB        │ │
│  │   (Vite)      │◄─►│  (Express)   │◄─►│   (mongo:latest) │ │
│  │   :5173       │   │   :5000      │   │   :27017         │ │
│  │               │   │              │   │                  │ │
│  │  React +      │   │  REST API +  │   │  13 Collections  │ │
│  │  Leaflet Map  │   │  Socket.IO   │   │  GeoJSON indexes │ │
│  └──────────────┘   └──────────────┘   └──────────────────┘ │
│         ▲                   ▲                                │
│         │    WebSocket      │                                │
│         └───────────────────┘                                │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Client** sends REST requests (Axios) to the **Server** at `/api/*`
2. **Server** processes requests, interacts with **MongoDB**, and responds
3. **Server** emits Socket.IO events for real-time updates (new incidents, SOS, walk tracking)
4. **Client** listens on Socket.IO rooms and updates the UI instantly

---

## Features

### 1. Interactive Map Dashboard
- OpenStreetMap tiles via Leaflet with incident markers (color-coded by urgency)
- Heatmap overlay showing incident density (`leaflet.heat`)
- Time range filters (24 hours / 7 days / 30 days)
- Area safety score display with detailed breakdown
- Live ticker for newly reported incidents (via Socket.IO)
- Click-to-report FAB (floating action button)

### 2. Incident Reporting
- 5 categories: Lighting, Roads, Animals, Crime, Other
- Upload up to 3 photos per incident
- Interactive map for location picking (auto-locates via Geolocation API)
- **Location fuzzing** — optional ~100-200m random offset for reporter privacy
- **Auto urgency scoring** — keywords in title/description drive urgency level
- Status workflow: `open` → `in_review` → `resolved` / `rejected`
- Notes/comments system (with `isOfficial` flag for authority responses)

### 3. SOS Emergency System
- Floating panic button with a 3-second countdown confirmation
- Uses browser Geolocation API + haptic vibration
- Broadcasts SOS to all nearby users via Socket.IO
- Notifies saved emergency contacts
- Active alert banner with cancel/resolve options
- Emergency contacts CRUD management

### 4. Safe Walk Tracking
- Start a tracked walk with expected duration (5–120 minutes)
- Live GPS tracking via `navigator.geolocation.watchPosition()`
- Periodic check-in system (configurable interval)
- Route recording (coordinate + timestamp trail)
- Emergency escalation button during walk
- ETA and time-remaining display

### 5. Lost & Found
- Post lost or found items across 8 categories (Pet, Electronics, Keys, Wallet, Bag, Document, Clothing, Other)
- Photo uploads and location tagging
- Optional reward system (amount in INR)
- Claim workflow: `pending` → `approved` / `rejected`
- Matching system to link lost items with found items

### 6. Community Hub
- **Groups**: Create/browse/join neighbourhood watch groups, emergency response teams, etc.
- Groups are geo-fenced with GeoJSON Polygon areas
- Privacy settings (anonymous posts, member approval, alert radius)
- **Events**: Create/browse community events with RSVP (going / interested / not going)
- Virtual event support with links

### 7. Notification Center
- Bell icon with unread badge count
- Priority-colored notifications (low / medium / high / critical)
- 7 notification types: incident, SOS, safe_walk, community, system, lost_found, alert
- Auto-polling every 30 seconds
- Mark as read / mark all read / delete

### 8. Authority Dashboard
- Role-restricted to `moderator`, `authority_admin`, `super_admin`
- Stats cards: total, active, resolved incidents + average response time
- Active SOS alert banner (pulsing animation)
- 3-tab layout: Incidents table, SOS emergencies, Analytics
- CSV export of incident data

### 9. Safety Analytics
- Grid-based safety scoring (0–100) with breakdown:
  - Crime rate, Lighting, Response time, Community engagement, Recent incidents
- Time-of-day scores (morning / afternoon / evening / night)
- Trend indicator (improving / stable / declining)
- Incident heatmap data for map overlay

---

## Data Models

The application uses **13 Mongoose models** with GeoJSON support:

| Model | Purpose | Key Fields |
| ------------------- | ---------------------------------- | ------------------------------------------------ |
| **User** | User accounts & profiles | displayName, email, role, homeLocation, trustScore, emergencyInfo |
| **Incident** | Safety incident reports | category, location (2dsphere), urgencyScore, status, photos[], notes[] |
| **SOSAlert** | Emergency panic alerts | userId, location, status, respondedBy, notifiedContacts[] |
| **SafeWalk** | Tracked walking sessions | start/end/current location, route[], checkInInterval, trackedBy[] |
| **LostAndFound** | Lost & found items | type (lost/found), category, reward, claims[], matchedWith |
| **CommunityGroup** | Neighbourhood groups | area (Polygon), members[], category, settings |
| **CommunityEvent** | Community events | location, attendees[], isVirtual, isRecurring |
| **Notification** | User notifications | type, priority, isRead, expiresAt |
| **WatchArea** | User-defined monitoring zones | center (2dsphere), radiusMeters, categories[] |
| **SafetyScore** | Grid-based area safety scores | gridId, score (0-100), breakdown, timeBasedScores, trend |
| **AlertZone** | Custom alert configurations | type (home/work/school/custom), alertSettings, quietHours |
| **Evidence** | Digital evidence for incidents | incidentId, type (photo/video/audio/document), verificationStatus |
| **EmergencyContact** | User emergency contacts | name, phone, relationship, isPrimary |

### User Roles

| Role | Access Level |
| ------------------- | ------------------------------------------- |
| `citizen` | Default. Report incidents, use SOS, etc. |
| `moderator` | Review incidents, access dashboard |
| `authority_admin` | Full incident management, analytics |
| `super_admin` | All permissions |

---

## API Endpoints

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
| ------ | ----------- | --------- | --------------------- |
| POST | `/register` | Public | Register new user |
| POST | `/login` | Public | Login, returns JWT |
| GET | `/me` | Protected | Get current user profile |

### Incidents — `/api/incidents`

| Method | Endpoint | Auth | Description |
| ------ | ------------------- | --------- | ------------------------------------------- |
| GET | `/` | Public | List incidents (geo, time, category, status filters) |
| POST | `/` | Protected | Create incident (multer: max 3 photos) |
| POST | `/sos` | Protected | Quick SOS as high-priority incident |
| PATCH | `/:id/status` | Admin | Update incident status |
| POST | `/:id/notes` | Protected | Add note/comment |
| GET | `/export` | Protected | CSV export |

### SOS — `/api/sos`

| Method | Endpoint | Auth | Description |
| ------ | ---------------------- | --------- | ----------------------------- |
| POST | `/trigger` | Protected | Trigger SOS alert |
| GET | `/active` | Protected | Get active SOS alerts |
| PATCH | `/:alertId/respond` | Protected | Respond to SOS |
| PATCH | `/:alertId/resolve` | Protected | Resolve SOS |
| PATCH | `/:alertId/cancel` | Protected | Cancel own SOS |
| GET | `/contacts` | Protected | List emergency contacts |
| POST | `/contacts` | Protected | Add emergency contact |
| PUT | `/contacts/:contactId` | Protected | Update emergency contact |
| DELETE | `/contacts/:contactId`| Protected | Delete emergency contact |

### Safe Walk — `/api/safe-walk`

| Method | Endpoint | Auth | Description |
| ------ | ----------------------- | --------- | -------------------------------- |
| POST | `/start` | Protected | Start a tracked walk |
| PATCH | `/:walkId/location` | Protected | Update current location |
| POST | `/:walkId/checkin` | Protected | Check in during walk |
| PATCH | `/:walkId/complete` | Protected | Complete the walk |
| POST | `/:walkId/emergency` | Protected | Trigger emergency during walk |
| PATCH | `/:walkId/cancel` | Protected | Cancel the walk |
| GET | `/my-walks` | Protected | List user's walks |
| GET | `/active` | Protected | List active walks |
| GET | `/:walkId` | Protected | Get walk details |

### Community — `/api/community`

| Method | Endpoint | Auth | Description |
| ------ | --------------------------------- | --------- | ----------------------------- |
| GET | `/groups` | Public | List community groups |
| POST | `/groups` | Protected | Create group |
| POST | `/groups/:groupId/join` | Protected | Join group |
| POST | `/groups/:groupId/leave` | Protected | Leave group |
| GET | `/groups/my-groups` | Protected | List user's groups |
| GET | `/events` | Public | List events |
| POST | `/events` | Protected | Create event |
| POST | `/events/:eventId/rsvp` | Protected | RSVP to event |
| GET | `/events/my-events` | Protected | List user's events |

### Lost & Found — `/api/lost-found`

| Method | Endpoint | Auth | Description |
| ------ | ----------------------------- | --------- | -------------------------------- |
| GET | `/` | Public | List items (type, category filters) |
| POST | `/` | Protected | Report lost/found item |
| GET | `/:id` | Public | Get item details |
| PATCH | `/:id` | Protected | Update item |
| DELETE | `/:id` | Protected | Delete item |
| POST | `/:id/claim` | Protected | Claim an item |
| PATCH | `/:id/claims/:claimId` | Protected | Handle claim (approve/reject) |
| GET | `/:id/matches` | Protected | Find matching items |
| GET | `/my-items` | Protected | List user's items |

### Analytics — `/api/analytics`

| Method | Endpoint | Auth | Description |
| ------ | ---------------- | ------ | ------------------------------ |
| GET | `/safety-score` | Public | Grid-based safety score |
| GET | `/heatmap` | Public | Incident heatmap data |
| GET | `/trends` | Public | Safety trends over time |
| GET | `/stats` | Public | Area statistics |

---

## Client Components

### Pages

| Page | Route | Description |
| ------------------- | ------------ | ------------------------------------------ |
| **LeafletMap** | `/` | Home — interactive map with all overlays |
| **Login** | `/login` | Login form |
| **Register** | `/register` | Registration form |
| **ReportIncident** | `/report` | Incident report form (protected) |
| **Dashboard** | `/dashboard` | Authority dashboard (role-restricted) |

### UI Components

| Component | Description |
| ----------------------- | ---------------------------------------------------------- |
| **Layout** | App shell — animated sidebar, glassmorphic navigation, renders floating components |
| **LeafletMap** | Map view — incident markers, heatmap toggle, search, live ticker |
| **HeatmapLayer** | Leaflet.heat wrapper for heatmap rendering |
| **IncidentDetail** | Modal — incident details, photos, timeline, notes/comments |
| **SOSButton** | Floating panic button with countdown, emergency contacts |
| **SafeWalkPanel** | Floating panel — start/track walks, check-in, emergency |
| **LostAndFound** | Full modal — browse, report, claim items (3 tabs) |
| **CommunityHub** | Full modal — groups, events, RSVP (3 tabs) |
| **NotificationCenter** | Bell icon + slide-in panel with notification management |
| **AuthorityDashboard** | Stats, incident table, SOS cards, analytics |
| **SafetyScoreCard** | Circular SVG gauge (0-100) with breakdown bars |
| **Timeline** | Activity timeline for incident history |
| **ProtectedRoute** | Route guard — checks auth and optional role requirements |

---

## Real-Time (Socket.IO)

### Socket Rooms

| Room Pattern | Purpose |
| ---------------------- | --------------------------------------------- |
| `user_{userId}` | User-specific notifications |
| `grid_{lat}_{lng}` | Location-based alerts (grid cells) |
| `safe_walk_{walkId}` | Walk tracking updates |

### Events Emitted (Server → Client)

| Event | Payload | When |
| ------------------- | -------------- | ------------------------------------ |
| `incident:created` | Incident data | New incident reported |
| `incident:updated` | Incident data | Incident status/notes changed |
| `sos:alert` | SOS data | SOS triggered |

### Events Listened (Client → Server)

| Event | Payload | Purpose |
| ------------------- | ---------------------- | ----------------------------------- |
| `join_user_room` | userId | Subscribe to personal notifications |
| `join_location` | { lat, lng } | Subscribe to nearby alerts |
| `track_walk` | walkId | Start receiving walk updates |
| `untrack_walk` | walkId | Stop receiving walk updates |

---

## Authentication & Authorization

- **JWT-based**: Token returned on login/register, stored in `localStorage`
- **Axios interceptor**: Token automatically attached as `Authorization: Bearer <token>`
- **Middleware**:
  - `protect` — verifies JWT, attaches user to request
  - `admin` — checks role is `moderator`, `authority_admin`, or `super_admin`
- **Route guards**: `<ProtectedRoute>` React component checks auth status and optional `allowedRoles`

---

## Getting Started

### Prerequisites

- **Node.js** (v18+)
- **MongoDB** (local or Atlas)
- **npm**

### Option 1: Docker Compose (Recommended)

```bash
docker-compose up --build
```

This starts all three services:
- Client at `http://localhost:5173`
- Server at `http://localhost:5000`
- MongoDB at `localhost:27017`

### Option 2: Manual Setup

**1. Start MongoDB** (must be running on `localhost:27017`)

**2. Server**

```bash
cd server
npm install
npm run dev
```

**3. Client** (in a new terminal)

```bash
cd client
npm install
npm run dev
```

- Client: `http://localhost:5173`
- Server API: `http://localhost:5000/api`

---

## Environment Variables

### Server (`server/.env`)

| Variable | Default | Description |
| ------------ | --------------------------------------- | -------------------------------- |
| `PORT` | `5000` | Server port |
| `MONGO_URI` | `mongodb://localhost:27017/safety-network` | MongoDB connection string |
| `JWT_SECRET` | — | Secret key for JWT signing |
| `NODE_ENV` | `development` | Environment mode |
| `CLIENT_URL` | `http://localhost:5173` | Client URL (for CORS) |

### Client (via Vite)

| Variable | Default | Description |
| -------------- | ------------------------------ | ----------------------- |
| `VITE_API_URL` | `http://localhost:5000/api` | Backend API base URL |

---

## Project Structure

```
neighbour-community/
├── docker-compose.yml          # 3-service stack (client, server, mongo)
│
├── client/                     # React Frontend
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── App.tsx             # Route definitions
│       ├── main.tsx            # Entry point
│       ├── components/
│       │   ├── Layout.tsx              # App shell + sidebar
│       │   ├── LeafletMap.tsx          # Interactive map dashboard
│       │   ├── HeatmapLayer.tsx        # Heatmap overlay
│       │   ├── IncidentDetail.tsx      # Incident detail modal
│       │   ├── SOSButton.tsx           # Emergency panic button
│       │   ├── SafeWalkPanel.tsx       # Walk tracking panel
│       │   ├── LostAndFound.tsx        # Lost & found board
│       │   ├── CommunityHub.tsx        # Groups & events
│       │   ├── NotificationCenter.tsx  # Notification management
│       │   ├── AuthorityDashboard.tsx  # Authority analytics
│       │   ├── SafetyScoreCard.tsx     # Safety score gauge
│       │   ├── Timeline.tsx            # Activity timeline
│       │   └── ProtectedRoute.tsx      # Auth route guard
│       ├── context/
│       │   ├── AuthContext.tsx          # Auth state management
│       │   └── SocketContext.tsx        # Socket.IO context
│       ├── pages/
│       │   ├── Dashboard.tsx           # Authority dashboard page
│       │   ├── Login.tsx               # Login form
│       │   ├── Register.tsx            # Registration form
│       │   └── ReportIncident.tsx      # Incident report form
│       └── services/
│           ├── authService.ts          # Auth API calls
│           └── incidentService.ts      # Incident API calls
│
└── server/                     # Express Backend
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── server.ts           # Entry — Express + Socket.IO setup
        ├── config/
        │   └── db.ts                   # MongoDB connection
        ├── controllers/
        │   ├── authController.ts       # Register, login, profile
        │   ├── incidentController.ts   # CRUD + geo queries + CSV export
        │   ├── sosController.ts        # SOS trigger/respond/resolve
        │   ├── safeWalkController.ts   # Walk lifecycle management
        │   ├── communityController.ts  # Groups & events CRUD
        │   ├── lostFoundController.ts  # Lost & found + claims
        │   ├── notificationController.ts # Notification management
        │   ├── analyticsController.ts  # Safety scores, heatmaps, trends
        │   └── watchAreaController.ts  # Watch area CRUD
        ├── middleware/
        │   ├── authMiddleware.ts       # JWT verification + role check
        │   └── uploadMiddleware.ts     # Multer file upload config
        ├── models/                     # 13 Mongoose schemas
        │   ├── User.ts
        │   ├── Incident.ts
        │   ├── SOSAlert.ts
        │   ├── SafeWalk.ts
        │   ├── LostAndFound.ts
        │   ├── CommunityGroup.ts
        │   ├── CommunityEvent.ts
        │   ├── Notification.ts
        │   ├── WatchArea.ts
        │   ├── SafetyScore.ts
        │   ├── AlertZone.ts
        │   ├── Evidence.ts
        │   └── EmergencyContact.ts
        ├── routes/                     # Express route definitions
        │   ├── authRoutes.ts
        │   ├── incidentRoutes.ts
        │   ├── sosRoutes.ts
        │   ├── safeWalkRoutes.ts
        │   ├── communityRoutes.ts
        │   ├── lostFoundRoutes.ts
        │   ├── notificationRoutes.ts
        │   ├── analyticsRoutes.ts
        │   └── watchAreaRoutes.ts
        ├── utils/
        │   ├── generateToken.ts        # JWT token generation
        │   ├── notificationLogic.ts    # Notification creation logic
        │   └── urgency.ts             # Urgency score calculation
        └── uploads/                    # Uploaded files directory
```

---

## Notable Design Patterns

| Pattern | Details |
| ----------------------- | --------------------------------------------------------- |
| **Location Privacy** | Optional location fuzzing (~100-200m random offset) on incident reports to protect reporter identity |
| **Auto Urgency Scoring** | Keywords in title/description/category are analyzed to calculate urgency level automatically |
| **GeoJSON Everywhere** | All location fields use MongoDB 2dsphere indexes for `$near` and `$geoWithin` spatial queries |
| **Grid-Based Safety** | Safety scores computed per geographic grid cell with multi-factor breakdown |
| **Real-Time First** | Every mutation emits Socket.IO events for instant UI updates |
| **Role-Based Access** | 4-tier role hierarchy enforced at middleware and component level |
| **Glassmorphic UI** | Dark theme with backdrop-blur, gradients, and Framer Motion animations |

---

## License

ISC
