import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#101822] text-white p-4">
      <h1 className="text-6xl font-black mb-4 text-blue-500">404</h1>
      <h2 className="text-2xl font-bold mb-4">Página não encontrada</h2>
      <p className="text-slate-400 mb-8 max-w-md text-center">
        A página que você está procurando não existe ou foi movida.
      </p>
      <Link
        href="/"
        className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg font-semibold transition-all"
      >
        Voltar para o Início
      </Link>
    </div>
  );
}
