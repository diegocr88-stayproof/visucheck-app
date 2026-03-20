import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, Zap, Shield, BarChart3, Users, LogOut, LayoutDashboard, Home as HomeIcon } from "lucide-react";
import Auth from './Auth';
import Dashboard from './Dashboard';
import { supabase } from './supabase';

export default function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [currentView, setCurrentView] = useState('home');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) setCurrentView('dashboard');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setShowAuthModal(false);
        setCurrentView('dashboard');
      } else {
        setCurrentView('home');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const userName = session?.user?.email?.split('@')[0] || 'Usuário';

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#141923] font-sans relative">
      
      {showAuthModal && <Auth onClose={() => setShowAuthModal(false)} />}

      {/* CABEÇALHO UNIVERSAL */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto max-w-7xl px-4 py-4 flex justify-between items-center">
          <div 
            onClick={() => setCurrentView('home')}
            className="text-3xl font-black text-[#0F3460] tracking-tighter cursor-pointer hover:opacity-80 transition uppercase"
          >
            VisuCheck
          </div>
          
          <div className="flex items-center gap-4">
            {session ? (
              <>
                <span className="text-sm text-gray-600 hidden md:block">
                  Olá, <strong className="text-[#0F3460]">{userName}</strong>
                </span>
                <div className="h-6 w-px bg-gray-300 hidden md:block"></div>
                
                {currentView === 'home' ? (
                  <button 
                    onClick={() => setCurrentView('dashboard')} 
                    className="flex items-center gap-2 bg-[#0F3460] hover:bg-blue-900 text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow"
                  >
                    <LayoutDashboard size={16} /> Painel
                  </button>
                ) : (
                  <button 
                    onClick={() => setCurrentView('home')} 
                    className="flex items-center gap-2 bg-white hover:bg-gray-50 text-[#0F3460] border-2 border-gray-200 px-4 py-2 rounded-xl text-sm font-bold transition"
                  >
                    <HomeIcon size={16} /> Início
                  </button>
                )}

                <button 
                  onClick={handleLogout} 
                  className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl text-sm font-bold transition"
                  title="Sair da conta"
                >
                  <LogOut size={16} /> <span className="hidden sm:inline">Sair</span>
                </button>
              </>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="bg-[#4CAF8C] hover:bg-teal-600 text-white px-6 py-3 rounded-xl text-sm font-black tracking-widest uppercase transition shadow-lg">
                Entrar / Cadastro
              </button>
            )}
          </div>
        </div>
      </header>

      {/* RENDERIZAÇÃO CONDICIONAL */}
      {currentView === 'dashboard' && session ? (
        <Dashboard session={session} />
      ) : (
        <main>
          {/* Hero Section */}
          <section className="pt-24 pb-20 px-4 relative overflow-hidden">
            <div className="absolute inset-0 -z-10 opacity-20"
                 style={{
                   backgroundImage: `url('https://d2xsxph8kpxj0f.cloudfront.net/310519663372626426/582h2FhyytAPUxFYnCpsKp/hero-background-iAFCcBthApDb4H2UmiUvzg.webp')`,
                   backgroundSize: "cover",
                   backgroundPosition: "center",
                 }}
            />
            <div className="container mx-auto max-w-6xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="inline-block px-5 py-2 bg-[#E8F0F5] rounded-full border border-blue-100">
                    <span className="text-xs font-black uppercase tracking-widest text-[#0F3460]">
                      🚀 Tecnologia de IA para Obras e Imóveis
                    </span>
                  </div>
                  <h1 className="text-5xl lg:text-6xl font-black text-[#141923] leading-tight tracking-tight">
                    Auditoria Visual Inteligente
                  </h1>
                  <p className="text-lg text-gray-600 max-w-lg leading-relaxed">
                    Automatize a vistoria de entrada e saída com IA avançada. Compare o estado de conservação, inventário e controle de EPIs/ferramentas em segundos.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    {!session ? (
                      <button onClick={() => setShowAuthModal(true)} className="flex items-center justify-center bg-[#0F3460] hover:bg-blue-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition shadow-2xl">
                        Começar Teste Grátis <ArrowRight className="ml-2 w-5 h-5" />
                      </button>
                    ) : (
                      <button onClick={() => setCurrentView('dashboard')} className="flex items-center justify-center bg-[#4CAF8C] hover:bg-teal-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition shadow-2xl">
                        Acessar Meu Painel <ArrowRight className="ml-2 w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-6 pt-8 text-sm font-bold text-gray-500">
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#4CAF8C]" /><span>Sem configuração difícil</span></div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#4CAF8C]" /><span>Laudos em PDF</span></div>
                  </div>
                </div>
                <div className="relative h-96 lg:h-full hidden lg:block">
                  <img
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310519663372626426/582h2FhyytAPUxFYnCpsKp/ai-analysis-visualization-Mp3FAckbWrf9ueSXCebvr6.webp"
                    alt="VisuCheck AI Analysis"
                    className="w-full h-full object-contain drop-shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Como Funciona Section */}
          <section className="py-20 px-4 bg-[#E8F0F5]/50 border-y border-gray-100">
            <div className="container mx-auto max-w-6xl">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-black text-[#141923] mb-4 tracking-tight">Como Funciona</h2>
                <p className="text-lg text-gray-500 max-w-2xl mx-auto">Três passos simples para automatizar as suas vistorias e inspeções.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                <div className="bg-white rounded-[2rem] p-10 border border-gray-100 shadow-sm hover:shadow-xl transition-all">
                  <div className="w-14 h-14 bg-[#0F3460]/10 rounded-2xl flex items-center justify-center mb-6">
                    <span className="text-2xl font-black text-[#0F3460]">1</span>
                  </div>
                  <h3 className="text-2xl font-black text-[#141923] mb-3 tracking-tight">Capturar Foto</h3>
                  <p className="text-gray-500 leading-relaxed">Tire fotos de entrada e saída de cada ambiente ou estaleiro de obras.</p>
                </div>
                <div className="bg-white rounded-[2rem] p-10 border border-gray-100 shadow-sm hover:shadow-xl transition-all">
                  <div className="w-14 h-14 bg-[#4CAF8C]/10 rounded-2xl flex items-center justify-center mb-6">
                    <span className="text-2xl font-black text-[#4CAF8C]">2</span>
                  </div>
                  <h3 className="text-2xl font-black text-[#141923] mb-3 tracking-tight">Processamento IA</h3>
                  <p className="text-gray-500 leading-relaxed">A nossa IA analisa as imagens, deteta objetos (ferramentas, EPIs, móveis) e compara o estado.</p>
                </div>
                <div className="bg-white rounded-[2rem] p-10 border border-gray-100 shadow-sm hover:shadow-xl transition-all">
                  <div className="w-14 h-14 bg-[#0F3460]/10 rounded-2xl flex items-center justify-center mb-6">
                    <span className="text-2xl font-black text-[#0F3460]">3</span>
                  </div>
                  <h3 className="text-2xl font-black text-[#141923] mb-3 tracking-tight">Gerar Relatório</h3>
                  <p className="text-gray-500 leading-relaxed">Receba um relatório detalhado em PDF com evidências visuais e divergências destacadas.</p>
                </div>
              </div>
              <div className="mt-8">
                <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663372626426/582h2FhyytAPUxFYnCpsKp/property-inspection-flow-bt4j6EiZVEjpyjqYTxZtcV.webp" alt="Inspection Workflow" className="w-full max-w-4xl mx-auto rounded-[2rem] shadow-2xl border-4 border-white" />
              </div>
            </div>
          </section>

          {/* Resultados Reais */}
          <section className="py-24 px-4 bg-white">
            <div className="container mx-auto max-w-6xl">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-black text-[#141923] mb-4 tracking-tight">Resultados Reais</h2>
                <p className="text-lg text-gray-500 max-w-2xl mx-auto">Veja como a IA VisuCheck identifica diferenças e danos instantaneamente.</p>
              </div>
              <div className="rounded-[3rem] overflow-hidden border-8 border-gray-50 shadow-2xl">
                <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663372626426/582h2FhyytAPUxFYnCpsKp/feature-comparison-nAAxBg9xDeweWB2HTjALrE.webp" alt="Before and After Comparison" className="w-full" />
              </div>
            </div>
          </section>

          {/* Recursos Principais */}
          <section className="py-24 px-4 bg-[#E8F0F5]/50 border-t border-gray-100">
            <div className="container mx-auto max-w-6xl">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-black text-[#141923] mb-4 tracking-tight">Recursos Principais</h2>
                <p className="text-lg text-gray-500 max-w-2xl mx-auto">Tudo o que precisa para gerir inspeções como um profissional.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="flex gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                  <div className="flex-shrink-0"><div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-[#0F3460]/10"><Zap className="h-8 w-8 text-[#0F3460]" /></div></div>
                  <div><h3 className="text-xl font-black text-[#141923] tracking-tight">Análise Multi-Ângulo</h3><p className="text-gray-500 mt-2 leading-relaxed">Reconhece objetos mesmo que estejam em posições diferentes entre as fotos de entrada e saída.</p></div>
                </div>
                <div className="flex gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                  <div className="flex-shrink-0"><div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-[#4CAF8C]/10"><Shield className="h-8 w-8 text-[#4CAF8C]" /></div></div>
                  <div><h3 className="text-xl font-black text-[#141923] tracking-tight">Laudos Oficiais</h3><p className="text-gray-500 mt-2 leading-relaxed">Gera evidências visuais precisas prontas para relatórios de engenharia ou locação.</p></div>
                </div>
                <div className="flex gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                  <div className="flex-shrink-0"><div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-[#0F3460]/10"><BarChart3 className="h-8 w-8 text-[#0F3460]" /></div></div>
                  <div><h3 className="text-xl font-black text-[#141923] tracking-tight">Controlo de Inventário</h3><p className="text-gray-500 mt-2 leading-relaxed">Contagem automática de ferramentas, EPIs e verificação de presença de móveis.</p></div>
                </div>
                <div className="flex gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                  <div className="flex-shrink-0"><div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-[#4CAF8C]/10"><Users className="h-8 w-8 text-[#4CAF8C]" /></div></div>
                  <div><h3 className="text-xl font-black text-[#141923] tracking-tight">Para Equipas e Obras</h3><p className="text-gray-500 mt-2 leading-relaxed">Sistema desenvolvido para ser usado tanto em estaleiros de obra quanto em propriedades prontas.</p></div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 py-12 px-4">
            <div className="container mx-auto max-w-6xl">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                <div>
                  <h4 className="font-black text-2xl tracking-tighter text-[#0F3460] mb-4 uppercase">VisuCheck</h4>
                  <p className="text-sm text-gray-500 font-medium">A evolução da perícia visual.</p>
                </div>
                <div>
                  <h4 className="font-black text-[#141923] mb-4 uppercase tracking-widest text-xs">Produto</h4>
                  <ul className="space-y-3 text-sm text-gray-500 font-medium">
                    <li><a href="#" className="hover:text-[#4CAF8C] transition-colors">Recursos</a></li>
                    <li><a href="#" className="hover:text-[#4CAF8C] transition-colors">Preços</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-black text-[#141923] mb-4 uppercase tracking-widest text-xs">Empresa</h4>
                  <ul className="space-y-3 text-sm text-gray-500 font-medium">
                    <li><a href="#" className="hover:text-[#4CAF8C] transition-colors">Sobre</a></li>
                    <li><a href="#" className="hover:text-[#4CAF8C] transition-colors">Contacto</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-black text-[#141923] mb-4 uppercase tracking-widest text-xs">Legal</h4>
                  <ul className="space-y-3 text-sm text-gray-500 font-medium">
                    <li><a href="#" className="hover:text-[#4CAF8C] transition-colors">Privacidade</a></li>
                    <li><a href="#" className="hover:text-[#4CAF8C] transition-colors">Termos de Uso</a></li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-8 text-center">
                <p className="text-sm font-bold text-gray-400">© 2026 VisuCheck. Todos os direitos reservados.</p>
              </div>
            </div>
          </footer>
        </main>
      )}
    </div>
  );
}