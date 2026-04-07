'use client';

import React from 'react';

type OnValueChange = (
  value: string | undefined,
  name?: string | undefined,
  values?: {
    float: number | null;
    formatted: string;
    value: string;
  }
) => void;

interface CustomCurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'prefix'> {
  value?: string | number;
  onValueChange?: OnValueChange;
  prefix?: string;
  decimalSeparator?: string;
  groupSeparator?: string;
  allowDecimals?: boolean;
  disableAbbreviations?: boolean;
  decimalsLimit?: number;
  decimalScale?: number;
  fixedDecimalLength?: number;
  formatValueOnBlur?: boolean;
  transformRawValue?: (rawValue: string) => string;
}

const getDigitsFromValue = (value: string | number | undefined) => {
  if (value === undefined || value === null || value === '') return '';

  const normalized =
    typeof value === 'number'
      ? Math.round(value * 100).toString()
      : value.replace(/\D/g, '');

  return normalized.replace(/^0+(?=\d)/, '');
};

const formatDigitsToDecimal = (digits: string) => {
  if (!digits) return undefined;

  const safeDigits = digits.replace(/^0+(?=\d)/, '') || '0';
  const integerPart = safeDigits.length > 2 ? safeDigits.slice(0, -2) : '0';
  const decimalPart = safeDigits.length > 2
    ? safeDigits.slice(-2)
    : safeDigits.padStart(2, '0');

  return `${integerPart}.${decimalPart}`;
};

const formatDisplayValue = (
  digits: string,
  prefix: string,
  decimalSeparator: string,
  groupSeparator: string
) => {
  const decimalValue = formatDigitsToDecimal(digits);

  if (!decimalValue) return '';

  const [integerPart, decimalPart = '00'] = decimalValue.split('.');
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);

  return `${prefix}${groupedInteger}${decimalSeparator}${decimalPart}`;
};

export default function CurrencyInput({
  value,
  onValueChange,
  prefix = '',
  decimalSeparator = ',',
  groupSeparator = '.',
  className = '',
  onFocus,
  onBlur,
  name,
  allowDecimals: _allowDecimals,
  disableAbbreviations: _disableAbbreviations,
  decimalsLimit: _decimalsLimit,
  decimalScale: _decimalScale,
  fixedDecimalLength: _fixedDecimalLength,
  formatValueOnBlur: _formatValueOnBlur,
  transformRawValue: _transformRawValue,
  ...props
}: CustomCurrencyInputProps) {
  const digits = getDigitsFromValue(value);
  const displayValue = formatDisplayValue(digits, prefix, decimalSeparator, groupSeparator);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!onValueChange) return;

    const nextDigits = event.target.value.replace(/\D/g, '');
    const nextValue = formatDigitsToDecimal(nextDigits);

    onValueChange(nextValue, name, {
      float: nextValue ? Number(nextValue) : null,
      formatted: formatDisplayValue(nextDigits, prefix, decimalSeparator, groupSeparator),
      value: nextValue || '',
    });
  };

  return (
    <input
      {...props}
      name={name}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={displayValue}
      onChange={handleChange}
      onFocus={(event) => {
        event.target.setSelectionRange(displayValue.length, displayValue.length);
        onFocus?.(event);
      }}
      onBlur={onBlur}
      className={className}
    />
  );
}
