interface Props {
  streak: number;
}

export function StreakBadge({ streak }: Props) {
  if (streak >= 7) {
    return (
      <span className="streak-badge streak-badge-gold">
        <span className="streak-icon">🔥</span>
        <span>{streak} days</span>
        <span>Hot Streak!</span>
      </span>
    );
  }
  if (streak >= 3) {
    return (
      <span className="streak-badge streak-badge-orange">
        <span className="streak-icon">🔥</span>
        <span>{streak} days</span>
      </span>
    );
  }
  return (
    <span className="streak-badge streak-badge-gray">
      <span className="streak-icon">🔥</span>
      <span>{streak} {streak === 1 ? 'day' : 'days'}</span>
    </span>
  );
}
