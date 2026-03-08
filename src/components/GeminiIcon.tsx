import { useState, useEffect } from 'react';
import { getIcon } from '@/lib/gemini';
import { cn } from '@/lib/utils';

interface GeminiIconProps {
  iconKey: string;
  size?: number;
  className?: string;
  fallback?: string;
}

export function GeminiIcon({ iconKey, size = 32, className, fallback = '?' }: GeminiIconProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getIcon(iconKey).then(img => {
      if (!cancelled) {
        setSrc(img);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [iconKey]);

  if (loading) {
    return (
      <div
        className={cn("rounded-lg shimmer-bg flex-shrink-0", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  if (!src) {
    return (
      <div
        className={cn("rounded-lg bg-muted flex items-center justify-center text-muted-foreground font-bold flex-shrink-0", className)}
        style={{ width: size, height: size, fontSize: size * 0.5 }}
      >
        {fallback}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={iconKey}
      className={cn("rounded-lg object-contain flex-shrink-0", className)}
      style={{ width: size, height: size }}
    />
  );
}
