
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { generatePersonalizedPlan, getWorkoutByCategory, getWarmupRoutine, getChallengeWorkout, getCooldownRoutine, getYogaRoutine } from '../constants';
import { getVideo } from '../services/offlineManager';

// URL de um som de sucesso satisfatório e curto
const SUCCESS_SOUND_URL = 'https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3';

const WorkoutPlayerScreen: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, completeWorkout } = useApp();
  
  const [showCongrats, setShowCongrats] = useState(false);
  const [sessionRating, setSessionRating] = useState<'Easy' | 'Good' | 'Hard'>('Good');
  
  // New State for Safety Tips Modal
  const [showSafetyTips, setShowSafetyTips] = useState(false);
  
  // Offline Video State
  const [offlineVideoUrl, setOfflineVideoUrl] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Som de sucesso
  const playSuccessSound = () => {
    const audio = new Audio(SUCCESS_SOUND_URL);
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio play blocked by browser"));
  };
  
  // Obter localização do usuário (Home vs Gym)
  const userLocation = user?.onboardingData?.workoutLocation || 'Home';

  // Memoize workoutData
  const workoutData = useMemo(() => {
    if (id === 'warmup') {
        return getWarmupRoutine();
    }
    if (id === 'cooldown') {
        return getCooldownRoutine();
    }
    if (id === 'yoga') {
        return getYogaRoutine();
    }
    if (id?.startsWith('challenge-')) {
        return getChallengeWorkout(id);
    }
    if (id?.startsWith('cat-')) {
        return getWorkoutByCategory(id.replace('cat-', ''), userLocation);
    }
    // Use the dynamic generator to ensure we get the right plan for the ID
    const plan = generatePersonalizedPlan(user);
    return plan.find(d => d.id === id);
  }, [id, userLocation, user]);
  
  // Memoize allExercises
  const allExercises = useMemo(() => {
    if (!workoutData) return [];
    
    // Explicitly removed Warmup phase from daily workouts as requested
    const phases = [
        // { name: 'Aquecimento', items: workoutData.warmup || [] },
        { name: 'Treino Principal', items: workoutData.workout || [] },
        { name: 'Alongamento', items: workoutData.cooldown || [] }
    ];
    return phases.flatMap(p => p.items.map(ex => ({ ...ex, phase: p.name })));
  }, [workoutData]);
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [showRest, setShowRest] = useState(false);
  const [restTimer, setRestTimer] = useState(15);
  const [currentSet, setCurrentSet] = useState(1);

  const currentEx = allExercises[currentIdx];
  
  // Image Handling
  const [displayImage, setDisplayImage] = useState<string>(currentEx?.imageUrl || '');

  useEffect(() => {
    if (!currentEx) return;

    // Default to base image (Female/Generic)
    let img = currentEx.imageUrl;

    // If User is Male and male image exists, use it
    if (user?.gender === 'Masculino' && currentEx.maleImageUrl) {
        img = currentEx.maleImageUrl;
    }
    
    setDisplayImage(img);
  }, [currentEx, user?.gender]);

  // Cálculo de dificuldade dinâmico & Sets/Reps baseado no OBJETIVO
  const userLevel = user?.onboardingData?.level || 'Iniciante';
  const userGoal = user?.onboardingData?.goal || 'Manter a Forma';
  
  const { sets: targetSets, reps: targetReps } = useMemo(() => {
    if (!currentEx) return { sets: 1, reps: 10 };

    // Se for desafio fixo (tem descrição específica de sets/reps), usa o do exercício
    if (id?.startsWith('challenge-')) {
        return { sets: currentEx.sets || 1, reps: currentEx.reps || 10 };
    }

    let sets = currentEx.sets || 1;
    let reps = currentEx.reps || 10;

    // Base Adjustments based on User Level
    if (userLevel === 'Intermédio') {
       sets = sets + 1;
       reps = Math.ceil(reps * 1.2);
    } else if (userLevel === 'Avançado') {
       sets = sets + 2;
       reps = Math.ceil(reps * 1.5);
    }
    
    // *** NEW LOGIC: Adjust based on Goal ***
    if (currentEx.phase === 'Treino Principal') {
        // Force minimum 3 sets to ensure ~15min duration for workouts
        sets = Math.max(sets, 3);
        
        if (userGoal === 'Ganhar Músculo') {
            // Hypertrophy Focus: Moderate Reps (8-12), More Sets
            sets = Math.max(sets, 4);
            reps = 12; // Standard hypertrophy range
        } else if (userGoal === 'Perda de Peso') {
            // Endurance/Burn: High Reps (15-20), Standard Sets
            reps = Math.max(reps, 15);
            sets = Math.max(sets, 3);
        }
    } else {
        // Warmup/Cooldown defaults
        sets = 1;
        reps = currentEx.reps || 10;
    }

    return { sets, reps };
  }, [currentEx, userLevel, userGoal, id]);

  // CÁLCULO DE CARGA INTELIGENTE
  const recommendedWeight = useMemo(() => {
      if (!currentEx || !currentEx.equipment || currentEx.equipment === 'None') return null;
      
      const weight = user?.weight || 70;
      const isMale = user?.gender === 'Masculino';
      let multiplier = 0;

      // Base Multipliers based on User Level
      if (userLevel === 'Iniciante') multiplier = 0.15;
      else if (userLevel === 'Intermédio') multiplier = 0.35;
      else multiplier = 0.60;

      // Gender Adjustment
      const genderFactor = isMale ? 1.2 : 0.8;

      let rec = 0;
      
      if (currentEx.id.includes('squat') || currentEx.id.includes('legpress') || currentEx.id.includes('deadlift')) {
          rec = weight * (multiplier * 1.5); 
      } else if (currentEx.id.includes('bench') || currentEx.id.includes('press')) {
          rec = weight * (multiplier * genderFactor);
      } else if (currentEx.id.includes('lat') || currentEx.id.includes('row')) {
          rec = weight * (multiplier * genderFactor);
      } else {
          rec = weight * (multiplier * 0.4);
      }

      return Math.round(rec / 2.5) * 2.5;

  }, [currentEx, userLevel, user?.weight, user?.gender]);

  useEffect(() => {
    if (currentEx?.durationSeconds) { 
      setTimer(currentEx.durationSeconds); 
      setIsActive(false); 
    } else {
      setTimer(0);
      setIsActive(false);
    }
    setCurrentSet(1);
  }, [currentEx?.id]); 

  useEffect(() => {
    let interval: any = null;
    if (isActive && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0 && isActive && currentEx?.durationSeconds) {
      setIsActive(false);
      handleSetCompletion();
    }
    return () => clearInterval(interval);
  }, [isActive, timer, currentEx]);

  useEffect(() => {
    let restInterval: any = null;
    if (showRest && restTimer > 0) {
      restInterval = setInterval(() => setRestTimer(prev => prev - 1), 1000);
    } else if (restTimer === 0 && showRest) {
      setShowRest(false);
      setRestTimer(currentEx?.restSeconds || 30);
    }
    return () => clearInterval(restInterval);
  }, [showRest, restTimer, currentEx]);

  const handleSetCompletion = () => {
    playSuccessSound();
    if (currentSet < targetSets) {
      setCurrentSet(prev => prev + 1);
      setShowRest(true);
      if (currentEx.durationSeconds) setTimer(currentEx.durationSeconds);
      setIsActive(false);
    } else {
      handleNextExercise();
    }
  };

  const handleNextExercise = () => {
    if (currentIdx < allExercises.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setShowRest(true);
      setCurrentSet(1);
    } else {
      playSuccessSound();
      setShowCongrats(true);
    }
  };

  const finishWorkout = () => {
      completeWorkout(id!, workoutData?.totalMinutes || 0, sessionRating);
      navigate('/plan');
  };

  const toggleTimer = () => {
      setIsActive(!isActive);
  };
  
  // Check for offline video availability when exercise changes
  useEffect(() => {
      const checkOfflineVideo = async () => {
          if (currentEx?.videoUrl && !currentEx.videoUrl.includes('youtube')) {
              const cachedUrl = await getVideo(currentEx.videoUrl);
              if (cachedUrl) {
                  setOfflineVideoUrl(cachedUrl);
              } else {
                  setOfflineVideoUrl(null);
              }
          } else {
              setOfflineVideoUrl(null);
          }
      };
      checkOfflineVideo();
  }, [currentEx]);

  const handleOpenVideo = () => {
      if (offlineVideoUrl) {
          setShowVideoModal(true);
      } else if (currentEx.videoUrl) {
          window.open(currentEx.videoUrl, '_blank');
      } else {
          // Fallback to YouTube Search
          const query = encodeURIComponent(`${currentEx.name} exercise tutorial`);
          window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
      }
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80';
  };

  // Generate Contextual Safety Tips based on Exercise Name/ID
  const getContextualSafetyTips = () => {
      const name = currentEx.name.toLowerCase();
      const id = currentEx.id.toLowerCase();
      
      const tips = [];
      
      // Generic Breathing
      tips.push({ icon: 'fa-wind', text: 'Expire ao fazer força, inspire ao relaxar.' });

      if (name.includes('agachamento') || id.includes('squat')) {
          tips.push({ icon: 'fa-arrow-down', text: 'Mantenha os calcanhares colados ao chão.' });
          tips.push({ icon: 'fa-check', text: 'Joelhos sempre apontando para fora, nunca para dentro.' });
          tips.push({ icon: 'fa-exclamation-triangle', text: 'Não deixe os joelhos passarem muito da ponta do pé se sentir dor.' });
      } else if (name.includes('flexão') || name.includes('pushup')) {
          tips.push({ icon: 'fa-minus', text: 'Mantenha o corpo reto como uma prancha.' });
          tips.push({ icon: 'fa-angle-double-down', text: 'Cotovelos a 45 graus do corpo, não 90.' });
      } else if (name.includes('prancha') || id.includes('plank')) {
          tips.push({ icon: 'fa-arrows-alt-h', text: 'Contraia glúteos e abdômen o tempo todo.' });
          tips.push({ icon: 'fa-times-circle', text: 'Não deixe a lombar cair (arquear para baixo).' });
      } else if (name.includes('supino') || id.includes('press')) {
          tips.push({ icon: 'fa-shield-alt', text: 'Mantenha os ombros firmes no banco/chão.' });
          tips.push({ icon: 'fa-hand-rock', text: 'Punhos retos, não deixe dobrar para trás.' });
      } else if (name.includes('lung') || name.includes('afundo')) {
          tips.push({ icon: 'fa-walking', text: 'Joelho da frente não deve oscilar para os lados.' });
          tips.push({ icon: 'fa-angle-up', text: 'Tronco ereto, olhe para frente.' });
      } else {
          tips.push({ icon: 'fa-heartbeat', text: 'Mantenha o movimento controlado, sem balanço.' });
      }

      return tips;
  };

  if (showCongrats) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-8 text-center animate-fade-in relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-red-600/20 to-transparent"></div>
        <div className="z-10 space-y-6 w-full max-w-sm mx-auto">
          <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(234,179,8,0.4)] animate-bounce">
            <i className="fas fa-trophy text-4xl text-black"></i>
          </div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">Treino Concluído!</h1>
          
          <div className="bg-zinc-900/80 p-6 rounded-3xl border border-zinc-800 backdrop-blur-md">
            <p className="text-sm font-bold text-zinc-300 mb-4">Como sentiu o treino?</p>
            <div className="flex gap-2 justify-center">
                <button 
                    onClick={() => setSessionRating('Easy')}
                    className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase transition-all ${sessionRating === 'Easy' ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}
                >
                    Fácil
                </button>
                <button 
                    onClick={() => setSessionRating('Good')}
                    className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase transition-all ${sessionRating === 'Good' ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}
                >
                    Bom
                </button>
                <button 
                    onClick={() => setSessionRating('Hard')}
                    className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase transition-all ${sessionRating === 'Hard' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}
                >
                    Difícil
                </button>
            </div>
            <p className="text-[10px] text-zinc-500 mt-3 italic">
                {sessionRating === 'Easy' && "A IA aumentará a carga no próximo treino."}
                {sessionRating === 'Good' && "Carga ideal. Manteremos o ritmo."}
                {sessionRating === 'Hard' && "A IA reduzirá levemente a intensidade."}
            </p>
          </div>

          <button 
            onClick={finishWorkout}
            className="w-full py-5 bg-white text-black font-black text-xl rounded-2xl shadow-xl uppercase tracking-widest transition-transform active:scale-95"
          >
            Registar Progresso
          </button>
        </div>
      </div>
    );
  }

  if (!workoutData || allExercises.length === 0) return <div className="h-screen bg-black flex items-center justify-center font-black uppercase tracking-widest text-white">Carregando Treino...</div>;
  if (!currentEx) return <div className="h-screen bg-black flex items-center justify-center text-white">Erro no exercício</div>;

  // Determine correct phase label
  const displayPhase = currentEx.id.startsWith('w_') ? 'Aquecimento' : currentEx.phase;
  const badgeColor = displayPhase === 'Aquecimento' ? 'bg-yellow-600 text-black' :
                     displayPhase === 'Alongamento' ? 'bg-blue-600 text-black' :
                     'bg-red-600 text-black';

  return (
    <div className="min-h-screen bg-black flex flex-col overflow-hidden text-white select-none">
      {showRest && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="absolute top-12 text-zinc-500 font-bold uppercase tracking-widest">Descanso</div>
          <div className="relative w-64 h-64 flex items-center justify-center">
            <div className="absolute inset-0 bg-red-600/10 rounded-full animate-ping"></div>
            <div className="text-8xl font-black">{restTimer}</div>
          </div>
          <h2 className="text-3xl font-black mt-12 mb-2 uppercase italic text-red-600">Respire</h2>
          <p className="text-zinc-400 mb-8 uppercase text-[10px] font-bold tracking-widest">A seguir: {allExercises[currentIdx]?.name}</p>
          <button onClick={() => setShowRest(false)} className="px-12 py-4 bg-zinc-900 border border-zinc-800 text-white font-black rounded-full text-xs uppercase tracking-widest">Pular</button>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && offlineVideoUrl && (
        <div className="fixed inset-0 z-[70] bg-black flex items-center justify-center p-4 animate-fade-in">
            <button 
                onClick={() => setShowVideoModal(false)}
                className="absolute top-6 right-6 w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-white z-50"
            >
                <i className="fas fa-times"></i>
            </button>
            <div className="w-full max-w-lg aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 relative">
                <video 
                    src={offlineVideoUrl} 
                    controls 
                    autoPlay 
                    className="w-full h-full object-contain"
                />
            </div>
        </div>
      )}

      {/* Safety Tips Modal */}
      {showSafetyTips && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-6" onClick={() => setShowSafetyTips(false)}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md"></div>
            <div className="relative w-full max-w-sm bg-zinc-900 rounded-3xl p-6 border border-zinc-800 animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-lg font-black italic uppercase text-white">Dicas & Segurança</h2>
                   <button onClick={() => setShowSafetyTips(false)} className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400">
                       <i className="fas fa-times"></i>
                   </button>
                </div>

                <div className="space-y-4">
                    {getContextualSafetyTips().map((tip, idx) => (
                        <div key={idx} className="flex gap-4 items-start">
                             <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 text-blue-500">
                                 <i className={`fas ${tip.icon}`}></i>
                             </div>
                             <div>
                                 <p className="text-sm font-bold text-zinc-200">{tip.text}</p>
                             </div>
                        </div>
                    ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-zinc-800">
                    <p className="text-[10px] text-zinc-500 italic text-center">
                        "Se sentir dor aguda, pare imediatamente e consulte um profissional."
                    </p>
                </div>
            </div>
        </div>
      )}

      {/* Header com Progresso */}
      <div className="p-6 pt-8">
        <div className="flex justify-between items-center mb-4">
            <button onClick={() => navigate('/plan')} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors border border-zinc-800">
                <i className="fas fa-times"></i>
            </button>
            
            <div className="flex flex-col items-center">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">
                    Exercício {currentIdx + 1} de {allExercises.length}
                </span>
                <div className={`text-xs font-black uppercase px-3 py-1 rounded-full ${badgeColor}`}>
                    {displayPhase}
                </div>
            </div>

            <button onClick={() => setShowSafetyTips(true)} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-yellow-500 hover:text-white transition-colors border border-zinc-800 animate-pulse">
                <i className="fas fa-lightbulb"></i>
            </button>
        </div>

        {/* Barra de Progresso Segmentada */}
        <div className="flex gap-1 h-1.5 w-full">
            {allExercises.map((_, idx) => (
                <div 
                    key={idx} 
                    className={`flex-1 rounded-full transition-all duration-300 ${
                        idx < currentIdx ? 'bg-green-500' : 
                        idx === currentIdx ? 'bg-white' : 
                        'bg-zinc-800'
                    }`}
                ></div>
            ))}
        </div>
      </div>

      {/* Container de Imagem Otimizado para Vertical */}
      <div className="px-6 mb-2">
        <div className="w-full h-[40vh] bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 relative group shadow-2xl flex items-center justify-center">
           {/* Background blurred */}
           <img src={displayImage} className="absolute inset-0 w-full h-full object-cover opacity-30 blur-md transition-all duration-500" alt="" />
           
           {/* Main Image */}
           <img 
             src={displayImage} 
             onError={handleError}
             className="w-full h-full object-contain relative z-10" 
             alt={currentEx.name} 
           />
           
           <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-20">
             <div className="flex gap-2">
                <span className="bg-black/70 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider backdrop-blur-md">Nível {userLevel}</span>
                {currentEx.equipment && (
                    <span className="bg-red-600/90 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider backdrop-blur-md">
                        <i className="fas fa-dumbbell mr-1"></i>
                        {currentEx.equipment}
                    </span>
                )}
             </div>
             
             {/* Video Button */}
             <button 
                onClick={handleOpenVideo}
                className="bg-white text-black text-[10px] font-black px-3 py-2 rounded-lg uppercase tracking-wider flex items-center gap-2 hover:bg-zinc-200 transition-colors w-fit shadow-lg"
             >
                 <i className="fab fa-youtube text-red-600 text-sm"></i> Ver Vídeo
             </button>
           </div>
        </div>
      </div>

      <div className="flex-1 px-6 text-center flex flex-col">
        <h1 className="text-2xl font-black uppercase mb-1 tracking-tighter italic leading-none">{currentEx.name}</h1>
        
        {/* Mostrador de Séries e Repetições */}
        <div className="bg-zinc-900 inline-block px-4 py-1 rounded-full border border-zinc-800 mb-2 mt-1">
            <span className="text-zinc-300 text-xs font-black uppercase tracking-wider">
                {targetSets} Séries • {currentEx.durationSeconds ? `${currentEx.durationSeconds}s` : `${targetReps} Repetições`}
            </span>
        </div>

        <div className="text-sm font-bold text-zinc-500 mb-1">
           A realizar série {currentSet}
        </div>

        {/* Recomendação de Peso INTELIGENTE */}
        {recommendedWeight && (
            <div className="bg-blue-600/20 border border-blue-500/50 rounded-xl p-2 mb-2 inline-flex items-center justify-center gap-2 max-w-[200px] mx-auto animate-fade-in">
                <i className="fas fa-weight-hanging text-blue-400"></i>
                <div className="text-left">
                    <span className="block text-[8px] text-blue-300 uppercase font-bold">Carga Nuru AI</span>
                    <span className="text-sm text-white font-black">{recommendedWeight} Kg</span>
                </div>
            </div>
        )}

        <div className="text-5xl font-black text-red-600 mb-2 font-mono drop-shadow-[0_0_10px_rgba(255,0,0,0.3)]">
           {currentEx.durationSeconds ? `${timer}s` : `x${targetReps}`}
        </div>
        
        <div className="flex-1 overflow-y-auto text-left bg-zinc-900/50 p-4 rounded-3xl border border-zinc-800 backdrop-blur-sm mb-4">
          <h3 className="text-[10px] font-black uppercase text-red-600 mb-2 tracking-widest flex items-center gap-2">
            <i className="fas fa-info-circle"></i> Execução Correta
          </h3>
          <ul className="space-y-2">
            {(currentEx.cues || currentEx.instructions).map((inst, i) => (
              <li key={i} className="flex gap-2 text-xs text-zinc-300">
                <span className="text-red-600 font-bold">•</span>
                <span className="leading-tight">{inst}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="p-6 pb-8 pt-0">
        <button 
          onClick={currentEx.durationSeconds ? toggleTimer : handleSetCompletion} 
          className={`w-full py-4 text-black font-black text-xl rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.4)] uppercase italic tracking-tighter transition-all ${currentEx.durationSeconds && isActive ? 'bg-yellow-500' : 'bg-green-500'}`}
        >
          {currentEx.durationSeconds ? (isActive ? 'Pausar' : (timer < currentEx.durationSeconds ? 'Retomar' : 'Iniciar')) : 'Série Concluída'}
        </button>
      </div>
    </div>
  );
};

export default WorkoutPlayerScreen;
