import { useState, useEffect, useCallback } from 'react';
import { useAuth, navigate } from '../App';
import {
  getChildren, createChild, updateChild,
  getActivities, getChildActivities, getAllChildActivities, toggleChildActivity,
  getTotalPoints, getCurrentStreak, getWeeklyPoints, getActivityLogsForRange, signOut
} from '../lib/supabase';
import { hashPin } from '../lib/auth';
import type { Child, Activity, ChildActivity, DayPoints } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { GeminiIcon } from '@/components/GeminiIcon';
import { ICON_KEYS } from '@/lib/gemini';

const AVATAR_COLORS = [
  '#6c5ce7', '#fd7043', '#00b894', '#0984e3', '#e84393',
  '#fdcb6e', '#00cec9', '#e17055', '#a29bfe', '#55efc4'
];

interface ChildStats {
  totalPoints: number;
  streak: number;
  weeklyData: DayPoints[];
}

export function ParentDashboard() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [childStats, setChildStats] = useState<Record<string, ChildStats>>({});
  const [loading, setLoading] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);
  const [manageChildId, setManageChildId] = useState<string | null>(null);
  const [changePinChildId, setChangePinChildId] = useState<string | null>(null);

  const loadChildren = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const kids = await getChildren(user.id);
    setChildren(kids);
    setLoading(false);

    for (const kid of kids) {
      const [total, streak, weekly] = await Promise.all([
        getTotalPoints(kid.id),
        getCurrentStreak(kid.id),
        getWeeklyPoints(kid.id),
      ]);
      setChildStats(prev => ({
        ...prev,
        [kid.id]: { totalPoints: total, streak, weeklyData: weekly }
      }));
    }
  }, [user]);

  useEffect(() => { loadChildren(); }, [loadChildren]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const stats = (childId: string): ChildStats =>
    childStats[childId] ?? { totalPoints: 0, streak: 0, weeklyData: [] };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <GeminiIcon iconKey={ICON_KEYS.APP_LOGO} size={36} />
          <span className="text-xl font-black text-primary">KidQuest</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground hidden sm:block">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>Sign Out</Button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-foreground">Parent Dashboard</h1>
            <p className="text-muted-foreground font-semibold mt-1">Manage your children's quests and track their progress</p>
          </div>
          {children.length < 2 && (
            <Button onClick={() => setShowAddChild(true)} className="gap-2">
              <GeminiIcon iconKey={ICON_KEYS.ADD_CHILD} size={20} className="rounded-md" />
              Add Child
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 rounded-full shimmer-bg" />
            <p className="text-muted-foreground font-bold">Loading your children...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {children.map(child => (
              <ChildCard
                key={child.id}
                child={child}
                stats={stats(child.id)}
                onManage={() => setManageChildId(child.id)}
                onChangePin={() => setChangePinChildId(child.id)}
              />
            ))}

            {children.length === 0 && (
              <div
                className="col-span-full border-2 border-dashed border-border rounded-2xl p-12 flex flex-col items-center gap-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                onClick={() => setShowAddChild(true)}
              >
                <GeminiIcon iconKey={ICON_KEYS.ADD_CHILD} size={64} className="rounded-2xl" />
                <p className="text-muted-foreground font-bold text-center">Add your first child to get started!</p>
                <Button onClick={() => setShowAddChild(true)}>Add Child</Button>
              </div>
            )}

            {children.length === 1 && (
              <div
                className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                onClick={() => setShowAddChild(true)}
              >
                <GeminiIcon iconKey={ICON_KEYS.ADD_CHILD} size={48} className="rounded-xl" />
                <p className="text-muted-foreground font-bold text-sm">Add another child</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Child Dialog */}
      <Dialog open={showAddChild} onOpenChange={setShowAddChild}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add a Child</DialogTitle>
            <DialogDescription>Set up a profile for your child to start their quests!</DialogDescription>
          </DialogHeader>
          <AddChildForm
            parentId={user!.id}
            onClose={() => setShowAddChild(false)}
            onSaved={() => { setShowAddChild(false); loadChildren(); }}
          />
        </DialogContent>
      </Dialog>

      {/* Manage Activities Dialog */}
      {manageChildId && (
        <Dialog open={!!manageChildId} onOpenChange={() => setManageChildId(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Manage Activities</DialogTitle>
              <DialogDescription>
                Choose which activities {children.find(c => c.id === manageChildId)?.name} should complete daily
              </DialogDescription>
            </DialogHeader>
            <ManageActivitiesContent
              child={children.find(c => c.id === manageChildId)!}
              onClose={() => setManageChildId(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Change PIN Dialog */}
      {changePinChildId && (
        <Dialog open={!!changePinChildId} onOpenChange={() => setChangePinChildId(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Change PIN for {children.find(c => c.id === changePinChildId)?.name}</DialogTitle>
              <DialogDescription>Enter a new 4-digit PIN</DialogDescription>
            </DialogHeader>
            <ChangePinForm
              child={children.find(c => c.id === changePinChildId)!}
              onClose={() => setChangePinChildId(null)}
              onSaved={() => { setChangePinChildId(null); loadChildren(); }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ── Child Card ─────────────────────────────────────────────

interface ChildCardProps {
  child: Child;
  stats: ChildStats;
  onManage: () => void;
  onChangePin: () => void;
}

function ChildCard({ child, stats, onManage, onChangePin }: ChildCardProps) {
  const initials = child.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const maxPoints = Math.max(...stats.weeklyData.map(d => d.points), 1);
  const BAR_MAX_PX = 48;

  // Last 7 days date strings
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const today = last7[6];
  const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Activity completion data
  const [activities, setActivities] = useState<import('../types').ChildActivity[]>([]);
  const [logMap, setLogMap] = useState<Record<string, Set<string>>>({});

  useEffect(() => {
    const load = async () => {
      const [acts, logs] = await Promise.all([
        getChildActivities(child.id),
        getActivityLogsForRange(child.id, last7[0], last7[6]),
      ]);
      setActivities(acts);
      const map: Record<string, Set<string>> = {};
      for (const log of logs) {
        if (!map[log.completed_date]) map[log.completed_date] = new Set();
        map[log.completed_date].add(log.activity_id);
      }
      setLogMap(map);
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [child.id]);

  const streakVariant = stats.streak >= 7 ? 'warning' : stats.streak >= 3 ? 'secondary' : 'default';

  return (
    <Card className="overflow-hidden">
      {/* Banner */}
      <div
        className="h-16 flex items-end px-6 pb-0 relative"
        style={{ background: `linear-gradient(135deg, ${child.avatar_color}, ${child.avatar_color}aa)` }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-xl border-4 border-white shadow-lg translate-y-7 flex-shrink-0"
          style={{ background: child.avatar_color }}
        >
          {initials}
        </div>
      </div>

      <CardContent className="pt-10 pb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-black">{child.name}</h3>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="default" className="gap-1.5">
            <GeminiIcon iconKey={ICON_KEYS.POINTS_STAR} size={14} className="rounded-sm" />
            {stats.totalPoints} pts
          </Badge>
          <Badge variant={streakVariant} className="gap-1.5">
            <GeminiIcon iconKey={ICON_KEYS.STREAK_FIRE} size={14} className="rounded-sm" />
            {stats.streak} day streak
          </Badge>
        </div>

        {/* Bar chart — fixed pixel heights */}
        {stats.weeklyData.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-bold text-muted-foreground mb-2">Points — Last 7 Days</p>
            <div className="flex items-end gap-1" style={{ height: `${BAR_MAX_PX + 20}px` }}>
              {stats.weeklyData.map(day => {
                const isToday = day.date === today;
                const barPx = day.points === 0 ? 3 : Math.max(6, (day.points / maxPoints) * BAR_MAX_PX);
                const d = new Date(day.date + 'T12:00:00');
                const label = DAY_LABELS[d.getDay()];
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5" style={{ justifyContent: 'flex-end' }}>
                    {day.points > 0 && (
                      <span className="text-[9px] font-black" style={{ color: isToday ? '#fd7043' : child.avatar_color }}>
                        {day.points}
                      </span>
                    )}
                    <div
                      className="w-full rounded-sm transition-all"
                      style={{
                        height: `${barPx}px`,
                        background: isToday ? '#fd7043' : child.avatar_color,
                        opacity: day.points === 0 ? 0.15 : 1,
                      }}
                    />
                    <span className="text-[10px] font-black" style={{ color: isToday ? '#fd7043' : '#9b94c9' }}>
                      {isToday ? '•' : label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Activity completion grid */}
        {activities.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold text-muted-foreground mb-2">Activity Completion</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left font-bold text-muted-foreground pb-1 pr-2 w-24">Activity</th>
                    {last7.map(date => {
                      const d = new Date(date + 'T12:00:00');
                      const isT = date === today;
                      return (
                        <th key={date} className="text-center pb-1 w-7">
                          <span className="font-black text-[10px]" style={{ color: isT ? '#fd7043' : '#9b94c9' }}>
                            {isT ? '•' : DAY_LABELS[d.getDay()]}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {activities.map(act => (
                    <tr key={act.id}>
                      <td className="pr-2 py-0.5 font-semibold text-foreground truncate max-w-[96px]" title={act.activity?.name}>
                        {act.activity?.name ?? '—'}
                      </td>
                      {last7.map(date => {
                        const done = logMap[date]?.has(act.activity_id);
                        return (
                          <td key={date} className="text-center py-0.5">
                            <div
                              className="w-4 h-4 rounded-sm mx-auto"
                              style={{
                                background: done ? child.avatar_color : 'transparent',
                                border: `1.5px solid ${done ? child.avatar_color : '#e2e8f0'}`,
                              }}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Separator className="mb-4" />

        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={onManage}>
            Manage Activities
          </Button>
          <Button size="sm" variant="ghost" onClick={onChangePin}>
            Change PIN
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Add Child Form ─────────────────────────────────────────

interface AddChildFormProps {
  parentId: string;
  onClose: () => void;
  onSaved: () => void;
}

function AddChildForm({ parentId, onClose, onSaved }: AddChildFormProps) {
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }
    if (pin !== pin2) {
      setError('PINs do not match');
      return;
    }
    setSaving(true);
    const pin_hash = await hashPin(pin);
    const result = await createChild({
      parent_id: parentId,
      name: name.trim(),
      birthdate,
      pin_hash,
      avatar_color: avatarColor,
    });
    setSaving(false);
    if (!result) {
      setError('Failed to create child. Please try again.');
      return;
    }
    onSaved();
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold p-3">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label>Child's Name</Label>
        <Input
          placeholder="e.g. Alex"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Date of Birth</Label>
        <Input
          type="date"
          value={birthdate}
          onChange={e => setBirthdate(e.target.value)}
          required
          max={new Date().toISOString().split('T')[0]}
        />
        <p className="text-xs text-muted-foreground font-semibold">Used to verify your child's identity when logging in</p>
      </div>

      <div className="space-y-2">
        <Label>4-Digit PIN</Label>
        <Input
          placeholder="e.g. 1234"
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          type="tel"
          inputMode="numeric"
          maxLength={4}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Confirm PIN</Label>
        <Input
          placeholder="Repeat PIN"
          value={pin2}
          onChange={e => setPin2(e.target.value.replace(/\D/g, '').slice(0, 4))}
          type="tel"
          inputMode="numeric"
          maxLength={4}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Avatar Color</Label>
        <div className="flex flex-wrap gap-2 pt-1">
          {AVATAR_COLORS.map(c => (
            <button
              key={c}
              type="button"
              className="w-8 h-8 rounded-full transition-all focus:outline-none"
              style={{
                background: c,
                border: avatarColor === c ? '3px solid #fff' : '3px solid transparent',
                boxShadow: avatarColor === c ? `0 0 0 3px ${c}` : 'none',
                transform: avatarColor === c ? 'scale(1.2)' : 'scale(1)',
              }}
              onClick={() => setAvatarColor(c)}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="flex-1" disabled={saving}>
          {saving ? 'Saving...' : 'Add Child'}
        </Button>
      </div>
    </form>
  );
}

// ── Manage Activities Content ──────────────────────────────

interface ManageActivitiesContentProps {
  child: Child;
  onClose: () => void;
}

interface CategoryGroup {
  id: string;
  name: string;
  icon: string;
  color: string;
  activities: Activity[];
}

function ManageActivitiesContent({ child, onClose }: ManageActivitiesContentProps) {
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [childActivityMap, setChildActivityMap] = useState<Record<string, ChildActivity>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [acts, childActs] = await Promise.all([
        getActivities(),
        getAllChildActivities(child.id),
      ]);
      setAllActivities(acts);
      const map: Record<string, ChildActivity> = {};
      for (const ca of childActs) map[ca.activity_id] = ca;
      setChildActivityMap(map);
      setLoading(false);
    };
    load();
  }, [child.id]);

  const handleToggle = async (activityId: string) => {
    const current = childActivityMap[activityId];
    const newActive = current ? !current.is_active : true;
    setSaving(activityId);

    setChildActivityMap(prev => ({
      ...prev,
      [activityId]: {
        id: current?.id ?? '',
        child_id: child.id,
        activity_id: activityId,
        is_active: newActive,
      }
    }));

    await toggleChildActivity(child.id, activityId, newActive);
    setSaving(null);
  };

  const categoryMap: Record<string, CategoryGroup> = {};
  for (const act of allActivities) {
    const cat = (act as Activity & { activity_categories?: { id: string; name: string; icon: string; color: string } }).activity_categories;
    if (!cat) continue;
    if (!categoryMap[cat.id]) {
      categoryMap[cat.id] = { id: cat.id, name: cat.name, icon: cat.icon, color: cat.color, activities: [] };
    }
    categoryMap[cat.id].activities.push(act);
  }
  const categories = Object.values(categoryMap);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-8 h-8 rounded-full shimmer-bg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
        {categories.map(cat => (
          <div key={cat.id}>
            <div className="flex items-center gap-2 mb-2 pb-1 border-b border-border">
              <span className="text-xl">{cat.icon}</span>
              <span className="font-extrabold text-sm" style={{ color: cat.color }}>{cat.name}</span>
            </div>
            <div className="space-y-1">
              {cat.activities.map(act => {
                const isActive = childActivityMap[act.id]?.is_active ?? false;
                return (
                  <div
                    key={act.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isActive ? 'bg-primary/10' : 'hover:bg-muted'}`}
                    onClick={() => handleToggle(act.id)}
                  >
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isActive ? 'bg-primary border-primary' : 'border-input'}`}>
                      {saving === act.id ? (
                        <div className="w-3 h-3 rounded-full shimmer-bg" />
                      ) : isActive ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : null}
                    </div>
                    <span className={`flex-1 text-sm font-bold ${isActive ? 'text-primary' : 'text-foreground'}`}>{act.name}</span>
                    <Badge variant={isActive ? 'default' : 'outline'} className="text-xs">{act.points} pts</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <Button className="w-full" onClick={onClose}>Done</Button>
    </div>
  );
}

// ── Change PIN Form ────────────────────────────────────────

interface ChangePinFormProps {
  child: Child;
  onClose: () => void;
  onSaved: () => void;
}

function ChangePinForm({ child: _child, onClose, onSaved }: ChangePinFormProps) {
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }
    if (pin !== pin2) {
      setError('PINs do not match');
      return;
    }
    setSaving(true);
    const pin_hash = await hashPin(pin);
    const result = await updateChild(_child.id, { pin_hash });
    setSaving(false);
    if (!result) {
      setError('Failed to update PIN.');
      return;
    }
    onSaved();
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold p-3">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <Label>New PIN</Label>
        <Input
          placeholder="4 digits"
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          type="tel"
          inputMode="numeric"
          maxLength={4}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Confirm New PIN</Label>
        <Input
          placeholder="Repeat PIN"
          value={pin2}
          onChange={e => setPin2(e.target.value.replace(/\D/g, '').slice(0, 4))}
          type="tel"
          inputMode="numeric"
          maxLength={4}
          required
        />
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="flex-1" disabled={saving}>
          {saving ? 'Saving...' : 'Save PIN'}
        </Button>
      </div>
    </form>
  );
}
