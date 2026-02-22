
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';

const AdminScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  
  if (!user?.isAdmin) {
    navigate('/plan');
    return null;
  }

  return (
    <div className="min-h-screen bg-black p-6 pb-24 font-['Inter']">
      <div className="flex justify-between items-center mb-8 pt-8">
        <h1 className="text-2xl font-bold text-red-600">NURU Admin</h1>
        <button onClick={() => navigate('/plan')} className="text-zinc-500">Voltar</button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
             <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                <div className="text-2xl font-bold text-green-500">1,240</div>
                <div className="text-[10px] text-zinc-500 uppercase">Usuários</div>
             </div>
             <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                <div className="text-2xl font-bold text-blue-500">21,250</div>
                <div className="text-[10px] text-zinc-500 uppercase">Receita (MZN)</div>
             </div>
      </div>

      <div className="space-y-6">
        
        {/* Competition Dashboard (New) */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h2 className="font-bold text-lg mb-4 text-white">Dashboard de Competições</h2>
            <div className="space-y-3">
                <div className="bg-black p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                    <div>
                        <div className="font-bold text-xs text-white">Corrida do Mês</div>
                        <div className="text-[9px] text-zinc-500">22 Participantes</div>
                    </div>
                    <div className="text-right">
                        <div className="font-bold text-xs text-green-500">Ativo</div>
                        <button className="text-[9px] text-blue-500 underline">Ver Ranking</button>
                    </div>
                </div>
                 <div className="bg-black p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                    <div>
                        <div className="font-bold text-xs text-white">Caminhada do Mês</div>
                        <div className="text-[9px] text-zinc-500">18 Participantes</div>
                    </div>
                    <div className="text-right">
                        <div className="font-bold text-xs text-green-500">Ativo</div>
                        <button className="text-[9px] text-blue-500 underline">Ver Ranking</button>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <h2 className="font-bold text-lg mb-4 text-white">Controle de Promoções</h2>
          <div className="space-y-3">
              <button className="w-full py-3 bg-red-600 rounded-xl text-xs uppercase font-bold text-white">
                  Enviar Notificação Push
              </button>
              <button className="w-full py-3 bg-zinc-800 rounded-xl text-xs uppercase font-bold text-zinc-400">
                  Alterar Preço Premium
              </button>
          </div>
        </div>

        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <h2 className="font-bold text-lg mb-4 text-white">Gerir Conteúdo</h2>
          <div className="space-y-3">
              <button className="w-full py-3 bg-zinc-800 rounded-xl text-xs uppercase font-bold text-zinc-400">
                  Adicionar Exercício
              </button>
              <button className="w-full py-3 bg-zinc-800 rounded-xl text-xs uppercase font-bold text-zinc-400">
                  Upload PDF Dieta
              </button>
          </div>
          <p className="text-[10px] text-zinc-500 mt-4">Para alterações permanentes, edite <code>constants.tsx</code>.</p>
        </div>

      </div>
    </div>
  );
};

export default AdminScreen;
