import Link from 'next/link';
import { HardHat, ChevronLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101822] flex flex-col items-center justify-center p-4">
      <div className="size-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20 mb-8">
        <HardHat size={32} />
      </div>
      
      <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">404</h1>
      <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 text-center max-w-md">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      
      <Link 
        href="/dashboard"
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20"
      >
        <ChevronLeft size={20} />
        Back to Dashboard
      </Link>
    </div>
  );
}
