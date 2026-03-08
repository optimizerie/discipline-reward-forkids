import { useState, useEffect, useCallback } from 'react';
import { navigate, useChildSession } from '../App';
import {
  getChildActivities, getTodayLogs, logActivity, unlogActivity,
  getWeeklyPoints, getTotalPoints, getCurrentStreak
} from '../lib/supabase';
import { clearChildSession } from '../lib/auth';
import { generateEncouragingImage } from '../lib/gemini';
import { StreakBadge } from '../components/StreakBadge';
import { WeeklyChart } from '../components/WeeklyChart';
import type { ChildActivity, ActivityCategory, DayPoints } from '../types';

interface CategoryGroup {
  category: ActivityCategory;
  activities: ChildActivity[];
}

export function ChildDashboard() {
  const { childSession, setChildSession } = useChildSession();
  const childId = childSession!.childId;
  const childName = childSession!.childName;
  const avatarColor = childSession!.avatarColor;

  const [activities, setActivities] = useState<ChildActivity[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [weeklyData, setWeeklyData] = useState<DayPoints[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dailyImage, setDailyImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebImage, setCelebImage] = useState<string | null>(null);
  const [celebImageLoading, setCelebImageLoading] = useState(false);
  const [todayPoints, setTodayPoints] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [acts, logs, weekly, total, str] = await Promise.all([
      getChildActivities(childId),
      getTodayLogs(childId),
      getWeeklyPoints(childId),
      getTotalPoints(childId),
      getCurrentStreak(childId),
    ]);
    setActivities(acts);
    setCompletedIds(new Set(logs));
    setWeeklyData(weekly);
    setTotalPoints(total);
    setStreak(str);
    setLoading(false);
  }, [childId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate today's points
  useEffect(() => {
    let pts = 0;
    for (const act of activities) {
      if (completedIds.has(act.activity_id) && act.activity) {
        pts += act.activity.points;
      }
    }
    setTodayPoints(pts);
  }, [activities, completedIds]);

  // Generate daily image
  useEffect(() => {
    setImageLoading(true);
    generateEncouragingImage(
      childName,
      `The child is working on daily activities including chores, studying, and sports practice. Show a happy cartoon child ready for their day`
    ).then(img => {
      setDailyImage(img);
      setImageLoading(false);
    });
  }, [childName]);

  // Check for all-done celebration
  useEffect(() => {
    if (activities.length === 0 || loading) return;
    const allDone = activities.every(a => completedIds.has(a.activity_id));
    if (allDone && !showCelebration) {
      setShowCelebration(true);
      // Generate celebration image
      setCelebImageLoading(true);
      generateEncouragingImage(
        childName,
        `The child completed ALL their daily activities! Show a big celebration with confetti, stars, trophies, and a very happy child`
      ).then(img => {
        setCelebImage(img);
        setCelebImageLoading(false);
      });
    }
  }, [completedIds, activities, loading, childName, showCelebration]);

  const handleToggle = async (act: ChildActivity) => {
    const actId = act.activity_id;
    const isCompleted = completedIds.has(actId);

    // Optimistic update
    const newSet = new Set(completedIds);
    if (isCompleted) newSet.delete(actId);
    else newSet.add(actId);
    setCompletedIds(newSet);

    // Update total points optimistically
    const pts = act.activity?.points ?? 0;
    setTotalPoints(prev => isCompleted ? prev - pts : prev + pts);

    // Persist
    if (isCompleted) {
      await unlogActivity(childId, actId);
    } else {
      await logActivity(childId, actId);
    }

    // Refresh weekly data
    const weekly = await getWeeklyPoints(childId);
    setWeeklyData(weekly);
  };

  const handleSignOut = () => {
    clearChildSession();
    setChildSession(null);
    navigate('/child');
  };

  // Group by category
  const categoryGroups: CategoryGroup[] = [];
  const catMap: Record<string, CategoryGroup> = {};
  for (const act of activities) {
    const cat = act.activity?.activity_categories;
    if (!cat) continue;
    if (!catMap[cat.id]) {
      catMap[cat.id] = { category: cat, activities: [] };
      categoryGroups.push(catMap[cat.id]);
    }
    catMap[cat.id].activities.push(act);
  }

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">🌟</div>
        <div className="loading-spinner" />
        <div className="loading-text">Loading your quests...</div>
      </div>
    );
  }

  return (
    <div className="child-dashboard">
      {/* Header */}
      <div className="child-dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: avatarColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 900, color: '#fff',
              border: '3px solid rgba(255,255,255,0.4)',
              flexShrink: 0
            }}>
              {getInitials(childName)}
            </div>
            <h1 className="child-welcome-title" style={{ margin: 0 }}>
              Hi {childName}! 🌟
            </h1>
          </div>
          <button
            className="btn-ghost btn-sm"
            style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', color: '#fff' }}
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>

        {/* Stats chips */}
        <div className="child-stats-bar" style={{ justifyContent: 'center' }}>
          <div className="stat-chip">
            <span className="stat-chip-icon">⭐</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--purple)' }}>{totalPoints}</div>
              <div className="stat-chip-label">Total Points</div>
            </div>
          </div>
          <div className="stat-chip">
            <div>
              <StreakBadge streak={streak} />
              <div className="stat-chip-label" style={{ textAlign: 'center', marginTop: 2 }}>Streak</div>
            </div>
          </div>
          <div className="stat-chip">
            <span className="stat-chip-icon">🎯</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--orange)' }}>{todayPoints}</div>
              <div className="stat-chip-label">Today</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="child-dashboard-content">
        {/* Daily image */}
        <div className="daily-image-card">
          {imageLoading ? (
            <div className="daily-image-placeholder" style={{ background: 'var(--purple-light)' }}>
              <span style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>🎨</span>
            </div>
          ) : dailyImage ? (
            <img src={dailyImage} alt="Today's adventure" className="daily-image" />
          ) : (
            <div className="daily-image-placeholder" style={{ background: 'var(--purple-light)', fontSize: 32 }}>
              🌟 Ready for today's adventure?
            </div>
          )}
        </div>

        {/* Activities */}
        {categoryGroups.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>😴</div>
            <h3 style={{ fontWeight: 900, marginBottom: 8 }}>No activities yet!</h3>
            <p style={{ color: 'var(--gray-600)', fontWeight: 600 }}>
              Ask your parent to set up some activities for you.
            </p>
          </div>
        ) : (
          categoryGroups.map(group => {
            const earnedPts = group.activities
              .filter(a => completedIds.has(a.activity_id))
              .reduce((sum, a) => sum + (a.activity?.points ?? 0), 0);
            const totalPts = group.activities.reduce((sum, a) => sum + (a.activity?.points ?? 0), 0);

            return (
              <div
                key={group.category.id}
                className="category-card"
              >
                <div
                  className="category-card-header"
                  style={{ background: `linear-gradient(135deg, ${group.category.color}, ${group.category.color}cc)` }}
                >
                  <span className="category-icon">{group.category.icon}</span>
                  <span className="category-title">{group.category.name}</span>
                  <span className="category-points-earned">
                    {earnedPts}/{totalPts} pts
                  </span>
                </div>
                <div className="category-card-body">
                  {group.activities.map(act => {
                    const isChecked = completedIds.has(act.activity_id);
                    return (
                      <div
                        key={act.id}
                        className={`kid-checkbox-row ${isChecked ? 'checked' : ''}`}
                        onClick={() => handleToggle(act)}
                      >
                        <div className="kid-checkbox-box">
                          {isChecked && <span style={{ color: '#fff', fontSize: 18 }}>✓</span>}
                        </div>
                        <div className="kid-checkbox-label">
                          <div className="kid-checkbox-name">{act.activity?.name}</div>
                        </div>
                        <span className="kid-checkbox-points">
                          {isChecked ? '✅' : ''} {act.activity?.points ?? 0} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {/* Weekly chart */}
        {weeklyData.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <WeeklyChart data={weeklyData} color={avatarColor} />
          </div>
        )}
      </div>

      {/* Celebration Overlay */}
      {showCelebration && (
        <>
          <ConfettiRain />
          <div className="celebration-overlay">
            <div className="celebration-card">
              <span className="celebration-emoji">🏆</span>
              <h2 className="celebration-title">AMAZING!</h2>
              <p className="celebration-subtitle">
                You completed ALL your activities today, {childName}!
              </p>

              {celebImageLoading ? (
                <div style={{ padding: '20px 0', textAlign: 'center' }}>
                  <div className="spinner" style={{ margin: '0 auto' }} />
                  <div style={{ marginTop: 8, color: 'var(--gray-600)', fontWeight: 700 }}>Creating your trophy image...</div>
                </div>
              ) : celebImage ? (
                <img src={celebImage} alt="Celebration" className="celebration-image" />
              ) : null}

              <div className="celebration-points">
                ⭐ {todayPoints} points today!
              </div>

              <button
                className="btn-primary btn-lg"
                onClick={() => setShowCelebration(false)}
              >
                Awesome! 🎉
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Confetti Component ─────────────────────────────────────

const CONFETTI_COLORS = ['#6c5ce7', '#fd7043', '#00b894', '#0984e3', '#fdcb6e', '#e84393', '#a29bfe'];

function ConfettiRain() {
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`,
    duration: `${2 + Math.random() * 2}s`,
    size: `${8 + Math.random() * 8}px`,
    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
  }));

  return (
    <div className="confetti-container">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            background: p.color,
            left: p.left,
            width: p.size,
            height: p.size,
            borderRadius: p.borderRadius,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}
