import { createClient } from '@supabase/supabase-js';
import { Child, ActivityCategory, Activity, ChildActivity, DayPoints } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth
export const signUp = (email: string, password: string) =>
  supabase.auth.signUp({ email, password });
export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });
export const signOut = () => supabase.auth.signOut();
export const getSession = () => supabase.auth.getSession();
export const resetPassword = (email: string, redirectTo: string) =>
  supabase.auth.resetPasswordForEmail(email, { redirectTo });
export const updatePassword = (password: string) =>
  supabase.auth.updateUser({ password });

// Categories
export async function getCategories(): Promise<ActivityCategory[]> {
  const { data } = await supabase
    .from('activity_categories')
    .select('*')
    .order('sort_order');
  return data ?? [];
}

// Activities
export async function getActivities(categoryId?: string): Promise<Activity[]> {
  let q = supabase.from('activities').select('*, activity_categories(*)').order('sort_order');
  if (categoryId) q = q.eq('category_id', categoryId);
  const { data } = await q;
  return (data ?? []) as Activity[];
}

// Children
export async function getChildren(parentId: string): Promise<Child[]> {
  const { data } = await supabase
    .from('children')
    .select('*')
    .eq('parent_id', parentId)
    .order('created_at');
  return data ?? [];
}

export async function createChild(child: Omit<Child, 'id' | 'created_at'>): Promise<Child | null> {
  const { data } = await supabase.from('children').insert(child).select().single();
  return data;
}

export async function updateChild(id: string, updates: Partial<Child>): Promise<Child | null> {
  const { data } = await supabase.from('children').update(updates).eq('id', id).select().single();
  return data;
}

// Find children for access page (returns minimal info)
export async function findChildrenForAccess(): Promise<{ id: string; name: string; avatar_color: string }[]> {
  const { data } = await supabase.from('children').select('id, name, avatar_color').order('created_at');
  return data ?? [];
}

// Verify child access
export async function verifyChildAccess(childId: string, birthdate: string, pinHash: string): Promise<Child | null> {
  const { data } = await supabase
    .from('children')
    .select('*')
    .eq('id', childId)
    .eq('birthdate', birthdate)
    .eq('pin_hash', pinHash)
    .single();
  return data;
}

// Child activities (assigned activities)
export async function getChildActivities(childId: string): Promise<ChildActivity[]> {
  const { data } = await supabase
    .from('child_activities')
    .select('*, activities(*, activity_categories(*))')
    .eq('child_id', childId)
    .eq('is_active', true);
  return (data ?? []) as ChildActivity[];
}

export async function getAllChildActivities(childId: string): Promise<ChildActivity[]> {
  const { data } = await supabase
    .from('child_activities')
    .select('*, activities(*, activity_categories(*))')
    .eq('child_id', childId);
  return (data ?? []) as ChildActivity[];
}

export async function toggleChildActivity(childId: string, activityId: string, isActive: boolean): Promise<void> {
  await supabase
    .from('child_activities')
    .upsert({ child_id: childId, activity_id: activityId, is_active: isActive }, { onConflict: 'child_id,activity_id' });
}

// Activity logs
export async function logActivity(childId: string, activityId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  await supabase.from('activity_logs').upsert(
    { child_id: childId, activity_id: activityId, completed_date: today },
    { onConflict: 'child_id,activity_id,completed_date' }
  );
}

export async function unlogActivity(childId: string, activityId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  await supabase.from('activity_logs')
    .delete()
    .eq('child_id', childId)
    .eq('activity_id', activityId)
    .eq('completed_date', today);
}

export async function getTodayLogs(childId: string): Promise<string[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('activity_logs')
    .select('activity_id')
    .eq('child_id', childId)
    .eq('completed_date', today);
  return (data ?? []).map(d => d.activity_id);
}

export async function getWeeklyPoints(childId: string): Promise<DayPoints[]> {
  const days: DayPoints[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const { data } = await supabase
      .from('activity_logs')
      .select('activities(points)')
      .eq('child_id', childId)
      .eq('completed_date', dateStr);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pts = ((data ?? []) as any[]).reduce((sum: number, row: any) => sum + (row.activities?.points ?? 0), 0);
    days.push({ date: dateStr, points: pts });
  }
  return days;
}

export async function getTotalPoints(childId: string): Promise<number> {
  const { data } = await supabase
    .from('activity_logs')
    .select('activities(points)')
    .eq('child_id', childId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).reduce((sum: number, row: any) => sum + (row.activities?.points ?? 0), 0);
}

export async function getCurrentStreak(childId: string): Promise<number> {
  let streak = 0;
  const d = new Date();
  // Check today first; if today has no completions, start from yesterday
  const todayStr = d.toISOString().split('T')[0];
  const { data: todayData } = await supabase
    .from('activity_logs')
    .select('id')
    .eq('child_id', childId)
    .eq('completed_date', todayStr)
    .limit(1);

  if (!todayData || todayData.length === 0) {
    d.setDate(d.getDate() - 1);
  }

  for (let i = 0; i < 365; i++) {
    const dateStr = d.toISOString().split('T')[0];
    const { data } = await supabase
      .from('activity_logs')
      .select('id')
      .eq('child_id', childId)
      .eq('completed_date', dateStr)
      .limit(1);
    if (data && data.length > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
