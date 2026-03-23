export const normalizePhoneDigits = (value?: string | null) => {
  if (!value) return "";
  return value.replace(/\D/g, "");
};

export const formatPhone = (value?: string | null) => {
  const digits = normalizePhoneDigits(value);
  if (!digits) return "-";
  return digits.replace(/\d{5}(?=\d)/g, "$& ");
};

export const formatPhoneInput = (value?: string | null) => {
  const digits = normalizePhoneDigits(value);
  if (!digits) return "";
  return digits.replace(/\d{5}(?=\d)/g, "$& ");
};
