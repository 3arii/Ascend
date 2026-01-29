# ShredTracker: Complete Development Documentation

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack & Justification](#2-technology-stack--justification)
3. [Development Environment Setup](#3-development-environment-setup)
4. [Project Structure](#4-project-structure)
5. [Database Design](#5-database-design)
6. [Feature 1: Workout Tracker](#6-feature-1-workout-tracker)
7. [Feature 2: Nutrition Tracker](#7-feature-2-nutrition-tracker)
8. [Feature 3: Daily Check-ins (Photos & Weight)](#8-feature-3-daily-check-ins-photos--weight)
9. [Feature 4: Dashboard & Analytics](#9-feature-4-dashboard--analytics)
10. [Data Files (Workouts & Meals JSON)](#10-data-files-workouts--meals-json)
11. [Mobile Access Setup](#11-mobile-access-setup)
12. [Raspberry Pi Migration Guide](#12-raspberry-pi-migration-guide)
13. [Development Timeline](#13-development-timeline)

---

## 1. Project Overview

### 1.1 What You're Building

A personal fitness tracking web application that runs locally on your MacBook (and later Raspberry Pi) and is accessed via your iPhone's browser. The app will:

- Guide you through your 6-day PPL workout program with rest timers and progressive overload calculations
- Tell you exactly what to eat and when, based on your 6am wake time
- Collect daily progress photos and morning weigh-ins
- Visualize your transformation over time with charts and metrics

### 1.2 Core Principles

| Principle | Description |
|-----------|-------------|
| **Offline-first** | Works without internet once loaded |
| **Mobile-optimized** | Designed for iPhone Safari, used with sweaty gym hands |
| **Data ownership** | All your data stays on your machine |
| **Simplicity** | No accounts, no auth, no complexity - just you |
| **Evidence-based** | All calculations backed by research from your shred guide |

### 1.3 User Flow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        DAILY FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   6:00 AM  ──►  Wake up notification: "Log morning weight"       │
│                 ▼                                                │
│   6:05 AM  ──►  Weight logged, breakfast shown                   │
│                 ▼                                                │
│   Throughout   Meal reminders at scheduled times                 │
│   Day          ▼                                                │
│   4:00 PM  ──►  "Time for Push A workout"                        │
│                 ▼                                                │
│                 Start workout → Exercise animations →            │
│                 Log sets → Rest timer → Next exercise            │
│                 ▼                                                │
│   Post-       "Workout complete! Take progress photo"            │
│   Workout      ▼                                                │
│                 Dashboard updates with new data                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack & Justification

### 2.1 Frontend Technologies

| Technology | Purpose | Why This Choice |
|------------|---------|-----------------|
| **Next.js 14 (App Router)** | React framework | Single codebase for frontend + API, excellent developer experience, works great on Raspberry Pi |
| **TypeScript** | Type safety | Catch errors early, better IDE support, self-documenting code |
| **Tailwind CSS** | Styling | Rapid prototyping, mobile-first utilities, no separate CSS files |
| **Framer Motion** | Animations | Smooth page transitions, rest timer animations, celebration effects |
| **Recharts** | Data visualization | React-native charts, good for weight/progress tracking |

### 2.2 Backend Technologies

| Technology | Purpose | Why This Choice |
|------------|---------|-----------------|
| **Next.js API Routes** | REST API | No separate server needed, same codebase, automatic routing |
| **better-sqlite3** | Database | Zero config, single file, blazing fast, perfect for single-user apps, easy to backup |
| **Sharp** | Image processing | Compress progress photos, create thumbnails, reduce storage |

### 2.3 Exercise Animations

| Option | Technology | Description |
|--------|------------|-------------|
| **Primary** | LottieFiles + lottie-react | Large free library of fitness animations in lightweight JSON format |
| **Fallback** | Static SVG illustrations | Simple movement diagrams if Lottie animations unavailable |
| **Source** | lottiefiles.com | Search "exercise", "workout", "fitness" for free animations |

### 2.4 Why Not Native iOS App?

| Factor | Web App | Native iOS |
|--------|---------|------------|
| Development time | 1-2 weeks | 4-6 weeks |
| Requires Apple Developer account | No | Yes ($99/year) |
| Works on Raspberry Pi | Yes | No |
| Easy to modify | Yes | Requires rebuild |
| Access from any device | Yes | iOS only |

---

## 3. Development Environment Setup

### 3.1 Prerequisites Checklist

Before writing any code, ensure you have these installed:

| Requirement | How to Check | How to Install |
|-------------|--------------|----------------|
| macOS | You have this | - |
| Node.js v18+ | `node --version` | Download from nodejs.org (LTS version) |
| npm v9+ | `npm --version` | Comes with Node.js |
| Git | `git --version` | `xcode-select --install` |
| VS Code | Check Applications | Download from code.visualstudio.com |

### 3.2 Install Node.js (If Needed)

1. Open your browser and go to https://nodejs.org
2. Download the **LTS** version (currently v20.x)
3. Open the downloaded `.pkg` file and follow the installer
4. Open Terminal and verify:
   ```bash
   node --version
   ```
   Should output something like `v20.10.0`

### 3.3 Install VS Code Extensions

Open VS Code, go to Extensions (Cmd+Shift+X), and install:

| Extension | Purpose |
|-----------|---------|
| ES7+ React/Redux/React-Native snippets | Fast component creation with shortcuts |
| Tailwind CSS IntelliSense | Autocomplete for Tailwind classes |
| Prettier - Code formatter | Automatic code formatting |
| SQLite Viewer | View and query your database in VS Code |
| Thunder Client | Test your API endpoints without Postman |
| Error Lens | See errors inline as you code |

### 3.4 Create the Project

Open Terminal and run these commands one by one:

```bash
# Step 1: Navigate to your projects folder (create if needed)
mkdir -p ~/Projects
cd ~/Projects

# Step 2: Create Next.js project with recommended settings
npx create-next-app@latest shred-tracker

# When prompted, select:
#   ✔ Would you like to use TypeScript? Yes
#   ✔ Would you like to use ESLint? Yes
#   ✔ Would you like to use Tailwind CSS? Yes
#   ✔ Would you like to use `src/` directory? Yes
#   ✔ Would you like to use App Router? Yes
#   ✔ Would you like to customize the default import alias? No

# Step 3: Navigate into the project
cd shred-tracker

# Step 4: Install additional dependencies
npm install better-sqlite3
npm install @types/better-sqlite3 --save-dev
npm install framer-motion
npm install recharts
npm install lottie-react
npm install sharp
npm install date-fns
npm install uuid
npm install @types/uuid --save-dev
```

### 3.5 Verify Installation

Run the development server to make sure everything works:

```bash
npm run dev
```

Open http://localhost:3000 in your browser. You should see the Next.js welcome page.

### 3.6 Create Environment Configuration

Create a file called `.env.local` in your project root with your personal settings:

```env
# Database
DATABASE_PATH=./data/shredtracker.db

# Your Stats
USER_HEIGHT_INCHES=72
USER_STARTING_WEIGHT=184
USER_TARGET_WEIGHT=178

# Schedule
WAKE_TIME=06:00
WORKOUT_TIME=16:00

# Current Phase: bulk | cut | maintain
CURRENT_PHASE=bulk

# Calorie Targets (from your shred guide)
BULK_CALORIES=2900
CUT_CALORIES=2300
MAINTAIN_CALORIES=2600
```

---

## 4. Project Structure

### 4.1 Folder Organization

```
shred-tracker/
│
├── src/
│   ├── app/                          # Pages (App Router)
│   │   ├── layout.tsx                # Root layout with navigation
│   │   ├── page.tsx                  # Dashboard (home)
│   │   │
│   │   ├── workout/
│   │   │   ├── page.tsx              # Today's workout overview
│   │   │   └── active/
│   │   │       └── page.tsx          # Active workout session
│   │   │
│   │   ├── nutrition/
│   │   │   └── page.tsx              # Daily meal tracker
│   │   │
│   │   ├── checkin/
│   │   │   └── page.tsx              # Weight + photo logging
│   │   │
│   │   ├── progress/
│   │   │   └── page.tsx              # Historical charts
│   │   │
│   │   ├── settings/
│   │   │   └── page.tsx              # Max weights, preferences
│   │   │
│   │   └── api/                      # Backend API routes
│   │       ├── workouts/
│   │       │   └── route.ts
│   │       ├── nutrition/
│   │       │   └── route.ts
│   │       ├── checkins/
│   │       │   └── route.ts
│   │       └── photos/
│   │           └── route.ts
│   │
│   ├── components/                   # Reusable UI components
│   │   ├── ui/                       # Generic components
│   │   ├── workout/                  # Workout-specific
│   │   ├── nutrition/                # Nutrition-specific
│   │   ├── checkin/                  # Check-in specific
│   │   └── dashboard/                # Dashboard widgets
│   │
│   └── lib/                          # Utilities and helpers
│       ├── db/                       # Database connection + queries
│       ├── calculations/             # Progressive overload, macros
│       ├── hooks/                    # Custom React hooks
│       └── utils/                    # Date formatting, etc.
│
├── data/                             # Data files
│   ├── shredtracker.db              # SQLite database (auto-created)
│   ├── workouts.json                # Your PPL program
│   ├── meals.json                   # Meal plan
│   └── exercises.json               # Exercise metadata
│
├── public/                           # Static files
│   ├── animations/                  # Lottie JSON files
│   └── photos/                      # Progress photos
│
├── .env.local                        # Your configuration
├── next.config.js                    # Next.js config
├── tailwind.config.ts               # Tailwind config
└── package.json                      # Dependencies
```

### 4.2 Component Organization Philosophy

Each feature area has its own component folder. Components are organized by:

| Type | Location | Example |
|------|----------|---------|
| Generic/Reusable | `components/ui/` | Button, Card, Modal, Timer |
| Feature-specific | `components/[feature]/` | ExerciseCard, MealCard |
| Page-level | Inside `app/[page]/` | Only if used by one page |

---

## 5. Database Design

### 5.1 Overview

You will use SQLite with 7 tables to track all fitness data. SQLite stores everything in a single file (`shredtracker.db`), making backups trivial.

### 5.2 Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────────┐
│  user_settings  │       │   exercise_maxes    │
│  (1 row only)   │       │                     │
├─────────────────┤       ├─────────────────────┤
│ height_inches   │       │ exercise_name (PK)  │
│ current_weight  │       │ one_rep_max         │
│ target_weight   │       │ last_working_weight │
│ current_phase   │       │ last_reps_achieved  │
│ wake_time       │       │ updated_at          │
│ workout_time    │       └─────────────────────┘
└─────────────────┘
                                    │
                                    │ referenced by
                                    ▼
┌─────────────────────┐     ┌─────────────────────┐
│  workout_sessions   │────►│   workout_sets      │
├─────────────────────┤     ├─────────────────────┤
│ id (PK)             │     │ id (PK)             │
│ date                │     │ session_id (FK)     │
│ workout_type        │     │ exercise_name       │
│ started_at          │     │ set_number          │
│ completed_at        │     │ target_reps         │
│ total_duration      │     │ actual_reps         │
└─────────────────────┘     │ target_weight       │
                            │ actual_weight       │
                            │ completed_at        │
                            └─────────────────────┘

┌─────────────────────┐     ┌─────────────────────┐
│   daily_nutrition   │────►│       meals         │
├─────────────────────┤     ├─────────────────────┤
│ id (PK)             │     │ id (PK)             │
│ date (unique)       │     │ nutrition_id (FK)   │
│ target_calories     │     │ meal_name           │
│ target_protein      │     │ scheduled_time      │
│ target_carbs        │     │ logged_at           │
│ target_fats         │     │ was_eaten           │
└─────────────────────┘     │ notes               │
                            └─────────────────────┘

┌─────────────────────┐     ┌─────────────────────┐
│   daily_checkins    │     │   progress_photos   │
├─────────────────────┤     ├─────────────────────┤
│ id (PK)             │     │ id (PK)             │
│ date (unique)       │     │ checkin_id (FK)     │
│ morning_weight      │     │ angle               │
│ notes               │     │ file_path           │
│ created_at          │     │ thumbnail_path      │
└─────────────────────┘     │ created_at          │
                            └─────────────────────┘
```

### 5.3 Table Definitions

#### Table 1: `user_settings`

Stores your personal configuration. Only one row exists.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Always 1 |
| height_inches | INTEGER | Your height (72 for 6'0") |
| current_weight | REAL | Latest weight from check-ins |
| target_weight | REAL | Goal weight |
| current_phase | TEXT | "bulk", "cut", or "maintain" |
| wake_time | TEXT | "06:00" format |
| workout_time | TEXT | "16:00" format |
| program_start_date | TEXT | When you started the program |
| created_at | TEXT | ISO timestamp |
| updated_at | TEXT | ISO timestamp |

#### Table 2: `exercise_maxes`

Your current strength levels for progressive overload calculations.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment |
| exercise_name | TEXT UNIQUE | "Barbell Bench Press", etc. |
| one_rep_max | REAL | Calculated or tested 1RM |
| last_working_weight | REAL | Weight used last session |
| last_reps_achieved | INTEGER | Reps completed at that weight |
| last_session_date | TEXT | When last performed |
| updated_at | TEXT | ISO timestamp |

#### Table 3: `workout_sessions`

Each time you start a workout, a session is created.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment |
| date | TEXT | "2026-01-12" format |
| workout_type | TEXT | "Push A", "Pull A", "Legs A", etc. |
| program_day | INTEGER | 1-6 (which day of the 6-day split) |
| started_at | TEXT | ISO timestamp when started |
| completed_at | TEXT | ISO timestamp when finished (null if incomplete) |
| total_duration_minutes | INTEGER | Calculated from start/end |
| notes | TEXT | Optional notes |

#### Table 4: `workout_sets`

Individual sets within a workout session.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment |
| session_id | INTEGER | Foreign key to workout_sessions |
| exercise_name | TEXT | "Barbell Bench Press", etc. |
| set_number | INTEGER | 1, 2, 3, 4... |
| target_reps | INTEGER | Programmed reps (e.g., 6) |
| actual_reps | INTEGER | What you actually did |
| target_weight | REAL | Calculated recommended weight |
| actual_weight | REAL | What you actually lifted |
| rpe | INTEGER | Rate of Perceived Exertion (1-10), optional |
| rest_duration_seconds | INTEGER | How long you rested after |
| completed_at | TEXT | ISO timestamp |

#### Table 5: `daily_nutrition`

One row per day tracking overall nutrition.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment |
| date | TEXT UNIQUE | "2026-01-12" format |
| target_calories | INTEGER | Based on current phase |
| actual_calories | INTEGER | Sum of logged meals |
| target_protein | INTEGER | Grams |
| actual_protein | INTEGER | Grams |
| target_carbs | INTEGER | Grams |
| actual_carbs | INTEGER | Grams |
| target_fats | INTEGER | Grams |
| actual_fats | INTEGER | Grams |
| compliance_percentage | REAL | How well you hit targets |

#### Table 6: `meals`

Individual meals within a day.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment |
| nutrition_id | INTEGER | Foreign key to daily_nutrition |
| meal_number | INTEGER | 1-6 (which meal of the day) |
| meal_name | TEXT | "Breakfast", "Pre-Workout", etc. |
| scheduled_time | TEXT | "06:30" format |
| logged_at | TEXT | ISO timestamp when logged |
| was_eaten | BOOLEAN | 1 if eaten, 0 if skipped |
| calories | INTEGER | From meal plan |
| protein | INTEGER | Grams |
| carbs | INTEGER | Grams |
| fats | INTEGER | Grams |
| notes | TEXT | Substitutions, etc. |

#### Table 7: `daily_checkins`

Morning weigh-ins and daily check-in data.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment |
| date | TEXT UNIQUE | "2026-01-12" format |
| morning_weight | REAL | Pounds |
| waist_measurement | REAL | Inches (optional, weekly) |
| notes | TEXT | How you feel, sleep quality, etc. |
| created_at | TEXT | ISO timestamp |

#### Table 8: `progress_photos`

Progress photos linked to check-ins.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment |
| checkin_id | INTEGER | Foreign key to daily_checkins |
| angle | TEXT | "front", "side", "back" |
| file_path | TEXT | Path to full image |
| thumbnail_path | TEXT | Path to compressed thumbnail |
| created_at | TEXT | ISO timestamp |

### 5.4 Database Initialization

When the app first runs, it should:

1. Check if `data/shredtracker.db` exists
2. If not, create it and run all CREATE TABLE statements
3. Insert default row into `user_settings` with values from `.env.local`
4. Pre-populate `exercise_maxes` with all exercises from `workouts.json` (with null weights, to be filled in settings)

---

## 6. Feature 1: Workout Tracker

### 6.1 Feature Overview

The workout tracker guides you through your 6-day PPL program with:

- Automatic day detection (knows it's "Push A" day)
- Exercise animations showing proper form
- Set/rep tracking with calculated weights
- Rest timer that starts after logging a set
- Progressive overload suggestions

### 6.2 User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     WORKOUT FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Open app → Dashboard shows "Today: Push A"                   │
│                     │                                            │
│                     ▼                                            │
│  2. Tap "Start Workout"                                          │
│                     │                                            │
│                     ▼                                            │
│  3. First exercise appears:                                      │
│     ┌─────────────────────────────────────┐                      │
│     │  🏋️ Barbell Bench Press              │                      │
│     │  [Animation playing]                │                      │
│     │                                     │                      │
│     │  Set 1 of 4                         │                      │
│     │  Target: 5-6 reps @ 185 lbs         │                      │
│     │                                     │                      │
│     │  [ - ] 185 lbs [ + ]                │                      │
│     │  [ - ]  5 reps [ + ]                │                      │
│     │                                     │                      │
│     │  [    Complete Set    ]             │                      │
│     └─────────────────────────────────────┘                      │
│                     │                                            │
│                     ▼                                            │
│  4. After tapping "Complete Set":                                │
│     ┌─────────────────────────────────────┐                      │
│     │         REST TIME                   │                      │
│     │                                     │                      │
│     │           2:47                      │                      │
│     │     (counting down from 3:00)       │                      │
│     │                                     │                      │
│     │  [  Skip Rest  ]  [ + 30 sec ]      │                      │
│     └─────────────────────────────────────┘                      │
│                     │                                            │
│                     ▼                                            │
│  5. Timer ends → Next set appears                                │
│     (Repeat until all sets done)                                 │
│                     │                                            │
│                     ▼                                            │
│  6. Next exercise appears                                        │
│     (Repeat until all exercises done)                            │
│                     │                                            │
│                     ▼                                            │
│  7. Workout complete screen:                                     │
│     ┌─────────────────────────────────────┐                      │
│     │  🎉 Workout Complete!               │                      │
│     │                                     │                      │
│     │  Duration: 58 minutes               │                      │
│     │  Total Volume: 12,450 lbs           │                      │
│     │  Sets Completed: 21/21              │                      │
│     │                                     │                      │
│     │  [ Take Progress Photo ]            │                      │
│     │  [   Back to Dashboard  ]           │                      │
│     └─────────────────────────────────────┘                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Day Calculation Logic

The app needs to know which workout day you're on:

```
Program Structure (6-day cycle):
  Day 1: Push A
  Day 2: Pull A  
  Day 3: Legs A
  Day 4: Push B
  Day 5: Pull B
  Day 6: Legs B
  Day 7: REST (no workout)
  Day 8: Push A (cycle repeats)

Calculation:
  1. Get program_start_date from user_settings
  2. Calculate days_since_start = today - program_start_date
  3. current_cycle_day = (days_since_start % 7) + 1
  4. If current_cycle_day == 7, it's a rest day
  5. Otherwise, map to workout type
```

### 6.4 Progressive Overload Algorithm

Based on research from your shred guide, here's how to calculate recommended weights:

```
PROGRESSIVE OVERLOAD RULES:

For Heavy/Strength Days (Push A, Pull A, Legs A):
  - Rep range: 5-6 reps
  - If last session you hit 6 reps on all sets:
      → Increase weight by 5 lbs (2.5 lbs for smaller exercises)
  - If last session you hit less than 5 reps on any set:
      → Keep same weight
  - If you failed to complete sets:
      → Decrease weight by 5 lbs

For Volume/Hypertrophy Days (Push B, Pull B, Legs B):
  - Rep range: 8-12 or 10-15 depending on exercise
  - If last session you hit top of rep range on all sets:
      → Increase weight by 5 lbs
  - Otherwise:
      → Keep same weight, aim for more reps

Weight Calculation from 1RM:
  - Heavy sets (5-6 reps): Use 80-85% of 1RM
  - Moderate sets (8-10 reps): Use 70-75% of 1RM
  - Light sets (12-15 reps): Use 60-65% of 1RM

1RM Estimation (Brzycki Formula):
  1RM = weight × (36 / (37 - reps))
  
  Example: If you bench 185 lbs for 6 reps:
  1RM = 185 × (36 / (37 - 6)) = 185 × 1.16 = 215 lbs
```

### 6.5 Rest Timer Logic

| Exercise Type | Rest Duration |
|---------------|---------------|
| Heavy compounds (Squat, Bench, Deadlift, OHP) | 3:00 - 4:00 minutes |
| Moderate compounds (Rows, Pull-ups, Leg Press) | 2:00 - 2:30 minutes |
| Isolation exercises (Curls, Lateral Raises, Extensions) | 1:00 - 1:30 minutes |

The timer should:
- Start automatically when "Complete Set" is tapped
- Show large countdown display
- Vibrate/beep when finished (if browser supports)
- Allow adding 30 seconds
- Allow skipping

### 6.6 Exercise Animations

Search LottieFiles.com for these animations:

| Exercise | Search Terms | Fallback |
|----------|--------------|----------|
| Bench Press | "bench press", "chest press" | Simple diagram |
| Squat | "squat", "barbell squat" | Simple diagram |
| Deadlift | "deadlift", "barbell lift" | Simple diagram |
| Pull-up | "pull up", "chin up" | Simple diagram |
| Shoulder Press | "overhead press", "shoulder press" | Simple diagram |
| Rows | "barbell row", "rowing" | Simple diagram |
| Curls | "bicep curl", "dumbbell curl" | Simple diagram |
| Lateral Raise | "lateral raise", "shoulder raise" | Simple diagram |

If no suitable animation exists, display:
- Exercise name in large text
- Target muscles highlighted on a body diagram
- 2-3 bullet points for form cues

### 6.7 Required Components

| Component | Purpose |
|-----------|---------|
| `WorkoutOverview` | Shows today's workout, "Start Workout" button |
| `ActiveWorkout` | Full-screen workout session controller |
| `ExerciseCard` | Displays current exercise with animation |
| `SetLogger` | Weight/rep inputs with +/- buttons |
| `RestTimer` | Countdown timer with skip/extend options |
| `WorkoutComplete` | Summary screen with stats |
| `ExerciseAnimation` | Lottie player or fallback diagram |

### 6.8 Required API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/workouts/today` | GET | Get today's planned workout |
| `/api/workouts/sessions` | POST | Create new workout session |
| `/api/workouts/sessions/[id]` | PATCH | Update session (complete, add notes) |
| `/api/workouts/sets` | POST | Log a completed set |
| `/api/workouts/exercise-max/[name]` | GET | Get current max for exercise |
| `/api/workouts/exercise-max/[name]` | PATCH | Update after new PR |

---

## 7. Feature 2: Nutrition Tracker

### 7.1 Feature Overview

The nutrition tracker tells you exactly what to eat and when, based on your wake time (6:00 AM) and current phase (bulk/cut/maintain). It's not a calorie counter - it's a meal checklist.

### 7.2 User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    NUTRITION FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Morning View (6:00 AM):                                         │
│  ┌─────────────────────────────────────┐                         │
│  │  📅 Sunday, January 12               │                         │
│  │  Phase: Lean Bulk (2,900 cal)        │                         │
│  │                                      │                         │
│  │  ━━━━━━━━━━━░░░░░░░░░░ 0/2,900 cal   │                         │
│  │  P: 0/175g  C: 0/375g  F: 0/78g      │                         │
│  │                                      │                         │
│  │  ┌────────────────────────────────┐  │                         │
│  │  │ ⏰ 6:30 AM - Breakfast         │  │                         │
│  │  │ 4 eggs, 2 toast, banana, PB    │  │                         │
│  │  │ 650 cal | P:32 C:55 F:28       │  │                         │
│  │  │ [ Mark as Eaten ]              │  │                         │
│  │  └────────────────────────────────┘  │                         │
│  │                                      │                         │
│  │  ┌────────────────────────────────┐  │                         │
│  │  │ 🔒 10:00 AM - Snack            │  │                         │
│  │  │ Greek yogurt, granola, berries │  │                         │
│  │  │ 450 cal | P:25 C:45 F:8        │  │                         │
│  │  │ (Available in 3.5 hours)       │  │                         │
│  │  └────────────────────────────────┘  │                         │
│  │                                      │                         │
│  │  ... more meals ...                  │                         │
│  └─────────────────────────────────────┘                         │
│                                                                  │
│  After logging Breakfast:                                        │
│  ┌─────────────────────────────────────┐                         │
│  │  ━━━━━━━━░░░░░░░░░░░░░ 650/2,900    │                         │
│  │                                      │                         │
│  │  ┌────────────────────────────────┐  │                         │
│  │  │ ✅ 6:30 AM - Breakfast         │  │                         │
│  │  │ Logged at 6:45 AM              │  │                         │
│  │  └────────────────────────────────┘  │                         │
│  └─────────────────────────────────────┘                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Meal Schedule (Based on 6:00 AM Wake Time)

| Meal | Time | Name | Purpose |
|------|------|------|---------|
| 1 | 6:30 AM | Breakfast | Break the fast, start protein synthesis |
| 2 | 10:00 AM | Mid-Morning Snack | Maintain amino acid levels |
| 3 | 1:00 PM | Lunch | Main midday fuel |
| 4 | 4:00 PM | Pre-Workout | Energy for training |
| 5 | 7:00 PM | Post-Workout Dinner | Recovery nutrition |
| 6 | 10:00 PM | Before Bed | Slow protein for overnight recovery |

### 7.4 Meal Plan Structure (Lean Bulk - 2,900 cal)

This is what goes in `meals.json`:

| Meal | Foods | Calories | Protein | Carbs | Fats |
|------|-------|----------|---------|-------|------|
| **Breakfast** | 4 whole eggs, 2 slices whole grain toast, 1 banana, 1 tbsp peanut butter | 650 | 32g | 55g | 28g |
| **Mid-Morning** | 200g Greek yogurt, 30g granola, mixed berries | 450 | 25g | 45g | 8g |
| **Lunch** | 200g chicken breast, 200g white rice, mixed vegetables, 1 tbsp olive oil | 650 | 50g | 80g | 15g |
| **Pre-Workout** | 40g whey protein, 1 banana, 50g oats (shake/smoothie) | 500 | 45g | 65g | 5g |
| **Post-Workout** | 200g lean beef or salmon, 250g sweet potato, broccoli | 550 | 45g | 75g | 12g |
| **Before Bed** | 200g cottage cheese, 30g almonds | 350 | 30g | 10g | 18g |
| **TOTAL** | | **3,150** | **227g** | **330g** | **86g** |

Note: Actual totals are slightly higher than 2,900 to account for minor variations. Adjust portions as needed.

### 7.5 Cutting Meal Plan (2,300 cal)

| Meal | Foods | Calories | Protein | Carbs | Fats |
|------|-------|----------|---------|-------|------|
| **Breakfast** | 4 egg whites + 2 whole eggs, 1 slice toast, 1 banana | 400 | 30g | 40g | 12g |
| **Mid-Morning** | 200g Greek yogurt (0% fat), berries | 200 | 22g | 20g | 2g |
| **Lunch** | 200g chicken breast, 150g rice, large salad, lemon dressing | 500 | 50g | 55g | 8g |
| **Pre-Workout** | 40g whey protein, 1 banana | 300 | 42g | 35g | 2g |
| **Post-Workout** | 200g white fish or chicken, 200g sweet potato, vegetables | 450 | 48g | 50g | 6g |
| **Before Bed** | 200g cottage cheese (low fat) | 180 | 28g | 8g | 2g |
| **TOTAL** | | **2,030** | **220g** | **208g** | **32g** |

Note: Add 1-2 tbsp olive oil or a handful of nuts to reach 2,300 cal target.

### 7.6 Meal Logging Logic

```
When user taps "Mark as Eaten":
  1. Record current timestamp as logged_at
  2. Set was_eaten = true
  3. Add meal's macros to daily_nutrition totals
  4. Show confirmation animation
  5. Unlock next meal if time-gated

When user taps "Skip Meal":
  1. Record current timestamp
  2. Set was_eaten = false
  3. Don't add macros to totals
  4. Show "Meal skipped" with option to undo

End of day compliance calculation:
  compliance_percentage = (meals_eaten / total_meals) × 100
```

### 7.7 Required Components

| Component | Purpose |
|-----------|---------|
| `NutritionOverview` | Daily summary with macro progress bars |
| `MealCard` | Individual meal display with foods, macros, action buttons |
| `MacroProgressBar` | Visual progress for protein/carbs/fats |
| `MealLogger` | Confirmation modal when logging a meal |
| `DailyMacroSummary` | End-of-day totals and compliance |

### 7.8 Required API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/nutrition/today` | GET | Get today's meal plan and progress |
| `/api/nutrition/meals/[id]` | PATCH | Mark meal as eaten/skipped |
| `/api/nutrition/history` | GET | Get past days for compliance tracking |

---

## 8. Feature 3: Daily Check-ins (Photos & Weight)

### 8.1 Feature Overview

Every day, the app prompts you for:

- **Morning:** Weigh-in (first thing after waking, before eating)
- **Post-workout:** Progress photo (front, side, or back)

### 8.2 User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHECK-IN FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Morning (when app opened before 8 AM):                          │
│  ┌─────────────────────────────────────┐                         │
│  │  ⚖️ Good morning! Time to weigh in   │                         │
│  │                                      │                         │
│  │        [ 184.2 ] lbs                 │                         │
│  │        [-0.1] [+0.1]                 │                         │
│  │                                      │                         │
│  │  Yesterday: 184.4 lbs                │                         │
│  │  7-day avg: 184.1 lbs                │                         │
│  │  Trend: ↓ 0.3 lbs this week          │                         │
│  │                                      │                         │
│  │       [ Save Weight ]                │                         │
│  └─────────────────────────────────────┘                         │
│                                                                  │
│  Post-Workout (triggered after workout complete):                │
│  ┌─────────────────────────────────────┐                         │
│  │  📸 Progress Photo Time!             │                         │
│  │                                      │                         │
│  │  Today's angle: FRONT                │                         │
│  │  (Rotate: Front → Side → Back)       │                         │
│  │                                      │                         │
│  │  ┌─────────────────────────────┐     │                         │
│  │  │                             │     │                         │
│  │  │      Camera Preview         │     │                         │
│  │  │                             │     │                         │
│  │  └─────────────────────────────┘     │                         │
│  │                                      │                         │
│  │       [ 📷 Take Photo ]              │                         │
│  │       [ Skip Today ]                 │                         │
│  └─────────────────────────────────────┘                         │
│                                                                  │
│  After taking photo:                                             │
│  ┌─────────────────────────────────────┐                         │
│  │  ┌─────────────────────────────┐     │                         │
│  │  │                             │     │                         │
│  │  │      Photo Preview          │     │                         │
│  │  │                             │     │                         │
│  │  └─────────────────────────────┘     │                         │
│  │                                      │                         │
│  │  [ Retake ]  [ Save & Continue ]     │                         │
│  └─────────────────────────────────────┘                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Photo Rotation System

To track your physique from all angles, rotate through:

```
Week 1: Sunday=Front, Monday=Side, Tuesday=Back, Wednesday=Front...
Week 2: Continues rotation

Simple calculation:
  photo_angles = ["front", "side", "back"]
  days_since_start = today - program_start_date
  todays_angle = photo_angles[days_since_start % 3]
```

### 8.4 Photo Storage Strategy

```
Storage Location: /public/photos/
File Naming: {date}_{angle}.jpg
  Example: 2026-01-12_front.jpg

Thumbnail Creation:
  - Original: Max 1920px wide, ~500KB
  - Thumbnail: 400px wide, ~50KB (for gallery view)

Compression:
  - Use Sharp library to resize and compress
  - Quality: 80% JPEG
  - Strip EXIF data for privacy
```

### 8.5 Weight Tracking Calculations

```
Displayed Metrics:

1. Today's Weight: Direct input

2. Yesterday's Weight: From previous check-in

3. 7-Day Average:
   avg = sum(last_7_weights) / 7
   
4. Weekly Trend:
   trend = this_week_avg - last_week_avg
   
5. Progress vs Start:
   progress = current_weight - starting_weight
   
6. Progress vs Goal:
   remaining = current_weight - target_weight
   
7. Projected Date to Goal (if cutting):
   weeks_remaining = remaining / weekly_loss_rate
   projected_date = today + (weeks_remaining * 7)
```

### 8.6 Required Components

| Component | Purpose |
|-----------|---------|
| `MorningWeighIn` | Weight input with trend display |
| `PhotoCapture` | Camera interface using MediaDevices API |
| `PhotoPreview` | Review captured photo before saving |
| `PhotoGallery` | Browse historical photos by date/angle |
| `WeightChart` | Sparkline or mini chart of recent weights |

### 8.7 Browser Camera Access

To capture photos, you'll use the browser's MediaDevices API:

```
User grants camera permission (one-time prompt)
  ↓
App accesses rear camera
  ↓
Live preview displayed
  ↓
User taps capture
  ↓
Frame captured as image data
  ↓
Sent to API for processing and storage
```

**Important:** Safari on iOS requires HTTPS for camera access, BUT localhost is an exception. Since you're accessing via local IP (http://192.168.x.x), you may need to use the file upload fallback instead. See Section 11 for details.

### 8.8 Required API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/checkins/today` | GET | Get today's check-in status |
| `/api/checkins/weight` | POST | Log morning weight |
| `/api/checkins/photo` | POST | Upload progress photo |
| `/api/checkins/history` | GET | Get historical check-ins |
| `/api/photos/[date]` | GET | Get specific photo |
| `/api/photos/gallery` | GET | Get photo gallery data |

---

## 9. Feature 4: Dashboard & Analytics

### 9.1 Feature Overview

The dashboard is your command center - showing everything at a glance and helping you track progress over time.

### 9.2 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                       DASHBOARD                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  Good morning, Deniz!                    Day 23 of 90   │     │
│  │  Phase: Lean Bulk                        ━━━━━░░░░░░░   │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │ TODAY'S WEIGHT  │  │  WEEKLY TREND   │  │   VS TARGET     │   │
│  │    184.2 lbs    │  │    ↓ 0.8 lbs    │  │   +6.2 lbs      │   │
│  │   ↓0.2 vs yday  │  │  On track! ✓    │  │   to goal       │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  TODAY'S WORKOUT: Push A                                │     │
│  │  Chest, Shoulders, Triceps | ~60 min                    │     │
│  │                                                         │     │
│  │  [         Start Workout         ]                      │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  NUTRITION TODAY                           650/2,900    │     │
│  │  ━━━━━━░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  22%          │     │
│  │                                                         │     │
│  │  Next meal: Lunch @ 1:00 PM (in 2h 15m)                 │     │
│  │  [       View Meal Plan       ]                         │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  WEIGHT TREND (Last 30 Days)                            │     │
│  │                                                         │     │
│  │  186│    ╭─╮                                            │     │
│  │     │   ╭╯ ╰╮  ╭─╮                                      │     │
│  │  184│──╯    ╰──╯ ╰──────────────────                    │     │
│  │     │                        ╰─────                     │     │
│  │  182│                                                   │     │
│  │     └──────────────────────────────────                 │     │
│  │       Dec 15        Jan 1         Jan 12                │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  STRENGTH PROGRESS                                      │     │
│  │                                                         │     │
│  │  Bench Press    185 lbs → 195 lbs    ↑ 5.4%            │     │
│  │  Squat          225 lbs → 245 lbs    ↑ 8.9%            │     │
│  │  Deadlift       275 lbs → 295 lbs    ↑ 7.3%            │     │
│  │                                                         │     │
│  │  [    View All Exercises    ]                           │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  RECENT PROGRESS PHOTOS                                 │     │
│  │                                                         │     │
│  │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐                     │     │
│  │  │ Jan │  │ Jan │  │ Jan │  │ Jan │                     │     │
│  │  │ 12  │  │ 11  │  │ 10  │  │  9  │                     │     │
│  │  │Front│  │Side │  │Back │  │Front│                     │     │
│  │  └─────┘  └─────┘  └─────┘  └─────┘                     │     │
│  │                                                         │     │
│  │  [    View Photo Gallery    ]                           │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.3 Progress Page (Detailed Analytics)

When user taps "View All" or navigates to /progress:

```
┌─────────────────────────────────────────────────────────────────┐
│                     PROGRESS DETAILS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Weight] [Strength] [Nutrition] [Photos]  ← Tab navigation      │
│                                                                  │
│  ═══════════════════════════════════════════════════════════     │
│                                                                  │
│  WEIGHT TAB:                                                     │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  Starting Weight:    184.0 lbs (Dec 20, 2025)           │     │
│  │  Current Weight:     182.4 lbs                          │     │
│  │  Target Weight:      178.0 lbs                          │     │
│  │  Total Change:       -1.6 lbs                           │     │
│  │  Weekly Average:     -0.5 lbs/week                      │     │
│  │  Estimated Goal Date: Feb 28, 2026                      │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                  │
│  [Large interactive weight chart - 90 days]                      │
│                                                                  │
│  ═══════════════════════════════════════════════════════════     │
│                                                                  │
│  STRENGTH TAB:                                                   │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  Exercise          Start    Current   Change   % Change │     │
│  ├─────────────────────────────────────────────────────────┤     │
│  │  Bench Press       175      195       +20      +11.4%   │     │
│  │  Squat             225      255       +30      +13.3%   │     │
│  │  Deadlift          275      315       +40      +14.5%   │     │
│  │  OHP               115      130       +15      +13.0%   │     │
│  │  Barbell Row       155      175       +20      +12.9%   │     │
│  │  Pull-ups          BW+25    BW+45     +20      +80.0%   │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                  │
│  [Tap any exercise for detailed history chart]                   │
│                                                                  │
│  ═══════════════════════════════════════════════════════════     │
│                                                                  │
│  NUTRITION TAB:                                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  Average Daily Compliance: 87%                          │     │
│  │  Meals Logged: 138/162 (last 30 days)                   │     │
│  │  Most Skipped: Before Bed (12 times)                    │     │
│  │  Protein Target Hit: 28/30 days                         │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                  │
│  [Weekly compliance heatmap calendar]                            │
│                                                                  │
│  ═══════════════════════════════════════════════════════════     │
│                                                                  │
│  PHOTOS TAB:                                                     │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  Side-by-side comparison:                               │     │
│  │                                                         │     │
│  │  ┌─────────────┐    ┌─────────────┐                     │     │
│  │  │   DAY 1     │    │   TODAY     │                     │     │
│  │  │   Front     │    │   Front     │                     │     │
│  │  │             │    │             │                     │     │
│  │  │   Dec 20    │    │   Jan 12    │                     │     │
│  │  │   184 lbs   │    │   182 lbs   │                     │     │
│  │  └─────────────┘    └─────────────┘                     │     │
│  │                                                         │     │
│  │  [← Previous]  [Select Dates]  [Next →]                 │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.4 Key Metrics to Calculate

| Metric | Calculation | Display |
|--------|-------------|---------|
| Program Day | days since start + 1 | "Day 23 of 90" |
| Weight Change (Total) | current - starting | "+3.2 lbs" or "-1.6 lbs" |
| Weight Change (Weekly) | this_week_avg - last_week_avg | "↓ 0.8 lbs" |
| Weight Trend | Linear regression over 14 days | "On track" / "Ahead" / "Behind" |
| Days to Goal | remaining_weight / weekly_rate * 7 | "~6 weeks" |
| Strength Gain % | (current - start) / start * 100 | "+11.4%" |
| Workout Compliance | completed_workouts / expected_workouts * 100 | "92%" |
| Nutrition Compliance | meals_eaten / total_meals * 100 | "87%" |
| Streak | Consecutive days with workout + nutrition logged | "12 days 🔥" |

### 9.5 Charts to Implement

| Chart | Type | Library | Data |
|-------|------|---------|------|
| Weight Trend | Line chart | Recharts | daily_checkins.morning_weight |
| Strength Progress | Bar chart | Recharts | exercise_maxes over time |
| Nutrition Compliance | Heatmap/Calendar | Custom or Recharts | daily_nutrition.compliance_percentage |
| Macro Distribution | Pie chart | Recharts | Today's P/C/F breakdown |
| Workout Volume | Area chart | Recharts | Total weight lifted per session |

### 9.6 Required Components

| Component | Purpose |
|-----------|---------|
| `DashboardHeader` | Greeting, program day, phase indicator |
| `StatCard` | Reusable metric display card |
| `TodayWorkoutCard` | Shows today's workout with start button |
| `NutritionSummaryCard` | Macro progress and next meal |
| `WeightTrendChart` | 30-day weight line chart |
| `StrengthProgressTable` | All exercises with gains |
| `PhotoCarousel` | Recent progress photos |
| `ComplianceCalendar` | Heatmap of workout/nutrition adherence |
| `ProgressComparison` | Side-by-side photo viewer |

### 9.7 Required API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/dashboard` | GET | All dashboard data in one call |
| `/api/progress/weight` | GET | Weight history for charts |
| `/api/progress/strength` | GET | All exercise progress |
| `/api/progress/nutrition` | GET | Nutrition compliance history |
| `/api/progress/summary` | GET | High-level stats |

---

## 10. Data Files (Workouts & Meals JSON)

### 10.1 workouts.json Structure

This file defines your entire 6-day PPL program. Place it in `/data/workouts.json`.

```json
{
  "program": {
    "name": "Push/Pull/Legs 6-Day Split",
    "days_per_cycle": 7,
    "description": "Train each muscle group twice per week"
  },
  "schedule": [
    {
      "day": 1,
      "name": "Push A",
      "focus": "Heavy/Strength",
      "muscles": ["Chest", "Shoulders", "Triceps"],
      "estimated_duration_minutes": 60,
      "exercises": [
        {
          "name": "Barbell Bench Press",
          "sets": 4,
          "reps": "5-6",
          "rest_seconds": 180,
          "type": "compound",
          "progression": "heavy",
          "animation_id": "bench-press",
          "form_cues": [
            "Retract shoulder blades",
            "Feet flat on floor",
            "Bar path: slight diagonal"
          ]
        }
      ]
    }
  ]
}
```

### 10.2 Complete Workout Program

Here is the full workout program based on your shred guide:

#### Day 1 - Push A (Heavy/Strength)

| Exercise | Sets | Reps | Rest |
|----------|------|------|------|
| Barbell Bench Press | 4 | 5-6 | 3 min |
| Incline Dumbbell Press | 3 | 8-10 | 2 min |
| Overhead Press (Barbell) | 4 | 6-8 | 2.5 min |
| Cable Lateral Raises | 4 | 12-15 | 60 sec |
| Dips (weighted) | 3 | 8-12 | 2 min |
| Overhead Tricep Extension | 3 | 10-12 | 90 sec |

#### Day 2 - Pull A (Heavy/Strength)

| Exercise | Sets | Reps | Rest |
|----------|------|------|------|
| Deadlift (Conventional) | 4 | 5-6 | 3-4 min |
| Weighted Pull-ups | 4 | 6-8 | 2.5 min |
| Barbell Rows | 4 | 6-8 | 2 min |
| Face Pulls | 4 | 15-20 | 60 sec |
| Barbell Curls | 3 | 8-10 | 90 sec |
| Hammer Curls | 3 | 10-12 | 60 sec |

#### Day 3 - Legs A (Heavy/Strength)

| Exercise | Sets | Reps | Rest |
|----------|------|------|------|
| Back Squat | 4 | 5-6 | 3-4 min |
| Romanian Deadlift | 4 | 8-10 | 2.5 min |
| Leg Press | 3 | 10-12 | 2 min |
| Walking Lunges | 3 | 12 each | 90 sec |
| Leg Curls | 3 | 10-12 | 90 sec |
| Standing Calf Raises | 4 | 12-15 | 60 sec |

#### Day 4 - Push B (Volume/Hypertrophy)

| Exercise | Sets | Reps | Rest |
|----------|------|------|------|
| Dumbbell Shoulder Press | 4 | 8-10 | 2 min |
| Incline Barbell Press | 4 | 8-10 | 2 min |
| Cable Flyes (Low to High) | 3 | 12-15 | 60 sec |
| Lateral Raises | 4 | 12-15 | 60 sec |
| Upright Rows | 3 | 10-12 | 90 sec |
| Tricep Pushdowns | 3 | 12-15 | 60 sec |
| Skull Crushers | 3 | 10-12 | 90 sec |

#### Day 5 - Pull B (Volume/Hypertrophy)

| Exercise | Sets | Reps | Rest |
|----------|------|------|------|
| Lat Pulldowns (Wide Grip) | 4 | 10-12 | 90 sec |
| Chest-Supported Rows | 4 | 10-12 | 90 sec |
| Single-Arm Cable Rows | 3 | 12 each | 60 sec |
| Straight-Arm Pulldowns | 3 | 12-15 | 60 sec |
| Rear Delt Flyes | 4 | 15-20 | 45 sec |
| Incline Dumbbell Curls | 3 | 10-12 | 60 sec |
| Cable Curls | 3 | 12-15 | 45 sec |

#### Day 6 - Legs B (Volume/Hypertrophy)

| Exercise | Sets | Reps | Rest |
|----------|------|------|------|
| Front Squat | 4 | 8-10 | 2.5 min |
| Bulgarian Split Squats | 3 | 10 each | 90 sec |
| Leg Extensions | 4 | 12-15 | 60 sec |
| Lying Leg Curls | 4 | 10-12 | 60 sec |
| Hip Thrusts | 3 | 10-12 | 90 sec |
| Seated Calf Raises | 4 | 15-20 | 45 sec |

#### Day 7 - Rest

No exercises. Active recovery encouraged.

### 10.3 meals.json Structure

This file defines your meal plans for each phase. Place it in `/data/meals.json`.

```json
{
  "phases": {
    "bulk": {
      "name": "Lean Bulk",
      "daily_targets": {
        "calories": 2900,
        "protein": 175,
        "carbs": 375,
        "fats": 78
      },
      "meals": [
        {
          "meal_number": 1,
          "name": "Breakfast",
          "time_offset_minutes": 30,
          "foods": [
            { "item": "Whole eggs", "amount": "4", "unit": "large" },
            { "item": "Whole grain toast", "amount": "2", "unit": "slices" },
            { "item": "Banana", "amount": "1", "unit": "medium" },
            { "item": "Peanut butter", "amount": "1", "unit": "tbsp" }
          ],
          "macros": {
            "calories": 650,
            "protein": 32,
            "carbs": 55,
            "fats": 28
          }
        }
      ]
    },
    "cut": {
      "name": "Cut",
      "daily_targets": {
        "calories": 2300,
        "protein": 185,
        "carbs": 250,
        "fats": 62
      },
      "meals": []
    },
    "maintain": {
      "name": "Maintenance",
      "daily_targets": {
        "calories": 2600,
        "protein": 180,
        "carbs": 310,
        "fats": 70
      },
      "meals": []
    }
  }
}
```

### 10.4 Complete Meal Plans

#### Lean Bulk Phase (2,900 calories)

| Meal | Time | Foods | Cal | P | C | F |
|------|------|-------|-----|---|---|---|
| Breakfast | Wake +30min | 4 eggs, 2 toast, 1 banana, 1 tbsp PB | 650 | 32 | 55 | 28 |
| Mid-Morning | Wake +4hr | 200g Greek yogurt, 30g granola, berries | 450 | 25 | 45 | 8 |
| Lunch | Wake +7hr | 200g chicken, 200g rice, veggies, 1 tbsp olive oil | 650 | 50 | 80 | 15 |
| Pre-Workout | Wake +10hr | 40g whey, 1 banana, 50g oats | 500 | 45 | 65 | 5 |
| Post-Workout | Wake +13hr | 200g beef/salmon, 250g sweet potato, broccoli | 550 | 45 | 75 | 12 |
| Before Bed | Wake +16hr | 200g cottage cheese, 30g almonds | 350 | 30 | 10 | 18 |

#### Cutting Phase (2,300 calories)

| Meal | Time | Foods | Cal | P | C | F |
|------|------|-------|-----|---|---|---|
| Breakfast | Wake +30min | 4 egg whites + 2 whole, 1 toast, 1 banana | 400 | 30 | 40 | 12 |
| Mid-Morning | Wake +4hr | 200g Greek yogurt (0% fat), berries | 200 | 22 | 20 | 2 |
| Lunch | Wake +7hr | 200g chicken, 150g rice, large salad | 500 | 50 | 55 | 8 |
| Pre-Workout | Wake +10hr | 40g whey, 1 banana | 300 | 42 | 35 | 2 |
| Post-Workout | Wake +13hr | 200g white fish, 200g sweet potato, veggies | 450 | 48 | 50 | 6 |
| Before Bed | Wake +16hr | 200g cottage cheese (low fat) | 180 | 28 | 8 | 2 |

Note: Add 1-2 tbsp olive oil or 30g almonds to reach 2,300 cal target.

### 10.5 exercises.json Structure

Metadata for each exercise including animation references.

```json
{
  "exercises": {
    "Barbell Bench Press": {
      "muscle_group": "Chest",
      "secondary_muscles": ["Shoulders", "Triceps"],
      "equipment": "Barbell",
      "animation_file": "bench-press.json",
      "animation_fallback": "bench-press.svg",
      "form_cues": [
        "Retract and depress shoulder blades",
        "Maintain slight arch in lower back",
        "Keep feet flat on the floor",
        "Lower bar to mid-chest",
        "Press in slight diagonal toward face"
      ],
      "common_mistakes": [
        "Flaring elbows too wide",
        "Bouncing bar off chest",
        "Lifting hips off bench"
      ]
    }
  }
}
```

---

## 11. Mobile Access Setup

### 11.1 Finding Your MacBook's IP Address

1. Click the Apple menu → System Settings
2. Click Network in the sidebar
3. Click WiFi
4. Click Details next to your connected network
5. Note the IP address (e.g., `192.168.1.105`)

Alternatively, open Terminal and run:

```bash
ipconfig getifaddr en0
```

### 11.2 Running the Development Server

Start the server bound to all network interfaces:

```bash
npm run dev -- --hostname 0.0.0.0 --port 3000
```

This allows connections from other devices on your network.

### 11.3 Accessing from iPhone

1. Make sure iPhone is on the same WiFi network as MacBook
2. Open Safari on iPhone
3. Navigate to: `http://192.168.1.105:3000` (use your actual IP)
4. The app should load

### 11.4 Camera Access Issue & Solution

**Problem:** iOS Safari requires HTTPS for camera access (MediaDevices API), but you're using HTTP.

**Solution Options:**

| Option | Difficulty | Description |
|--------|------------|-------------|
| A. File Upload | Easy | Instead of camera, use file input that opens photo picker |
| B. Self-signed Certificate | Medium | Create local HTTPS certificate |
| C. ngrok tunnel | Easy | Creates HTTPS tunnel (requires internet) |

**Recommended: Option A (File Upload)**

Instead of live camera, use:

```html
<input type="file" accept="image/*" capture="environment">
```

This opens the camera on mobile and lets user take a photo, which is then uploaded. Simpler and works without HTTPS.

### 11.5 Add to Home Screen (PWA-like)

To make the app feel native on iPhone:

1. Open the app URL in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Name it "ShredTracker"
5. Tap Add

Now it appears as an app icon and opens without Safari UI.

### 11.6 Keeping Server Running

To prevent the server from stopping when you close the terminal:

**Option A: Use `nohup`**

```bash
nohup npm run dev -- --hostname 0.0.0.0 --port 3000 &
```

**Option B: Use `screen`**

```bash
screen -S shredtracker
npm run dev -- --hostname 0.0.0.0 --port 3000
# Press Ctrl+A then D to detach
# Use `screen -r shredtracker` to reattach
```

**Option C: Use Amphetamine App**

- Download Amphetamine from App Store
- Configure to keep Mac awake when closed
- Server continues running with lid closed

---

## 12. Raspberry Pi Migration Guide

### 12.1 Recommended Hardware

| Component | Recommendation | Why |
|-----------|---------------|-----|
| Board | Raspberry Pi 4 (4GB RAM) | Enough power for Node.js + SQLite |
| Storage | 32GB+ microSD or USB SSD | SSD preferred for longevity |
| Power | Official Pi 4 power supply | Stable power prevents corruption |
| Case | With passive cooling | Prevents thermal throttling |

### 12.2 Initial Pi Setup

1. Download Raspberry Pi Imager from raspberrypi.com
2. Flash "Raspberry Pi OS Lite (64-bit)" to your SD card
3. Enable SSH before first boot (create empty `ssh` file in boot partition)
4. Configure WiFi (create `wpa_supplicant.conf` in boot partition)
5. Boot the Pi and SSH in: `ssh pi@raspberrypi.local`

### 12.3 Install Dependencies on Pi

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install build tools (for better-sqlite3)
sudo apt install -y build-essential python3

# Verify installation
node --version  # Should show v20.x.x
```

### 12.4 Transfer Project to Pi

From your MacBook:

```bash
# Copy entire project folder
scp -r ~/Projects/shred-tracker pi@raspberrypi.local:~/

# Or use rsync for incremental updates
rsync -avz ~/Projects/shred-tracker/ pi@raspberrypi.local:~/shred-tracker/
```

### 12.5 Install and Run on Pi

SSH into Pi and run:

```bash
cd ~/shred-tracker

# Install dependencies (may take a while)
npm install

# Build for production
npm run build

# Start production server
npm start -- --hostname 0.0.0.0 --port 3000
```

### 12.6 Run as Background Service

Create a systemd service for automatic startup:

```bash
# Create service file
sudo nano /etc/systemd/system/shredtracker.service
```

Content:

```ini
[Unit]
Description=ShredTracker Fitness App
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/shred-tracker
ExecStart=/usr/bin/npm start -- --hostname 0.0.0.0 --port 3000
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable shredtracker
sudo systemctl start shredtracker
sudo systemctl status shredtracker
```

### 12.7 Set Static IP on Pi

To always access at the same address:

1. Find Pi's current IP: `hostname -I`
2. Edit dhcpcd config: `sudo nano /etc/dhcpcd.conf`
3. Add at bottom:

```
interface wlan0
static ip_address=192.168.1.200/24
static routers=192.168.1.1
static domain_name_servers=192.168.1.1 8.8.8.8
```

4. Reboot: `sudo reboot`

Now always access at: `http://192.168.1.200:3000`

### 12.8 Data Backup Strategy

Your SQLite database and photos should be backed up:

**Option A: Copy to Mac periodically**

```bash
scp pi@192.168.1.200:~/shred-tracker/data/shredtracker.db ~/Backups/
scp -r pi@192.168.1.200:~/shred-tracker/public/photos ~/Backups/
```

**Option B: Automated backup script on Pi**

```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
cp ~/shred-tracker/data/shredtracker.db ~/backups/shredtracker-$DATE.db
```

Run via cron weekly.

---

## 13. Development Timeline

### 13.1 Estimated Time Investment

| Phase | Duration | Hours | Description |
|-------|----------|-------|-------------|
| Setup | Day 1 | 2-3 hrs | Environment, project creation, dependencies |
| Database | Day 1-2 | 3-4 hrs | Schema design, initialization, basic queries |
| Workout Tracker | Day 2-4 | 8-12 hrs | Core feature, most complex |
| Nutrition Tracker | Day 5-6 | 4-6 hrs | Simpler, mostly display logic |
| Daily Check-ins | Day 6-7 | 4-6 hrs | Weight input, photo capture |
| Dashboard | Day 7-9 | 6-8 hrs | Charts, aggregations, UI polish |
| Testing & Polish | Day 9-10 | 4-6 hrs | Bug fixes, mobile testing |
| **Total** | **~2 weeks** | **30-45 hrs** | Working MVP |

### 13.2 Recommended Build Order

```
Week 1:
├── Day 1: Setup + Database
├── Day 2-3: Workout tracker (basic flow)
├── Day 4: Workout tracker (progressive overload, timer)
├── Day 5: Nutrition tracker
├── Day 6: Daily check-ins (weight)
└── Day 7: Daily check-ins (photos)

Week 2:
├── Day 8: Dashboard (basic)
├── Day 9: Dashboard (charts)
├── Day 10: Progress page
├── Day 11: Mobile testing + fixes
├── Day 12: Polish + edge cases
└── Day 13-14: Buffer / Raspberry Pi migration
```

### 13.3 MVP vs Nice-to-Have

**MVP (Must Have for Day 1 Use):**

- Log workout sets with weight/reps
- See today's workout and exercises
- Rest timer
- Log morning weight
- Basic dashboard with today's info

**V1.1 (Add After MVP Works):**

- Progressive overload suggestions
- Meal tracking
- Progress photos
- Charts and graphs

**V2.0 (Nice to Have):**

- Exercise animations
- Photo comparison tool
- Export data to CSV
- Dark mode
- Notifications/reminders

### 13.4 Testing Checklist

Before considering MVP complete:

```
[ ] Can start and complete a full workout
[ ] Sets/reps/weights save to database
[ ] Rest timer works correctly
[ ] Can log morning weight
[ ] Can access from iPhone on same WiFi
[ ] UI is usable with one hand at gym
[ ] Data persists after server restart
[ ] Can see historical workout data
[ ] Dashboard loads without errors
```

---

## Final Notes

### Key Success Factors

1. **Start Simple:** Get basic workout logging working before adding animations or charts
2. **Test on Phone Early:** Build with iPhone in hand, not just desktop browser
3. **Backup Your Data:** Before making changes, backup your SQLite file
4. **Iterate:** Use the app for a few workouts, note what's annoying, fix it

### Common Pitfalls to Avoid

| Pitfall | How to Avoid |
|---------|--------------|
| Over-engineering | Build MVP first, add features later |
| Desktop-first design | Always test on iPhone while building |
| Complex state management | SQLite + simple API is enough |
| Skipping database design | Get schema right first, saves headaches |
| Forgetting timezones | Store all times as UTC, convert on display |

### Resources for Learning

| Topic | Resource |
|-------|----------|
| Next.js | nextjs.org/docs |
| Tailwind CSS | tailwindcss.com/docs |
| SQLite with Node | github.com/WiseLibs/better-sqlite3 |
| Recharts | recharts.org |
| Framer Motion | framer.com/motion |
| Lottie Files | lottiefiles.com |

---

**You now have everything you need to build ShredTracker. Start with the setup, get the database working, and build one feature at a time. In two weeks, you'll have a custom fitness app tailored exactly to your program.**

**NOW GO GET SHREDDED.**
