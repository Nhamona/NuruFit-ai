
import { DayWorkout, Exercise, UserProfile, WorkoutLocation } from './types';
import { EXERCISE_DATABASE } from './data/exercise_db';

// Convert Array DB to Record Object for existing logic compatibility
export const EXERCISE_LIB: Record<string, Exercise> = EXERCISE_DATABASE.reduce((acc, exercise) => {
  acc[exercise.id] = exercise;
  return acc;
}, {} as Record<string, Exercise>);

export const VALID_COUPONS: Record<string, { days: number }> = {
  'NURU30': { days: 30 },
  'PRO50': { days: 30 },
  'WELCOME': { days: 7 }
};

export const CATEGORIES = [
  'Full Body', 'Superiores', 'Inferiores', 'Mobilidade', 'Cardio'
];

export const DIET_PLAN_COVER_URL = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80';

export const CHALLENGE_CARDS = [
  { id: 'challenge-100-pushups', label: '100 Flexões', count: 100, level: 'Hard', color: 'red', image: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=800&q=80' },
  { id: 'challenge-300-squats', label: '300 Agachamentos', count: 300, level: 'Hard', color: 'blue', image: 'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=800&q=80' },
  { id: 'challenge-plank', label: '5 Min Prancha', count: '5m', level: 'Extreme', color: 'yellow', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80' }
];

export const MOTIVATIONAL_QUOTES = [
  "A disciplina é a ponte entre metas e realizações.",
  "O teu corpo pode tudo, é a tua mente que tens de convencer.",
  "Não pares quando estiveres cansado, para quando tiveres acabado.",
  "O suor de hoje é a conquista de amanhã.",
  "Sê mais forte que a tua melhor desculpa.",
  "A dor é temporária, o orgulho é para sempre.",
  "Não desejes que fosse mais fácil, deseja ser melhor.",
  "Pequenos progressos diários somam grandes resultados.",
  "Transformação acontece um dia de cada vez.",
  "Tu és o teu único projeto vitalício. Cuida-te."
];

// Helper Functions for Workouts
const getWarmup = (): Exercise[] => [EXERCISE_LIB.warmup_arm_circles, EXERCISE_LIB.cardio_jumping_jacks];
const getCooldown = (): Exercise[] => [EXERCISE_LIB.stretch_cobra, EXERCISE_LIB.stretch_down_dog];

export const generatePersonalizedPlan = (user: UserProfile | null): DayWorkout[] => {
    // If we have a saved plan and it matches the goal/duration (mock check), return it.
    // For now, we regenerate to ensure slider updates work immediately.
    
    const plan: DayWorkout[] = [];
    
    // Default Fallbacks
    const goal = user?.onboardingData?.goal || 'Manter a Forma';
    const location = user?.onboardingData?.workoutLocation || 'Home';
    const durationPreference = user?.onboardingData?.minutesPerDay || 30; // 20-60 mins
    const isGym = location === 'Gym';

    // Helper to scale volume based on duration
    // 20 min = 1x base sets
    // 40 min = 1.5x sets or add exercise
    // 60 min = 2x sets or add 2 exercises
    const scaleWorkout = (baseExercises: Exercise[]): Exercise[] => {
        let scaled = [...baseExercises];
        
        // If duration > 30 mins, we increase volume/intensity
        if (durationPreference > 30) {
            // For longer workouts, we append a "Finisher" or extra compound movement
            if (goal === 'Perda de Peso') {
                // Add Intense Cardio Finishers
                scaled.push(EXERCISE_LIB.cardio_burpee); 
                if (durationPreference >= 50) scaled.push(EXERCISE_LIB.abs_plank); // Extra core
            } else {
                // Add more volume for muscle
                // We just repeat the first compound exercise at the end for volume
                scaled.push({ ...baseExercises[0], name: `${baseExercises[0].name} (Burnout)` });
            }
        }
        
        // If duration is short (20 mins), we might trim isolation exercises if list is long
        if (durationPreference <= 20 && scaled.length > 4) {
             return scaled.slice(0, 4);
        }

        return scaled;
    };

    // *** LOGIC FOR "MUSCLE GAIN" (GANHAR MÚSCULO) ***
    if (goal === 'Ganhar Músculo') {
        // ABC Split (Push/Pull/Legs) repeated
        for (let i = 1; i <= 30; i++) {
            let workout: Exercise[] = [];
            let title = '';
            const cycle = i % 4; // 1=Push, 2=Pull, 3=Legs, 0=Rest

            if (cycle === 1) { // PUSH
                title = `Dia ${i} - Empurrar (Peito/Ombro/Tríceps)`;
                const base = isGym ? 
                    [EXERCISE_LIB.gym_bench_press, EXERCISE_LIB.gym_incline_press, EXERCISE_LIB.gym_shoulder_press, EXERCISE_LIB.gym_lateral_raise, EXERCISE_LIB.gym_tricep_pushdown] :
                    [EXERCISE_LIB.home_pushup_wide, EXERCISE_LIB.home_pike_pushup, EXERCISE_LIB.home_dips, EXERCISE_LIB.cardio_burpee];
                workout = scaleWorkout(base);
            
            } else if (cycle === 2) { // PULL
                title = `Dia ${i} - Puxar (Costas/Bíceps)`;
                const base = isGym ?
                    [EXERCISE_LIB.gym_deadlift, EXERCISE_LIB.gym_lat_pulldown, EXERCISE_LIB.gym_dumbbell_row, EXERCISE_LIB.gym_bicep_curl, EXERCISE_LIB.home_superman] :
                    [EXERCISE_LIB.home_superman, EXERCISE_LIB.gym_dumbbell_row, EXERCISE_LIB.abs_plank]; 
                workout = scaleWorkout(base);
            
            } else if (cycle === 3) { // LEGS
                title = `Dia ${i} - Pernas de Aço`;
                const base = isGym ?
                    [EXERCISE_LIB.gym_barbell_squat, EXERCISE_LIB.gym_leg_press, EXERCISE_LIB.home_lunge, EXERCISE_LIB.home_glute_bridge] :
                    [EXERCISE_LIB.home_squat, EXERCISE_LIB.home_lunge, EXERCISE_LIB.home_glute_bridge, EXERCISE_LIB.cardio_jumping_jacks];
                workout = scaleWorkout(base);
            
            } else { // REST
                title = `Dia ${i} - Recuperação Ativa`;
                workout = [EXERCISE_LIB.warmup_arm_circles, EXERCISE_LIB.stretch_cobra, EXERCISE_LIB.stretch_down_dog];
            }

            plan.push({
                id: `d${i}`,
                dayNumber: i,
                title,
                totalMinutes: cycle === 0 ? 15 : durationPreference,
                warmup: cycle === 0 ? [] : getWarmup(),
                workout: workout,
                cooldown: cycle === 0 ? [] : getCooldown()
            });
        }
    } 
    
    // *** LOGIC FOR "WEIGHT LOSS" (PERDA DE PESO) ***
    else if (goal === 'Perda de Peso') {
        // High Frequency Full Body & HIIT - Refined for Higher Intensity
        for (let i = 1; i <= 30; i++) {
            let workout: Exercise[] = [];
            let title = '';
            const cycle = i % 3; // 1=FullBody HIIT, 2=Lower Cardio, 0=Active Rest

            if (cycle === 1) {
                title = `Dia ${i} - Queima Total (HIIT)`;
                // Base HIIT
                const base = [
                    EXERCISE_LIB.cardio_jumping_jacks, 
                    EXERCISE_LIB.cardio_burpee, 
                    EXERCISE_LIB.home_squat, 
                    EXERCISE_LIB.home_pushup_wide, 
                    EXERCISE_LIB.abs_crunch
                ];
                // For weight loss, scaling adds more rounds/cardio moves
                workout = scaleWorkout(base);
            
            } else if (cycle === 2) {
                title = `Dia ${i} - Cardio & Pernas`;
                const base = [
                    EXERCISE_LIB.home_lunge, 
                    EXERCISE_LIB.home_glute_bridge, 
                    EXERCISE_LIB.cardio_jumping_jacks, 
                    EXERCISE_LIB.abs_plank
                ];
                workout = scaleWorkout(base);
            
            } else {
                title = `Dia ${i} - Yoga & Mobilidade`;
                workout = [EXERCISE_LIB.stretch_down_dog, EXERCISE_LIB.stretch_cobra, EXERCISE_LIB.home_superman];
            }

            plan.push({
                id: `d${i}`,
                dayNumber: i,
                title,
                totalMinutes: cycle === 0 ? 15 : durationPreference, // User preference applies here
                warmup: getWarmup(),
                workout: workout,
                cooldown: getCooldown()
            });
        }
    }

    // *** LOGIC FOR "MAINTAIN" (MANTER A FORMA) ***
    else {
        // Upper / Lower Split
        for (let i = 1; i <= 30; i++) {
            let workout: Exercise[] = [];
            let title = '';
            const cycle = i % 3; // 1=Upper, 2=Lower, 0=Rest

            if (cycle === 1) {
                title = `Dia ${i} - Superiores`;
                const base = isGym ? 
                    [EXERCISE_LIB.gym_bench_press, EXERCISE_LIB.gym_lat_pulldown, EXERCISE_LIB.gym_shoulder_press] :
                    [EXERCISE_LIB.home_pushup_wide, EXERCISE_LIB.home_dips, EXERCISE_LIB.home_pike_pushup];
                workout = scaleWorkout(base);

            } else if (cycle === 2) {
                title = `Dia ${i} - Inferiores & Core`;
                const base = isGym ?
                    [EXERCISE_LIB.gym_leg_press, EXERCISE_LIB.home_lunge, EXERCISE_LIB.abs_crunch] :
                    [EXERCISE_LIB.home_squat, EXERCISE_LIB.home_glute_bridge, EXERCISE_LIB.abs_plank];
                workout = scaleWorkout(base);

            } else {
                title = `Dia ${i} - Descanso`;
                workout = [EXERCISE_LIB.stretch_cobra, EXERCISE_LIB.stretch_down_dog];
            }

            plan.push({
                id: `d${i}`,
                dayNumber: i,
                title,
                totalMinutes: cycle === 0 ? 15 : durationPreference,
                warmup: cycle === 0 ? [] : getWarmup(),
                workout: workout,
                cooldown: cycle === 0 ? [] : getCooldown()
            });
        }
    }

    return plan;
};

// Deprecated: kept for backward compatibility if needed, but redirects to new logic
export const getMonthlyPlan = (location: WorkoutLocation = 'Home'): DayWorkout[] => {
    // Basic mock user for fallback
    const mockUser: any = { onboardingData: { goal: 'Manter a Forma', workoutLocation: location, minutesPerDay: 30 } };
    return generatePersonalizedPlan(mockUser);
};

export const getWorkoutByCategory = (category: string, location: WorkoutLocation = 'Home'): DayWorkout | undefined => {
  const isGym = location === 'Gym';
  
  if (category === 'Mobilidade') {
    return {
      id: 'cat-Mobilidade',
      dayNumber: 0,
      title: 'Mobilidade Total',
      totalMinutes: 20,
      warmup: [],
      workout: [
          EXERCISE_LIB.warmup_arm_circles, 
          EXERCISE_LIB.mobility_cat_cow, 
          EXERCISE_LIB.mobility_hip_opener, 
          EXERCISE_LIB.stretch_down_dog,
          EXERCISE_LIB.stretch_cobra
      ],
      cooldown: []
    };
  }

  let workout: Exercise[] = [];
  if (category === 'Full Body') {
      workout = isGym ? [EXERCISE_LIB.gym_barbell_squat, EXERCISE_LIB.gym_bench_press] : [EXERCISE_LIB.cardio_burpee, EXERCISE_LIB.home_pushup_wide];
  } else if (category === 'Superiores') {
      workout = isGym ? [EXERCISE_LIB.gym_bench_press, EXERCISE_LIB.gym_lat_pulldown] : [EXERCISE_LIB.home_pushup_wide, EXERCISE_LIB.home_dips];
  } else if (category === 'Inferiores') {
      workout = isGym ? [EXERCISE_LIB.gym_leg_press, EXERCISE_LIB.gym_deadlift] : [EXERCISE_LIB.home_squat, EXERCISE_LIB.home_lunge];
  } else {
      workout = [EXERCISE_LIB.cardio_jumping_jacks, EXERCISE_LIB.abs_plank];
  }

  return {
    id: `cat-${category}`,
    dayNumber: 0,
    title: `Treino de ${category}`,
    totalMinutes: 30,
    warmup: getWarmup(),
    workout: workout,
    cooldown: getCooldown()
  };
};

export const getWarmupRoutine = (): DayWorkout => {
  return {
    id: 'warmup',
    dayNumber: 0,
    title: 'Aquecimento Geral',
    totalMinutes: 5,
    warmup: [],
    workout: [EXERCISE_LIB.cardio_jumping_jacks, EXERCISE_LIB.warmup_arm_circles],
    cooldown: []
  };
};

export const getCooldownRoutine = (): DayWorkout => {
  return {
    id: 'cooldown',
    dayNumber: 0,
    title: 'Alongamento Pós-Treino',
    totalMinutes: 5,
    warmup: [],
    workout: [EXERCISE_LIB.stretch_down_dog, EXERCISE_LIB.stretch_cobra],
    cooldown: []
  };
};

export const getYogaRoutine = (): DayWorkout => {
  return {
    id: 'yoga',
    dayNumber: 0,
    title: 'Yoga Flow',
    totalMinutes: 15,
    warmup: [],
    workout: [EXERCISE_LIB.stretch_down_dog, EXERCISE_LIB.stretch_cobra, EXERCISE_LIB.home_superman],
    cooldown: []
  };
};

export const getChallengeWorkout = (id: string): DayWorkout | undefined => {
  const challenge = CHALLENGE_CARDS.find(c => c.id === id);
  if (!challenge) return undefined;

  let exercise = EXERCISE_LIB.home_pushup_wide;
  let reps = 100;
  
  if (id === 'challenge-300-squats') {
    exercise = EXERCISE_LIB.home_squat;
    reps = 300;
  } else if (id === 'challenge-plank') {
    exercise = { ...EXERCISE_LIB.abs_plank, durationSeconds: 300 };
    reps = 1;
  }

  const challengeExercise = { ...exercise, reps: reps, sets: 1 };

  return {
    id: id,
    dayNumber: 0,
    title: challenge.label,
    totalMinutes: 20,
    warmup: [EXERCISE_LIB.warmup_arm_circles],
    workout: [challengeExercise],
    cooldown: [EXERCISE_LIB.stretch_cobra]
  };
};
