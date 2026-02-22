
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';

const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useApp();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        navigate('/login');
      } else if (!user.onboardingComplete) {
        navigate('/onboarding');
      } else {
        navigate('/plan');
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [user, navigate]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-black">
      <div className="relative flex flex-col items-center animate-fade-in">
        <div className="w-24 h-24 bg-red-600 rounded-2xl flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(220,38,38,0.5)]">
           <i className="fas fa-dumbbell text-4xl text-white transform -rotate-45"></i>
        </div>
        <h1 className="mt-6 text-4xl font-black tracking-tighter italic">
          NURU <span className="text-red-600">FIT</span>
        </h1>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.3em] mt-2">Treino inteligente, Transformação rápida</p>
      </div>
    </div>
  );
};

export default SplashScreen;
