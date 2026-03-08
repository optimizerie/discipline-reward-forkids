const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const CACHE_KEY = 'kidquest_icons_v2';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

interface IconCache {
  timestamp: number;
  icons: Record<string, string>;
}

function loadCache(): IconCache {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return { timestamp: 0, icons: {} };
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL) return { timestamp: 0, icons: {} };
    return parsed;
  } catch { return { timestamp: 0, icons: {} }; }
}

function saveCache(cache: IconCache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
}

async function generateImage(prompt: string): Promise<string | null> {
  if (!API_KEY) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
        })
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    for (const part of (data?.candidates?.[0]?.content?.parts ?? [])) {
      if (part.inlineData?.data) {
        return `data:${part.inlineData.mimeType ?? 'image/png'};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch { return null; }
}

// Pre-defined icon prompts — no emoji, use these for all icons throughout the app
export const ICON_KEYS = {
  APP_LOGO: 'app_logo',
  CHORES: 'chores',
  MATH: 'math',
  SQUASH: 'squash',
  POINTS_STAR: 'points_star',
  STREAK_FIRE: 'streak_fire',
  TROPHY: 'trophy',
  BRUSH_TEETH: 'brush_teeth',
  SHOWER: 'shower',
  MAKE_BED: 'make_bed',
  DISHES: 'dishes',
  TIDY_ROOM: 'tidy_room',
  TRASH: 'trash',
  BATHROOM: 'bathroom',
  HOMEWORK: 'homework',
  READING: 'reading',
  PRACTICE: 'practice',
  GHOSTING: 'ghosting',
  DRILL: 'drill',
  WRITING: 'writing',
  CHILD_ACCESS: 'child_access',
  PARENT_DASHBOARD: 'parent_dashboard',
  ADD_CHILD: 'add_child',
} as const;

const ICON_PROMPTS: Record<string, string> = {
  app_logo: 'A cute cartoon star with a happy face wearing a small golden crown, bright purple and gold colors, clean simple design, no text, white background, rounded friendly style',
  chores: 'A cheerful cartoon house with a sparkly broom and cleaning bubbles, bright green colors, simple clean icon style, no text, white background',
  math: 'Colorful cartoon numbers 1 2 3 with a pencil and small open book, bright blue colors, simple clean icon style, no text, white background',
  squash: 'A cartoon squash racket with a bright orange ball and motion lines, energetic sporty style, orange and red colors, simple clean icon, no text, white background',
  points_star: 'A shiny golden star with sparkles radiating outward, warm yellow and orange colors, simple clean icon style, no text, white background',
  streak_fire: 'A bright cartoon flame with a smiling face, warm orange and red gradient colors, simple clean icon style, no text, white background',
  trophy: 'A golden trophy cup with stars and confetti around it, gold and yellow colors, simple clean icon style, no text, white background',
  brush_teeth: 'A cartoon toothbrush with blue and white toothpaste and bubbles, clean fresh colors, simple icon style, no text, white background',
  shower: 'A cartoon showerhead with water droplets and steam clouds, blue and light colors, simple clean icon style, no text, white background',
  make_bed: 'A cartoon bed with a fluffy pillow and colorful blanket neatly made, warm cozy colors, simple clean icon style, no text, white background',
  dishes: 'A cartoon plate and bowl with a soapy sponge and bubbles, clean fresh colors, simple icon style, no text, white background',
  tidy_room: 'A cartoon room with toys in a box and a neat floor, bright playful colors, simple clean icon style, no text, white background',
  trash: 'A cartoon recycling bin with a lid and a small check mark, green and grey colors, simple clean icon style, no text, white background',
  bathroom: 'A cartoon sink with water and soap bubbles, fresh blue and white colors, simple clean icon style, no text, white background',
  homework: 'A cartoon open notebook with a pencil and a small gold star, bright yellow and blue colors, simple clean icon style, no text, white background',
  reading: 'A cartoon open book with colorful pages and a small lightbulb above it, bright colors, simple clean icon style, no text, white background',
  practice: 'A cartoon calculator with colorful math symbols floating around it, bright colors, simple clean icon style, no text, white background',
  ghosting: 'A cartoon figure running quickly across a squash court with motion lines, sporty energetic style, orange colors, simple clean icon, no text, white background',
  drill: 'A cartoon squash player doing a drill with a racket and multiple balls in motion, sporty style, bright colors, simple clean icon, no text, white background',
  writing: 'A cartoon notebook with a pen writing on it with a small squash ball nearby, neat clean style, simple icon, no text, white background',
  child_access: 'A cute cartoon child character giving a thumbs up, friendly bright colors, simple clean icon style, no text, white background',
  parent_dashboard: 'A cartoon clipboard with colorful stars and checkmarks on it, professional yet friendly, bright colors, simple clean icon style, no text, white background',
  add_child: 'A cartoon child silhouette with a plus symbol and sparkles, friendly bright colors, simple clean icon style, no text, white background',
};

export async function getIcon(key: string): Promise<string | null> {
  const cache = loadCache();
  if (cache.icons[key]) return cache.icons[key];
  const prompt = ICON_PROMPTS[key];
  if (!prompt) return null;
  const img = await generateImage(prompt);
  if (img) {
    cache.icons[key] = img;
    cache.timestamp = Date.now();
    saveCache(cache);
  }
  return img;
}

export async function preloadIcons(keys: string[]): Promise<Record<string, string>> {
  const cache = loadCache();
  const missing = keys.filter(k => !cache.icons[k]);
  if (missing.length > 0) {
    // Generate in parallel batches of 3 to avoid rate limiting
    for (let i = 0; i < missing.length; i += 3) {
      const batch = missing.slice(i, i + 3);
      const results = await Promise.all(batch.map(k => getIcon(k)));
      batch.forEach((k, idx) => {
        if (results[idx]) cache.icons[k] = results[idx]!;
      });
    }
    saveCache(cache);
  }
  const result: Record<string, string> = {};
  for (const k of keys) {
    if (cache.icons[k]) result[k] = cache.icons[k];
  }
  return result;
}

export async function generateEncouragingImage(childName: string, context: string): Promise<string | null> {
  return generateImage(`Create a colorful, fun, cartoon-style illustration for a child named ${childName}. ${context}. Bright colors, cheerful, encouraging, kid-friendly, no text in image.`);
}
