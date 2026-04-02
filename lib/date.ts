const IST_TIMEZONE = process.env.NEXT_PUBLIC_APP_TIMEZONE || "Asia/Kolkata";

export const formatDateInputIST = (date: Date) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
};

export const formatDateDisplayIST = (date: Date) => {
  const formatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return formatter.format(date);
};
