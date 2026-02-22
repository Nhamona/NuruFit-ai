
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { analyzeMeal, analyzeMealText } from '../services/gemini';
import { MealLog } from '../types';
import { requestNotificationPermission } from '../services/notifications';

const HealthDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logWater, addMeal, updateProfile } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealLog | null>(null);

  // Text Input State
  const [showTextModal, setShowTextModal] = useState(false);
  const [mealText, setMealText] = useState('');

  // Water Settings State
  const [showWaterSettings, setShowWaterSettings] = useState(false);

  // BMI States
  const [weight, setWeight] = useState(user?.weight || 70);
  const [height, setHeight] = useState(user?.height || 170);
  // Age removed as requested
  const [bmiResult, setBmiResult] = useState<{ value: string, category: string, color: string } | null>(null);

  useEffect(() => {
     // Check visitor status on mount
     if (user?.isVisitor) {
         // Optionally show a modal or just let them see but block interactions
     }
     calculateBMI();
  }, []);

  const handleRestrictedAction = (action: () => void) => {
    if (user?.isVisitor) {
        navigate('/paywall');
    } else {
        action();
    }
  };

  const calculateBMI = () => {
      if (weight && height) {
          const hM = height / 100;
          const bmi = weight / (hM * hM);
          let category = '';
          let color = '';

          // BMI Logic (Standard for Adults, simplified)
          if (bmi < 18.5) { category = 'Abaixo do Peso'; color = 'text-blue-400'; }
          else if (bmi < 24.9) { category = 'Normal'; color = 'text-green-500'; }
          else if (bmi < 29.9) { category = 'Sobrepeso'; color = 'text-yellow-500'; }
          else { category = 'Obesidade'; color = 'text-red-600'; }

          setBmiResult({ value: bmi.toFixed(1), category, color });
      }
  };

  const handleWaterClick = () => {
    handleRestrictedAction(() => logWater(250));
  };

  const toggleWaterReminders = async () => {
      if (!user?.waterRemindersEnabled) {
          const granted = await requestNotificationPermission();
          if (granted) {
              updateProfile({ waterRemindersEnabled: true });
          } else {
              alert("É necessário permitir notificações para ativar os lembretes.");
          }
      } else {
          updateProfile({ waterRemindersEnabled: false });
      }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (user?.isVisitor) {
        navigate('/paywall');
        return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const analysis = await analyzeMeal(base64);
      
      if (analysis) {
        const newMeal: MealLog = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          imageUrl: base64,
          analysis: analysis
        };
        addMeal(newMeal);
      } else {
        alert("Não foi possível analisar a imagem. Tente novamente.");
      }
      setAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleTextSubmit = async () => {
      if (!mealText.trim()) return;
      if (user?.isVisitor) {
          navigate('/paywall');
          return;
      }

      setShowTextModal(false);
      setAnalyzing(true);

      const analysis = await analyzeMealText(mealText);
      
      if (analysis) {
          const newMeal: MealLog = {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              textInput: mealText,
              imageUrl: undefined, // No image for text logs
              analysis: analysis
          };
          addMeal(newMeal);
          setMealText('');
      } else {
          alert("Não foi possível analisar o texto. Tente ser mais específico.");
      }
      setAnalyzing(false);
  };

  const waterProgress = Math.min(((user?.waterIntake || 0) / (user?.waterTarget || 2500)) * 100, 100);

  // Daily Distance Calculation for Chart
  const dailyDistances = useMemo(() => {
    const history = user?.activityHistory || [];
    const days = [];
    const today = new Date();
    
    // Last 30 days
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        const dayTotal = history
            .filter(h => h.date.startsWith(dateStr))
            .reduce((sum, h) => sum + h.distanceKm, 0);
            
        days.push({ date: dateStr, km: dayTotal });
    }
    return days;
  }, [user?.activityHistory]);

  const maxDailyDist = Math.max(...dailyDistances.map(d => d.km), 5); // Minimum scale of 5km to look good

  return (
    <div className="min-h-screen bg-black text-white pb-24 font-['Inter']">
      {/* Header with Safe Area */}
      <div className="p-6 pt-[calc(3rem+env(safe-area-inset-top))] flex items-center justify-between">
         <h1 className="text-2xl font-black italic uppercase">Nutrição & Saúde</h1>
         <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{new Date().toLocaleDateString()}</div>
      </div>

      <div className="px-6 space-y-6">
          {/* Ebooks & Recipes Placeholder */}
          <div className="bg-gradient-to-r from-green-900 to-zinc-900 p-6 rounded-3xl border border-zinc-800 relative overflow-hidden">
              <div className="relative z-10">
                  <h2 className="font-bold text-lg text-white mb-2">Ebooks & Receitas</h2>
                  <p className="text-xs text-zinc-300 mb-4 max-w-[80%]">Descubra receitas saudáveis, smoothies e guias de nutrição para potenciar os seus resultados.</p>
                  <button className="px-5 py-2.5 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                      Explorar Biblioteca
                  </button>
              </div>
              <i className="fas fa-book-open absolute -bottom-4 -right-4 text-8xl text-green-500/20"></i>
          </div>

          {/* Meal Tracker (Dark Style) */}
          <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
             <div className="flex justify-between items-center mb-6">
                 <div>
                     <h2 className="font-bold text-lg">Registo Alimentar</h2>
                     <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Foto ou Texto (IA)</p>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => setShowTextModal(true)} className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center hover:bg-zinc-700 transition-colors border border-zinc-700">
                         <i className="fas fa-keyboard text-zinc-400"></i>
                    </button>
                    <button onClick={() => user?.isVisitor ? navigate('/paywall') : fileInputRef.current?.click()} className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center hover:bg-zinc-700 transition-colors border border-zinc-700">
                        <i className="fas fa-camera text-zinc-400"></i>
                    </button>
                 </div>
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
             </div>

             {analyzing && (
                 <div className="text-center py-8">
                     <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                     <p className="text-[10px] text-zinc-500 uppercase font-bold animate-pulse">Analisando Refeição...</p>
                 </div>
             )}

             <div className="space-y-3">
                 {user?.mealLogs && user.mealLogs.length > 0 ? (
                     user.mealLogs.slice(0, 3).map(meal => (
                         <div 
                            key={meal.id} 
                            onClick={() => setSelectedMeal(meal)}
                            className="flex gap-4 p-3 bg-black rounded-2xl border border-zinc-800 cursor-pointer hover:border-zinc-600 transition-colors group"
                         >
                             {meal.imageUrl ? (
                                 <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800">
                                     <img src={meal.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="Meal" />
                                 </div>
                             ) : (
                                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800 flex items-center justify-center border border-zinc-700">
                                     <i className="fas fa-align-left text-zinc-500"></i>
                                 </div>
                             )}
                             <div className="flex-1 min-w-0 flex flex-col justify-center">
                                 <div className="flex justify-between items-start mb-1">
                                     <span className="text-[10px] text-zinc-500 uppercase font-bold">{new Date(meal.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                     <span className="text-xs font-black text-green-500">{meal.analysis.calories} kcal</span>
                                 </div>
                                 <p className="text-sm font-bold truncate text-white">{meal.analysis.items.join(', ')}</p>
                             </div>
                             <div className="flex items-center text-zinc-600">
                                 <i className="fas fa-chevron-right text-xs"></i>
                             </div>
                         </div>
                     ))
                 ) : (
                     !analyzing && (
                        <div className="h-32 rounded-2xl border-2 border-zinc-800 flex items-center justify-center bg-zinc-900/30">
                            <p className="text-zinc-500 text-xs italic">Nenhuma refeição registada hoje.</p>
                        </div>
                     )
                 )}
             </div>
          </div>

          {/* Hydration Card (Redesigned with Settings) */}
          <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 relative overflow-hidden">
             <div className="flex justify-between items-start mb-6">
                 <div>
                     <h2 className="font-bold text-lg text-white">Hidratação</h2>
                     <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Meta diária: {user?.waterTarget || 2500}ml</p>
                 </div>
                 <div className="flex gap-3">
                    <button 
                        onClick={() => setShowWaterSettings(!showWaterSettings)} 
                        className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${user?.waterRemindersEnabled ? 'bg-blue-600/20 border-blue-600 text-blue-500' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
                    >
                        <i className="fas fa-bell"></i>
                    </button>
                    <i className="fas fa-tint text-blue-600 text-3xl opacity-80"></i>
                 </div>
             </div>

             {showWaterSettings && (
                 <div className="mb-6 bg-black/50 p-4 rounded-xl border border-zinc-800 animate-fade-in">
                     <div className="flex justify-between items-center mb-4">
                         <span className="text-xs font-bold text-zinc-300">Lembretes Ativos</span>
                         <button 
                            onClick={toggleWaterReminders} 
                            className={`w-10 h-5 rounded-full relative transition-colors ${user?.waterRemindersEnabled ? 'bg-blue-600' : 'bg-zinc-700'}`}
                         >
                             <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${user?.waterRemindersEnabled ? 'left-6' : 'left-1'}`}></div>
                         </button>
                     </div>
                     
                     {user?.waterRemindersEnabled && (
                         <div>
                             <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-zinc-300">Intervalo</span>
                                <span className="text-xs font-black text-blue-500">{user?.waterReminderInterval || 2} Horas</span>
                             </div>
                             <input 
                                type="range" 
                                min="1" 
                                max="4" 
                                step="1"
                                value={user?.waterReminderInterval || 2}
                                onChange={(e) => updateProfile({ waterReminderInterval: parseInt(e.target.value) })}
                                className="w-full accent-blue-600 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                             />
                             <div className="flex justify-between mt-1 text-[8px] text-zinc-500 font-bold uppercase">
                                 <span>1h</span>
                                 <span>2h</span>
                                 <span>3h</span>
                                 <span>4h</span>
                             </div>
                         </div>
                     )}
                 </div>
             )}

             <div className="flex items-baseline gap-1 mb-2">
                 <span className="text-5xl font-black text-blue-500">{user?.waterIntake || 0}</span>
                 <span className="text-sm font-bold text-zinc-500">ml</span>
             </div>

             <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-6">
                 <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${waterProgress}%` }}></div>
             </div>

             <button onClick={handleWaterClick} className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-black uppercase tracking-widest transition-colors shadow-lg shadow-blue-900/20">
                 + 250ML
             </button>
          </div>
          
          {/* Distance History Chart Widget */}
          <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
             <div className="flex justify-between items-center mb-6">
                 <div>
                     <h2 className="font-bold text-lg">Distância (30 Dias)</h2>
                     <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Total Mês: {user?.distanceStats?.monthKm.toFixed(1) || 0} km</p>
                 </div>
                 <i className="fas fa-chart-bar text-zinc-600 text-xl"></i>
             </div>

             <div className="flex items-end gap-0.5 h-32 mt-2">
                 {dailyDistances.map((day, idx) => (
                     <div key={idx} className="flex-1 flex flex-col justify-end group relative">
                         <div 
                            className={`w-full rounded-t-sm transition-all duration-500 ${day.km > 0 ? 'bg-red-600' : 'bg-zinc-800'}`}
                            style={{ height: `${(day.km / maxDailyDist) * 100}%`, minHeight: '4px' }}
                         ></div>
                         {/* Tooltip */}
                         <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white text-black text-[8px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                             {day.km.toFixed(1)} km - {new Date(day.date).getDate()}/{new Date(day.date).getMonth()+1}
                         </div>
                     </div>
                 ))}
             </div>
             <div className="flex justify-between mt-2 text-[8px] text-zinc-500 font-bold uppercase">
                 <span>{new Date(dailyDistances[0].date).toLocaleDateString(undefined, {day:'2-digit', month:'2-digit'})}</span>
                 <span>Hoje</span>
             </div>
          </div>

          {/* BMI Calculator (Removed Age) */}
          <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
             <div className="flex justify-between items-center mb-4">
                 <h2 className="font-bold text-lg">Calculadora IMC</h2>
                 {bmiResult && <span className={`text-xs font-black uppercase px-2 py-1 rounded bg-black ${bmiResult.color}`}>{bmiResult.category}</span>}
             </div>
             
             <div className="flex gap-3 mb-4">
                 <div className="flex-1">
                     <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Peso (kg)</label>
                     <input 
                        type="number" 
                        value={weight} 
                        onChange={(e) => { setWeight(Number(e.target.value)); calculateBMI(); }}
                        className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white font-bold focus:border-blue-500 outline-none"
                     />
                 </div>
                 <div className="flex-1">
                     <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Altura (cm)</label>
                     <input 
                        type="number" 
                        value={height} 
                        onChange={(e) => { setHeight(Number(e.target.value)); calculateBMI(); }}
                        className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white font-bold focus:border-blue-500 outline-none"
                     />
                 </div>
             </div>
             
             {bmiResult && (
                 <div className="bg-black/50 p-3 rounded-xl flex justify-between items-center border border-zinc-800">
                     <span className="text-xs text-zinc-500 font-bold uppercase">Seu Índice</span>
                     <span className="text-xl font-black text-white">{bmiResult.value}</span>
                 </div>
             )}
          </div>
          
          {/* Progress Photos (Simplified Dark) */}
          <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 flex items-center justify-between mb-8">
              <div>
                  <h2 className="font-bold text-lg text-white">Fotos de Progresso</h2>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Acompanhe a evolução</p>
              </div>
              <button onClick={() => handleRestrictedAction(() => {})} className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-300 transition-colors">
                  Ver Galeria
              </button>
          </div>
      </div>

      {/* Text Input Modal */}
      {showTextModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowTextModal(false)}>
            <div className="bg-zinc-900 w-full max-w-sm rounded-3xl p-6 border border-zinc-800 relative shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowTextModal(false)} className="absolute top-4 right-4 w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                    <i className="fas fa-times"></i>
                </button>
                
                <h3 className="text-lg font-black italic uppercase mb-2 text-white">Descreva sua Refeição</h3>
                <p className="text-xs text-zinc-400 mb-4">Seja específico. Ex: "Omelete de 3 ovos com queijo e salada de alface".</p>
                
                <textarea 
                    value={mealText}
                    onChange={(e) => setMealText(e.target.value)}
                    className="w-full h-32 bg-black border border-zinc-800 rounded-xl p-4 text-white resize-none focus:outline-none focus:border-green-500 mb-4"
                    placeholder="Digite aqui..."
                    autoFocus
                />
                
                <button 
                    onClick={handleTextSubmit}
                    disabled={!mealText.trim()}
                    className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                    Analisar Texto
                </button>
            </div>
        </div>
      )}

      {/* Meal Detail Modal */}
      {selectedMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedMeal(null)}>
            <div className="bg-zinc-900 w-full max-w-sm rounded-3xl p-6 border border-zinc-800 relative shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSelectedMeal(null)} className="absolute top-4 right-4 w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                    <i className="fas fa-times"></i>
                </button>
                
                <h3 className="text-lg font-black italic uppercase mb-1 text-white">Detalhes da Refeição</h3>
                <p className="text-xs text-zinc-500 font-bold mb-4 uppercase tracking-wider">{new Date(selectedMeal.timestamp).toLocaleString()}</p>

                {selectedMeal.imageUrl ? (
                    <div className="w-full h-48 rounded-2xl overflow-hidden mb-4 bg-black border border-zinc-800">
                        <img src={selectedMeal.imageUrl} className="w-full h-full object-cover" alt="Meal" />
                    </div>
                ) : (
                    <div className="w-full h-24 rounded-2xl mb-4 bg-zinc-800/50 border border-zinc-800 flex items-center justify-center">
                         <div className="text-center">
                             <i className="fas fa-align-left text-zinc-600 text-2xl mb-2"></i>
                             <p className="text-xs text-zinc-400 italic">"{selectedMeal.textInput}"</p>
                         </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-black p-3 rounded-xl border border-zinc-800">
                        <span className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Calorias</span>
                        <span className="text-xl font-black text-white">{selectedMeal.analysis.calories} <span className="text-xs text-zinc-500">kcal</span></span>
                    </div>
                    <div className="bg-black p-3 rounded-xl border border-zinc-800">
                        <span className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Macros</span>
                        <span className="text-xs font-bold text-white leading-tight block">{selectedMeal.analysis.macros}</span>
                    </div>
                </div>

                <div className="bg-black p-4 rounded-2xl border border-zinc-800 mb-4">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">Alimentos Identificados</p>
                    <ul className="space-y-2">
                        {selectedMeal.analysis.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-zinc-300">
                                <span className="text-green-500 mt-1.5 text-[8px]"><i className="fas fa-circle"></i></span>
                                <span className="font-medium leading-tight">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                
                {selectedMeal.analysis.feedback && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                        <div className="flex gap-2">
                            <i className="fas fa-comment-alt text-green-500 text-xs mt-1"></i>
                            <p className="text-xs text-green-400 italic font-medium leading-tight">"{selectedMeal.analysis.feedback}"</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-black/95 backdrop-blur-lg border-t border-zinc-900 flex justify-around z-40">
        <button onClick={() => navigate('/plan', { state: { tab: 'focus' } })} className="text-zinc-600 flex flex-col items-center gap-1 transition-colors hover:text-white group">
          <i className="fas fa-dumbbell text-lg group-hover:text-white transition-colors"></i>
          <span className="text-[9px] font-black uppercase tracking-wider">Treino</span>
        </button>
        <button onClick={() => {}} className="text-red-600 flex flex-col items-center gap-1 transition-colors">
          <i className="fas fa-apple-alt text-lg"></i>
          <span className="text-[9px] font-black uppercase tracking-wider">Nutrição</span>
        </button>
        <button onClick={() => navigate('/activity')} className="text-zinc-600 flex flex-col items-center gap-1 transition-colors hover:text-white group">
          <i className="fas fa-running text-lg group-hover:text-white transition-colors"></i>
          <span className="text-[9px] font-black uppercase tracking-wider">Atividade</span>
        </button>
        <button onClick={() => navigate('/plan', { state: { tab: 'challenge' } })} className="text-zinc-600 flex flex-col items-center gap-1 transition-colors hover:text-white group">
          <i className="fas fa-trophy text-lg group-hover:text-white transition-colors"></i>
          <span className="text-[9px] font-black uppercase tracking-wider">Desafio</span>
        </button>
        <button onClick={() => handleRestrictedAction(() => navigate('/plan', { state: { openSettings: true } }))} className="text-zinc-600 flex flex-col items-center gap-1 transition-colors hover:text-white">
          <i className="fas fa-user text-lg"></i>
          <span className="text-[9px] font-black uppercase tracking-wider">Perfil</span>
        </button>
      </div>
    </div>
  );
};

export default HealthDashboard;
