export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  // Remove non-digit characters
  const cleaned = phone.replace(/\D/g, "");
  
  // Brazilian phones should be either 10 or 11 digits
  // e.g., 11 98084 3514 (11 digits) or 11 4004 0000 (10 digits)
  if (cleaned.length < 10 || cleaned.length > 11) return false;
  
  // Basic validation for area code (DDD)
  const ddd = parseInt(cleaned.substring(0, 2), 10);
  if (ddd < 11 || ddd > 99) return false;

  // Validation for the first digit of the number
  if (cleaned.length === 11) {
    const firstDigit = parseInt(cleaned.charAt(2), 10);
    if (firstDigit !== 9) return false; // Mobile phones must start with 9
  }

  return true;
}

export function isValidCPF(cpf: string): boolean {
  if (!cpf) return false;
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return false;

  // Reject known invalid combinations
  if (/^(\d)\1+$/.test(cleaned)) return false;

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleaned.substring(i - 1, i), 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(9, 10), 10)) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleaned.substring(i - 1, i), 10) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(10, 11), 10)) return false;

  return true;
}

export function isValidCNPJ(cnpj: string): boolean {
  if (!cnpj) return false;
  const cleaned = cnpj.replace(/\D/g, "");
  if (cleaned.length !== 14) return false;

  // Reject known invalid combinations
  if (/^(\d)\1+$/.test(cleaned)) return false;

  let length = cleaned.length - 2;
  let numbers = cleaned.substring(0, length);
  const digits = cleaned.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0), 10)) return false;

  length = length + 1;
  numbers = cleaned.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1), 10)) return false;

  return true;
}
