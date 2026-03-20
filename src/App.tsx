import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Dashboard from './Dashboard';

export default function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-sm w-full text-center">
          <h1 className="text-4xl font-black text-[#0F3460] mb-2 tracking-tighter uppercase">VisuCheck</h1>
          <p className="text-gray-400 text-sm mb-8">Faça login para periciar</p>
          
          <form onSubmit={async (e) => {
            e.preventDefault();
            const email = (e.target as any).email.value;
            const password = (e.target as any).password.value;
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) alert("Erro ao entrar: " + error.message);
          }} className="space-y-4">
            <input name="email" type="email" placeholder="E-mail" required className="w-full bg-gray-50 p-4 rounded-xl text-sm outline-none" />
            <input name="password" type="password" placeholder="Senha" required className="w-full bg-gray-50 p-4 rounded-xl text-sm outline-none" />
            <button type="submit" className="w-full bg-[#0F3460] text-white py-4 rounded-xl font-bold hover:bg-blue-900 transition-all">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  return <Dashboard session={session} />;
}