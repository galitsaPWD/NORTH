/**
 * Safely parses JSON from an AI response string.
 * Handles markdown code blocks and potential noise.
 */
export function parseAIJson<T>(raw: string): T | null {
  try {
    if (!raw) return null;
    
    // Attempt to extract purely the JSON object/array portion
    let clean = raw.trim();
    
    // Remove code blocks
    clean = clean.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();

    // Find the first { or [ and last } or ]
    const firstBrace = clean.indexOf('{');
    const firstBracket = clean.indexOf('[');
    const firstIndex = firstBrace !== -1 && firstBracket !== -1 
      ? Math.min(firstBrace, firstBracket) 
      : Math.max(firstBrace, firstBracket);
      
    const lastBrace = clean.lastIndexOf('}');
    const lastBracket = clean.lastIndexOf(']');
    const lastIndex = Math.max(lastBrace, lastBracket);

    if (firstIndex !== -1 && lastIndex !== -1 && lastIndex > firstIndex) {
      clean = clean.substring(firstIndex, lastIndex + 1);
    }

    return JSON.parse(clean) as T;
  } catch (error) {
    console.error('Failed to parse AI JSON:', error);
    console.error('RAW CONTENT WAS:', raw);
    return null;
  }
}

