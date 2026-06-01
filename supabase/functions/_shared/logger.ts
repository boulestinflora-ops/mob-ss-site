/**
 * Logger structuré pour les Edge Functions Supabase.
 * Les logs apparaissent dans Supabase Dashboard → Edge Functions → Logs.
 * Format JSON pour faciliter le filtrage.
 */

type Level = 'info' | 'warn' | 'error';

function log(level: Level, fn: string, message: string, data?: Record<string, unknown>) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    fn,
    message,
    ...(data ?? {}),
  };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  info:  (fn: string, msg: string, data?: Record<string, unknown>) => log('info',  fn, msg, data),
  warn:  (fn: string, msg: string, data?: Record<string, unknown>) => log('warn',  fn, msg, data),
  error: (fn: string, msg: string, data?: Record<string, unknown>) => log('error', fn, msg, data),
};
