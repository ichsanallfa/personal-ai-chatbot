export const getCurrentTimeInfo = (date = new Date()) => {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
};

export const getWibDate = (date = new Date()) => {
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
};
