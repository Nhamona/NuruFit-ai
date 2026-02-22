
export type UserLevel = 'Iniciante' | 'Intermédio' | 'Avançado';
export type UserGoal = 'Perda de Peso' | 'Ganhar Músculo' | 'Manter a Forma';
export type BodyType = 'Ectomorfo' | 'Mesomorfo' | 'Endomorfo';
export type Gender = 'Masculino' | 'Feminino' | 'Outro';
export type WorkoutLocation = 'Home' | 'Gym';
export type TargetBody = 'Definido' | 'Grande/Musculoso' | 'Magro/Atlético'; 

export type WorkoutCategory = 
  | 'Full Body' | 'Superiores' | 'Inferiores' | 'Pernas' | 'Glúteos' 
  | 'Glúteo Médio' | 'Braços' | 'Ombros' | 'Joelhos/Recuperação' | 'Panturrilha' 
  | 'Antebraço' | 'Abdominais' | 'Costas' | 'Dorsais' | 'Tríceps' | 'Bíceps'
  | 'Mobilidade';

export interface Exercise {
  id: string;
  name: string;
  description: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  instructions: string[];
  imageUrl: string;
  maleImageUrl?: string;
  videoUrl?: string; // YouTube or MP4 URL
  equipment: 'None' | 'Dumbbell' | 'Barbell' | 'Machine' | 'Cable' | 'Chair';
  reps?: number;
  sets?: number;
  durationSeconds?: number;
  restSeconds?: number;
  cues?: string[];
  phase?: string; // Used in runtime for display
}

export interface DayWorkout {
  id: string;
  dayNumber: number;
  title: string;
  totalMinutes: number;
  warmup: Exercise[];
  workout: Exercise[];
  cooldown: Exercise[];
}

export interface MealLog {
  id: string;
  timestamp: string;
  imageUrl?: string;
  textInput?: string;
  analysis: {
    items: string[];
    calories: number;
    macros: string;
    feedback?: string;
  };
}

export interface WorkoutLog {
  id: string;
  workoutId: string;
  timestamp: string;
  durationMinutes: number;
  difficultyRating?: 'Easy' | 'Good' | 'Hard'; 
  xpEarned: number;
}

export interface TransformationPhoto {
  id: string;
  date: string;
  weight: number;
  imageUrl: string;
  type: 'Before' | 'After' | 'Progress';
}

export interface Competition {
  id: string;
  title: string;
  type: 'Running' | 'Walking';
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  currentParticipants: number;
  endsAt: string;
  isJoined?: boolean;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  source?: 'Manual' | 'GoogleFit' | 'AppleHealth' | 'Challenge';
}

export interface GPSPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface ActivitySession {
  id: string;
  type: 'Running' | 'Walking';
  title?: string;
  photoUrl?: string;
  date: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  distanceKm: number;
  paceMinKm: string;
  calories: number;
  route: GPSPoint[];
  source?: 'Manual' | 'GoogleFit' | 'AppleHealth';
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'model';
  content: string;
}

export interface OnboardingData {
  goal: UserGoal;
  level: UserLevel;
  daysPerWeek: number;
  minutesPerDay: number;
  workoutLocation: WorkoutLocation;
  limitations: string;
  targetBody: TargetBody;
  emotionalPainPoint: string;
}

export interface WeightEntry {
    date: string;
    weight: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  profilePicture?: string; 
  isAdmin: boolean;
  isPremium: boolean;
  isVisitor?: boolean; 
  premiumUntil?: string; 
  hasUsedTrial: boolean;
  trialEndsAt?: string; 
  
  // Compras Avulsas
  hasPurchasedDietPlan: boolean; 

  onboardingComplete: boolean;
  onboardingData?: OnboardingData;
  
  referralCode: string;
  referralsCount: number;

  gender?: Gender;
  age?: number;
  weight?: number;
  height?: number;
  bodyType?: BodyType;

  // Stats
  streak: number;
  lastCheckInDate?: string; 
  xp: number;
  level: number;
  badges: string[];
  
  // History
  completedDays: string[];
  workoutHistory: WorkoutLog[];
  transformationPhotos: TransformationPhoto[];
  mealLogs: MealLog[];
  activityHistory: ActivitySession[];
  weightHistory: WeightEntry[];

  // Plan Persistence
  savedPlan?: DayWorkout[]; // JSON storage of the generated plan

  // Water
  waterIntake: number;
  waterTarget: number;
  waterRemindersEnabled: boolean;
  waterReminderInterval?: number;
  lastWaterNotificationTime?: string;

  // Workout Reminders & AI Proactivity
  workoutTime?: string;
  reminders: string[];
  lastWorkoutNotificationDate?: string;
  lastInactivityNotificationDate?: string;
  lastActivityDate?: string; // To track "missing" days

  // Monetization / Wallet
  walletBalance: number; // Nuro Coins
  challengeEarnings: number; // Real Money/Points from challenges
  activeDiscounts: string[];
  lockedRewards: number;
  transactions: Transaction[];
  competitionsJoined: string[];
  distanceStats: {
    todayKm: number;
    monthKm: number;
    lastLogDate: string;
  };
  
  // Settings
  autoPauseEnabled: boolean;
  lastHealthSyncDate?: string;
}
