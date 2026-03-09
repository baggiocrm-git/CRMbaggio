'use client';

import React from 'react';
import CurrencyInput, { CurrencyInputProps } from 'react-currency-input-field';

interface CustomCurrencyInputProps extends Omit<CurrencyInputProps, 'onChange'> {
  label?: string;
  error?: string;
  onChange?: (value: string | undefined) => void;
}

export default function CustomCurrencyInput({ 
  label, 
  error, 
  onChange, 
  className = '',
  ...props 
}: CustomCurrencyInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          {label}
        </label>
      )}
      <CurrencyInput
        intlConfig={{ locale: 'pt-BR', currency: 'BRL' }}
        decimalSeparator=","
        groupSeparator="."
        onValueChange={onChange}
        className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600 transition-all ${className}`}
        {...props}
      />
      {error && (
        <span className="text-red-500 text-[10px] font-bold uppercase">
          {error}
        </span>
      )}
    </div>
  );
}
