import React, { useState, useEffect } from 'react';
import { 
  Camera, Home, Plus, LayoutGrid, Upload, MapPin,
  CheckCircle2, ArrowLeft, Zap, ImagePlus, 
  Trash2, Edit, FileText, Loader2, XCircle, Info, ChevronRight, ClipboardCheck, History
} from "lucide-react";
import { supabase } from './supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export default function Dashboard({ session }: { session: any }) {
  const [activeView, setActiveView] = useState('painel');
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [historicoLaudos, setHistoricoLaudos] = useState<any[]>([]);
  const [loadingDados, setLoadingDados] = useState(true);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeImovel, setNomeImovel] = useState('');
  const [endereco, setEndereco] = useState({ rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' });
  const [comodosCadastro, setComodosCadastro] = useState<any[]>([{ id: '1', nome: '', fotos: { a1: null, a2: null, a3: null, a4: null } }]);
  const [imovelSelecionadoId, setImovelSelecionadoId] = useState('');
  const [comodoAtivoVistoria, setComodoAtivoVistoria] = useState(0);
  const [fotosVistoria, setFotosVistoria] = useState<any>({}); 
  const [uploading, setUploading] = useState(false);
  const [analisandoIA, setAnalisandoIA] = useState(false);
  const [laudoJSON, setLaudoJSON] = useState<any>(null);

  const angulos = [
    { id: 'a1', nome: 'Frente', desc: 'Entrada' }, 
    { id: 'a2', nome: 'Costas', desc: 'Fundo' }, 
    { id: 'a3', nome: 'Dir.', desc: 'Direita' }, 
    { id: 'a4', nome: 'Esq.', desc: 'Esquerda' }
  ];

  useEffect(() => { if (session) buscarImoveis(); }, [session]);

  async function buscarImoveis() {
    try {
      setLoadingDados(true);
      const { data, error } = await supabase.from('imoveis').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setImoveis(data.map((item: any) => ({ 
        id: item.id, 
        nome: item.nome, 
        endereco: typeof item.endereco === 'string' ? JSON.parse(item.endereco || '{}') : item.endereco, 
        comodos: item.dados_comodos 
      })));
    } catch (error: any) { console.error(error); } finally { setLoadingDados(false); }
  }

  async function buscarHistorico(imovelId: string) {
    const { data } = await supabase.from('laudos').select('*').eq('imovel_id', imovelId).order('created_at', { ascending: false });
    if (data) setHistoricoLaudos(data);
  }

  const handleUpload = async (file: File, callback: (url: string) => void) => {
    try {
      setUploading(true);
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `uploads/${session.user.id}/${fileName}`;
      const { error } = await supabase.storage.from('property-images').upload(filePath, file);
      if (error) throw error;
      const { data } = supabase.storage.from('property-images').getPublicUrl(filePath);
      callback(data.publicUrl);
    } catch (error: any) { alert(error.message); } finally { setUploading(false); }
  };

  const salvarImovel = async () => {
    if (!nomeImovel || !endereco.rua) return alert("Preencha os campos obrigatórios.");
    try {
      setUploading(true);
      const payload = { user_id: session.user.id, nome: nomeImovel, endereco: endereco, dados_comodos: comodosCadastro };
      if (editandoId) await supabase.from('imoveis').update(payload).eq('id', editandoId);
      else await supabase.from('imoveis').insert([payload]);
      await buscarImoveis();
      setActiveView('painel');
    } catch (error: any) { alert(error.message); } finally { setUploading(false); }
  };

  const gerarLaudoIA = async (imovelAtual: any, comodoAtual: any) => {
    if (!apiKey) return alert("API Key não encontrada.");
    try {
      setAnalisandoIA(true);
      setActiveView('laudo');
      const model = genAI.getGenerativeModel({ 
        model: "gemini-3-flash-preview", 
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" } 
      });

      const urlToPart = async (url: string) => {
        const resp = await fetch(url);
        const blob = await resp.blob();
        return new Promise((res) => {
          const r = new FileReader();
          r.onloadend = () => res({ inlineData: { data: (r.result as string).split(',')[1], mimeType: blob.type } });
          r.readAsDataURL(blob);
        });
      };
      
      let contents: any[] = [
        "ATUE COMO UM PERITO DE SEGURANÇA DO TRABALHO EM VISTORIA TÉCNICA.",
        "MÉTODO DE VARREDURA OBRIGATÓRIO:",
        "1. Identifique todos os objetos na foto 'REFERÊNCIA'.",
        "2. Foque especificamente em EPIs e itens de valor: CAPACETES, RÁDIOS, FERRAMENTAS.",
        "3. Compare com a foto 'VISTORIA ATUAL'. Se um CAPACETE estava na bancada/mesa e sumiu, reporte como FALTANTE.",
        "4. Analise contrastes: um objeto escuro (como um capacete ou garrafa) sobre uma mesa clara deve ser detectado.",
        "5. Não aceite ausência de itens como 'reorganização'. Se sumiu da visão, é falta."
      ];

      for (const a of angulos) {
        if (comodoAtual.fotos[a.id] && fotosVistoria[comodoAtual.id]?.[a.id]) {
          contents.push(`Ângulo ${a.nome} - REFERÊNCIA:`, await urlToPart(comodoAtual.fotos[a.id]));
          contents.push(`Ângulo ${a.nome} - VISTORIA ATUAL:`, await urlToPart(fotosVistoria[comodoAtual.id][a.id]));
        }
      }

      contents.push('Responda JSON: {"resumo": "...", "divergencias": [{"item": "...", "status": "faltante|danificado", "angulo": "...", "nota": "..."}], "conformidades": ["..."]}');
      
      const result = await model.generateContent(contents);
      const jsonFinal = JSON.parse(result.response.text());
      setLaudoJSON(jsonFinal);

      const { error: saveError } = await supabase.from('laudos').insert([{
        imovel_id: imovelAtual.id,
        user_id: session.user.id,
        comodo_nome: comodoAtual.nome,
        dados_laudo: jsonFinal
      }]);

      if (saveError) alert("Erro ao salvar no histórico: " + saveError.message);

    } catch (e: any) { alert("Erro: " + e.message); setActiveView('vistoria'); } finally { setAnalisandoIA(false); }
  };

  const formatEndereco = (e: any) => e?.rua ? `${e.rua}, ${e.numero} - ${e.cidade}/${e.estado}` : "Endereço por preencher";

  if (loadingDados) return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="animate-spin text-[#0F3460]" size={40} /></div>;

  if (activeView === 'painel') return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-black text-[#0F3460] tracking-tighter uppercase">VisuCheck</h1>
          <p className="text-gray-500 font-medium">Perícia visual inteligente para engenharia e imóveis.</p>
        </div>
        <button onClick={() => { setEditandoId(null); setNomeImovel(''); setEndereco({ rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' }); setComodosCadastro([{ id: '1', nome: '', fotos: { a1: null, a2: null, a3: null, a4: null } }]); setActiveView('cadastro'); }} className="bg-[#0F3460] text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-xl hover:bg-blue-900 transition-all active:scale-95">
          <Plus size={20}/> Novo Imóvel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {imoveis.map(i => (
          <div key={i.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all overflow-hidden flex flex-col group">
            <div className="h-56 bg-gray-100 relative overflow-hidden">
               {i.comodos[0]?.fotos.a1 ? <img src={i.comodos[0].fotos.a1} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/> : <div className="w-full h-full flex items-center justify-center text-gray-200"><Home size={60}/></div>}
               <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={() => { setEditandoId(i.id); setNomeImovel(i.nome); setEndereco(i.endereco); setComodosCadastro(i.comodos); setActiveView('cadastro'); }} className="p-3 bg-white/90 backdrop-blur rounded-xl text-blue-600 shadow-lg hover:bg-white"><Edit size={18}/></button>
                  <button onClick={async () => { if(confirm("Deseja excluir este imóvel?")) { await supabase.from('imoveis').delete().eq('id', i.id); buscarImoveis(); } }} className="p-3 bg-white/90 backdrop-blur rounded-xl text-red-600 shadow-lg hover:bg-white"><Trash2 size={18}/></button>
               </div>
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <h3 className="text-2xl font-black text-[#0F3460] mb-2">{i.nome}</h3>
              <p className="text-xs text-gray-400 flex items-start gap-2 mb-8 flex-1 leading-relaxed"><MapPin size={16} className="mt-1 flex-shrink-0"/> {formatEndereco(i.endereco)}</p>
              <button 
                onClick={() => { setImovelSelecionadoId(i.id); setComodoAtivoVistoria(0); setFotosVistoria({}); buscarHistorico(i.id); setActiveView('vistoria'); }}
                className="w-full py-4 bg-gray-50 text-[#0F3460] rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#4CAF8C] hover:text-white transition-all shadow-inner"
              >
                Auditar Checkout <ChevronRight size={18}/>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (activeView === 'cadastro') return (
    <div className="max-w-4xl mx-auto px-4 py-10 text-[#0F3460]">
      <div className="flex items-center gap-6 mb-10">
        <button onClick={() => setActiveView('painel')} className="p-3 bg-white border shadow-sm rounded-full hover:bg-gray-50"><ArrowLeft size={24}/></button>
        <h1 className="text-3xl font-black tracking-tight">{editandoId ? 'Editar Propriedade' : 'Nova Propriedade'}</h1>
      </div>
      <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl mb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Identificação</label>
            <input value={nomeImovel} onChange={e => setNomeImovel(e.target.value)} className="w-full border-b-4 border-gray-50 outline-none font-black text-3xl text-[#0F3460] focus:border-[#4CAF8C] pb-4 transition-all" placeholder="Ex: Galpão A"/>
          </div>
          <div className="md:col-span-3"><label className="text-[10px] font-black text-gray-400 uppercase mt-4 block">Endereço</label><input value={endereco.rua} onChange={e => setEndereco({...endereco, rua: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl text-sm mt-1 outline-none" placeholder="Rua..."/></div>
          <div><label className="text-[10px] font-black text-gray-400 uppercase mt-4 block">Nº</label><input value={endereco.numero} onChange={e => setEndereco({...endereco, numero: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl text-sm mt-1 text-center"/></div>
        </div>
      </div>
      <div className="space-y-6">
        {comodosCadastro.map(c => (
          <div key={c.id} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="flex justify-between mb-8 items-center border-b pb-4"><input value={c.nome} onChange={e => setComodosCadastro(comodosCadastro.map(i => i.id === c.id ? {...i, nome: e.target.value} : i))} className="font-black text-xl outline-none" placeholder="Cômodo"/><button onClick={() => setComodosCadastro(comodosCadastro.filter(i => i.id !== c.id))} className="text-red-300 hover:text-red-500"><Trash2 size={24}/></button></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {angulos.map(a => (<div key={a.id} className="bg-gray-50 border-2 border-dashed rounded-3xl h-32 flex flex-col items-center justify-center relative overflow-hidden group hover:border-[#4CAF8C] transition-all">{c.fotos[a.id] ? <img src={c.fotos[a.id]} className="w-full h-full object-cover"/> : <><Upload size={20} className="text-gray-300 mb-1"/><span className="text-[9px] font-black text-gray-400 uppercase">{a.nome}</span></>}<input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files && handleUpload(e.target.files[0], url => setComodosCadastro(comodosCadastro.map(i => i.id === c.id ? {...i, fotos: {...i.fotos, [a.id]: url}} : i)))}/></div>))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-12 flex justify-between items-center"><button onClick={() => setComodosCadastro([...comodosCadastro, { id: Date.now().toString(), nome: '', fotos: { a1: null, a2: null, a3: null, a4: null } }])} className="font-black text-xs uppercase tracking-widest">+ Adicionar Ambiente</button><button onClick={salvarImovel} disabled={uploading} className="bg-[#4CAF8C] text-white px-14 py-5 rounded-[2rem] font-black shadow-2xl hover:bg-emerald-600 transition-all uppercase tracking-widest">{uploading ? "Sincronizando..." : "Salvar"}</button></div>
    </div>
  );

  if (activeView === 'vistoria') {
    const imovel = imoveis.find(i => i.id === imovelSelecionadoId);
    const comodo = imovel.comodos[comodoAtivoVistoria];
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-6 mb-10"><button onClick={() => setActiveView('painel')} className="p-3 bg-white shadow rounded-full hover:bg-gray-100"><ArrowLeft size={24}/></button><div><h1 className="text-3xl font-black text-[#0F3460] tracking-tighter">{imovel.nome}</h1><p className="text-sm text-gray-400">Auditoria Digital em Andamento</p></div></div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-2">
             <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Ambientes</h3>
             {imovel.comodos.map((c: any, idx: number) => (<button key={c.id} onClick={() => setComodoAtivoVistoria(idx)} className={`w-full text-left px-6 py-4 rounded-2xl font-bold transition-all ${comodoAtivoVistoria === idx ? 'bg-[#0F3460] text-white shadow-lg' : 'bg-white border text-gray-500 hover:bg-gray-50'}`}>{c.nome}</button>))}
             <div className="mt-10 pt-10 border-t">
               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><History size={14}/> Histórico de Laudos</h3>
               <div className="space-y-3">
                 {historicoLaudos.map((l, idx) => (<button key={idx} onClick={() => { setLaudoJSON(l.dados_laudo); setActiveView('laudo'); }} className="w-full text-left p-3 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition"><p className="text-[10px] font-bold text-blue-600">{new Date(l.created_at).toLocaleDateString()}</p><p className="text-xs font-black text-[#0F3460] truncate">{l.comodo_nome}</p></button>))}
               </div>
             </div>
          </div>
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="bg-gray-50 p-8 rounded-[3rem] border border-gray-100"><h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 text-center">Referência (Cadastro)</h3><div className="grid grid-cols-2 gap-4">{angulos.map(a => (<div key={a.id} className="h-48 bg-gray-200 rounded-[2rem] relative overflow-hidden border-4 border-white shadow-inner">{comodo.fotos[a.id] ? <img src={comodo.fotos[a.id]} className="w-full h-full object-cover opacity-60"/> : <div className="h-full flex items-center justify-center text-[10px] text-gray-400">N/A</div>}<div className="absolute bottom-0 w-full bg-black/40 backdrop-blur-sm text-white text-[9px] text-center font-black py-3 uppercase tracking-widest">{a.nome}</div></div>))}</div></div>
              <div className="bg-white p-8 rounded-[3rem] border-4 border-blue-50 shadow-xl shadow-blue-50/50"><h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-8 text-center">Checkout Atual</h3><div className="grid grid-cols-2 gap-4">{angulos.map(a => (<div key={a.id} className="h-48 border-4 border-dashed border-blue-100 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group hover:border-blue-500 transition-all">{fotosVistoria[comodo.id]?.[a.id] ? <img src={fotosVistoria[comodo.id][a.id]} className="w-full h-full object-cover"/> : <ImagePlus className="text-blue-200" size={40}/>}<input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => e.target.files && handleUpload(e.target.files[0], url => setFotosVistoria({...fotosVistoria, [comodo.id]: {...(fotosVistoria[comodo.id] || {}), [a.id]: url}}))}/><div className="absolute bottom-0 w-full bg-blue-600 text-white text-[9px] text-center font-black py-3 uppercase tracking-widest">{a.nome}</div></div>))}</div></div>
            </div>
            <div className="mt-16 flex justify-end"><button onClick={() => gerarLaudoIA(imovel, comodo)} className="bg-[#0F3460] text-white px-12 py-6 rounded-[2.5rem] font-black shadow-2xl flex items-center gap-4 hover:bg-blue-900 transition-all uppercase tracking-widest text-sm"><Zap size={24} className="fill-white"/> Processar Auditoria Digital</button></div>
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'laudo') {
    const imovel = imoveis.find(i => i.id === imovelSelecionadoId);
    return (
      <div className="max-w-6xl mx-auto py-12 px-4">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .print-hidden { display: none !important; }
            .laudo-container { border: none !important; box-shadow: none !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
            .header-print { background-color: #0F3460 !important; -webkit-print-color-adjust: exact !important; padding: 40px !important; color: white !important; }
            .header-print h1, .header-print p, .header-print span { color: white !important; }
            .card-pericia { break-inside: avoid !important; page-break-inside: avoid !important; margin-bottom: 30px !important; border: 1px solid #eee !important; border-radius: 20px !important; }
            @page { margin: 1cm; }
          }
        `}} />

        {analisandoIA ? (
          <div className="text-center p-24 bg-white rounded-[4rem] shadow-2xl flex flex-col items-center border border-gray-100"><Loader2 className="animate-spin text-[#0F3460] mb-6" size={80}/><h2 className="text-3xl font-black text-[#0F3460] uppercase tracking-tight">VisuCheck: Escaneando...</h2></div>
        ) : (
          <div className="laudo-container bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-gray-100 print:rounded-none">
            <div className="header-print bg-[#0F3460] p-16 text-white relative">
              <div className="absolute top-0 right-0 p-16 opacity-5 print-hidden"><ClipboardCheck size={200} /></div>
              <div className="relative z-10">
                <h1 className="text-5xl font-black uppercase tracking-tight text-white mb-2 leading-none">Relatório de Perícia Visual</h1>
                <p className="text-[#4CAF8C] font-black text-xl tracking-[0.3em] uppercase mb-12">VisuCheck • Auditoria Inteligente</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div><p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Propriedade</p><p className="text-3xl font-bold text-white leading-tight">{imovel.nome}</p><p className="text-blue-100 flex items-center gap-2 mt-2 font-medium text-sm"><MapPin size={16}/> {formatEndereco(imovel.endereco)}</p></div>
                   <div className="md:text-right flex flex-col justify-end"><p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Data de Emissão</p><p className="font-bold text-xl text-white">{new Date().toLocaleString('pt-BR')}</p></div>
                </div>
              </div>
            </div>

            <div className="p-16 print:p-8">
              <div className="bg-blue-50 p-10 rounded-[3rem] mb-16 border border-blue-100 shadow-inner"><p className="text-[#0F3460] text-2xl font-black italic leading-tight">"{laudoJSON?.resumo}"</p></div>
              <h3 className="text-red-500 font-black mb-8 flex items-center gap-3 text-2xl uppercase tracking-tighter"><XCircle size={32}/> Inconformidades Detectadas</h3>
              <div className="space-y-12">
                {laudoJSON?.divergencias.map((div: any, idx: number) => {
                   const angulo = angulos.find(a => a.nome === div.angulo);
                   const fA = imovel.comodos[comodoAtivoVistoria].fotos[angulo?.id || 'a1'];
                   const fD = fotosVistoria[imovel.comodos[comodoAtivoVistoria].id]?.[angulo?.id || 'a1'];
                   return (
                    <div key={idx} className="card-pericia bg-white border-2 border-gray-50 rounded-[3rem] p-10 shadow-sm">
                      <div className="flex justify-between items-center mb-8"><h4 className="text-3xl font-black text-[#0F3460] tracking-tight">{div.item}</h4><span className="bg-red-600 text-white text-[10px] px-5 py-2 rounded-full font-black uppercase tracking-widest shadow-xl shadow-red-200">{div.status}</span></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 h-72 mb-8 print:h-64">
                         <div className="rounded-[2.5rem] overflow-hidden relative shadow-2xl border-4 border-white"><img src={fA} className="w-full h-full object-cover opacity-90"/><div className="absolute top-6 left-6 bg-black/70 text-white text-[10px] px-4 py-2 rounded-full font-black uppercase tracking-widest">Antes</div></div>
                         <div className="rounded-[2.5rem] overflow-hidden relative border-4 border-red-100 shadow-2xl">
                            {fD ? <img src={fD} className="w-full h-full object-cover"/> : <div className="h-full bg-red-50 flex flex-col items-center justify-center text-red-300 font-black uppercase tracking-widest text-xs"><XCircle size={48} className="mb-2"/> Não Localizado</div>}
                            <div className="absolute top-6 right-6 bg-red-600 text-white text-[10px] px-4 py-2 rounded-full font-black uppercase tracking-widest">Depois</div>
                         </div>
                      </div>
                      <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100"><p className="text-[#0F3460] font-bold text-xl leading-relaxed">"{div.nota}"</p></div>
                    </div>
                   );
                })}
              </div>

              <div className="mt-24 bg-emerald-50/50 p-16 rounded-[4rem] border border-emerald-100 shadow-inner">
                 <h3 className="text-3xl font-black text-emerald-900 uppercase tracking-tighter mb-10 flex items-center gap-4"><CheckCircle2 size={40}/> Itens em Conformidade</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {laudoJSON?.conformidades.map((item: string, idx: number) => (<div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm border border-emerald-100 flex items-center gap-4 text-emerald-800 font-black text-sm uppercase tracking-tight"><CheckCircle2 size={24} className="text-emerald-500 flex-shrink-0"/> {item}</div>))}
                 </div>
              </div>

              <div className="mt-32 grid grid-cols-1 md:grid-cols-2 gap-24 border-t border-gray-100 pt-20 card-pericia">
                 <div className="text-center"><div className="border-b-4 border-gray-100 mb-6 h-16"></div><p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Inspetor Técnico</p></div>
                 <div className="text-center"><div className="border-b-4 border-gray-100 mb-6 h-16"></div><p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Locatário / Ocupante</p></div>
              </div>

              <div className="mt-20 flex justify-end gap-5 print-hidden">
                <button onClick={() => { setActiveView('vistoria'); buscarHistorico(imovel.id); }} className="border-4 border-gray-50 px-10 py-5 rounded-[2rem] font-black text-gray-400 hover:bg-gray-50 transition-all uppercase tracking-widest text-xs">Voltar</button>
                <button onClick={() => window.print()} className="bg-[#4CAF8C] text-white px-14 py-5 rounded-[2rem] font-black shadow-2xl hover:bg-emerald-600 transition-all flex items-center gap-3 uppercase tracking-widest text-xs"><FileText size={20}/> Gerar PDF Final</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}