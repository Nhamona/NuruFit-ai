
import React, { useState } from 'react';
import { useApp } from '../App';
import { useNavigate } from 'react-router-dom';

const LoginScreen: React.FC = () => {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) login(email);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col p-6 font-['Inter']">
      <div className="mt-12 mb-12 text-center flex flex-col items-center">
        {/* Logo Nuru Fit */}
        <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(220,38,38,0.4)]">
           <i className="fas fa-dumbbell text-3xl text-white transform -rotate-45"></i>
        </div>

        <h2 className="text-2xl font-black tracking-tighter italic mb-6 text-white">
          NURU <span className="text-red-600">FIT</span>
        </h2>

        <h1 className="text-3xl font-extrabold mb-2 text-white">Bem-vindo</h1>
        <p className="text-zinc-400 text-sm">Treino inteligente, Transformação rápida</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-zinc-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-red-600 transition-colors"
            placeholder="nome@exemplo.com"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
        >
          <i className="fas fa-envelope"></i> Continuar com Email
        </button>
      </form>

      <div className="my-8 flex items-center gap-4 text-zinc-500">
        <div className="flex-1 h-px bg-zinc-800"></div>
        <span>ou</span>
        <div className="flex-1 h-px bg-zinc-800"></div>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => login('google-user@gmail.com')}
          className="w-full py-4 bg-zinc-900 border border-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
        >
          <i className="fab fa-google text-red-500"></i> Continuar com Google
        </button>

        <button
          onClick={() => login('apple-user@icloud.com')}
          className="w-full py-4 bg-zinc-900 border border-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
        >
          <i className="fab fa-apple text-white text-xl"></i> Continuar com Apple
        </button>
      </div>
      
      {/* Botão Visitante */}
      <div className="mt-6">
        <button
          onClick={() => login('', true)}
          className="w-full py-2 text-zinc-500 text-sm font-bold uppercase tracking-wider hover:text-white transition-colors"
        >
          Entrar como Visitante
        </button>
      </div>

      <p className="mt-auto text-center text-[10px] text-zinc-600 pb-4">
        Ao continuar, concorda com os nossos Termos e Política de Privacidade.
      </p>
    </div>
  );
};

export default LoginScreen;
