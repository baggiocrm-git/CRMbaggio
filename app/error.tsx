'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101822] flex flex-col items-center justify-center p-4">
      <div className="size-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400 shadow-xl shadow-red-600/10 mb-8">
        <AlertCircle size={32} />
      </div>
      
      <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2 text-center">
        Something went wrong
      </h1>
      <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 text-center max-w-md">
        An unexpected error occurred while processing your request.
      </p>
      
      <button
        onClick={() => reset()}
        className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-slate-900/10"
      >
        <RefreshCcw size={20} />
        Try again
      </button>
    </div>
  );
}
