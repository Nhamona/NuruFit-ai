
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProfile, MealLog, WorkoutLog, TransformationPhoto, Competition, Transaction, ActivitySession } from './types';
import { VALID_COUPONS } from './constants';
import { requestNotificationPermission, sendNotification } from './services/notifications';
import { syncUserProfile } from './services/firebase';

interface AppContextType {
  user: UserProfile | null;
  login: (email: string, isVisitor?: boolean) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  addMeal: (meal: MealLog) => void;
  logWater: (amount: number) => void;
  completeWorkout: (dayId: string, duration: number, difficulty?: 'Easy' | 'Good' | 'Hard') => void;
  addTransformationPhoto: (photo: TransformationPhoto) => void;
  togglePremium: () => void;
  purchaseDietPlan: () => void;
  redeemReferral: () => void;
  redeemCoupon: (code: string) => boolean;
  getStats: () => { day: number; week: number; month: number };
  // Novas funções
  logDistance: (km: number) => void;
  joinCompetition: (competitionId: string, fee: number, title: string) => boolean;
  addFunds: (amount: number) => void;
  saveActivity: (activity: ActivitySession) => void;
  withdrawFunds: () => boolean;
  syncHealthData: () => Promise<number>; 
  performDailyCheckIn: () => boolean; 
}

const AppContext = createContext<AppContextType | undefined>(undefined);
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import PlanScreen from './screens/PlanScreen';
import WorkoutPlayerScreen from './screens/WorkoutPlayerScreen';
import ChatScreen from './screens/ChatScreen';
import PaywallScreen from './screens/PaywallScreen';
import HealthDashboard from './screens/HealthDashboard';
import AdminScreen from './screens/AdminScreen';
import ActivityScreen from './screens/ActivityScreen';
import WalletScreen from './screens/WalletScreen';

const App: React.FC = () => {
  // Privacy Enforcement
  useEffect(() => {
    const handleContext = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContext);
    return () => document.removeEventListener('contextmenu', handleContext);
  }, []);

  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('nuru_user_profile');
    return saved ? JSON.parse(saved) : null;
  });

  // Persist to LocalStorage AND Sync to Firestore
  useEffect(() => {
    if (user) {
        localStorage.setItem('nuru_user_profile', JSON.stringify(user));
        
        // Debounce sync to firestore (optional but good practice)
        const timeout = setTimeout(() => {
            syncUserProfile(user);
        }, 1000);
        return () => clearTimeout(timeout);
    }
  }, [user]);

  // Verificar código de convite na URL (ref)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode && !user) {
        localStorage.setItem('pending_referral', refCode);
    }
  }, [user]);

  // ==========================================
  // NOTIFICATION & AI PROACTIVE SYSTEM
  // ==========================================
  useEffect(() => {
    if (!user) return;

    if (user.waterRemindersEnabled || user.workoutTime) {
      requestNotificationPermission();
    }

    const checkProactiveAI = () => {
      const now = new Date();
      const currentHourMinute = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const todayString = now.toISOString().split('T')[0];

      // 1. Proactive Inactivity Check (A cobrança da IA)
      // Verifica última atividade (Treino ou GPS)
      const lastActivityDateStr = user.lastActivityDate || user.workoutHistory[user.workoutHistory.length - 1]?.timestamp || now.toISOString();
      const lastActivityDate = new Date(lastActivityDateStr);
      const diffTime = Math.abs(now.getTime() - lastActivityDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

      if (diffDays >= 1 && user.lastInactivityNotificationDate !== todayString) {
         const hour = now.getHours();
         // Só envia à noite se não treinou o dia todo
         if (hour >= 18 && hour <= 21) {
             const userName = user.name.split(' ')[0] || 'Ei';
             sendNotification(`${userName}... você não treinou hoje 😑`, "10 min já contam. Vamos?");
             updateProfile({ lastInactivityNotificationDate: todayString });
         }
      }

      // 2. Workout Reminder
      if (user.workoutTime && user.workoutTime === currentHourMinute) {
        if (user.lastWorkoutNotificationDate !== todayString) {
          sendNotification("Hora do Treino! 💪", "O teu corpo precisa de movimento. Vamos a isso?");
          updateProfile({ lastWorkoutNotificationDate: todayString });
        }
      }

      // 3. Water Reminder Logic
      if (user.waterRemindersEnabled) {
        // Default to 2 hours if undefined
        const intervalHours = user.waterReminderInterval || 2;
        const intervalMs = intervalHours * 60 * 60 * 1000;
        
        const lastWaterTime = user.lastWaterNotificationTime ? new Date(user.lastWaterNotificationTime).getTime() : 0;
        const timeSinceLastNotification = now.getTime() - lastWaterTime;

        // Only remind between 8am and 9pm to avoid waking user up
        const hour = now.getHours();
        if (hour >= 8 && hour <= 21) {
            if (timeSinceLastNotification > intervalMs) {
                // If they haven't logged water recently, remind them
                // You could check user.mealLogs or recent activity here too for smarter AI
                sendNotification("Hora de Hidratar 💧", `Já passaram ${intervalHours} horas. Beba um copo de água!`);
                updateProfile({ lastWaterNotificationTime: now.toISOString() });
            }
        }
      }
    };

    // Check every minute
    const intervalId = setInterval(checkProactiveAI, 60000);
    checkProactiveAI(); // Run on mount

    return () => clearInterval(intervalId);
  }, [user]);

  const login = (email: string, isVisitor: boolean = false) => {
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 30); 

    const isAdmin = email.includes('admin') || email === 'dev@nuru.com';
    const pendingRef = localStorage.getItem('pending_referral');
    const userId = isVisitor ? 'visitor_' + Date.now() : 'u1';
    
    setUser({
      id: userId, 
      email: isVisitor ? 'visitante@nuru.fit' : email, 
      name: isVisitor ? 'Visitante' : '', 
      isAdmin: isAdmin,
      isPremium: isAdmin,
      isVisitor: isVisitor, 
      hasUsedTrial: false, 
      trialEndsAt: trialEnd.toISOString(),
      hasPurchasedDietPlan: false,
      onboardingComplete: isVisitor, 
      streak: 0,
      xp: 0,
      level: 1,
      badges: [],
      referralCode: Math.random().toString(36).substring(7).toUpperCase(),
      referralsCount: pendingRef ? 1 : 0, 
      completedDays: [], 
      workoutHistory: [], 
      transformationPhotos: [],
      waterIntake: 0, 
      waterTarget: 2500, 
      waterRemindersEnabled: !isVisitor,
      waterReminderInterval: 2, 
      mealLogs: [], 
      reminders: ['08:00'],
      activityHistory: [],
      weightHistory: [],
      
      // Monetization
      walletBalance: 120, // Welcome bonus adjusted
      challengeEarnings: 0,
      lockedRewards: 0,
      activeDiscounts: [],
      distanceStats: {
        todayKm: 0,
        monthKm: 0,
        lastLogDate: new Date().toISOString().split('T')[0]
      },
      competitionsJoined: [],
      transactions: [{
          id: 'welcome_bonus',
          type: 'credit',
          amount: 120,
          description: 'Bónus Inicial',
          date: new Date().toISOString(),
          source: 'Manual'
      }], 
      
      autoPauseEnabled: true,
      lastCheckInDate: '',
      lastActivityDate: new Date().toISOString(),

      onboardingData: isVisitor ? {
          goal: 'Manter a Forma',
          level: 'Iniciante',
          daysPerWeek: 3,
          minutesPerDay: 20,
          workoutLocation: 'Home',
          limitations: '',
          targetBody: 'Definido',
          emotionalPainPoint: 'Apenas visitando'
      } : undefined
    });
    
    if (pendingRef) localStorage.removeItem('pending_referral');
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  const addMeal = (meal: MealLog) => {
    setUser(prev => prev ? { ...prev, mealLogs: [meal, ...prev.mealLogs] } : null);
  };

  const logWater = (amount: number) => {
    setUser(prev => {
        if (!prev) return null;
        // XP Gain for Water: 10XP per log
        const newXp = prev.xp + 10;
        const newLevel = Math.floor(newXp / 1000) + 1;
        return { 
            ...prev, 
            waterIntake: (prev.waterIntake || 0) + amount,
            xp: newXp,
            level: newLevel,
            // Reset notification timer when user drinks water manually
            lastWaterNotificationTime: new Date().toISOString()
        };
    });
  };

  const performDailyCheckIn = (): boolean => {
      const today = new Date().toISOString().split('T')[0];
      
      if (user && user.lastCheckInDate !== today) {
          setUser(prev => {
              if (!prev) return null;
              // XP: +20, Wallet: +5 Coins
              const newXp = prev.xp + 20;
              const newLevel = Math.floor(newXp / 1000) + 1;
              const bonus = 5;

              return {
                  ...prev,
                  lastCheckInDate: today,
                  xp: newXp,
                  level: newLevel,
                  walletBalance: prev.walletBalance + bonus,
                  transactions: [{
                      id: Date.now().toString(),
                      type: 'credit',
                      amount: bonus,
                      description: 'Check-in Diário',
                      date: new Date().toISOString(),
                      source: 'Manual'
                  }, ...prev.transactions]
              };
          });
          return true;
      }
      return false;
  };

  const logDistance = (km: number) => {
      // Helper used by activity screen mostly
      // Logic moved inside saveActivity for better atomic updates
  };

  const saveActivity = (activity: ActivitySession) => {
      setUser(prev => {
          if (!prev) return null;
          
          const newHistory = [activity, ...(prev.activityHistory || [])];
          
          const today = new Date().toISOString().split('T')[0];
          let currentTodayKm = prev.distanceStats.todayKm;
          
          if (prev.distanceStats.lastLogDate !== today) {
              currentTodayKm = 0;
          }
          
          const km = activity.distanceKm;
          const newTodayKm = currentTodayKm + km;
          
          // XP Logic: 50 XP per KM
          const xpGained = Math.floor(km * 50);
          const newXp = prev.xp + xpGained;
          const newLevel = Math.floor(newXp / 1000) + 1;

          // Notification / "Alive AI"
          setTimeout(() => {
              sendNotification("🔥 BOA! Consistência é tudo", `Você correu ${km}km. Continue assim!`);
          }, 2000);

          return {
              ...prev,
              activityHistory: newHistory,
              xp: newXp,
              level: newLevel,
              lastActivityDate: new Date().toISOString(),
              distanceStats: {
                  todayKm: newTodayKm,
                  monthKm: prev.distanceStats.monthKm + km,
                  lastLogDate: today
              }
          };
      });
  };

  const syncHealthData = async (): Promise<number> => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return 0; // Mock implementation
  };

  const addFunds = (amount: number) => {
      setUser(prev => {
          if (!prev) return null;
          return { 
              ...prev, 
              walletBalance: prev.walletBalance + amount,
              transactions: [{
                  id: Date.now().toString(),
                  type: 'credit',
                  amount: amount,
                  description: 'Depósito de Fundos',
                  date: new Date().toISOString(),
                  source: 'Manual'
              }, ...prev.transactions]
          }
      });
  };
  
  const withdrawFunds = (): boolean => {
      // Withdraw only Challenge Earnings (real value), not Coins
      if (!user || user.challengeEarnings <= 0) return false;
      
      setUser(prev => {
          if (!prev) return null;
          const amount = prev.challengeEarnings;
          return {
              ...prev,
              challengeEarnings: 0,
              transactions: [{
                  id: Date.now().toString(),
                  type: 'debit',
                  amount: amount,
                  description: 'Levantamento M-Pesa',
                  date: new Date().toISOString(),
                  source: 'Manual'
              }, ...(prev.transactions || [])]
          };
      });
      return true;
  };

  const joinCompetition = (competitionId: string, fee: number, title: string): boolean => {
      if (!user) return false;
      if (user.walletBalance < fee) return false;
      
      setUser(prev => {
          if (!prev) return null;
          
          const newTransaction: Transaction = {
              id: Date.now().toString(),
              type: 'debit',
              amount: fee,
              description: `Inscrição: ${title}`,
              date: new Date().toISOString(),
              source: 'Challenge'
          };

          return {
              ...prev,
              walletBalance: prev.walletBalance - fee,
              competitionsJoined: [...prev.competitionsJoined, competitionId],
              transactions: [newTransaction, ...(prev.transactions || [])]
          };
      });
      return true;
  };

  const addTransformationPhoto = (photo: TransformationPhoto) => {
    setUser(prev => prev ? { ...prev, transformationPhotos: [photo, ...prev.transformationPhotos] } : null);
  };

  const completeWorkout = (dayId: string, duration: number, difficulty: 'Easy' | 'Good' | 'Hard' = 'Good') => {
    setUser(prev => {
      if (!prev) return prev;
      
      // Calculate XP: 10 per minute + Bonus
      let xpEarned = duration * 10;
      if (difficulty === 'Hard') xpEarned += 50; 
      
      const newXp = prev.xp + xpEarned;
      const newLevel = Math.floor(newXp / 1000) + 1;

      const newLog: WorkoutLog = {
        id: Date.now().toString(),
        workoutId: dayId,
        timestamp: new Date().toISOString(),
        durationMinutes: duration,
        difficultyRating: difficulty,
        xpEarned
      };
      
      const alreadyCompleted = prev.completedDays.includes(dayId);
      const newStreak = alreadyCompleted ? prev.streak : prev.streak + 1;
      
      // Proactive AI Message
      setTimeout(() => {
          sendNotification("Treino Esmagado! 🚀", `Mais ${xpEarned}XP para a conta. Nível ${newLevel} está logo ali.`);
      }, 1000);

      return {
        ...prev,
        completedDays: alreadyCompleted ? prev.completedDays : [...prev.completedDays, dayId],
        workoutHistory: [...prev.workoutHistory, newLog],
        streak: newStreak,
        xp: newXp,
        level: newLevel,
        lastActivityDate: new Date().toISOString()
      };
    });
  };

  const togglePremium = () => {
    setUser(prev => prev ? { ...prev, isPremium: true, isVisitor: false } : null);
  };

  const purchaseDietPlan = () => {
    setUser(prev => prev ? { ...prev, hasPurchasedDietPlan: true } : null);
  };

  const redeemReferral = () => {};
  
  const redeemCoupon = (code: string): boolean => {
      return true;
  };

  const getStats = () => {
    if (!user) return { day: 0, week: 0, month: 0 };
    return { day: 0, week: 0, month: 0 };
  };

  return (
    <AppContext.Provider value={{ 
      user, login, updateProfile, addMeal, logWater, addTransformationPhoto, completeWorkout, 
      togglePremium, purchaseDietPlan, redeemReferral, redeemCoupon, getStats,
      logDistance, joinCompetition, addFunds, saveActivity, withdrawFunds, syncHealthData, performDailyCheckIn
    }}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={user ? <Navigate to="/plan" /> : <LoginScreen />} />
          <Route path="/onboarding" element={user ? <OnboardingScreen /> : <Navigate to="/login" />} />
          <Route path="/plan" element={user ? <PlanScreen /> : <Navigate to="/login" />} />
          <Route path="/health" element={user ? <HealthDashboard /> : <Navigate to="/login" />} />
          <Route path="/activity" element={user ? <ActivityScreen /> : <Navigate to="/login" />} />
          <Route path="/wallet" element={user ? <WalletScreen /> : <Navigate to="/login" />} />
          <Route path="/workout/:id" element={user ? <WorkoutPlayerScreen /> : <Navigate to="/login" />} />
          <Route path="/chat" element={user ? <ChatScreen /> : <Navigate to="/login" />} />
          <Route path="/paywall" element={user ? <PaywallScreen /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user?.isAdmin ? <AdminScreen /> : <Navigate to="/plan" />} />
        </Routes>
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;
