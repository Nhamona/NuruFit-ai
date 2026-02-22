
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';

const PaywallScreen: React.FC = () => {
  const navigate = useNavigate();
  const { togglePremium, redeemCoupon, user, purchaseDietPlan } = useApp();
  const [couponInput, setCouponInput] = useState('');

  const handleSubscribe = () => {
    const message = "Olá! Quero ativar meus 30 dias grátis no NURU FIT.";
    const whatsappUrl = `https://wa.me/258834438936?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePurchaseDiet = () => {
     // Simular compra da dieta
     if (confirm("Confirmar compra do Plano Alimentar por 175 MT?")) {
         purchaseDietPlan();
         alert("Plano Alimentar desbloqueado com sucesso!");
         navigate('/plan');
     }
  };

  const handleApplyCoupon = () => {
      if(!couponInput.trim()) return;
      
      const success = redeemCoupon(couponInput);
      if (success) {
          alert("Cupão aplicado com sucesso! Acesso prolongado.");
          navigate('/plan');
      } else {
          alert("Código inválido ou expirado.");
      }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-y-auto no-scrollbar">
      <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
      
      <div className="p-6 pt-12 flex justify-between">
        <button onClick={() => navigate('/plan')} className="text-zinc-500">
          <i className="fas fa-times text-xl"></i>
        </button>
        <button onClick={togglePremium} className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Restaurar</button>
      </div>

      <div className="px-6 text-center mt-4">
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-lg shadow-yellow-500/20">
          <i className="fas fa-crown text-black"></i>
        </div>
        <h1 className="text-3xl font-black mb-2 uppercase italic">Plano <span className="text-red-600">Full Access</span></h1>
        <p className="text-zinc-400 max-w-xs mx-auto mb-6 text-xs">
          Resultados reais com treino e nutrição inteligente.
        </p>

        {/* Payment Methods Icons */}
        <div className="flex justify-center gap-4 mb-8 text-2xl text-zinc-500">
           <div className="flex flex-col items-center">
             <i className="fas fa-money-bill-wave text-red-600"></i>
             <span className="text-[8px] mt-1">M-Pesa</span>
           </div>
           <div className="flex flex-col items-center">
             <i className="fas fa-wallet text-orange-500"></i>
             <span className="text-[8px] mt-1">E-Mola</span>
           </div>
           <div className="flex flex-col items-center">
             <i className="fab fa-cc-visa text-blue-500"></i>
             <span className="text-[8px] mt-1">Visa</span>
           </div>
        </div>
      </div>

      <div className="mt-auto p-6 pb-12 space-y-6">
        
        {/* Subscription Card */}
        <div className="p-1 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600">
          <div className="bg-black rounded-xl p-5 relative">
             <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-red-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-red-600">Recomendado</div>
             <div className="flex justify-between items-center mb-2">
               <span className="text-zinc-400 line-through text-sm">250 MZN</span>
               <span className="text-green-500 font-bold text-xs uppercase">1º Mês</span>
             </div>
             <div className="flex justify-between items-baseline mb-4">
                <div>
                  <h3 className="text-3xl font-black text-white">150 MZN</h3>
                  <p className="text-[10px] text-zinc-500">Acesso Total (Treino + Dieta)</p>
                </div>
                <div className="text-right">
                   <span className="block text-xl font-bold text-white">30 Dias</span>
                   <span className="text-xs text-zinc-400">Grátis</span>
                </div>
             </div>
             <button 
                onClick={handleSubscribe}
                className="w-full py-4 bg-white text-black font-black text-lg rounded-xl uppercase tracking-tighter hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
              >
                <i className="fab fa-whatsapp text-xl"></i> Iniciar 30 Dias Grátis
              </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-zinc-700">
           <div className="h-px bg-zinc-800 flex-1"></div>
           <span className="text-xs uppercase font-bold">OU COMPRA ÚNICA</span>
           <div className="h-px bg-zinc-800 flex-1"></div>
        </div>

        {/* Diet Plan Only Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
           <div>
               <h4 className="font-bold text-white text-sm">Apenas Plano Alimentar (PDF)</h4>
               <p className="text-[10px] text-zinc-500">Compra vitalícia. Sem subscrição.</p>
           </div>
           <button 
             onClick={handlePurchaseDiet}
             className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-white text-xs font-black uppercase rounded-lg hover:bg-zinc-700"
           >
               175 MZN
           </button>
        </div>

        <div className="mt-6 pt-6 border-t border-zinc-900">
           <p className="text-xs text-zinc-400 mb-2 font-bold text-center uppercase tracking-widest">Cupão de Desconto</p>
           <div className="flex gap-2">
             <input 
               type="text" 
               value={couponInput}
               onChange={(e) => setCouponInput(e.target.value)}
               placeholder="Insira o código (ex: NURU30)" 
               className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none uppercase"
             />
             <button onClick={handleApplyCoupon} className="px-4 py-2 bg-zinc-800 rounded-xl font-bold text-xs hover:bg-zinc-700">Aplicar</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PaywallScreen;
