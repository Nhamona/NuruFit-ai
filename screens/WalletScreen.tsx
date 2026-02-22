
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';

const WalletScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, withdrawFunds } = useApp();
  const [activeTab, setActiveTab] = useState<'rewards' | 'transactions'>('rewards');

  const handleWithdraw = () => {
      if ((user?.challengeEarnings || 0) <= 0) {
          alert("Sem ganhos disponíveis para levantamento.");
          return;
      }
      if (confirm(`Levantar ${user?.challengeEarnings} MT para M-Pesa?`)) {
          withdrawFunds();
          alert("Levantamento processado!");
      }
  };

  const handleCopyCode = () => {
      navigator.clipboard.writeText(`https://nuru.fit/invite?ref=${user?.referralCode}`);
      alert("Link de convite copiado!");
  };

  // --- Referral Logic ---
  const referrals = user?.referralsCount || 0;
  let nextRefTier = 0;
  let refProgress = 0;
  let currentRefLabel = 'Iniciante';
  
  if (referrals < 1) {
      nextRefTier = 1;
      refProgress = (referrals / 1) * 100;
  } else if (referrals < 5) {
      nextRefTier = 5;
      refProgress = ((referrals - 1) / 4) * 100;
      currentRefLabel = 'Bronze';
  } else if (referrals < 20) {
      nextRefTier = 20;
      refProgress = ((referrals - 5) / 15) * 100;
      currentRefLabel = 'Prata';
  } else {
      nextRefTier = 20;
      refProgress = 100;
      currentRefLabel = 'VIP Gold';
  }

  // --- XP / Level Logic ---
  const currentXp = user?.xp || 0;
  const currentLevel = Math.floor(currentXp / 1000) + 1;
  const xpForNextLevel = 1000;
  const currentLevelXp = currentXp % 1000;
  const levelProgress = (currentLevelXp / xpForNextLevel) * 100;

  return (
    <div className="min-h-screen bg-black text-white font-['Inter'] pb-24">
      {/* Header */}
      <div className="p-6 pt-12 flex justify-between items-center bg-zinc-900 border-b border-zinc-800 sticky top-0 z-20">
        <div>
           <h1 className="text-2xl font-black italic uppercase">Minha Carteira</h1>
           <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Nuru Coins & Rewards</p>
        </div>
        <button onClick={() => navigate('/plan')} className="w-10 h-10 bg-black rounded-full flex items-center justify-center border border-zinc-800 hover:bg-zinc-800 transition-colors">
             <i className="fas fa-times text-zinc-400"></i>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-4 gap-4">
          <button 
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'rewards' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-500'}`}
          >
              Progresso
          </button>
          <button 
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'transactions' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-500'}`}
          >
              Transações
          </button>
      </div>

      <div className="px-6 space-y-6 animate-fade-in">
          
          {activeTab === 'rewards' ? (
            <>
                {/* LEVEL PROGRESS CARD (Gamification) */}
                <div className="bg-gradient-to-r from-indigo-900 to-blue-900 p-6 rounded-3xl border border-white/10 relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <i className="fas fa-trophy text-8xl text-white"></i>
                    </div>
                    
                    <div className="flex justify-between items-end mb-4 relative z-10">
                        <div>
                            <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1">Nível de Atividade</p>
                            <h2 className="text-4xl font-black text-white">Nível {currentLevel}</h2>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-yellow-400">{currentXp}</span>
                            <span className="text-xs text-blue-300 font-bold uppercase block">Total XP</span>
                        </div>
                    </div>

                    {/* XP Bar */}
                    <div className="relative z-10">
                        <div className="flex justify-between text-[10px] font-bold text-blue-200 mb-1 uppercase">
                            <span>{currentLevelXp} XP</span>
                            <span>{xpForNextLevel} XP</span>
                        </div>
                        <div className="h-3 bg-black/40 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)] transition-all duration-1000" style={{ width: `${levelProgress}%` }}></div>
                        </div>
                        <p className="text-[10px] text-blue-300 mt-2 italic text-center">
                            "Faltam {xpForNextLevel - currentLevelXp} XP para desbloquear recompensas do Nível {currentLevel + 1}."
                        </p>
                    </div>
                </div>

                {/* COINS BALANCE CARD */}
                <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 p-6 rounded-3xl shadow-xl relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 text-9xl text-white opacity-10 rotate-12">
                        <i className="fas fa-coins"></i>
                    </div>
                    <p className="text-yellow-100 text-xs font-black uppercase tracking-widest mb-1">Saldo Atual</p>
                    <div className="flex items-baseline gap-2 mb-4">
                        <h2 className="text-5xl font-black text-white">{user?.walletBalance || 0}</h2>
                        <span className="text-sm font-bold text-yellow-200 uppercase">Coins</span>
                    </div>
                    <div className="flex gap-2">
                        <button className="flex-1 bg-black/30 backdrop-blur-md py-3 rounded-xl text-[10px] font-bold uppercase text-white border border-white/20 hover:bg-black/50 transition-colors">
                            <i className="fas fa-store mr-2 text-yellow-400"></i> Loja
                        </button>
                        <button className="flex-1 bg-black/30 backdrop-blur-md py-3 rounded-xl text-[10px] font-bold uppercase text-white border border-white/20 hover:bg-black/50 transition-colors">
                            <i className="fas fa-gift mr-2 text-yellow-400"></i> Resgatar
                        </button>
                    </div>
                </div>

                {/* REAL MONEY EARNINGS */}
                <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 relative">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Ganhos de Desafios</p>
                            <h2 className="text-4xl font-black text-green-500">{user?.challengeEarnings || 0} <span className="text-lg text-white">MT</span></h2>
                        </div>
                        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
                            <i className="fas fa-money-bill-wave text-xl"></i>
                        </div>
                    </div>
                    <button 
                        onClick={handleWithdraw}
                        className="w-full py-3 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 shadow-lg"
                    >
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/2560px-M-PESA_LOGO-01.svg.png" className="h-4" alt="M-Pesa" />
                        Levantar Fundos
                    </button>
                </div>

                {/* REFERRAL PROGRESS */}
                <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-black italic uppercase text-white">Programa de Indicação</h2>
                        <div className="bg-purple-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase">{currentRefLabel}</div>
                    </div>
                    
                    <div className="mb-4">
                        <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase mb-1">
                            <span>{referrals} Amigos</span>
                            <span>Meta: {nextRefTier}</span>
                        </div>
                        <div className="h-2 bg-black rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${refProgress}%` }}></div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className={`flex items-center gap-3 p-3 rounded-xl border ${referrals >= 1 ? 'border-purple-500/50 bg-purple-500/10' : 'border-zinc-800 bg-black'}`}>
                            <i className={`fas fa-check-circle ${referrals >= 1 ? 'text-purple-500' : 'text-zinc-700'}`}></i>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-white">1 Amigo</p>
                                <p className="text-[10px] text-zinc-500">Desbloqueia: 30% Desconto</p>
                            </div>
                        </div>
                        <div className={`flex items-center gap-3 p-3 rounded-xl border ${referrals >= 5 ? 'border-purple-500/50 bg-purple-500/10' : 'border-zinc-800 bg-black'}`}>
                            <i className={`fas fa-check-circle ${referrals >= 5 ? 'text-purple-500' : 'text-zinc-700'}`}></i>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-white">5 Amigos</p>
                                <p className="text-[10px] text-zinc-500">Desbloqueia: 1 Mês Premium</p>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleCopyCode}
                        className="w-full mt-4 py-3 bg-zinc-800 text-purple-400 font-black uppercase tracking-widest rounded-xl hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 border border-purple-500/20"
                    >
                        <i className="fas fa-link"></i> Copiar Link de Convite
                    </button>
                </div>
            </>
          ) : (
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden min-h-[50vh]">
                <div className="p-4 border-b border-zinc-800 bg-zinc-900 sticky top-0">
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">Histórico Completo</h3>
                </div>
                <div className="divide-y divide-zinc-800">
                    {user?.transactions && user.transactions.length > 0 ? (
                        user.transactions.slice().reverse().map((t) => (
                            <div key={t.id} className="p-4 flex items-center justify-between hover:bg-black/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm border ${
                                        t.type === 'credit' 
                                        ? 'bg-green-900/20 border-green-500/30 text-green-500' 
                                        : 'bg-red-900/20 border-red-500/30 text-red-500'
                                    }`}>
                                        <i className={`fas ${t.source === 'Challenge' ? 'fa-trophy' : t.type === 'credit' ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
                                    </div>
                                    <div>
                                        <p className="font-bold text-xs text-white uppercase">{t.description}</p>
                                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                            {new Date(t.date).toLocaleDateString()} • {new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                    </div>
                                </div>
                                <div className={`text-sm font-black font-mono ${t.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                                    {t.type === 'credit' ? '+' : '-'}{t.amount}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3 text-zinc-600">
                                <i className="fas fa-file-invoice-dollar text-2xl"></i>
                            </div>
                            <p className="text-zinc-500 text-xs">Nenhuma transação encontrada.</p>
                        </div>
                    )}
                </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default WalletScreen;
