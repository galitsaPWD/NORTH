import { groq } from '@/lib/groq';
import { SYSTEM_PROMPTS } from '@/lib/prompts';
import { parseAIJson } from '@/lib/parse';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages, skills } = await req.json();

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.PATH_GENERATION },
        { 
          role: 'user', 
          content: `Here is the person's extracted skill profile:\n${JSON.stringify(skills, null, 2)}\n\nHere is their full onboarding conversation:\n${JSON.stringify(messages, null, 2)}\n\nGenerate 3 highly specific income paths for THIS person. Reference their exact skill names, their stated money goal, their risk tolerance score, and their time availability in the why_it_fits field. Do not generate generic paths.`
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = parseAIJson(content);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Path generation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
