type DisplayDateValue = string | Date | null | undefined;

const parseDisplayDate = (value: DisplayDateValue) => {
  if (!value) return null;

  const date =
    value instanceof Date
      ? value
      : new Date(value.includes(" ") ? value.replace(" ", "T") : value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDisplayDate = (
  value: DisplayDateValue,
  fallback = "-",
) => {
  const date = parseDisplayDate(value);
  if (!date) return typeof value === "string" ? value || fallback : fallback;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatDisplayDateTime = (
  value: DisplayDateValue,
  fallback = "-",
) => {
  const date = parseDisplayDate(value);
  if (!date) return typeof value === "string" ? value || fallback : fallback;

  return date
    .toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(/\b(am|pm)\b/g, (period) => period.toUpperCase());
};
