import { useState, useEffect, useCallback, useRef } from 'react';
import { navigate, useChildSession } from '../App';
import {
  getChildActivities, getLogsForDate, logActivity, unlogActivity,
  getWeeklyPoints, getTotalPoints, getCurrentStreak
} from '../lib/supabase';
import { clearChildSession } from '../lib/auth';
import { generateEncouragingImage, ICON_KEYS } from '../lib/gemini';
import { GeminiIcon } from '@/components/GeminiIcon';
import { StreakBadge } from '../components/StreakBadge';
import { WeeklyChart } from '../components/WeeklyChart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { ChildActivity, ActivityCategory, DayPoints } from '../types';

interface CategoryGroup {
  category: ActivityCategory;
  activities: ChildActivity[];
}

function getActivityIconKey(activityName: string): string {
  const name = activityName.toLowerCase();
  if (name.includes('brush') || name.includes('teeth')) return ICON_KEYS.BRUSH_TEETH;
  if (name.includes('shower')) return ICON_KEYS.SHOWER;
  if (name.includes('bed')) return ICON_KEYS.MAKE_BED;
  if (name.includes('dish')) return ICON_KEYS.DISHES;
  if (name.includes('tidy') || name.includes('room')) return ICON_KEYS.TIDY_ROOM;
  if (name.includes('trash') || name.includes('garbage')) return ICON_KEYS.TRASH;
  if (name.includes('bathroom')) return ICON_KEYS.BATHROOM;
  if (name.includes('homework')) return ICON_KEYS.HOMEWORK;
  if (name.includes('read')) return ICON_KEYS.READING;
  if (name.includes('practice') || name.includes('problem')) return ICON_KEYS.PRACTICE;
  if (name.includes('ghost')) return ICON_KEYS.GHOSTING;
  if (name.includes('drill')) return ICON_KEYS.DRILL;
  if (name.includes('writ')) return ICON_KEYS.WRITING;
  return ICON_KEYS.TROPHY;
}

function getCategoryIconKey(categoryName: string): string {
  const name = categoryName.toLowerCase();
  if (name.includes('chor')) return ICON_KEYS.CHORES;
  if (name.includes('math') || name.includes('learn') || name.includes('acad')) return ICON_KEYS.MATH;
  if (name.includes('squash') || name.includes('sport')) return ICON_KEYS.SQUASH;
  return ICON_KEYS.TROPHY;
}

const TODAY = new Date().toISOString().split('T')[0];
const YESTERDAY = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; })();

export function ChildDashboard() {
  const { childSession, setChildSession } = useChildSession();
  const childId = childSession!.childId;
  const childName = childSession!.childName;
  const avatarColor = childSession!.avatarColor;

  const [activities, setActivities] = useState<ChildActivity[]>([]);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [completedYesterday, setCompletedYesterday] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'today' | 'yesterday'>('today');
  const [weeklyData, setWeeklyData] = useState<DayPoints[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebImage, setCelebImage] = useState<string | null>(null);
  const [celebImageLoading, setCelebImageLoading] = useState(false);
  const celebrationShownRef = useRef(false);

  // Compute smart tip based on current data
  const smartTip = (() => {
    if (activities.length === 0) return null;
    const remaining = activities.filter(a => !completedToday.has(a.activity_id));
    const remainingPts = remaining.reduce((s, a) => s + (a.activity?.points ?? 0), 0);
    const doneCount = activities.length - remaining.length;
    const allDone = remaining.length === 0;

    if (allDone) {
      if (streak >= 7) return { icon: ICON_KEYS.STREAK_FIRE, color: '#f59e0b', title: `${streak}-day streak!`, body: `You're on fire! Keep it going tomorrow to make it ${streak + 1} days.` };
      return { icon: ICON_KEYS.TROPHY, color: '#6c5ce7', title: 'Perfect day!', body: `You earned all your points today. Do it again tomorrow to build your streak!` };
    }

    // Check yesterday completions to flag consistency
    const missedYesterday = activities.filter(a => !completedYesterday.has(a.activity_id));
    const missedBoth = remaining.filter(a => missedYesterday.some(m => m.activity_id === a.activity_id));
    if (missedBoth.length > 0) {
      const act = missedBoth[0];
      return { icon: ICON_KEYS.STREAK_FIRE, color: '#fd7043', title: 'Break the pattern!', body: `You skipped "${act.activity?.name}" yesterday too. Doing it today protects your streak!` };
    }

    if (doneCount === 0) {
      return { icon: ICON_KEYS.POINTS_STAR, color: '#6c5ce7', title: `${remainingPts} points waiting!`, body: `Complete all ${activities.length} activities today to earn your full score.` };
    }

    return { icon: ICON_KEYS.POINTS_STAR, color: '#00b894', title: `${remainingPts} more points to go!`, body: `You've done ${doneCount} of ${activities.length} activities. Finish the rest to max out today!` };
  })();

  const todayPoints = activities
    .filter(a => completedToday.has(a.activity_id))
    .reduce((sum, a) => sum + (a.activity?.points ?? 0), 0);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [acts, logsToday, logsYesterday, weekly, total, str] = await Promise.all([
      getChildActivities(childId),
      getLogsForDate(childId, TODAY),
      getLogsForDate(childId, YESTERDAY),
      getWeeklyPoints(childId),
      getTotalPoints(childId),
      getCurrentStreak(childId),
    ]);
    setActivities(acts);
    setCompletedToday(new Set(logsToday));
    setCompletedYesterday(new Set(logsYesterday));
    setWeeklyData(weekly);
    setTotalPoints(total);
    setStreak(str);
    setLoading(false);
  }, [childId]);

  useEffect(() => { loadData(); }, [loadData]);


  // All-done celebration (today only)
  useEffect(() => {
    if (activities.length === 0 || loading || activeTab !== 'today') return;
    const allDone = activities.every(a => completedToday.has(a.activity_id));
    if (!allDone) {
      celebrationShownRef.current = false;
      return;
    }
    if (allDone && !celebrationShownRef.current) {
      celebrationShownRef.current = true;
      setShowCelebration(true);
      setCelebImageLoading(true);
      generateEncouragingImage(
        childName,
        'The child completed ALL their daily activities! Show a big celebration with confetti, stars, trophies, and a very happy child'
      ).then(img => { setCelebImage(img); setCelebImageLoading(false); });
    }
  }, [completedToday, activities, loading, childName, activeTab]);

  const handleToggle = async (act: ChildActivity, date: string, completed: Set<string>, setCompleted: (s: Set<string>) => void) => {
    const actId = act.activity_id;
    const isCompleted = completed.has(actId);
    const newSet = new Set(completed);
    if (isCompleted) newSet.delete(actId);
    else newSet.add(actId);
    setCompleted(newSet);

    const pts = act.activity?.points ?? 0;
    if (date === TODAY) setTotalPoints(prev => isCompleted ? prev - pts : prev + pts);

    if (isCompleted) await unlogActivity(childId, actId, date);
    else await logActivity(childId, actId, date);

    const weekly = await getWeeklyPoints(childId);
    setWeeklyData(weekly);
  };

  const handleSignOut = () => {
    clearChildSession();
    setChildSession(null);
    navigate('/child');
  };

  // Group activities by category
  const buildGroups = (acts: ChildActivity[]): CategoryGroup[] => {
    const catMap: Record<string, CategoryGroup> = {};
    const groups: CategoryGroup[] = [];
    for (const act of acts) {
      const cat = act.activity?.activity_categories;
      if (!cat) continue;
      if (!catMap[cat.id]) {
        catMap[cat.id] = { category: cat, activities: [] };
        groups.push(catMap[cat.id]);
      }
      catMap[cat.id].activities.push(act);
    }
    return groups;
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-100 to-orange-50 flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 rounded-2xl shimmer-bg" />
        <p className="text-primary font-black text-lg">Loading your quests...</p>
      </div>
    );
  }

  const categoryGroups = buildGroups(activities);

  const renderActivities = (date: string, completed: Set<string>, setCompleted: (s: Set<string>) => void) => (
    categoryGroups.length === 0 ? (
      <Card className="text-center p-12">
        <GeminiIcon iconKey={ICON_KEYS.ADD_CHILD} size={56} className="mx-auto mb-4 rounded-xl" />
        <p className="font-extrabold text-lg mb-2">No activities yet!</p>
        <p className="text-muted-foreground font-semibold text-sm">Ask your parent to set up some activities for you.</p>
      </Card>
    ) : (
      <div className="space-y-4">
        {categoryGroups.map(group => {
          const earnedPts = group.activities.filter(a => completed.has(a.activity_id)).reduce((s, a) => s + (a.activity?.points ?? 0), 0);
          const totalPts = group.activities.reduce((s, a) => s + (a.activity?.points ?? 0), 0);
          return (
            <Card key={group.category.id} className="overflow-hidden">
              {/* Category header */}
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ background: `linear-gradient(135deg, ${group.category.color}22, ${group.category.color}11)`, borderBottom: `2px solid ${group.category.color}33` }}
              >
                <GeminiIcon iconKey={getCategoryIconKey(group.category.name)} size={36} className="rounded-xl flex-shrink-0" />
                <span className="font-black text-base flex-1" style={{ color: group.category.color }}>{group.category.name}</span>
                <Badge variant="outline" className="text-xs font-extrabold" style={{ borderColor: group.category.color, color: group.category.color }}>
                  {earnedPts}/{totalPts} pts
                </Badge>
              </div>

              {/* Activities */}
              <CardContent className="p-2">
                {group.activities.map(act => {
                  const isChecked = completed.has(act.activity_id);
                  return (
                    <button
                      key={act.id}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left mb-1 last:mb-0',
                        isChecked
                          ? 'bg-accent/10 border-2 border-accent/30'
                          : 'bg-white border-2 border-transparent hover:border-border hover:bg-muted/50'
                      )}
                      onClick={() => handleToggle(act, date, completed, setCompleted)}
                    >
                      {/* Checkbox */}
                      <div className={cn(
                        'w-8 h-8 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all',
                        isChecked ? 'bg-accent border-accent' : 'border-input bg-white'
                      )}>
                        {isChecked && (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M3 8L6.5 11.5L13 5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>

                      {/* Activity icon */}
                      <GeminiIcon iconKey={getActivityIconKey(act.activity?.name ?? '')} size={32} className="rounded-lg flex-shrink-0" />

                      {/* Name */}
                      <span className={cn('font-extrabold flex-1 text-sm', isChecked && 'line-through text-muted-foreground')}>
                        {act.activity?.name}
                      </span>

                      {/* Points */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <GeminiIcon iconKey={ICON_KEYS.POINTS_STAR} size={16} className="rounded" />
                        <span className={cn('text-xs font-black', isChecked ? 'text-accent' : 'text-muted-foreground')}>
                          {act.activity?.points ?? 0}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-100 via-purple-50 to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-purple-500 text-white px-4 pt-6 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-black text-lg border-3 border-white/40"
                style={{ background: avatarColor }}
              >
                {getInitials(childName)}
              </div>
              <h1 className="text-2xl font-black">Hi {childName}!</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 border border-white/30"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { iconKey: ICON_KEYS.POINTS_STAR, value: totalPoints, label: 'Total Points' },
              { iconKey: ICON_KEYS.STREAK_FIRE, value: null, label: 'Streak', streak: true },
              { iconKey: ICON_KEYS.TROPHY, value: todayPoints, label: 'Today' },
            ].map((stat, i) => (
              <div key={i} className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center">
                <div className="flex justify-center mb-1">
                  <GeminiIcon iconKey={stat.iconKey} size={28} className="rounded-lg" />
                </div>
                {stat.streak ? (
                  <StreakBadge streak={streak} compact />
                ) : (
                  <div className="text-xl font-black">{stat.value}</div>
                )}
                <div className="text-xs font-bold text-white/80 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 -mt-4 pb-8">
        {/* Smart tip card */}
        {!loading && smartTip && (
          <Card className="mb-4 overflow-hidden shadow-lg border-0" style={{ background: `linear-gradient(135deg, ${smartTip.color}18, ${smartTip.color}08)`, borderLeft: `4px solid ${smartTip.color}` }}>
            <CardContent className="p-4 flex items-center gap-4">
              <GeminiIcon iconKey={smartTip.icon} size={48} className="rounded-2xl flex-shrink-0" />
              <div>
                <p className="font-black text-base" style={{ color: smartTip.color }}>{smartTip.title}</p>
                <p className="text-sm font-semibold text-muted-foreground mt-0.5">{smartTip.body}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today / Yesterday tabs */}
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'today' | 'yesterday')} className="mb-4">
          <TabsList className="w-full">
            <TabsTrigger value="today" className="flex-1 gap-2">
              <GeminiIcon iconKey={ICON_KEYS.POINTS_STAR} size={16} className="rounded" />
              Today
            </TabsTrigger>
            <TabsTrigger value="yesterday" className="flex-1 gap-2">
              <GeminiIcon iconKey={ICON_KEYS.STREAK_FIRE} size={16} className="rounded" />
              Yesterday
            </TabsTrigger>
          </TabsList>
          <TabsContent value="today">
            {renderActivities(TODAY, completedToday, setCompletedToday)}
          </TabsContent>
          <TabsContent value="yesterday">
            {renderActivities(YESTERDAY, completedYesterday, setCompletedYesterday)}
          </TabsContent>
        </Tabs>

        {/* Weekly chart */}
        {weeklyData.length > 0 && (
          <WeeklyChart data={weeklyData} color={avatarColor} />
        )}
      </div>

      {/* Celebration overlay */}
      {showCelebration && (
        <>
          <ConfettiRain />
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-sm text-center shadow-2xl animate-bounce-in">
              <CardContent className="pt-8 pb-6 space-y-4">
                <div className="flex justify-center">
                  <GeminiIcon iconKey={ICON_KEYS.TROPHY} size={80} className="rounded-2xl" />
                </div>
                <h2 className="text-3xl font-black text-primary">AMAZING!</h2>
                <p className="text-muted-foreground font-bold">
                  You completed ALL your activities today, {childName}!
                </p>
                {celebImageLoading ? (
                  <div className="h-40 shimmer-bg rounded-xl" />
                ) : celebImage ? (
                  <img src={celebImage} alt="Celebration" className="w-full rounded-xl object-cover" style={{ maxHeight: 200 }} />
                ) : null}
                <div className="flex items-center justify-center gap-2 text-xl font-black text-secondary">
                  <GeminiIcon iconKey={ICON_KEYS.POINTS_STAR} size={28} className="rounded-lg" />
                  {todayPoints} points today!
                </div>
                <Button size="lg" className="w-full" onClick={() => setShowCelebration(false)}>
                  Awesome!
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// Confetti
const CONFETTI_COLORS = ['#6c5ce7', '#fd7043', '#00b894', '#0984e3', '#fdcb6e', '#e84393'];

function ConfettiRain() {
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 2}s`,
    duration: `${2.5 + Math.random() * 2}s`,
    size: `${8 + Math.random() * 8}px`,
    borderRadius: Math.random() > 0.5 ? '50%' : '3px',
  }));

  return (
    <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute"
          style={{
            background: p.color,
            left: p.left,
            top: '-20px',
            width: p.size,
            height: p.size,
            borderRadius: p.borderRadius,
            animation: `confetti-fall ${p.duration} ${p.delay} ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
