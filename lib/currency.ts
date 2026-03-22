/**
 * Handles fixed decimal input logic for currency fields.
 * Example: typing "123" results in "1.23"
 */
export const handleFixedDecimalValueChange = (
  newValue: string | undefined,
  onChange: (value: string | undefined) => void
) => {
  if (newValue === undefined || newValue === '') {
    onChange(undefined);
    return;
  }

  // Extract only digits
  const digits = newValue.replace(/\D/g, '');
  
  if (!digits) {
    onChange(undefined);
    return;
  }

  // Convert to number (cents)
  const cents = parseInt(digits, 10);
  const amount = cents / 100;
  
  if (isNaN(amount)) {
    onChange(undefined);
    return;
  }

  // Return formatted string with 2 decimal places
  onChange(amount.toFixed(2));
};
