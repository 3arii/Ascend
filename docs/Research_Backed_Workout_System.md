# Research-Backed Workout System

## Complete Training Documentation for ShredTracker

---

## Table of Contents

1. [Research Foundation](#1-research-foundation)
2. [The Perfect 6-Day PPL Split (Complete JSON)](#2-the-perfect-6-day-ppl-split)
3. [Progressive Overload System](#3-progressive-overload-system)
4. [Exercise Variation Protocol](#4-exercise-variation-protocol)
5. [App Implementation Guide](#5-app-implementation-guide)
6. [Database Schema](#6-database-schema)
7. [Algorithm Pseudocode](#7-algorithm-pseudocode)

---

## 1. Research Foundation

### 1.1 Key Research Findings Summary

| Principle | Research Finding | Source | Application |
|-----------|------------------|--------|-------------|
| **Frequency** | Training 2x/week per muscle superior to 1x/week | Schoenfeld et al. (2016) | 6-day PPL hits each muscle 2x |
| **Volume** | 12-20 sets/muscle/week optimal for hypertrophy | Schoenfeld et al. (2017), Baz-Valle (2022) | 10-20 sets per muscle weekly |
| **Sets/Session** | >8 sets per muscle per session = diminishing returns | Grgic & Schoenfeld (2018) | Max 8-10 sets per muscle per workout |
| **Progressive Overload** | Load OR rep progression both produce equal hypertrophy | Schoenfeld et al. (2022) | Double progression system |
| **Exercise Variation** | Systematic rotation every 4-6 weeks enhances growth; random/excessive rotation hurts gains | Kassiano et al. (2022), Damas (2024) | Fixed compounds, rotate accessories |
| **Proximity to Failure** | 1-3 RIR optimal; failure not necessary | Grgic et al. (2021) | Train 1-2 reps from failure |
| **Rep Ranges** | All ranges produce hypertrophy when near failure | Schoenfeld (2010) | Mix of 5-8, 8-12, 12-15 reps |

### 1.2 Research Parameters JSON

```json
{
  "research_parameters": {
    "frequency": {
      "optimal": "2x per muscle per week",
      "minimum_effective": "1x per week",
      "maximum_useful": "3x per week",
      "source": "Schoenfeld et al. (2016) - Sports Medicine Meta-Analysis"
    },
    "weekly_volume_sets": {
      "beginner": { "min": 6, "max": 12 },
      "intermediate": { "min": 12, "max": 18 },
      "advanced": { "min": 16, "max": 22 },
      "maximum_recoverable": 25,
      "source": "Schoenfeld et al. (2017) - Journal of Sports Sciences"
    },
    "sets_per_session_per_muscle": {
      "minimum_effective": 3,
      "optimal": 6,
      "maximum_before_diminishing_returns": 10,
      "source": "Grgic & Schoenfeld (2018)"
    },
    "rep_ranges_by_goal": {
      "strength": { "min": 1, "max": 6, "percent_1rm": [80, 90] },
      "hypertrophy": { "min": 6, "max": 12, "percent_1rm": [65, 80] },
      "endurance": { "min": 12, "max": 20, "percent_1rm": [50, 65] }
    },
    "rest_periods_seconds": {
      "heavy_compound": { "min": 180, "max": 300 },
      "moderate_compound": { "min": 120, "max": 180 },
      "isolation": { "min": 60, "max": 120 }
    },
    "reps_in_reserve": {
      "optimal_for_hypertrophy": { "min": 1, "max": 3 },
      "strength_work": { "min": 1, "max": 2 }
    },
    "exercise_rotation_weeks": {
      "compounds": "never_rotate",
      "accessories": { "min": 4, "max": 8 }
    },
    "deload_frequency_weeks": {
      "min": 4,
      "max": 6,
      "volume_reduction_percent": 50
    }
  }
}
```

---

## 2. The Perfect 6-Day PPL Split

### 2.1 Program Overview

```json
{
  "program_metadata": {
    "name": "Research-Backed 6-Day PPL",
    "version": "1.0",
    "author": "Based on Schoenfeld, Krieger, Kassiano et al.",
    "goal": "Maximize hypertrophy with strength foundation",
    "duration_weeks": 12,
    "days_per_week": 6,
    "frequency_per_muscle": "2x weekly",
    "progression_model": "Double Progression with Linear Periodization",
    "suitable_for": ["intermediate", "advanced"],
    "minimum_training_age_months": 6
  },
  "weekly_structure": {
    "day_1": "Push A (Strength Focus)",
    "day_2": "Pull A (Strength Focus)",
    "day_3": "Legs A (Strength Focus)",
    "day_4": "Push B (Hypertrophy Focus)",
    "day_5": "Pull B (Hypertrophy Focus)",
    "day_6": "Legs B (Hypertrophy Focus)",
    "day_7": "Rest"
  },
  "weekly_volume_targets": {
    "chest": { "min_sets": 14, "max_sets": 18 },
    "back": { "min_sets": 16, "max_sets": 22 },
    "shoulders_total": { "min_sets": 16, "max_sets": 20 },
    "quads": { "min_sets": 14, "max_sets": 18 },
    "hamstrings": { "min_sets": 10, "max_sets": 14 },
    "glutes": { "min_sets": 10, "max_sets": 14 },
    "biceps": { "min_sets": 8, "max_sets": 12 },
    "triceps": { "min_sets": 10, "max_sets": 14 },
    "calves": { "min_sets": 8, "max_sets": 12 }
  }
}
```


### 2.2 Complete Workout Program JSON

```json
{
  "workouts": [
    {
      "id": "push_a",
      "day": 1,
      "name": "Push A",
      "focus": "Strength",
      "target_duration_minutes": 60,
      "muscles_primary": ["chest", "front_delts", "triceps"],
      "exercises": [
        {
          "id": "bench_press",
          "name": "Barbell Bench Press",
          "category": "compound",
          "rotation_locked": true,
          "sets": 4,
          "rep_range": { "min": 5, "max": 8 },
          "rpe_target": 8,
          "rest_seconds": 180,
          "muscles": { "primary": ["chest"], "secondary": ["front_delts", "triceps"] },
          "progression": { "type": "double_progression", "add_weight_lbs": 5 },
          "notes": "Primary strength movement - never rotate"
        },
        {
          "id": "ohp",
          "name": "Overhead Press (Barbell)",
          "category": "compound",
          "rotation_locked": true,
          "sets": 3,
          "rep_range": { "min": 6, "max": 8 },
          "rpe_target": 8,
          "rest_seconds": 150,
          "muscles": { "primary": ["front_delts"], "secondary": ["lateral_delts", "triceps"] },
          "progression": { "type": "double_progression", "add_weight_lbs": 5 }
        },
        {
          "id": "incline_db_press",
          "name": "Incline Dumbbell Press",
          "category": "compound",
          "rotation_locked": false,
          "sets": 3,
          "rep_range": { "min": 8, "max": 10 },
          "rpe_target": 8,
          "rest_seconds": 120,
          "muscles": { "primary": ["upper_chest"], "secondary": ["front_delts"] },
          "rotation_alternatives": ["Incline Barbell Press", "Low Incline Smith Machine Press"]
        },
        {
          "id": "cable_lateral_raise",
          "name": "Cable Lateral Raises",
          "category": "isolation",
          "rotation_locked": false,
          "sets": 3,
          "rep_range": { "min": 12, "max": 15 },
          "rpe_target": 9,
          "rest_seconds": 60,
          "muscles": { "primary": ["lateral_delts"] },
          "rotation_alternatives": ["Dumbbell Lateral Raises", "Machine Lateral Raises"]
        },
        {
          "id": "tricep_pushdown",
          "name": "Tricep Pushdowns",
          "category": "isolation",
          "rotation_locked": false,
          "sets": 3,
          "rep_range": { "min": 10, "max": 12 },
          "rpe_target": 9,
          "rest_seconds": 60,
          "muscles": { "primary": ["triceps"] },
          "rotation_alternatives": ["Overhead Cable Extension", "Tricep Dip Machine"]
        },
        {
          "id": "overhead_tricep_ext",
          "name": "Overhead Tricep Extension",
          "category": "isolation",
          "rotation_locked": false,
          "sets": 2,
          "rep_range": { "min": 12, "max": 15 },
          "rpe_target": 9,
          "rest_seconds": 60,
          "muscles": { "primary": ["triceps_long_head"] },
          "rotation_alternatives": ["Skull Crushers", "Single Arm Overhead Extension"]
        }
      ],
      "volume_per_muscle": { "chest": 7, "front_delts": 6, "lateral_delts": 3, "triceps": 5 }
    },
    {
      "id": "pull_a",
      "day": 2,
      "name": "Pull A",
      "focus": "Strength",
      "target_duration_minutes": 65,
      "muscles_primary": ["back", "biceps"],
      "exercises": [
        {
          "id": "deadlift",
          "name": "Conventional Deadlift",
          "category": "compound",
          "rotation_locked": true,
          "sets": 4,
          "rep_range": { "min": 5, "max": 6 },
          "rpe_target": 8,
          "rest_seconds": 240,
          "muscles": { "primary": ["posterior_chain", "back"], "secondary": ["traps", "forearms"] },
          "progression": { "type": "double_progression", "add_weight_lbs": 10 },
          "notes": "Only do heavy deadlifts 1x/week"
        },
        {
          "id": "weighted_pullups",
          "name": "Weighted Pull-ups",
          "category": "compound",
          "rotation_locked": true,
          "sets": 4,
          "rep_range": { "min": 6, "max": 8 },
          "rpe_target": 8,
          "rest_seconds": 150,
          "muscles": { "primary": ["lats"], "secondary": ["biceps", "rear_delts"] },
          "progression": { "type": "double_progression", "add_weight_lbs": 2.5 }
        },
        {
          "id": "barbell_row",
          "name": "Barbell Rows",
          "category": "compound",
          "rotation_locked": true,
          "sets": 3,
          "rep_range": { "min": 6, "max": 8 },
          "rpe_target": 8,
          "rest_seconds": 150,
          "muscles": { "primary": ["mid_back", "lats"], "secondary": ["rear_delts", "biceps"] },
          "progression": { "type": "double_progression", "add_weight_lbs": 5 }
        },
        {
          "id": "face_pulls",
          "name": "Face Pulls",
          "category": "isolation",
          "rotation_locked": false,
          "sets": 3,
          "rep_range": { "min": 15, "max": 20 },
          "rpe_target": 8,
          "rest_seconds": 60,
          "muscles": { "primary": ["rear_delts"], "secondary": ["external_rotators"] },
          "rotation_alternatives": ["Reverse Pec Deck", "Rear Delt Cable Flyes"]
        },
        {
          "id": "barbell_curl",
          "name": "Barbell Curls",
          "category": "isolation",
          "rotation_locked": false,
          "sets": 3,
          "rep_range": { "min": 8, "max": 10 },
          "rpe_target": 9,
          "rest_seconds": 90,
          "muscles": { "primary": ["biceps"] },
          "rotation_alternatives": ["EZ Bar Curls", "Dumbbell Curls"]
        },
        {
          "id": "hammer_curl",
          "name": "Hammer Curls",
          "category": "isolation",
          "rotation_locked": false,
          "sets": 2,
          "rep_range": { "min": 10, "max": 12 },
          "rpe_target": 9,
          "rest_seconds": 60,
          "muscles": { "primary": ["brachialis", "biceps"] },
          "rotation_alternatives": ["Cross Body Hammer Curls", "Cable Hammer Curls"]
        }
      ],
      "volume_per_muscle": { "back": 11, "rear_delts": 3, "biceps": 5 }
    },
    {
      "id": "legs_a",
      "day": 3,
      "name": "Legs A",
      "focus": "Strength",
      "target_duration_minutes": 65,
      "muscles_primary": ["quads", "glutes"],
      "exercises": [
        {
          "id": "back_squat",
          "name": "Barbell Back Squat",
          "category": "compound",
          "rotation_locked": true,
          "sets": 4,
          "rep_range": { "min": 5, "max": 8 },
          "rpe_target": 8,
          "rest_seconds": 240,
          "muscles": { "primary": ["quads", "glutes"], "secondary": ["adductors", "core"] },
          "progression": { "type": "double_progression", "add_weight_lbs": 5 }
        },
        {
          "id": "rdl",
          "name": "Romanian Deadlift",
          "category": "compound",
          "rotation_locked": true,
          "sets": 3,
          "rep_range": { "min": 8, "max": 10 },
          "rpe_target": 8,
          "rest_seconds": 150,
          "muscles": { "primary": ["hamstrings", "glutes"], "secondary": ["lower_back"] },
          "progression": { "type": "double_progression", "add_weight_lbs": 5 }
        },
        {
          "id": "leg_press",
          "name": "Leg Press",
          "category": "compound",
          "rotation_locked": false,
          "sets": 3,
          "rep_range": { "min": 10, "max": 12 },
          "rpe_target": 9,
          "rest_seconds": 120,
          "muscles": { "primary": ["quads"], "secondary": ["glutes"] },
          "rotation_alternatives": ["Hack Squat", "Belt Squat"]
        },
        {
          "id": "walking_lunge",
          "name": "Walking Lunges",
          "category": "compound",
          "rotation_locked": false,
          "sets": 3,
          "rep_range": { "min": 12, "max": 12 },
          "rep_type": "per_leg",
          "rpe_target": 8,
          "rest_seconds": 90,
          "muscles": { "primary": ["quads", "glutes"] },
          "rotation_alternatives": ["Reverse Lunges", "Bulgarian Split Squats"]
        },
        {
          "id": "leg_curl_a",
          "name": "Leg Curls",
          "category": "isolation",
          "rotation_locked": false,
          "sets": 3,
          "rep_range": { "min": 10, "max": 12 },
          "rpe_target": 9,
          "rest_seconds": 60,
          "muscles": { "primary": ["hamstrings"] },
          "rotation_alternatives": ["Nordic Curls", "Glute Ham Raise"]
        },
        {
          "id": "standing_calf_raise",
          "name": "Standing Calf Raises",
          "category": "isolation",
          "rotation_locked": false,
          "sets": 4,
          "rep_range": { "min": 12, "max": 15 },
          "rpe_target": 9,
          "rest_seconds": 45,
          "muscles": { "primary": ["gastrocnemius"] },
          "rotation_alternatives": ["Donkey Calf Raises", "Leg Press Calf Raises"]
        }
      ],
      "volume_per_muscle": { "quads": 10, "hamstrings": 6, "glutes": 7, "calves": 4 }
    },
    {
      "id": "push_b",
      "day": 4,
      "name": "Push B",
      "focus": "Hypertrophy",
      "target_duration_minutes": 65,
      "muscles_primary": ["shoulders", "chest", "triceps"],
      "exercises": [
        {
          "id": "db_shoulder_press",
          "name": "Dumbbell Shoulder Press",
          "category": "compound",
          "rotation_locked": false,
          "sets": 4,
          "rep_range": { "min": 8, "max": 10 },
          "rpe_target": 8,
          "rest_seconds": 120,
          "muscles": { "primary": ["front_delts", "lateral_delts"], "secondary": ["triceps"] },
          "rotation_alternatives": ["Arnold Press", "Machine Shoulder Press"]
        },
        {
          "id": "incline_bb_press",
          "name": "Incline Barbell Press",
          "category": "compound",
          "rotation_locked": false,
          "sets": 3,
          "rep_range": { "min": 8, "max": 10 },
          "rpe_target": 8,
          "rest_seconds": 120,
          "muscles": { "primary": ["upper_chest"], "secondary": ["front_delts", "triceps"] },
          "rotation_alternatives": ["Incline Dumbbell Press", "Incline Smith Machine Press"]
        },
        {
          "id": "cable_fly_low_high",
          "name": "Cable Flyes (Low to High)",
          "category": "isolation",
          "rotation_locked": false,
          "sets": 3,
          "rep_range": { "min": 12, "max": 15 },
          "rpe_target": 9,
          "rest_seconds": 60,
          "muscles": { "primary": ["upper_chest"] },
          "rotation_alternatives": ["Pec Deck", "Dumbbell Flyes"]
        },
        {
          "id": "db_lateral_raise",
          "name": "Lateral Raises",
          "category": "isolation",
          "rotation_locked": false,
          "sets": 4,
          "rep_range": { "min": 12, "max": 15 },
          "rpe_target": 9,
          "rest_seconds": 45,
          "muscles": { "primary": ["lateral_delts"] },
          "rotation_alternatives": ["Machine Lateral Raises", "Cable Lateral Raises"]
        },
        {
          "id": "upright_row",
          "name": "Upright Rows",
          "category": "compound",
          "rotation_locked": false,
          "sets": 3,
          "rep_range": { "min": 10, "max": 12 },
          "rpe_target": 8,
          "rest_seconds": 60,
          "muscles": { "primary": ["lateral_delts"], "secondary": ["traps"] },
          "rotation_alternatives": ["High Pulls", "Lu Raises"]
        },
        {
          "id": "weighted_dips",
          "name": "Tricep Dips",
          "category": "compound",
          "rotation_locked": false,
          "sets": 3,
          "rep_range": { "min": 8, "max": 12 },
          "rpe_target": 8,
          "rest_seconds": 90,
          "muscles": { "primary": ["triceps"], "secondary": ["chest"] },
          "rotation_alternatives": ["Close Grip Bench Press", "JM Press"]
        },
        {
          "id": "skull_crusher",
          "name": "Skull Crushers",
          "category": "isolation",
          "rotation_locked": false,
          "sets": 2,
          "rep_range": { "min": 10, "max": 12 },
          "rpe_target": 9,
          "rest_seconds": 60,
          "muscles": { "primary": ["triceps"] },
          "rotation_alternatives": ["Overhead Cable Extension", "French Press"]
        }
      ],
      "volume_per_muscle": { "chest": 9, "shoulders": 11, "triceps": 8 }
    },
    {
      "id": "pull_b",
      "day": 5,
      "name": "Pull B",
      "focus": "Hypertrophy",
      "target_duration_minutes": 65,
      "muscles_primary": ["back", "biceps"],
      "exercises": [
        {
          "id": "lat_pulldown",
          "name": "Lat Pulldowns",
          "category": "compound",
          "rotation_locked": false,
          "sets": 4,
          "rep_range": { "min": 10, "max": 12 },
          "rpe_target": 8,
          "rest_seconds": 90,
          "muscles": { "primary": ["lats"], "secondary": ["biceps"] },
          "rotation_alternatives": ["Neutral Grip Pulldowns", "Close Grip Pulldowns"]
        },
        {
          "id": "chest_supported_row",
          "name": "Chest-Supported Rows",
          "category": "compound",
          "rotation_locked": false,
          "sets": 4,
          "rep_range": { "min": 10, "max": 12 },
          "rpe_target": 8,
          "rest_seconds": 90,
          "muscles": { "primary": ["mid_back", "lats"], "secondary": ["rear_delts"] },
          "rotation_alternatives": ["Seal Rows", "Machine Rows"]
        },
        {
          "id": "single_arm_cable_row",
          "name": "Single-Arm Cable Rows",
          "category": "compound",
          "rotation_locked": false,
          "sets": 3,
          "rep_range": { "min": 12, "max": 12 },
          "rep_type": "per_arm",
          "rpe_target": 8,
          "rest_seconds": 60,
          "muscles": { "primary": ["lats", "mid_back"] },
          "rotation_alternatives": ["Single Arm Dumbbell Rows", "Meadows Rows"]
        },
        {
          "id": "straight_arm_pulldown",
          "name": "Straight-Arm Pulldowns",
          "category": "isolation",
          "rotation_locked": false,
          "sets": 3,
          "rep_range": { "min": 12, "max": 15 },
          "rpe_target": 9,
          "rest_seconds": 60,
          "muscles": { "primary": ["lats"] },
          "rotation_alternatives": ["Dumbbell Pullovers", "Rope Pullovers"]
        },
        {
          "id": "rear_delt_fly",
          "name": "Rear Delt Flyes",
          "category": "isolation",
          "rotation_locked": false,
          "sets": 4,
          "rep_range": { "min": 15, "max": 20 },
          "rpe_target": 9,
          "rest_seconds": 45,
          "muscles": { "primary": ["rear_delts"] },
          "rotation_alternatives": ["Reverse Pec Deck", "Face Pulls"]
        },
        {
          "id": "incline_db_curl",
          "name": "Incline Dumbbell Curls",
          "category": "isolation",
          "rotation_locked": false,
          "sets": 3,
          "rep_range": { "min": 10, "max": 12 },
          "rpe_target": 9,
          "rest_seconds": 60,
          "muscles": { "primary": ["biceps"] },
          "rotation_alternatives": ["Preacher Curls", "Spider Curls"]
        },
        {
          "id": "cable_curl",
          "name": "Cable Curls",
          "category": "isolation",
          "rotation_locked": false,
          "sets": 2,
          "rep_range": { "min": 12, "max": 15 },
          "rpe_target": 9,
          "rest_seconds": 45,
          "muscles": { "primary": ["biceps"] },
          "rotation_alternatives": ["Concentration Curls", "Machine Curls"]
        }
      ],
      "volume_per_muscle": { "back": 14, "rear_delts": 4, "biceps": 5 }
    },
    {
      "id": "legs_b",
      "day": 6,
      "name": "Legs B",
      "focus": "Hypertrophy",
      "target_duration_minutes": 60,
      "muscles_primary": ["quads", "hamstrings", "glutes"],
      "exercises": [
        {
          "id": "front_squat",
          "name": "Front Squat",
          "category": "compound",
          "rotation_locked": false,
          "sets": 4,
          "rep_range": { "min": 8, "max": 10 },
          "rpe_target": 8,
          "rest_seconds": 150,
          "muscles": { "primary": ["quads"], "secondary": ["core", "glutes"] },
          "rotation_alternatives": ["Goblet Squat", "Hack Squat"]
        },
        {
          "id": "bulgarian_split_squat",
          "name": "Bulgarian Split Squats",
          "category": "compound",
          "rotation_locked": false,
          "sets": 3,
          "rep_range": { "min": 10, "max": 10 },
          "rep_type": "per_leg",
          "rpe_target": 8,
          "rest_seconds": 90,
          "muscles": { "primary": ["quads", "glutes"] },
          "rotation_alternatives": ["Walking Lunges", "Step Ups"]
        },
        {
          "id": "leg_extension",
          "name": "Leg Extensions",
          "category": "isolation",
          "rotation_locked": false,
          "sets": 4,
          "rep_range": { "min": 12, "max": 15 },
          "rpe_target": 9,
          "rest_seconds": 60,
          "muscles": { "primary": ["quads"] },
          "rotation_alternatives": ["Sissy Squats", "Spanish Squats"]
        },
        {
          "id": "lying_leg_curl",
          "name": "Lying Leg Curls",
          "category": "isolation",
          "rotation_locked": false,
          "sets": 4,
          "rep_range": { "min": 10, "max": 12 },
          "rpe_target": 9,
          "rest_seconds": 60,
          "muscles": { "primary": ["hamstrings"] },
          "rotation_alternatives": ["Seated Leg Curls", "Nordic Curls"]
        },
        {
          "id": "hip_thrust",
          "name": "Hip Thrusts",
          "category": "compound",
          "rotation_locked": false,
          "sets": 3,
          "rep_range": { "min": 10, "max": 12 },
          "rpe_target": 9,
          "rest_seconds": 90,
          "muscles": { "primary": ["glutes"], "secondary": ["hamstrings"] },
          "rotation_alternatives": ["Cable Pull-Throughs", "Barbell Glute Bridges"]
        },
        {
          "id": "seated_calf_raise",
          "name": "Seated Calf Raises",
          "category": "isolation",
          "rotation_locked": false,
          "sets": 4,
          "rep_range": { "min": 15, "max": 20 },
          "rpe_target": 9,
          "rest_seconds": 45,
          "muscles": { "primary": ["soleus"] },
          "rotation_alternatives": ["Calf Press on Leg Press", "Single Leg Calf Raises"]
        }
      ],
      "volume_per_muscle": { "quads": 8, "hamstrings": 7, "glutes": 6, "calves": 4 }
    },
    {
      "id": "rest_day",
      "day": 7,
      "name": "Rest",
      "focus": "Recovery",
      "exercises": [],
      "recommendations": ["7-9 hours sleep", "Stay hydrated", "Light stretching", "10-20 min walk"]
    }
  ]
}
```


---

## 3. Progressive Overload System

### 3.1 The Double Progression Method

```json
{
  "progression_system": {
    "name": "Double Progression",
    "description": "Progress via reps first, then weight. Equal hypertrophy to pure load progression.",
    "source": "Schoenfeld et al. (2022) - PMC9528903",
    "steps": [
      "Start at BOTTOM of rep range (e.g., 8 reps for 8-12 range)",
      "Each session, try to add 1 rep to each set",
      "When you hit TOP of rep range on ALL sets (e.g., 12x3)",
      "Add weight and drop back to bottom of rep range",
      "Repeat the cycle"
    ],
    "example": {
      "exercise": "Bench Press",
      "rep_range": [8, 10],
      "timeline": [
        { "week": 1, "weight": 135, "reps": [8, 8, 8], "action": "baseline" },
        { "week": 2, "weight": 135, "reps": [9, 8, 8], "action": "add_reps" },
        { "week": 3, "weight": 135, "reps": [9, 9, 9], "action": "add_reps" },
        { "week": 4, "weight": 135, "reps": [10, 10, 9], "action": "add_reps" },
        { "week": 5, "weight": 135, "reps": [10, 10, 10], "action": "TRIGGER" },
        { "week": 6, "weight": 140, "reps": [8, 8, 7], "action": "new_baseline" }
      ]
    }
  }
}
```

### 3.2 Weight Increment Rules

```json
{
  "weight_increments": {
    "major_compounds": {
      "exercises": ["Bench Press", "Squat", "Deadlift", "OHP", "Rows"],
      "increment_lbs": 5
    },
    "minor_compounds": {
      "exercises": ["Incline Press", "Leg Press", "Pull-ups", "Dips"],
      "increment_lbs": 5
    },
    "isolation_large": {
      "exercises": ["Leg Curls", "Leg Extensions", "Lat Pulldowns"],
      "increment_lbs": 5
    },
    "isolation_small": {
      "exercises": ["Lateral Raises", "Curls", "Tricep Extensions", "Face Pulls"],
      "increment_lbs": 2.5
    }
  }
}
```

### 3.3 Feedback-Based Weight Adjustment

```json
{
  "feedback_adjustments": {
    "rpe_based": {
      "target_rpe": 8,
      "target_rir": 2,
      "rules": [
        {
          "scenario": "RPE 6 or below (4+ RIR)",
          "meaning": "Weight too light",
          "action": "Increase 5-10 lbs compounds, 2.5-5 lbs isolation"
        },
        {
          "scenario": "RPE 7-8 (2-3 RIR)",
          "meaning": "Weight perfect",
          "action": "Continue double progression normally"
        },
        {
          "scenario": "RPE 9-10 (0-1 RIR)",
          "meaning": "Weight at limit",
          "action": "Maintain weight, focus on quality reps"
        },
        {
          "scenario": "Failed minimum reps",
          "meaning": "Too heavy or recovery issue",
          "action": "Reduce 5-10% if form broke down"
        }
      ]
    },
    "form_quality": {
      "perfect": { "definition": "Controlled tempo, full ROM", "action": "Progress normally" },
      "grinder": { "definition": "Slow but form maintained", "action": "Count rep, note high RPE" },
      "ugly": { "definition": "Form breakdown, partial ROM", "action": "Do NOT count rep" }
    }
  }
}
```

### 3.4 Deload Protocol

```json
{
  "deload_protocol": {
    "frequency": "Every 4-6 weeks",
    "triggers": [
      "Strength decreased 2+ consecutive sessions",
      "Chronic fatigue lasting 1+ week",
      "Nagging joint pain",
      "Motivation significantly decreased"
    ],
    "options": {
      "volume_reduction": {
        "method": "Reduce sets by 50%, maintain weight",
        "example": "4x8 @ 185 → 2x8 @ 185",
        "best_for": "Most situations"
      },
      "intensity_reduction": {
        "method": "Reduce weight by 40-50%, maintain sets",
        "example": "4x8 @ 185 → 4x8 @ 110",
        "best_for": "Joint issues, technique work"
      },
      "full_rest": {
        "method": "No lifting for 1 week",
        "best_for": "Severe fatigue, injury prevention"
      }
    },
    "post_deload": "Resume at weights used before deload"
  }
}
```

---

## 4. Exercise Variation Protocol

### 4.1 Research-Based Rotation Rules

```json
{
  "rotation_rules": {
    "research_source": "Kassiano et al. (2022) - JSCR",
    "finding": "Systematic variation enhances hypertrophy; excessive random variation hurts gains",
    "categories": {
      "never_rotate": {
        "exercises": ["Bench Press", "Squat", "Deadlift", "OHP", "Rows", "Pull-ups"],
        "reasoning": "Skill-based, need practice for strength gains"
      },
      "rotate_infrequently": {
        "frequency": "Every 8-12 weeks",
        "exercises": ["Incline Press", "RDL", "Front Squat", "Lat Pulldowns"]
      },
      "rotate_regularly": {
        "frequency": "Every 4-6 weeks",
        "exercises": "All isolation and accessory exercises",
        "reasoning": "Less skill-dependent, variation enhances regional hypertrophy"
      }
    }
  }
}
```

### 4.2 Exercise Alternatives Database

```json
{
  "exercise_alternatives": {
    "chest": {
      "horizontal_press": ["Barbell Bench", "DB Bench", "Machine Press", "Smith Bench"],
      "incline_press": ["Incline BB", "Incline DB", "Low Incline Smith"],
      "isolation": ["Cable Flyes", "Pec Deck", "DB Flyes"]
    },
    "back": {
      "vertical_pull": ["Pull-ups", "Lat Pulldowns (wide)", "Lat Pulldowns (neutral)"],
      "horizontal_pull": ["BB Rows", "Chest-Supported Rows", "Cable Rows", "DB Rows"],
      "isolation": ["Straight-Arm Pulldowns", "Pullovers"]
    },
    "shoulders": {
      "overhead_press": ["BB OHP", "DB Shoulder Press", "Arnold Press", "Machine Press"],
      "lateral_delts": ["DB Lateral Raises", "Cable Lateral Raises", "Machine Laterals"],
      "rear_delts": ["Face Pulls", "Reverse Pec Deck", "Rear Delt Flyes"]
    },
    "quads": {
      "squat_pattern": ["Back Squat", "Front Squat", "Hack Squat", "Goblet Squat"],
      "unilateral": ["Bulgarian Split Squats", "Lunges", "Step-Ups"],
      "isolation": ["Leg Extensions", "Sissy Squats"]
    },
    "hamstrings": {
      "hip_hinge": ["RDL", "Stiff-Leg Deadlift", "Good Mornings"],
      "leg_curl": ["Lying Leg Curls", "Seated Leg Curls", "Nordic Curls"]
    },
    "triceps": {
      "extension": ["Pushdowns", "Overhead Extension", "Skull Crushers"],
      "compound": ["Close-Grip Bench", "Dips"]
    },
    "biceps": {
      "curl_variations": ["BB Curls", "EZ Curls", "DB Curls", "Cable Curls"],
      "position_based": ["Incline Curls (stretch)", "Preacher Curls (peak)", "Hammer Curls"]
    },
    "calves": {
      "straight_knee": ["Standing Calf Raises", "Donkey Calf Raises"],
      "bent_knee": ["Seated Calf Raises"]
    }
  }
}
```

### 4.3 Rotation Schedule

```json
{
  "rotation_schedule": {
    "mesocycle_length": 4,
    "rotation_timing": "Start of each mesocycle",
    "example": {
      "mesocycle_1_weeks_1_4": {
        "push_accessories": ["Cable Lateral Raises", "Tricep Pushdowns", "Incline DB Press"],
        "pull_accessories": ["Face Pulls", "Barbell Curls", "Hammer Curls"],
        "leg_accessories": ["Leg Press", "Lying Leg Curls", "Standing Calf Raises"]
      },
      "mesocycle_2_weeks_5_8": {
        "push_accessories": ["DB Lateral Raises", "Overhead Extension", "Incline BB Press"],
        "pull_accessories": ["Reverse Pec Deck", "EZ Bar Curls", "Cable Hammer Curls"],
        "leg_accessories": ["Hack Squat", "Seated Leg Curls", "Leg Press Calf Raises"]
      },
      "mesocycle_3_weeks_9_12": {
        "push_accessories": ["Machine Laterals", "Skull Crushers", "Low Incline Smith"],
        "pull_accessories": ["Rear Delt Flyes", "Incline DB Curls", "Cross Body Hammers"],
        "leg_accessories": ["Belt Squat", "Nordic Curls", "Donkey Calf Raises"]
      }
    }
  }
}
```


---

## 5. App Implementation Guide

### 5.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SHREDTRACKER WORKOUT SYSTEM                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐     ┌─────────────────┐     ┌───────────┐  │
│  │  WORKOUT DATA   │────▶│  PROGRESSION    │────▶│ EXERCISE  │  │
│  │  (workouts.json)│     │  ENGINE         │     │ ROTATION  │  │
│  └─────────────────┘     └─────────────────┘     │ SCHEDULER │  │
│           │                       │              └───────────┘  │
│           ▼                       ▼                     │       │
│  ┌─────────────────┐     ┌─────────────────┐     ┌───────────┐  │
│  │   ACTIVE        │     │   EXERCISE      │     │  USER     │  │
│  │   WORKOUT       │────▶│   MAXES DB      │────▶│  FEEDBACK │  │
│  │   SESSION       │     │   (SQLite)      │     │  SYSTEM   │  │
│  └─────────────────┘     └─────────────────┘     └───────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Step-by-Step Implementation Plan

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Phase 1: Foundation** | Days 1-3 | Create workouts.json, exercises.json, set up database tables |
| **Phase 2: Core Logic** | Days 4-7 | Build progression engine, feedback system, rotation scheduler |
| **Phase 3: UI Components** | Days 8-10 | ActiveWorkoutView, SetLogger, RestTimer, ProgressionIndicator |
| **Phase 4: Analytics** | Days 11-12 | Strength charts, volume tracking, rotation calendar |

### 5.3 Key Functions to Implement

```javascript
// 1. PROGRESSION ENGINE
calculateRecommendedWeight(exerciseId, userId)
// Returns suggested weight based on history and progression rules

checkProgressionTrigger(exerciseId, lastSession)
// Returns true if ready to add weight (hit max reps on all sets)

applyProgression(exerciseId, currentWeight, increment)
// Updates recommended weight in database

// 2. FEEDBACK SYSTEM
logSetWithFeedback(setData, rpe, formQuality)
// Saves set with user feedback, triggers adjustments if needed

analyzeSessionPerformance(sessionId)
// Returns performance analysis for the session

shouldTriggerDeload(userId, weekHistory)
// Returns true if deload recommended based on fatigue signals

// 3. ROTATION SCHEDULER
getCurrentMesocycle(startDate)
// Returns which 4-week block we're in (1, 2, or 3)

getActiveExercises(mesocycleNum, workoutId)
// Returns current exercises for this mesocycle

scheduleNextRotation(userId)
// Plans the next exercise swap at mesocycle boundary
```

### 5.4 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/workouts/today` | GET | Get today's workout with recommended weights |
| `/api/workouts/sessions` | POST | Start a new workout session |
| `/api/workouts/sets` | POST | Log a completed set with feedback |
| `/api/progression/:exerciseId` | GET | Get progression status for exercise |
| `/api/progression/:exerciseId/apply` | POST | Apply weight progression |
| `/api/rotation/schedule` | GET | Get current and upcoming rotations |
| `/api/rotation/swap` | POST | Swap an exercise for alternative |
| `/api/deload/status` | GET | Check if deload recommended |
| `/api/analytics/strength` | GET | Get strength progress data |
| `/api/analytics/volume` | GET | Get weekly volume by muscle |

---

## 6. Database Schema

### 6.1 Tables

```sql
-- User settings
CREATE TABLE user_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    program_start_date TEXT NOT NULL,
    current_mesocycle INTEGER DEFAULT 1,
    last_deload_date TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Exercise maxes and progression tracking
CREATE TABLE exercise_maxes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exercise_id TEXT UNIQUE NOT NULL,
    exercise_name TEXT NOT NULL,
    estimated_1rm REAL,
    current_working_weight REAL,
    last_reps_achieved TEXT, -- JSON array: [[8,8,8], [9,9,9]]
    last_weight_increase_date TEXT,
    total_progressions INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Workout sessions
CREATE TABLE workout_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_id TEXT NOT NULL,
    workout_name TEXT NOT NULL,
    program_day INTEGER NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    total_duration_minutes INTEGER,
    energy_level INTEGER,
    sleep_quality INTEGER
);

-- Individual sets
CREATE TABLE workout_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    exercise_id TEXT NOT NULL,
    set_number INTEGER NOT NULL,
    target_reps INTEGER,
    actual_reps INTEGER,
    target_weight REAL,
    actual_weight REAL,
    rpe INTEGER,
    form_quality TEXT,
    rest_duration_seconds INTEGER,
    completed_at TEXT,
    FOREIGN KEY (session_id) REFERENCES workout_sessions(id)
);

-- Exercise rotation tracking
CREATE TABLE exercise_rotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_id TEXT NOT NULL,
    base_exercise_id TEXT NOT NULL,
    current_exercise_id TEXT NOT NULL,
    mesocycle_number INTEGER NOT NULL,
    rotated_at TEXT DEFAULT (datetime('now'))
);

-- Deload history
CREATE TABLE deload_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    deload_type TEXT NOT NULL,
    reason TEXT
);

-- Progression history
CREATE TABLE progression_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exercise_id TEXT NOT NULL,
    old_weight REAL NOT NULL,
    new_weight REAL NOT NULL,
    trigger_reason TEXT,
    progressed_at TEXT DEFAULT (datetime('now'))
);
```

---

## 7. Algorithm Pseudocode

### 7.1 Calculate Recommended Weight

```
FUNCTION calculateRecommendedWeight(exercise_id):
    
    exercise = getExerciseFromDB(exercise_id)
    
    IF exercise.current_working_weight IS NULL:
        RETURN { weight: null, message: "Set starting weight in settings" }
    
    last_session = getLastSessionForExercise(exercise_id)
    
    IF last_session IS NULL:
        RETURN { weight: exercise.current_working_weight, is_first: true }
    
    // Check if ready to progress
    IF checkProgressionTrigger(exercise_id, last_session):
        increment = getIncrement(exercise_id)
        new_weight = exercise.current_working_weight + increment
        RETURN { 
            weight: new_weight, 
            is_progression: true,
            message: "Weight increased by " + increment + " lbs!"
        }
    
    // Check if weight should be reduced
    IF last_session.failed_minimum_reps AND last_session.form_issues:
        reduced = exercise.current_working_weight * 0.9
        RETURN { weight: reduced, is_reduction: true }
    
    // Default: keep same weight
    RETURN { weight: exercise.current_working_weight }

END FUNCTION
```

### 7.2 Check Progression Trigger

```
FUNCTION checkProgressionTrigger(exercise_id, last_session):
    
    config = getExerciseConfig(exercise_id)
    rep_max = config.rep_range.max
    required_sets = config.sets
    
    sets_data = last_session.sets
    sets_at_max = 0
    
    FOR EACH set IN sets_data:
        IF set.actual_reps >= rep_max:
            sets_at_max++
    
    // Trigger if ALL sets hit max reps
    RETURN sets_at_max >= required_sets

END FUNCTION
```

### 7.3 Check Deload Status

```
FUNCTION checkDeloadStatus(user_id):
    
    settings = getUserSettings(user_id)
    weeks_since_deload = weeksBetween(settings.last_deload_date, NOW())
    
    // Get fatigue indicators
    recent = getSessionsFromLastNWeeks(2)
    
    fatigue = {
        strength_declining: checkStrengthTrend(recent),
        rpe_increasing: checkRPETrend(recent),
        missed_reps: countMissedReps(recent),
        low_energy: checkEnergyLevels(recent)
    }
    
    fatigue_score = countTrueSignals(fatigue)
    
    IF weeks_since_deload >= 6:
        RETURN { recommendation: "required", reason: "6 weeks since deload" }
    
    IF fatigue_score >= 3:
        RETURN { recommendation: "required", reason: "Multiple fatigue signals" }
    
    IF weeks_since_deload >= 4 AND fatigue_score >= 2:
        RETURN { recommendation: "suggested" }
    
    RETURN { recommendation: "none" }

END FUNCTION
```

### 7.4 Get Current Exercises for Mesocycle

```
FUNCTION getCurrentExercises(workout_id):
    
    settings = getUserSettings()
    mesocycle = settings.current_mesocycle
    
    workout = getWorkoutFromJSON(workout_id)
    rotations = getRotationsForMesocycle(workout_id, mesocycle)
    
    final_exercises = []
    
    FOR EACH exercise IN workout.exercises:
        rotation = rotations.find(r => r.base_exercise_id == exercise.id)
        
        IF rotation EXISTS:
            alternative = getAlternative(rotation.current_exercise_id)
            final_exercises.push({ ...exercise, ...alternative, is_rotated: true })
        ELSE:
            final_exercises.push({ ...exercise, is_rotated: false })
    
    RETURN final_exercises

END FUNCTION
```

---

## 8. File Structure

```
shred-tracker/
├── src/
│   ├── app/
│   │   ├── workout/
│   │   │   ├── page.tsx              # Today's workout
│   │   │   └── active/page.tsx       # Active session
│   │   ├── progress/page.tsx         # Analytics
│   │   └── settings/page.tsx         # User settings
│   │
│   ├── components/
│   │   ├── workout/
│   │   │   ├── ExerciseCard.tsx
│   │   │   ├── SetLogger.tsx
│   │   │   ├── RestTimer.tsx
│   │   │   ├── ProgressionIndicator.tsx
│   │   │   ├── ExerciseRotationModal.tsx
│   │   │   └── DeloadCard.tsx
│   │   └── progress/
│   │       ├── StrengthChart.tsx
│   │       └── VolumeChart.tsx
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts              # Database connection
│   │   │   └── queries.ts            # SQL queries
│   │   ├── progression/
│   │   │   ├── calculator.ts         # Weight recommendations
│   │   │   ├── triggers.ts           # Progression checks
│   │   │   └── deload.ts             # Deload detection
│   │   └── rotation/
│   │       ├── scheduler.ts          # Rotation logic
│   │       └── alternatives.ts       # Exercise mapping
│   │
│   └── data/
│       ├── workouts.json             # Complete program
│       └── exercises.json            # Exercise database
│
└── data/
    └── shredtracker.db               # SQLite database
```

---

## 9. Quick Reference

### Progression Cheat Sheet

| Situation | Action |
|-----------|--------|
| Hit max reps ALL sets | Add weight next session |
| Hit max reps SOME sets | Keep weight, aim for more reps |
| Missed minimum reps (good form) | Keep weight, focus on recovery |
| Missed minimum reps (bad form) | Reduce weight 10% |
| RPE consistently 6 or below | Increase weight mid-session |
| Stuck 3+ weeks | Consider rotation or deload |

### Weight Increments

| Exercise Type | Increment |
|---------------|-----------|
| Squat, Deadlift, Bench, OHP, Rows | +5 lbs |
| Incline Press, Leg Press, Pull-ups | +5 lbs |
| Leg Curls, Extensions, Pulldowns | +5 lbs |
| Lateral Raises, Curls, Triceps | +2.5 lbs |

### Weekly Volume Targets

| Muscle | Weekly Sets |
|--------|-------------|
| Chest | 14-18 |
| Back | 16-22 |
| Shoulders | 16-20 |
| Quads | 14-18 |
| Hamstrings | 10-14 |
| Biceps | 8-12 |
| Triceps | 10-14 |
| Calves | 8-12 |

---

## Summary

This system provides:
1. **Research-backed workout program** - 6-day PPL with optimal volume/frequency
2. **Automatic weight progression** - Double progression with feedback adjustments
3. **Smart exercise rotation** - Keep compounds fixed, rotate accessories every 4-6 weeks
4. **Deload detection** - Alerts when recovery is needed
5. **Complete implementation guide** - Database, APIs, algorithms, UI specs

Follow this documentation to build a workout tracker that automatically handles the science of progressive overload and exercise variation.
