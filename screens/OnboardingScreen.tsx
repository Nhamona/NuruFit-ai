
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { BodyType, UserGoal, UserLevel, Gender, WorkoutLocation, TargetBody } from '../types';

const OnboardingScreen: React.FC = () => {
  const { updateProfile, user } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 11; 
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    gender: 'Feminino' as Gender,
    age: 30,
    weight: 70,
    height: 170,
    goal: 'Perda de Peso' as UserGoal,
    level: 'Iniciante' as UserLevel,
    bodyType: 'Mesomorfo' as BodyType,
    workoutLocation: 'Home' as WorkoutLocation,
    targetBody: 'Definido' as TargetBody, 
    emotionalPainPoint: '', 
    daysPerWeek: 3,
    minutesPerDay: 20,
    workoutTime: '07:00',
    limitations: ''
  });

  const nextStep = () => {
    if (step < totalSteps) {
      if (step === 1 && !formData.name.trim()) {
        alert("Por favor, insira o seu nome.");
        return;
      }
      setStep(step + 1);
    } else {
      // Calcular meta de água
      const waterTarget = formData.gender === 'Masculino' ? 3700 : 2700;
      
      updateProfile({ 
        name: formData.name,
        gender: formData.gender,
        age: formData.age,
        weight: formData.weight,
        height: formData.height,
        bodyType: formData.bodyType,
        workoutTime: formData.workoutTime,
        waterRemindersEnabled: true,
        waterTarget: waterTarget,
        onboardingData: {
            goal: formData.goal,
            level: formData.level,
            daysPerWeek: formData.daysPerWeek,
            minutesPerDay: formData.minutesPerDay,
            workoutLocation: formData.workoutLocation,
            limitations: formData.limitations,
            targetBody: formData.targetBody,
            emotionalPainPoint: formData.emotionalPainPoint
        },
        onboardingComplete: true 
      });
      navigate('/plan');
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const calculateBMI = () => {
      const hM = formData.height / 100;
      return (formData.weight / (hM * hM)).toFixed(1);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Como podemos chamar-te?</h2>
            <input 
              type="text" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              className="w-full bg-zinc-900 border border-zinc-800 p-5 rounded-2xl text-xl focus:border-red-600 outline-none text-white"
              placeholder="O teu nome"
              autoFocus
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Qual é o seu género?</h2>
            <p className="text-zinc-500 text-xs">Usado para calcular o metabolismo e hidratação.</p>
            {['Masculino', 'Feminino', 'Outro'].map(g => (
              <button key={g} onClick={() => setFormData({...formData, gender: g as Gender})} className={`w-full p-5 rounded-2xl border-2 text-left ${formData.gender === g ? 'border-red-600 bg-red-600/10' : 'border-zinc-800 bg-zinc-900'}`}>{g}</button>
            ))}
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">As suas medidas</h2>
            <div>
              <label className="block text-zinc-400 mb-2">Idade (anos)</label>
              <input 
                type="number" 
                value={formData.age} 
                onChange={(e) => setFormData({...formData, age: parseInt(e.target.value)})} 
                className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xl text-center focus:border-red-600 outline-none text-white"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-zinc-400 mb-2">Peso (kg)</label>
                <input 
                  type="number" 
                  value={formData.weight} 
                  onChange={(e) => setFormData({...formData, weight: parseInt(e.target.value)})} 
                  className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xl text-center focus:border-red-600 outline-none text-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-zinc-400 mb-2">Altura (cm)</label>
                <input 
                  type="number" 
                  value={formData.height} 
                  onChange={(e) => setFormData({...formData, height: parseInt(e.target.value)})} 
                  className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xl text-center focus:border-red-600 outline-none text-white"
                />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Qual é o seu objetivo principal?</h2>
            {['Perda de Peso', 'Ganhar Músculo', 'Manter a Forma'].map(g => (
              <button key={g} onClick={() => setFormData({...formData, goal: g as UserGoal})} className={`w-full p-5 rounded-2xl border-2 text-left ${formData.goal === g ? 'border-red-600 bg-red-600/10' : 'border-zinc-800 bg-zinc-900'}`}>{g}</button>
            ))}
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Que corpo deseja ter? (Visual)</h2>
            <div className="grid grid-cols-1 gap-3">
              {[
                { type: 'Definido', icon: 'fa-running', desc: 'Baixa gordura, músculos visíveis' },
                { type: 'Grande/Musculoso', icon: 'fa-dumbbell', desc: 'Volume muscular, força máxima' },
                { type: 'Magro/Atlético', icon: 'fa-bolt', desc: 'Leve, rápido, resistente' }
              ].map(b => (
                <button key={b.type} onClick={() => setFormData({...formData, targetBody: b.type as TargetBody})} className={`p-4 rounded-2xl border-2 text-left flex items-center gap-4 ${formData.targetBody === b.type ? 'border-red-600 bg-red-600/10' : 'border-zinc-800 bg-zinc-900'}`}>
                  <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-300">
                    <i className={`fas ${b.icon}`}></i>
                  </div>
                  <div>
                    <div className="font-bold">{b.type}</div>
                    <div className="text-xs text-zinc-500">{b.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
             <h2 className="text-2xl font-bold text-red-600">O que mais te incomoda?</h2>
             <p className="text-zinc-400 text-sm">A nossa IA vai usar isto para motivar você quando quiser desistir.</p>
             <textarea 
               value={formData.emotionalPainPoint}
               onChange={(e) => setFormData({...formData, emotionalPainPoint: e.target.value})}
               className="w-full h-32 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl focus:border-red-600 outline-none resize-none text-white"
               placeholder="Ex: Barriga inchada, braços finos, falta de energia..."
             />
          </div>
        );
      case 7: 
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Onde vai treinar?</h2>
            <p className="text-zinc-500 text-xs">Adaptamos os exercícios aos equipamentos disponíveis.</p>
            
            <button onClick={() => setFormData({...formData, workoutLocation: 'Home'})} className={`w-full p-5 rounded-2xl border-2 text-left flex items-center gap-4 ${formData.workoutLocation === 'Home' ? 'border-red-600 bg-red-600/10' : 'border-zinc-800 bg-zinc-900'}`}>
              <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center"><i className="fas fa-home"></i></div>
              <div>
                <div className="font-bold">Em Casa</div>
                <div className="text-xs text-zinc-500">Sem equipamento, peso do corpo</div>
              </div>
            </button>

            <button onClick={() => setFormData({...formData, workoutLocation: 'Gym'})} className={`w-full p-5 rounded-2xl border-2 text-left flex items-center gap-4 ${formData.workoutLocation === 'Gym' ? 'border-red-600 bg-red-600/10' : 'border-zinc-800 bg-zinc-900'}`}>
              <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center"><i className="fas fa-dumbbell"></i></div>
              <div>
                <div className="font-bold">No Ginásio</div>
                <div className="text-xs text-zinc-500">Acesso a máquinas e pesos</div>
              </div>
            </button>
          </div>
        );
      case 8:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Nível de Experiência?</h2>
            <p className="text-zinc-500 text-xs">Isto ajusta as séries e repetições do plano.</p>
            {['Iniciante', 'Intermédio', 'Avançado'].map(l => (
              <button key={l} onClick={() => setFormData({...formData, level: l as UserLevel})} className={`w-full p-5 rounded-2xl border-2 text-left ${formData.level === l ? 'border-red-600 bg-red-600/10' : 'border-zinc-800 bg-zinc-900'}`}>{l}</button>
            ))}
          </div>
        );
      case 9:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Escolha o seu biotipo</h2>
            <div className="grid grid-cols-1 gap-3">
              {[
                { type: 'Ectomorfo', desc: 'Naturalmente magro, metabolismo rápido.' },
                { type: 'Mesomorfo', desc: 'Atlético, ganha músculo facilmente.' },
                { type: 'Endomorfo', desc: 'Estrutura larga, ganha peso facilmente.' }
              ].map(b => (
                <button key={b.type} onClick={() => setFormData({...formData, bodyType: b.type as BodyType})} className={`p-4 rounded-2xl border-2 text-left ${formData.bodyType === b.type ? 'border-red-600 bg-red-600/10' : 'border-zinc-800 bg-zinc-900'}`}>
                  <div className="font-bold">{b.type}</div>
                  <div className="text-xs text-zinc-500">{b.desc}</div>
                </button>
              ))}
            </div>
          </div>
        );
      case 10:
        return (
          <div className="space-y-6">
             <h2 className="text-2xl font-bold">Compromisso & Alarmes</h2>
             <div>
               <label className="block text-zinc-400 mb-2 font-bold">Hora do Treino (Alarme)</label>
               <input 
                 type="time" 
                 value={formData.workoutTime} 
                 onChange={(e) => setFormData({...formData, workoutTime: e.target.value})} 
                 className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xl text-center focus:border-red-600 outline-none text-white color-scheme-dark"
               />
               <p className="text-xs text-zinc-500 mt-2 text-center">Vamos enviar uma notificação para não esquecer.</p>
             </div>

             <div>
               <label className="block text-zinc-400 mb-2 mt-4">Frequência Semanal: {formData.daysPerWeek} dias</label>
               <input type="range" min="1" max="7" value={formData.daysPerWeek} onChange={(e) => setFormData({...formData, daysPerWeek: parseInt(e.target.value)})} className="w-full accent-red-600" />
             </div>
          </div>
        );
      case 11:
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in relative">
            <div className="absolute inset-0 bg-red-600/5 blur-3xl rounded-full"></div>
            
            <div className="z-10 w-full bg-zinc-900/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-800 shadow-2xl">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
                    <h2 className="text-xl font-black italic uppercase text-white">Plano Gerado</h2>
                    <div className="px-3 py-1 bg-green-500/20 text-green-500 text-[10px] font-black uppercase rounded-full tracking-widest animate-pulse">
                        Pronto
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-black p-4 rounded-2xl border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold">Seu Nível</span>
                        <div className="text-lg font-black text-white mt-1">{formData.level}</div>
                    </div>
                    <div className="bg-black p-4 rounded-2xl border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold">IMC Estimado</span>
                        <div className="text-lg font-black text-white mt-1">{calculateBMI()}</div>
                    </div>
                    <div className="col-span-2 bg-black p-4 rounded-2xl border border-zinc-800 flex justify-between items-center">
                        <div>
                            <span className="text-[10px] text-zinc-500 uppercase font-bold">Foco Principal</span>
                            <div className="text-lg font-black text-red-600 mt-1">{formData.goal}</div>
                        </div>
                        <i className="fas fa-bullseye text-zinc-700 text-2xl"></i>
                    </div>
                </div>

                <p className="text-xs text-zinc-400 text-center italic">
                    "A nossa IA ajustará a carga e intensidade automaticamente após cada treino."
                </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col p-6 font-['Inter'] text-white">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
            {step > 1 && (
                <button onClick={prevStep} className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                    <i className="fas fa-arrow-left text-xs"></i>
                </button>
            )}
            <div className="text-zinc-500 text-sm font-bold tracking-widest">PASSO {step} / {totalSteps}</div>
        </div>
        <div className="h-1 bg-zinc-900 w-24 rounded-full overflow-hidden">
             <div className="h-full bg-red-600 transition-all duration-500" style={{width: `${(step/totalSteps)*100}%`}}></div>
        </div>
      </div>
      <div className="flex-1 animate-fade-in flex flex-col justify-center">{renderStep()}</div>
      <button 
        onClick={nextStep} 
        className="w-full py-5 bg-white text-black font-black text-lg rounded-2xl shadow-xl mt-6 uppercase tracking-widest hover:bg-zinc-200 transition-transform active:scale-95"
      >
        {step === totalSteps ? 'Começar Jornada' : 'Continuar'}
      </button>
    </div>
  );
};

export default OnboardingScreen;
