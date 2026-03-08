import { GeminiIcon } from '@/components/GeminiIcon';
import { ICON_KEYS } from '@/lib/gemini';

interface Props {
  streak: number;
  compact?: boolean;
}

export function StreakBadge({ streak, compact = false }: Props) {
  const color = streak >= 7 ? 'text-yellow-600' : streak >= 3 ? 'text-orange-500' : 'text-muted-foreground';
  return (
    <div className={`flex items-center justify-center gap-1 ${color}`}>
      <GeminiIcon iconKey={ICON_KEYS.STREAK_FIRE} size={compact ? 20 : 24} className="rounded" />
      <span className="font-black text-sm">{streak}</span>
      {!compact && streak >= 7 && <span className="text-xs font-bold">Hot!</span>}
    </div>
  );
}
