import Link from 'next/link';

export default function RootPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#101822] text-white">
      <div className="text-center">
        <h1 className="text-4xl font-black mb-4">CBSL CRM</h1>
        <p className="text-slate-400 mb-8">Sistema de Gestão de Engenharia</p>
        <Link href="/login" className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold transition-all">
          Entrar no Sistema
        </Link>
      </div>
    </div>
  );
}
