import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const path = searchParams.get('path') || 'Your Future Direction';
    const reason = searchParams.get('reason') || 'Analyzing available signal streams...';

    // 2. SOCIAL BINARY (STABLE SVG STRING)
    // Intelligent line-breaking for balanced typography
    const words = path.split(' ');
    let line1 = '';
    let line2 = '';
    
    // Attempt a balanced 60/40 split for professional look
    const midpoint = Math.floor(words.length * 0.6);
    line1 = words.slice(0, midpoint).join(' ');
    line2 = words.slice(midpoint).join(' ');

    const svg = `
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#121212;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#080808;stop-opacity:1" />
          </linearGradient>
          <radialGradient id="meshGlow" cx="100%" cy="0%" r="60%">
            <stop offset="0%" style="stop-color:#ffb340;stop-opacity:0.12" />
            <stop offset="50%" style="stop-color:#ff4081;stop-opacity:0.06" />
            <stop offset="100%" style="stop-color:#4081ff;stop-opacity:0" />
          </radialGradient>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#111" />
          </pattern>
        </defs>

        <rect width="1200" height="630" fill="#000" />
        <rect width="1200" height="630" fill="url(#grid)" />

        <rect x="200" y="75" width="800" height="480" rx="20" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
        <rect x="200" y="75" width="800" height="480" rx="20" fill="url(#meshGlow)" />

        <text x="250" y="130" font-family="sans-serif" font-size="18" font-weight="700" fill="rgba(255,255,255,0.6)" letter-spacing="2">NORTH ↑</text>
        <text x="600" y="220" font-family="monospace" font-size="10" text-anchor="middle" fill="#444" letter-spacing="5">OFFICIAL CHOICE</text>

        <!-- Centered Responsive Title -->
        <text x="600" y="300" font-family="sans-serif" font-size="44" font-weight="900" text-anchor="middle" fill="#F0EEE8" letter-spacing="-1.5">
          <tspan x="600" dy="0">Go with ${line1.trim()}</tspan>
          <tspan x="600" dy="52">${line2.trim()}</tspan>
        </text>

        <!-- Reason (Safe Wrapping via ForeignObject) -->
        <foreignObject x="300" y="390" width="600" height="120">
          <div xmlns="http://www.w3.org/1999/xhtml" style="color:#555; font-family:sans-serif; font-size:16px; text-align:center; line-height:1.6; padding:0 40px; font-weight:400;">
            ${reason.length > 200 ? reason.substring(0, 200) + '...' : reason}
          </div>
        </foreignObject>

        <text x="500" y="520" font-family="monospace" font-size="120" font-weight="900" fill="#111" opacity="0.1" letter-spacing="5">SIGNAL</text>
      </svg>
    `;

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err: any) {
    return new Response(`Atomic Failure: ${err.message}`, { status: 500 });
  }
}
