'use client';

import React from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#101822] text-white p-4">
      <h2 className="text-2xl font-bold mb-4">Algo deu errado!</h2>
      <p className="text-slate-400 mb-8 max-w-md text-center">
        Ocorreu um erro inesperado no sistema. Por favor, tente novamente.
      </p>
      <button
        onClick={() => reset()}
        className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg font-semibold transition-all"
      >
        Tentar novamente
      </button>
    </div>
  );
}
