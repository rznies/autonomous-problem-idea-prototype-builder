function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function createRunId(now: Date = new Date()): string {
  const year = now.getUTCFullYear();
  const month = pad(now.getUTCMonth() + 1);
  const day = pad(now.getUTCDate());
  const hour = pad(now.getUTCHours());
  const minute = pad(now.getUTCMinutes());
  const second = pad(now.getUTCSeconds());
  const millis = String(now.getUTCMilliseconds()).padStart(3, '0');
  return `${year}${month}${day}-${hour}${minute}${second}${millis}`;
}
