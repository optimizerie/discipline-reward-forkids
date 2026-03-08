const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function generateEncouragingImage(childName: string, context: string): Promise<string | null> {
  if (!API_KEY) return null;
  try {
    const prompt = `Create a colorful, fun, cartoon-style illustration for a child named ${childName}. ${context}. Bright colors, cheerful, encouraging, kid-friendly, no text in image.`;
    const response = await fetch(
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
    if (!response.ok) return null;
    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        return `data:${part.inlineData.mimeType ?? 'image/png'};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function generateCategoryImage(categoryName: string): Promise<string | null> {
  if (!API_KEY) return null;
  try {
    const prompts: Record<string, string> = {
      'Chores': 'A cheerful cartoon house with cleaning supplies, sparkles, and a happy sun, bright colors, kid-friendly',
      'Math': 'Colorful cartoon numbers and math symbols floating in the air, pencils, books, stars, kid-friendly illustration',
      'Squash': 'A cartoon squash racket and ball with energy lines, vibrant colors, sporty and fun, kid-friendly'
    };
    const prompt = prompts[categoryName] ?? `A fun cartoon illustration representing ${categoryName}, bright colors, kid-friendly`;
    const response = await fetch(
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
    if (!response.ok) return null;
    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        return `data:${part.inlineData.mimeType ?? 'image/png'};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch {
    return null;
  }
}
