# ⚡ Sportz — Real-Time Sports Application

A real-time sports application built with **Express.js**, **Drizzle ORM**, **PostgreSQL**, and **Zod** validation. It provides APIs to manage matches, track live scores, and store play-by-play commentary.

---

## 📑 Table of Contents

- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [Database Schema](#-database-schema)
- [Validation Schemas](#-validation-schemas)
- [API Endpoints](#-api-endpoints)
- [Utilities](#-utilities)

---

## 🛠 Tech Stack

| Layer          | Technology                                      |
| -------------- | ----------------------------------------------- |
| Runtime        | [Node.js](https://nodejs.org/)                  |
| Framework      | [Express v5](https://expressjs.com/)            |
| Database       | [PostgreSQL](https://www.postgresql.org/)       |
| ORM            | [Drizzle ORM](https://orm.drizzle.team/)        |
| Migrations     | [Drizzle Kit](https://orm.drizzle.team/kit)     |
| Validation     | [Zod](https://zod.dev/)                         |
| Env Management | [dotenv](https://github.com/motdotla/dotenv)    |

---

## 📁 Project Structure

```
Sportz/
├── drizzle/                        # Auto-generated migration files
│   └── 0000_quick_kat_farrell.sql  # Initial migration
├── src/
│   ├── index.js                    # Express server entry point
│   ├── db/
│   │   ├── db.js                   # Database connection (pg Pool + Drizzle)
│   │   └── schema.js               # Drizzle ORM table & enum definitions
│   ├── routes/
│   │   └── matches.js              # Match route handlers
│   ├── utils/
│   │   └── match-status.js         # Match status computation helpers
│   └── validation/
│       └── matches.js              # Zod validation schemas
├── .env                            # Environment variables (not committed)
├── .gitignore
├── drizzle.config.js               # Drizzle Kit configuration
├── package.json
└── package-lock.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** running locally or remotely

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd Sportz

# 2. Install dependencies
npm install

# 3. Create a .env file with your database connection string
#    (see Environment Variables section below)

# 4. Generate database migrations
npm run db:generate

# 5. Run migrations against your database
npm run db:migrate

# 6. Start the development server
npm run dev
```

The server starts at **http://localhost:8000**.

---

## 🔐 Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
```

| Variable       | Required | Description                              |
| -------------- | -------- | ---------------------------------------- |
| `DATABASE_URL` | ✅       | PostgreSQL connection string (URI format) |

---

## 📜 Available Scripts

| Script             | Command                    | Description                                            |
| ------------------ | -------------------------- | ------------------------------------------------------ |
| `npm run dev`      | `node --watch src/index.js`| Start dev server with auto-reload on file changes      |
| `npm start`        | `node src/index.js`        | Start the production server                            |
| `npm run db:generate` | `drizzle-kit generate`  | Generate SQL migration files from schema changes       |
| `npm run db:migrate`  | `drizzle-kit migrate`   | Run pending migrations against the database            |
| `npm run db:push`     | `drizzle-kit push`      | Push schema directly to database (dev shortcut)        |
| `npm run db:studio`   | `drizzle-kit studio`    | Open Drizzle Studio for visual database management     |

---

## 🗄 Database Schema

Defined in `src/db/schema.js` using Drizzle ORM. All variables use **camelCase**; all database columns use **snake_case**.

### Enum: `match_status`

```
'scheduled' | 'live' | 'finished'
```

### Table: `matches`

| Column       | DB Column    | Type           | Constraints              |
| ------------ | ------------ | -------------- | ------------------------ |
| `id`         | `id`         | `serial`       | Primary Key              |
| `sport`      | `sport`      | `varchar(50)`  | NOT NULL                 |
| `homeTeam`   | `home_team`  | `varchar(100)` | NOT NULL                 |
| `awayTeam`   | `away_team`  | `varchar(100)` | NOT NULL                 |
| `status`     | `status`     | `match_status` | NOT NULL, default `'scheduled'` |
| `startTime`  | `start_time` | `timestamp`    | —                        |
| `endTime`    | `end_time`   | `timestamp`    | —                        |
| `homeScore`  | `home_score` | `integer`      | NOT NULL, default `0`    |
| `awayScore`  | `away_score` | `integer`      | NOT NULL, default `0`    |
| `createdAt`  | `created_at` | `timestamp`    | NOT NULL, default `now()`|

### Table: `commentary`

| Column       | DB Column    | Type           | Constraints                                              |
| ------------ | ------------ | -------------- | -------------------------------------------------------- |
| `id`         | `id`         | `serial`       | Primary Key                                              |
| `matchId`    | `match_id`   | `integer`      | NOT NULL, FK → `matches.id` (ON DELETE CASCADE)          |
| `minute`     | `minute`     | `integer`      | NOT NULL                                                 |
| `sequence`   | `sequence`   | `integer`      | NOT NULL                                                 |
| `period`     | `period`     | `varchar(50)`  | NOT NULL                                                 |
| `eventType`  | `event_type` | `varchar(50)`  | NOT NULL                                                 |
| `actor`      | `actor`      | `varchar(100)` | Nullable                                                 |
| `team`       | `team`       | `varchar(100)` | NOT NULL                                                 |
| `message`    | `message`    | `text`         | NOT NULL                                                 |
| `metadata`   | `metadata`   | `jsonb`        | Nullable                                                 |
| `tags`       | `tags`       | `text`         | Nullable                                                 |
| `createdAt`  | `created_at` | `timestamp`    | NOT NULL, default `now()`                                |

### Entity Relationship

```
┌────────────┐        ┌──────────────┐
│  matches   │ 1────∞ │  commentary  │
│            │        │              │
│  id (PK)   │◄───────│  match_id(FK)│
│  sport     │        │  minute      │
│  home_team │        │  sequence    │
│  away_team │        │  period      │
│  status    │        │  event_type  │
│  start_time│        │  actor       │
│  end_time  │        │  team        │
│  home_score│        │  message     │
│  away_score│        │  metadata    │
│  created_at│        │  tags        │
└────────────┘        │  created_at  │
                      └──────────────┘
```

---

## ✅ Validation Schemas

Defined in `src/validation/matches.js` using **Zod**.

### `MATCH_STATUS` (Constant)

```js
{
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
}
```

### `listMatchesQuerySchema`

Validates query parameters for listing matches.

| Field   | Type      | Required | Rules                           |
| ------- | --------- | -------- | ------------------------------- |
| `limit` | `number`  | No       | Coerced, positive integer, max 100 |

### `matchIdParamSchema`

Validates URL parameters.

| Field | Type     | Required | Rules                       |
| ----- | -------- | -------- | --------------------------- |
| `id`  | `number` | Yes      | Coerced, positive integer   |

### `createMatchSchema`

Validates the request body when creating a match.

| Field       | Type     | Required | Rules                                            |
| ----------- | -------- | -------- | ------------------------------------------------ |
| `sport`     | `string` | Yes      | Trimmed, min length 1                            |
| `homeTeam`  | `string` | Yes      | Trimmed, min length 1                            |
| `awayTeam`  | `string` | Yes      | Trimmed, min length 1                            |
| `startTime` | `string` | Yes      | Must be a valid ISO 8601 date string             |
| `endTime`   | `string` | Yes      | Must be a valid ISO 8601 date string             |
| `homeScore` | `number` | No       | Coerced, non-negative integer                    |
| `awayScore` | `number` | No       | Coerced, non-negative integer                    |

**Refinements:**
- `startTime` and `endTime` are validated as parseable ISO 8601 date strings.
- A `superRefine` check ensures `endTime` is chronologically **after** `startTime`.

### `updateScoreSchema`

Validates the request body when updating match scores.

| Field       | Type     | Required | Rules                        |
| ----------- | -------- | -------- | ---------------------------- |
| `homeScore` | `number` | Yes      | Coerced, non-negative integer|
| `awayScore` | `number` | Yes      | Coerced, non-negative integer|

---

## 🌐 API Endpoints

Base URL: `http://localhost:8000`

### Root

| Method | Endpoint | Description          |
| ------ | -------- | -------------------- |
| GET    | `/`      | Health check message |

**Response:**
```
Hello from Express Server !
```

### Matches

All match routes are mounted at `/matches`.

| Method | Endpoint    | Description        | Request Body / Params             |
| ------ | ----------- | ------------------ | --------------------------------- |
| GET    | `/matches`  | List all matches   | Query: `?limit=<number>` (optional) |
| POST   | `/matches`  | Create a new match | Body: `createMatchSchema` payload |

#### `GET /matches`

Returns a list of matches.

**Example Response:**
```json
{
  "message": "Matches List"
}
```

#### `POST /matches`

Creates a new match record.

**Example Request Body:**
```json
{
  "sport": "football",
  "homeTeam": "Arsenal",
  "awayTeam": "Chelsea",
  "startTime": "2026-03-01T15:00:00.000Z",
  "endTime": "2026-03-01T17:00:00.000Z"
}
```

**Error Responses:**

| Status | Condition            | Body                                              |
| ------ | -------------------- | ------------------------------------------------- |
| 400    | Validation failure   | `{ message: "Invalid payload", details: "..." }`  |
| 500    | Database error       | `{ error: "Failed to create a match", details: "..." }` |

---

## 🔧 Utilities

### `src/utils/match-status.js`

Helper functions for computing and syncing match status based on time.

#### `getMatchStatus(startTime, endTime, now?)`

Determines the current status of a match based on the current time.

| Parameter   | Type   | Default       | Description                  |
| ----------- | ------ | ------------- | ---------------------------- |
| `startTime` | `any`  | —             | Match start time             |
| `endTime`   | `any`  | —             | Match end time               |
| `now`       | `Date` | `new Date()`  | Current time for comparison  |

**Returns:** `'scheduled'` | `'live'` | `'finished'` | `null`

**Logic:**
- Returns `null` if either date is invalid.
- Returns `'scheduled'` if `now < startTime`.
- Returns `'finished'` if `now >= endTime`.
- Returns `'live'` otherwise.

#### `syncMatchStatus(match, updateStatus)`

Compares the current computed status with the stored status and triggers an update if they differ.

| Parameter      | Type       | Description                                    |
| -------------- | ---------- | ---------------------------------------------- |
| `match`        | `object`   | Match object with `startTime`, `endTime`, `status` |
| `updateStatus` | `function` | Async callback to persist the new status       |

**Returns:** The current (possibly updated) `match.status`.

---

## 🗃 Database Connection

Defined in `src/db/db.js`.

- Uses `pg.Pool` for connection pooling.
- Wrapped with `drizzle()` for Drizzle ORM query building.
- Requires `DATABASE_URL` environment variable.

**Exports:**
| Export  | Type       | Description                        |
| ------- | ---------- | ---------------------------------- |
| `pool`  | `pg.Pool`  | Raw PostgreSQL connection pool     |
| `db`    | `Drizzle`  | Drizzle ORM instance for queries   |

---

## 📦 Dependencies

### Production

| Package       | Version  | Purpose                          |
| ------------- | -------- | -------------------------------- |
| `express`     | ^5.2.1   | HTTP framework                   |
| `drizzle-orm` | ^0.45.1  | Type-safe ORM for PostgreSQL     |
| `pg`          | ^8.18.0  | PostgreSQL client for Node.js    |
| `zod`         | ^4.3.6   | Schema validation                |
| `dotenv`      | ^17.3.1  | Environment variable management  |

### Development

| Package       | Version  | Purpose                          |
| ------------- | -------- | -------------------------------- |
| `drizzle-kit` | ^0.31.9  | Migration generation & studio    |

---

## 📄 License

ISC

