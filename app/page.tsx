import Link from 'next/link';

export default function RootPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
      <div className="text-center">
        <h1 className="text-4xl font-black mb-4 tracking-tight">CBSL <span className="text-[#d4ff3f]">CRM</span></h1>
        <p className="text-slate-500 font-bold uppercase tracking-widest mb-8">Sistema de Gestão de Engenharia</p>
        <Link href="/login" className="bg-[#d4ff3f] hover:bg-[#c4ef2f] text-[#0a0a0a] px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-[#d4ff3f]/10">
          Entrar no Sistema
        </Link>
      </div>
    </div>
  );
}
