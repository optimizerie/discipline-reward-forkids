import { useState, useEffect, useCallback } from 'react';
import { useAuth, navigate } from '../App';
import {
  getChildren, createChild, updateChild,
  getActivities, getAllChildActivities, toggleChildActivity,
  getTotalPoints, getCurrentStreak, getWeeklyPoints, signOut
} from '../lib/supabase';
import { hashPin } from '../lib/auth';
import type { Child, Activity, ChildActivity, DayPoints } from '../types';

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

    // Load stats for each child
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
    <div className="page-layout">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-logo">
          <span className="navbar-logo-icon">🌟</span>
          KidQuest
        </div>
        <div className="navbar-actions">
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-600)', marginRight: 4 }}>
            {user?.email}
          </span>
          <button className="btn-ghost btn-sm" onClick={handleSignOut}>Sign Out</button>
        </div>
      </nav>

      {/* Content */}
      <div className="page-content">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Parent Dashboard</h1>
            <p className="dashboard-sub">Manage your children's quests and track their progress</p>
          </div>
          {children.length < 2 && (
            <button className="btn-primary" onClick={() => setShowAddChild(true)}>
              + Add Child
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 16px' }} />
            <div style={{ color: 'var(--gray-600)', fontWeight: 700 }}>Loading your children...</div>
          </div>
        ) : (
          <div className="children-grid">
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
                className="add-child-card"
                style={{ gridColumn: '1 / -1' }}
                onClick={() => setShowAddChild(true)}
              >
                <div className="add-child-icon">👶</div>
                <div className="add-child-text">Add your first child to get started!</div>
                <button className="btn-primary">+ Add Child</button>
              </div>
            )}

            {children.length === 1 && (
              <div className="add-child-card" onClick={() => setShowAddChild(true)}>
                <div className="add-child-icon">➕</div>
                <div className="add-child-text">Add another child</div>
              </div>
            )}
          </div>
        )}
      </div>

      {showAddChild && (
        <AddChildModal
          parentId={user!.id}
          onClose={() => setShowAddChild(false)}
          onSaved={() => { setShowAddChild(false); loadChildren(); }}
        />
      )}

      {manageChildId && (
        <ManageActivitiesModal
          child={children.find(c => c.id === manageChildId)!}
          onClose={() => setManageChildId(null)}
        />
      )}

      {changePinChildId && (
        <ChangePinModal
          child={children.find(c => c.id === changePinChildId)!}
          onClose={() => setChangePinChildId(null)}
          onSaved={() => { setChangePinChildId(null); loadChildren(); }}
        />
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
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="child-card">
      <div className="child-card-banner" style={{ background: `linear-gradient(135deg, ${child.avatar_color}, ${child.avatar_color}aa)` }}>
        <div className="child-avatar-circle" style={{ background: child.avatar_color }}>
          {initials}
        </div>
      </div>
      <div className="child-card-body">
        <div className="child-name">{child.name}</div>

        <div className="child-stats-row">
          <span className="badge badge-purple">⭐ {stats.totalPoints} pts</span>
          <span className={`badge ${stats.streak >= 7 ? 'badge-yellow' : stats.streak >= 3 ? 'badge-orange' : 'badge-purple'}`}>
            🔥 {stats.streak} day streak
          </span>
        </div>

        {/* Mini bar chart */}
        {stats.weeklyData.length > 0 && (
          <div className="mini-chart">
            <div className="mini-chart-title">Last 7 Days</div>
            <div className="mini-bars">
              {stats.weeklyData.map(day => {
                const isToday = day.date === today;
                const heightPct = day.points === 0 ? 4 : Math.max(8, (day.points / maxPoints) * 100);
                const d = new Date(day.date + 'T12:00:00');
                const label = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()];
                return (
                  <div key={day.date} className="mini-bar-wrap">
                    <div
                      className="mini-bar"
                      style={{
                        height: `${heightPct}%`,
                        background: isToday ? '#fd7043' : child.avatar_color,
                        opacity: day.points === 0 ? 0.2 : 1
                      }}
                    />
                    <div className="mini-bar-label" style={{ color: isToday ? '#fd7043' : undefined }}>
                      {isToday ? '•' : label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="child-card-actions" style={{ marginTop: 16 }}>
          <button className="btn-primary btn-sm" onClick={onManage} style={{ flex: 1 }}>
            Manage Activities
          </button>
          <button className="btn-ghost btn-sm" onClick={onChangePin}>
            Change PIN
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Child Modal ────────────────────────────────────────

interface AddChildModalProps {
  parentId: string;
  onClose: () => void;
  onSaved: () => void;
}

function AddChildModal({ parentId, onClose, onSaved }: AddChildModalProps) {
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
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Add a Child</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p className="modal-sub">Set up a profile for your child to start their quests!</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="modal-form" onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Child's Name</label>
            <input
              className="form-input"
              placeholder="e.g. Alex"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date of Birth</label>
            <input
              type="date"
              className="form-input"
              value={birthdate}
              onChange={e => setBirthdate(e.target.value)}
              required
              max={new Date().toISOString().split('T')[0]}
            />
            <div style={{ fontSize: 12, color: 'var(--gray-600)', fontWeight: 600 }}>
              Used to verify your child's identity when logging in
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">4-Digit PIN</label>
            <input
              className="form-input"
              placeholder="e.g. 1234"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              type="tel"
              inputMode="numeric"
              maxLength={4}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm PIN</label>
            <input
              className="form-input"
              placeholder="Repeat PIN"
              value={pin2}
              onChange={e => setPin2(e.target.value.replace(/\D/g, '').slice(0, 4))}
              type="tel"
              inputMode="numeric"
              maxLength={4}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Avatar Color</label>
            <div className="color-picker-row">
              {AVATAR_COLORS.map(c => (
                <div
                  key={c}
                  className={`color-swatch ${avatarColor === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setAvatarColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Saving...</> : '✨ Add Child'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Manage Activities Modal ────────────────────────────────

interface ManageActivitiesModalProps {
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

function ManageActivitiesModal({ child, onClose }: ManageActivitiesModalProps) {
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

    // Optimistic update
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

  // Group by category
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

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Manage Activities</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p className="modal-sub">Choose which activities {child.name} should complete daily</p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : (
          <div className="activity-toggle-section">
            {categories.map(cat => (
              <div key={cat.id} className="activity-toggle-category">
                <div className="activity-toggle-category-header">
                  <span style={{ fontSize: 22 }}>{cat.icon}</span>
                  <span style={{ color: cat.color }}>{cat.name}</span>
                </div>
                {cat.activities.map(act => {
                  const isActive = childActivityMap[act.id]?.is_active ?? false;
                  return (
                    <div
                      key={act.id}
                      className={`activity-toggle-row ${isActive ? 'active' : ''}`}
                      onClick={() => handleToggle(act.id)}
                    >
                      <span className="activity-toggle-check">
                        {saving === act.id ? (
                          <span className="spinner" style={{ width: 18, height: 18 }} />
                        ) : isActive ? '✅' : '⬜'}
                      </span>
                      <span className="activity-toggle-name">{act.name}</span>
                      <span className="activity-toggle-points">{act.points} pts</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

// ── Change PIN Modal ───────────────────────────────────────

interface ChangePinModalProps {
  child: Child;
  onClose: () => void;
  onSaved: () => void;
}

function ChangePinModal({ child, onClose, onSaved }: ChangePinModalProps) {
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
    const result = await updateChild(child.id, { pin_hash });
    setSaving(false);
    if (!result) {
      setError('Failed to update PIN.');
      return;
    }
    onSaved();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Change PIN for {child.name}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p className="modal-sub">Enter a new 4-digit PIN</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="modal-form" onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">New PIN</label>
            <input
              className="form-input"
              placeholder="4 digits"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              type="tel"
              inputMode="numeric"
              maxLength={4}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New PIN</label>
            <input
              className="form-input"
              placeholder="Repeat PIN"
              value={pin2}
              onChange={e => setPin2(e.target.value.replace(/\D/g, '').slice(0, 4))}
              type="tel"
              inputMode="numeric"
              maxLength={4}
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save PIN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
