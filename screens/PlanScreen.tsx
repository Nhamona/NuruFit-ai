
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../App';
import { generatePersonalizedPlan, CATEGORIES, DIET_PLAN_COVER_URL, CHALLENGE_CARDS, MOTIVATIONAL_QUOTES } from '../constants';
import { Competition } from '../types';
import { saveVideo, isVideoDownloaded } from '../services/offlineManager';

const PlanScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logDistance, joinCompetition, addFunds, withdrawFunds, updateProfile, performDailyCheckIn } = useApp();
  
  const [activeTab, setActiveTab] = useState<'focus' | 'challenge'>('focus');
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [dailyQuote, setDailyQuote] = useState('');
  
  // Offline Download State
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloaded, setIsDownloaded] = useState(false);

  // Local state for duration slider
  const [duration, setDuration] = useState(user?.onboardingData?.minutesPerDay || 30);
  
  const profileInputRef = useRef<HTMLInputElement>(null);

  // Check if current workout is already downloaded
  useEffect(() => {
    const checkDownloadStatus = async () => {
        if (!todayWorkout) return;
        
        let allDownloaded = true;
        for (const ex of todayWorkout.workout) {
            if (ex.videoUrl && !ex.videoUrl.includes('youtube')) {
                const downloaded = await isVideoDownloaded(ex.videoUrl);
                if (!downloaded) {
                    allDownloaded = false;
                    break;
                }
            }
        }
        setIsDownloaded(allDownloaded);
    };
    checkDownloadStatus();
  }, [todayWorkout]);

  const handleDownloadWorkout = async () => {
      if (!user?.isPremium) {
          if (confirm("O download offline é exclusivo para membros Premium. Deseja assinar?")) {
              navigate('/paywall');
          }
          return;
      }

      if (!todayWorkout) return;

      setIsDownloading(true);
      setDownloadProgress(0);

      const exercises = todayWorkout.workout.filter(ex => ex.videoUrl && !ex.videoUrl.includes('youtube'));
      const total = exercises.length;
      let completed = 0;

      try {
          for (const ex of exercises) {
              await saveVideo(ex.videoUrl!);
              completed++;
              setDownloadProgress(Math.round((completed / total) * 100));
          }
          setIsDownloaded(true);
          alert("Treino baixado com sucesso! Você pode acessá-lo offline.");
      } catch (error) {
          console.error("Download failed", error);
          alert("Erro ao baixar treino. Verifique sua conexão.");
      } finally {
          setIsDownloading(false);
      }
  };

  // Update duration state when user profile changes
  useEffect(() => {
    if (user?.onboardingData?.minutesPerDay) {
        setDuration(user.onboardingData.minutesPerDay);
    }
  }, [user?.onboardingData?.minutesPerDay]);

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setDuration(parseInt(e.target.value));
  };

  const handleDurationCommit = () => {
      // Update profile only on mouse up / touch end to avoid excessive re-renders/syncs
      if (user?.onboardingData) {
          updateProfile({
              onboardingData: {
                  ...user.onboardingData,
                  minutesPerDay: duration
              }
          });
      }
  };

  // Competitions with Logic: 30 person limit
  const monthlyCompetitions: Competition[] = [
      {
          id: 'comp_walk_5km',
          title: 'Caminhar 5km/dia',
          type: 'Walking',
          entryFee: 150,
          prizePool: 3000,
          maxParticipants: 30,
          currentParticipants: 12, // Still open
          endsAt: '2025-02-28',
      },
      {
          id: 'comp_run_5km',
          title: 'Correr 5km/dia',
          type: 'Running',
          entryFee: 150,
          prizePool: 3000,
          maxParticipants: 30,
          currentParticipants: 30, // SOLD OUT
          endsAt: '2025-02-28',
      }
  ];

  useEffect(() => {
    if (location.state) {
        const state = location.state as { tab?: 'focus' | 'challenge', openSettings?: boolean };
        if (state.tab) setActiveTab(state.tab);
        if (state.openSettings) setShowSettings(true);
    }
  }, [location]);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setDailyQuote(MOTIVATIONAL_QUOTES[randomIndex]);
  }, []);

  const monthlyPlan = useMemo(() => generatePersonalizedPlan(user), [user]);
  
  const currentDay = user?.workoutHistory.length ? user.workoutHistory.length + 1 : 1;
  const todayWorkout = monthlyPlan.find(d => d.dayNumber === currentDay);
  
  const isCheckedInToday = user?.lastCheckInDate === new Date().toISOString().split('T')[0];

  const handleRestrictedAction = (action: () => void) => {
    if (user?.isVisitor) {
        navigate('/paywall');
    } else {
        action();
    }
  };

  const handleLogout = () => {
      localStorage.removeItem('nuru_user_profile');
      window.location.reload();
  };
  
  const handleProfileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              updateProfile({ profilePicture: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  const handleCheckIn = () => {
      const success = performDailyCheckIn();
  };

  const handleJoinComp = (comp: Competition) => {
      if (!user?.isPremium) {
          if (confirm("Para se inscrever em competições é necessário ser Premium. Deseja subscrever?")) {
              navigate('/paywall');
          }
          return;
      }

      if (comp.currentParticipants >= comp.maxParticipants) {
          alert("Desafio lotado! Fique atento ao próximo mês.");
          return;
      }

      const isJoined = user?.competitionsJoined.includes(comp.id);
      if (isJoined) return;

      if ((user?.walletBalance || 0) < comp.entryFee) {
          alert(`Saldo insuficiente (${user?.walletBalance} MT). Necessário ${comp.entryFee} MT.`);
          return;
      }

      if (confirm(`Inscrever na ${comp.title} por ${comp.entryFee} MT?`)) {
          const success = joinCompetition(comp.id, comp.entryFee, comp.title);
          if (success) alert("Inscrição confirmada! Boa sorte.");
          else alert("Erro ao inscrever.");
      }
  };

  // Activity Log Data Logic
  const activityHistoryData = useMemo(() => {
    if (!user) return { chart: [], list: [] };

    // Workouts
    const workouts = (user.workoutHistory || []).map(w => ({
        id: `w-${w.id}`,
        type: 'Workout',
        title: 'Treino Nuru',
        date: w.timestamp,
        stat: `${w.durationMinutes} min`,
        xp: `+${w.xpEarned} XP`,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        icon: 'fa-dumbbell'
    }));

    // Activities
    const activities = (user.activityHistory || []).map(a => ({
        id: `a-${a.id}`,
        type: a.type,
        title: a.title || (a.type === 'Running' ? 'Corrida' : 'Caminhada'),
        date: a.date,
        stat: `${a.distanceKm.toFixed(2)} km`,
        xp: '', 
        color: a.type === 'Running' ? 'text-orange-500' : 'text-blue-500',
        bg: a.type === 'Running' ? 'bg-orange-500/10' : 'bg-blue-500/10',
        icon: a.type === 'Running' ? 'fa-running' : 'fa-walking'
    }));

    const list = [...workouts, ...activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Chart (Last 15 days)
    const chart = [];
    const today = new Date();
    for (let i = 14; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        const dailyItems = list.filter(item => item.date.startsWith(dateStr));
        chart.push({
            day: d.getDate(),
            count: dailyItems.length,
            isToday: i === 0,
            hasActivity: dailyItems.length > 0
        });
    }

    return { list, chart };
  }, [user]);

  // Gamification Level Calculation
  const xp = user?.xp || 0;
  const level = Math.floor(xp / 1000) + 1;
  const xpForNextLevel = 1000;
  const currentLevelProgress = (xp % 1000) / xpForNextLevel * 100;
  
  // Fake chart data for demo
  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const workoutActivity = [0, 1, 1, 0, 1, 1, 0]; // 1 = worked out

  return (
    <div className="min-h-screen bg-black text-white pb-24 font-['Inter']">
       {/* ADDICTIVE HEADER with Safe Area Padding */}
       <div className="px-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-6 bg-zinc-900 rounded-b-[2.5rem] border-b border-zinc-800 mb-6 shadow-2xl relative z-10">
          <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
                     {user?.profilePicture ? (
                         <img src={user.profilePicture} className="w-full h-full rounded-full object-cover" />
                     ) : (
                         <span className="font-bold text-zinc-500">{user?.name?.charAt(0)}</span>
                     )}
                  </div>
                  <div>
                      <h2 className="text-sm font-bold text-white leading-none">Olá, {user?.name.split(' ')[0]}</h2>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Membro Pro</span>
                  </div>
              </div>
              <button onClick={() => navigate('/wallet')} className="bg-black/50 border border-zinc-700 px-3 py-1.5 rounded-full flex items-center gap-2">
                  <i className="fas fa-coins text-yellow-500 text-xs"></i>
                  <span className="text-xs font-black text-white">{user?.walletBalance}</span>
              </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
              <div className="bg-black/40 p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                  <i className="fas fa-fire text-orange-500 text-xl mb-1 animate-pulse"></i>
                  <span className="text-2xl font-black text-white leading-none">{user?.streak || 0}</span>
                  <span className="text-[9px] text-zinc-500 font-bold uppercase">Dias Seguidos</span>
              </div>
              <div className="bg-black/40 p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                  <i className="fas fa-trophy text-yellow-500 text-xl mb-1"></i>
                  <span className="text-2xl font-black text-white leading-none">{level}</span>
                  <span className="text-[9px] text-zinc-500 font-bold uppercase">Nível Atual</span>
              </div>
              <div className="bg-black/40 p-3 rounded-2xl border border-white/5 flex flex-col items-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-green-500/10"></div>
                  <i className="fas fa-check-circle text-green-500 text-xl mb-1"></i>
                  <span className="text-[8px] font-black text-white leading-none mt-1 text-center">TREINO<br/>DE HOJE</span>
                  <span className="text-[8px] text-green-500 font-bold uppercase mt-1">PRONTO</span>
              </div>
          </div>
       </div>

       <div className="px-6 space-y-6">
          {activeTab === 'focus' ? (
              <div className="space-y-6 animate-fade-in">
                  
                  {/* Daily Check-in Button */}
                  {!isCheckedInToday && (
                      <button 
                        onClick={handleCheckIn}
                        className="w-full py-4 bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-500/30 text-green-500 rounded-2xl flex items-center justify-center gap-3 animate-bounce-subtle"
                      >
                          <i className="fas fa-calendar-check text-xl"></i>
                          <div className="text-left">
                              <div className="text-xs font-black uppercase tracking-widest">Fazer Check-in</div>
                              <div className="text-[10px] text-green-400">Ganhe +20 XP e mantenha o fogo!</div>
                          </div>
                      </button>
                  )}

                  {/* Workout Duration Slider (New Feature) */}
                  <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                      <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Duração do Treino</span>
                          <span className="text-red-500 font-black text-sm">{duration} min</span>
                      </div>
                      <input 
                        type="range" 
                        min="20" 
                        max="60" 
                        step="5" 
                        value={duration}
                        onChange={handleDurationChange}
                        onMouseUp={handleDurationCommit}
                        onTouchEnd={handleDurationCommit}
                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                      />
                      <div className="flex justify-between mt-1">
                          <span className="text-[9px] text-zinc-600 font-bold">20m</span>
                          <span className="text-[9px] text-zinc-600 font-bold">40m</span>
                          <span className="text-[9px] text-zinc-600 font-bold">60m</span>
                      </div>
                  </div>

                  {/* Main Workout Card */}
                  {todayWorkout && (
                      <div className="relative overflow-hidden rounded-[2rem] bg-zinc-900 border border-zinc-800 shadow-2xl group h-96">
                          <img 
                            src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80" 
                            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
                            alt="Workout Cover" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                          
                          <div className="relative z-20 p-6 flex flex-col h-full justify-end items-start">
                             <div className="flex gap-2 mb-2">
                                 <div className="bg-red-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                     <i className="fas fa-calendar-alt"></i> Dia {currentDay}
                                 </div>
                                 <div className="bg-black/50 backdrop-blur text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10">
                                     {todayWorkout.totalMinutes} min
                                 </div>
                                 {/* Download Button */}
                                 <button 
                                    onClick={(e) => { e.stopPropagation(); handleDownloadWorkout(); }}
                                    disabled={isDownloading || isDownloaded}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 transition-colors ${
                                        isDownloaded 
                                            ? 'bg-green-600/20 text-green-400 border-green-500/30' 
                                            : (isDownloading 
                                                ? 'bg-zinc-800 text-zinc-400 border-zinc-700 cursor-wait' 
                                                : 'bg-black/50 text-white border-white/10 hover:bg-white/10')
                                    }`}
                                 >
                                     {isDownloading ? (
                                         <><i className="fas fa-spinner fa-spin"></i> {downloadProgress}%</>
                                     ) : isDownloaded ? (
                                         <><i className="fas fa-check"></i> Offline</>
                                     ) : (
                                         <><i className="fas fa-download"></i> Baixar</>
                                     )}
                                 </button>
                             </div>
                             
                             <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-2 leading-[0.9]">
                                 {todayWorkout.title.replace('Dia ' + currentDay + ' - ', '')}
                             </h2>
                             <p className="text-zinc-300 text-xs mb-6 line-clamp-2 w-3/4">
                                 Foco em {todayWorkout.workout.map(ex => ex.name).slice(0,2).join(', ')}...
                             </p>
                             
                             <button 
                                onClick={() => handleRestrictedAction(() => navigate(`/workout/${todayWorkout.id}`))}
                                className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 text-sm shadow-xl shadow-white/10"
                             >
                                <i className="fas fa-play text-xs"></i> Começar Agora
                             </button>
                          </div>
                      </div>
                  )}

                  {/* Visual Progress Graphs */}
                  <div className="grid grid-cols-2 gap-3">
                      {/* Weight Graph (Fake Visual) */}
                      <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex flex-col justify-between h-32">
                          <div>
                              <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Peso (kg)</p>
                              <div className="text-xl font-black text-white">{user?.weight} <span className="text-xs text-zinc-500">kg</span></div>
                          </div>
                          {/* Simple CSS Line Chart Representation */}
                          <div className="flex items-end justify-between h-12 w-full gap-1 px-1">
                              <div className="w-full bg-zinc-800 rounded-t-sm h-[60%]"></div>
                              <div className="w-full bg-zinc-800 rounded-t-sm h-[50%]"></div>
                              <div className="w-full bg-zinc-800 rounded-t-sm h-[70%]"></div>
                              <div className="w-full bg-zinc-800 rounded-t-sm h-[65%]"></div>
                              <div className="w-full bg-red-600 rounded-t-sm h-[55%] animate-pulse"></div>
                          </div>
                      </div>

                      {/* Workout Consistency Graph */}
                      <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex flex-col justify-between h-32">
                          <div>
                              <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Atividade</p>
                              <div className="text-xl font-black text-green-500">Ativo</div>
                          </div>
                          <div className="flex justify-between items-end h-10">
                              {weekDays.map((d, i) => (
                                  <div key={i} className="flex flex-col items-center gap-1">
                                      <div className={`w-1.5 rounded-full ${workoutActivity[i] ? 'h-6 bg-green-500' : 'h-1.5 bg-zinc-800'}`}></div>
                                      <span className="text-[6px] text-zinc-600 font-bold">{d}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>

                  {/* Quick Actions Grid - Enhanced Warmup */}
                  <h3 className="text-white text-sm font-black uppercase tracking-wider pl-1">Acesso Rápido</h3>
                  <div className="grid grid-cols-2 gap-3">
                      {/* Highlighted Warmup Routine */}
                      <div onClick={() => handleRestrictedAction(() => navigate('/workout/warmup'))} className="col-span-2 bg-gradient-to-r from-orange-900/50 to-red-900/50 p-4 rounded-2xl border border-orange-500/30 hover:bg-orange-900/70 transition-colors flex items-center justify-between group cursor-pointer">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-black">
                                <i className="fas fa-fire-alt text-lg"></i>
                              </div>
                              <div>
                                  <h4 className="font-black text-sm text-white uppercase italic">Aquecimento Rápido</h4>
                                  <p className="text-[10px] text-orange-200 font-bold">5 min • Essencial antes do treino</p>
                              </div>
                          </div>
                          <i className="fas fa-chevron-right text-orange-500 group-hover:translate-x-1 transition-transform"></i>
                      </div>

                      <div onClick={() => handleRestrictedAction(() => navigate('/workout/cooldown'))} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 hover:bg-zinc-800 transition-colors flex items-center gap-3">
                          <i className="fas fa-child text-blue-500 text-xl"></i>
                          <div>
                              <h4 className="font-bold text-xs text-white">Alongar</h4>
                              <p className="text-[8px] text-zinc-500 uppercase font-bold">10 min</p>
                          </div>
                      </div>
                      <div onClick={() => handleRestrictedAction(() => navigate('/workout/cat-Mobilidade'))} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 hover:bg-zinc-800 transition-colors flex items-center gap-3">
                          <i className="fas fa-sync-alt text-green-500 text-xl"></i>
                          <div>
                              <h4 className="font-bold text-xs text-white">Mobilidade</h4>
                              <p className="text-[8px] text-zinc-500 uppercase font-bold">20 min</p>
                          </div>
                      </div>
                      <div onClick={() => handleRestrictedAction(() => navigate('/workout/yoga'))} className="col-span-2 bg-zinc-900 p-4 rounded-2xl border border-zinc-800 hover:bg-zinc-800 transition-colors flex items-center gap-3">
                          <i className="fas fa-spa text-purple-500 text-xl"></i>
                          <div>
                              <h4 className="font-bold text-xs text-white">Yoga Flow</h4>
                              <p className="text-[8px] text-zinc-500 uppercase font-bold">15 min • Recuperação</p>
                          </div>
                      </div>
                  </div>
              </div>
          ) : (
              // CHALLENGE TAB CONTENT
              <div className="space-y-6 animate-fade-in">
                  
                  {/* Daily Goal Panel */}
                  <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-10">
                           <i className="fas fa-route text-6xl text-white"></i>
                       </div>
                       <h3 className="text-white text-sm font-black uppercase tracking-wider mb-2">Meta Diária</h3>
                       
                       <div className="flex items-baseline gap-1 mb-4">
                           <span className="text-5xl font-black text-white">{user?.distanceStats?.todayKm?.toFixed(1) || 0}</span>
                           <span className="text-xl font-bold text-zinc-500">/ 10 km</span>
                       </div>

                       {/* Progress Bar */}
                       <div className="h-3 bg-zinc-800 rounded-full overflow-hidden mb-4 relative">
                           <div 
                            className={`h-full transition-all duration-500 ${user?.distanceStats?.todayKm! >= 10 ? 'bg-green-500' : 'bg-red-600'}`} 
                            style={{ width: `${Math.min((user?.distanceStats?.todayKm! / 10) * 100, 100)}%` }}
                           ></div>
                       </div>
                  </div>

                  {/* Competitions List */}
                  <div>
                      <h3 className="text-white text-sm font-black uppercase tracking-wider mb-4">Desafios Premium</h3>
                      <div className="space-y-4">
                          {monthlyCompetitions.map(comp => {
                              const isJoined = user?.competitionsJoined.includes(comp.id);
                              const isFull = comp.currentParticipants >= comp.maxParticipants;
                              
                              return (
                                <div key={comp.id} className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 relative group overflow-hidden">
                                    {isJoined && <div className="absolute top-0 right-0 bg-green-500 text-black text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">Inscrito</div>}
                                    {isFull && !isJoined && <div className="absolute top-0 right-0 bg-zinc-600 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">Lotado</div>}
                                    
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg ${comp.type === 'Running' ? 'bg-gradient-to-br from-red-600 to-red-800 text-white' : 'bg-gradient-to-br from-blue-600 to-blue-800 text-white'}`}>
                                                <i className={`fas ${comp.type === 'Running' ? 'fa-running' : 'fa-walking'}`}></i>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-base text-white italic uppercase">{comp.title}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${isFull ? 'bg-red-900/50 text-red-500' : 'bg-zinc-800 text-zinc-400'}`}>
                                                        <i className="fas fa-users mr-1"></i> {comp.currentParticipants}/{comp.maxParticipants}
                                                    </span>
                                                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase font-bold">30 Dias</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end bg-black/30 p-3 rounded-xl mb-4 border border-white/5">
                                        <div>
                                            <p className="text-[9px] text-zinc-500 uppercase font-bold">Prémio</p>
                                            <p className="text-xl font-black text-yellow-500">{comp.prizePool} MT</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] text-zinc-500 uppercase font-bold">Entrada</p>
                                            <p className="text-sm font-bold text-white">{comp.entryFee} MT</p>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => handleJoinComp(comp)}
                                        disabled={isJoined || isFull}
                                        className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                            isJoined 
                                            ? 'bg-green-900/20 text-green-500 border border-green-500/30' 
                                            : (isFull 
                                                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                                                : 'bg-white text-black hover:bg-zinc-200 shadow-lg')
                                        }`}
                                    >
                                        {isJoined ? 'Participando' : (isFull ? 'LOTADO' : 'Inscrever-se')}
                                    </button>
                                </div>
                              );
                          })}
                      </div>
                  </div>
              </div>
          )}
       </div>

       {/* Settings Modal (Right Drawer) */}
       {showSettings && (
           <div className="fixed inset-0 z-50 flex justify-end">
               <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)}></div>
               <div className="relative w-80 bg-zinc-950 h-full border-l border-zinc-800 animate-slide-in-right flex flex-col pt-safe">
                   <div className="p-8 pt-12 text-center border-b border-zinc-900 relative">
                       <button onClick={() => profileInputRef.current?.click()} className="relative inline-block group cursor-pointer">
                           <div className="w-24 h-24 bg-red-600 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-black text-white overflow-hidden shadow-xl">
                               {user?.profilePicture ? (
                                   <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                               ) : (
                                   user?.name?.charAt(0) || 'V'
                               )}
                           </div>
                           <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <i className="fas fa-camera text-white"></i>
                           </div>
                       </button>
                       <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={handleProfileUpload} />
                       
                       <h3 className="font-bold text-lg text-white mb-1">{user?.name}</h3>
                       <div className="flex justify-center gap-2 text-[10px] font-bold uppercase text-zinc-500">
                           <span>Nível {level}</span>
                           <span>•</span>
                           <span>{user?.bodyType}</span>
                       </div>
                   </div>
                   
                   <div className="p-6 flex-1 overflow-y-auto space-y-3 pb-safe">
                       <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-2">Menu</p>

                       <button onClick={() => {setShowSettings(false); navigate('/paywall');}} className="w-full p-4 bg-gradient-to-r from-red-900/50 to-orange-900/50 rounded-xl text-left border border-red-500/20 flex justify-between items-center hover:border-red-500/50 transition-colors">
                           <span className="text-sm font-bold text-red-500 uppercase tracking-wide">Tornar Premium</span>
                           <i className="fas fa-crown text-red-500"></i>
                       </button>

                       <button onClick={() => {setShowSettings(false); navigate('/chat');}} className="w-full p-4 bg-zinc-900 rounded-xl text-left border border-zinc-800 flex justify-between items-center hover:bg-zinc-800">
                           <span className="text-sm font-bold text-white">Fale com IA</span>
                           <i className="fas fa-robot text-zinc-500"></i>
                       </button>

                       <button onClick={() => {setShowSettings(false); setShowHistory(true);}} className="w-full p-4 bg-zinc-900 rounded-xl text-left border border-zinc-800 flex justify-between items-center hover:bg-zinc-800">
                           <span className="text-sm font-bold text-white">Histórico</span>
                           <i className="fas fa-history text-zinc-500"></i>
                       </button>

                        <button onClick={() => {setShowSettings(false); setShowActivityLog(true);}} className="w-full p-4 bg-zinc-900 rounded-xl text-left border border-zinc-800 flex justify-between items-center hover:bg-zinc-800">
                           <span className="text-sm font-bold text-white">Registo de Atividades</span>
                           <i className="fas fa-route text-zinc-500"></i>
                       </button>

                       <button onClick={() => {setShowSettings(false); navigate('/wallet');}} className="w-full p-4 bg-zinc-900 rounded-xl text-left border border-zinc-800 flex justify-between items-center hover:bg-zinc-800">
                           <span className="text-sm font-bold text-white">Carteira</span>
                           <i className="fas fa-wallet text-zinc-500"></i>
                       </button>

                       <div className="border-t border-zinc-900 my-4"></div>

                       <button onClick={handleLogout} className="w-full p-4 bg-zinc-900/50 rounded-xl text-left border border-zinc-800 text-zinc-500 font-bold text-xs uppercase tracking-widest hover:text-white hover:bg-zinc-900">
                           Sair da Conta
                       </button>
                   </div>
               </div>
           </div>
       )}

       {/* Activity Log Modal */}
       {showActivityLog && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
               <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowActivityLog(false)}></div>
               <div className="relative w-full max-w-sm bg-zinc-900 rounded-3xl p-6 border border-zinc-800 animate-scale-in flex flex-col max-h-[85vh]">
                   
                   <div className="flex justify-between items-center mb-6 flex-shrink-0">
                       <div>
                           <h2 className="text-lg font-black italic uppercase text-white">Diário de Atividades</h2>
                           <p className="text-[10px] text-zinc-500 font-bold uppercase">Últimos 15 Dias</p>
                       </div>
                       <button onClick={() => setShowActivityLog(false)} className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400">
                           <i className="fas fa-times"></i>
                       </button>
                   </div>

                   {/* Chart */}
                   <div className="bg-black p-4 rounded-xl border border-zinc-800 mb-4 flex-shrink-0">
                       <div className="flex items-end justify-between h-24 gap-1">
                           {activityHistoryData.chart.map((day, idx) => (
                               <div key={idx} className="flex-1 flex flex-col justify-end items-center group">
                                   <div 
                                       className={`w-full rounded-t-sm transition-all ${day.hasActivity ? 'bg-red-600' : 'bg-zinc-800'}`}
                                       style={{ height: `${Math.max(day.count * 40, 10)}%` }}
                                   ></div>
                                   <span className={`text-[8px] mt-1 font-bold ${day.isToday ? 'text-white' : 'text-zinc-600'}`}>
                                       {day.day}
                                   </span>
                               </div>
                           ))}
                       </div>
                   </div>

                   {/* List */}
                   <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                       {activityHistoryData.list.length > 0 ? (
                           activityHistoryData.list.map((item) => (
                               <div key={item.id} className="bg-black p-3 rounded-xl border border-zinc-800 flex items-center gap-3">
                                   <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.bg} ${item.color} flex-shrink-0`}>
                                       <i className={`fas ${item.icon} text-lg`}></i>
                                   </div>
                                   <div className="flex-1 min-w-0">
                                       <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                                       <div className="flex items-center gap-2">
                                            <p className="text-[10px] text-zinc-500 capitalize">
                                                {new Date(item.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                                            </p>
                                            <span className="text-[10px] text-zinc-600">•</span>
                                            <p className="text-[10px] text-zinc-400">{item.xp}</p>
                                       </div>
                                   </div>
                                   <div className="text-right whitespace-nowrap">
                                       <span className={`text-xs font-black ${item.color}`}>{item.stat}</span>
                                   </div>
                               </div>
                           ))
                       ) : (
                           <div className="text-center py-10 text-zinc-500 text-xs italic">
                               Nenhuma atividade recente.
                               <br/>
                               <span className="text-[10px] opacity-50">Treinos e corridas aparecerão aqui.</span>
                           </div>
                       )}
                   </div>

               </div>
           </div>
       )}

       {/* History Modal (Legacy - kept for redundancy if needed, but Log covers it) */}
       {showHistory && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
               <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowHistory(false)}></div>
               <div className="relative w-full max-w-sm bg-zinc-900 rounded-3xl p-6 border border-zinc-800 animate-scale-in">
                   <div className="flex justify-between items-center mb-6">
                       <h2 className="text-lg font-black italic uppercase">Seu Progresso</h2>
                       <button onClick={() => setShowHistory(false)} className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400">
                           <i className="fas fa-times"></i>
                       </button>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                       <div className="bg-black p-4 rounded-xl border border-zinc-800 text-center">
                           <div className="text-2xl font-black text-white">{user?.workoutHistory.length}</div>
                           <div className="text-[9px] text-zinc-500 uppercase font-bold">Treinos Totais</div>
                       </div>
                       <div className="bg-black p-4 rounded-xl border border-zinc-800 text-center">
                           <div className="text-2xl font-black text-white">{user?.xp}</div>
                           <div className="text-[9px] text-zinc-500 uppercase font-bold">XP Total</div>
                       </div>
                   </div>
                   
                   <div className="mt-4 max-h-60 overflow-y-auto no-scrollbar space-y-2">
                       {user?.workoutHistory.slice().reverse().map(log => (
                           <div key={log.id} className="bg-black p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                               <div>
                                   <div className="text-xs font-bold text-white">Treino Completado</div>
                                   <div className="text-[9px] text-zinc-500">{new Date(log.timestamp).toLocaleDateString()}</div>
                               </div>
                               <div className="text-green-500 font-black text-xs">+{log.xpEarned} XP</div>
                           </div>
                       ))}
                   </div>
               </div>
           </div>
       )}

      {/* Bottom Navigation with Safe Area Padding */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-black/95 backdrop-blur-lg border-t border-zinc-900 flex justify-around z-40">
        <button onClick={() => { setActiveTab('focus'); setShowSettings(false); }} className={`${activeTab === 'focus' && !showSettings ? 'text-red-600' : 'text-zinc-600'} flex flex-col items-center gap-1 transition-colors group`}>
          <i className="fas fa-dumbbell text-lg group-hover:text-white transition-colors"></i>
          <span className="text-[9px] font-black uppercase tracking-wider">Treino</span>
        </button>
        
        <button onClick={() => handleRestrictedAction(() => navigate('/health'))} className="text-zinc-600 flex flex-col items-center gap-1 transition-colors hover:text-white">
          <i className="fas fa-apple-alt text-lg"></i>
          <span className="text-[9px] font-black uppercase tracking-wider">Nutrição</span>
        </button>

        <button onClick={() => handleRestrictedAction(() => navigate('/activity'))} className="text-zinc-600 flex flex-col items-center gap-1 transition-colors hover:text-white">
          <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center -mt-6 border-4 border-black text-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]">
             <i className="fas fa-running text-lg"></i>
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider">Atividade</span>
        </button>

        <button onClick={() => { setActiveTab('challenge'); setShowSettings(false); }} className={`${activeTab === 'challenge' && !showSettings ? 'text-red-600' : 'text-zinc-600'} flex flex-col items-center gap-1 transition-colors group`}>
          <i className="fas fa-trophy text-lg group-hover:text-white transition-colors"></i>
          <span className="text-[9px] font-black uppercase tracking-wider">Desafio</span>
        </button>
        <button onClick={() => handleRestrictedAction(() => setShowSettings(true))} className={`${showSettings ? 'text-white' : 'text-zinc-600'} flex flex-col items-center gap-1 transition-colors hover:text-white`}>
          <i className="fas fa-user text-lg"></i>
          <span className="text-[9px] font-black uppercase tracking-wider">Perfil</span>
        </button>
      </div>
    </div>
  );
};

export default PlanScreen;
