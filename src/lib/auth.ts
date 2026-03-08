import { ChildSession } from '../types';

const CHILD_SESSION_KEY = 'child_session';

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function setChildSession(session: ChildSession): void {
  sessionStorage.setItem(CHILD_SESSION_KEY, JSON.stringify(session));
}

export function getChildSession(): ChildSession | null {
  const raw = sessionStorage.getItem(CHILD_SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearChildSession(): void {
  sessionStorage.removeItem(CHILD_SESSION_KEY);
}
