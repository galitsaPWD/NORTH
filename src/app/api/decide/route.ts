import { groq } from '@/lib/groq';
import { SYSTEM_PROMPTS } from '@/lib/prompts';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { pathA, pathB, profile, messages } = await req.json();

    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.DECISION },
        { 
          role: 'user', 
          content: `Compare:
Path A: ${JSON.stringify(pathA)}
Path B: ${JSON.stringify(pathB)}

User Profile: ${JSON.stringify(profile)}
Previous messages in this session: ${JSON.stringify(messages)}` 
        },
      ],
      stream: true,
      max_tokens: 1000,
    });

    const encoder = new TextEncoder();

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const text = chunk.choices[0]?.delta?.content || '';
              controller.enqueue(encoder.encode(text));
            }
          } catch (error) {
            controller.error(error);
          } finally {
            controller.close();
          }
        },
      }),
      {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      }
    );
  } catch (error: any) {
    console.error('Decision error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
async function* streamToGenerator(stream: any) {
    for await (const chunk of stream) {
        yield chunk.choices[0]?.delta?.content || '';
    }
}
