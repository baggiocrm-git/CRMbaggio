/**
 * Handles fixed decimal input logic for currency fields.
 * Example:
 * "2" -> "0.02"
 * "25" -> "0.25"
 * "254" -> "2.54"
 */
export const handleFixedDecimalValueChange = (
  newValue: string | undefined,
  onChange: (value: string | undefined) => void
) => {
  if (newValue === undefined || newValue === '') {
    onChange(undefined);
    return;
  }

  const digits = newValue.replace(/\D/g, '');

  if (!digits) {
    onChange(undefined);
    return;
  }

  const normalizedDigits = digits.replace(/^0+(?=\d)/, '');
  const safeDigits = normalizedDigits === '' ? '0' : normalizedDigits;
  const integerPart = safeDigits.length > 2 ? safeDigits.slice(0, -2) : '0';
  const decimalPart = safeDigits.length > 2
    ? safeDigits.slice(-2)
    : safeDigits.padStart(2, '0');

  onChange(`${integerPart}.${decimalPart}`);
};

export const transformRawCurrencyValue = (rawValue: string) => rawValue.replace(/\D/g, '');
