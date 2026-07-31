import satori from 'satori';
import { Resvg } from '@resvg/resvg-wasm';
import resvgWasm from '@resvg/resvg-wasm/index_bg.wasm';

// Initialize resvg WASM once (cached at edge)
let wasmInit = false;
async function ensureWasm() {
  if (!wasmInit) {
    await Resvg.init(resvgWasm);
    wasmInit = true;
  }
}

// ── DESTINATION CONFIG ──────────────────────────────────────
const DESTS = {
  alaska:    { label: '🏔 Alaska Expedition',   bg: ['#071828','#0d2a40'], accent: '#7ee8e8', water: '#0f2e45' },
  caribbean: { label: '🌴 Caribbean Escape',    bg: ['#021830','#052840'], accent: '#00d4aa', water: '#0a5070' },
  europe:    { label: '🏰 European Voyage',     bg: ['#1a0e2e','#251542'], accent: '#c9a0e0', water: '#2a1848' },
  asia:      { label: '🏯 Asian Adventure',     bg: ['#1a0808','#2d1010'], accent: '#ff6b6b', water: '#260f0f' },
  australia: { label: '🦘 Australian Journey',  bg: ['#0d1f0a','#152d10'], accent: '#76c442', water: '#152e0f' },
  bahamas:   { label: '🐚 Bahamas Getaway',     bg: ['#012030','#023050'], accent: '#00e5ff', water: '#015080' },
  hawaii:    { label: '🌺 Hawaiian Escape',      bg: ['#1a0530','#280a48'], accent: '#ff4081', water: '#220a40' },
  mexico:    { label: '🌵 Mexico Adventure',    bg: ['#1a0e00','#2d1800'], accent: '#ff9800', water: '#261800' },
  canada:    { label: '🍁 Canadian Voyage',     bg: ['#0a0a1a','#0f0f28'], accent: '#ef5350', water: '#101d35' },
};

// ── PARSE DATE: mmddyyhhmm ───────────────────────────────────
function parseDepart(str) {
  if (!str || str.length < 8) return null;
  const mo = str.slice(0,2), dd = str.slice(2,4), yy = str.slice(4,6);
  const hh = str.slice(6,8) || '10', mm = str.slice(8,10) || '00';
  return new Date(2000 + parseInt(yy), parseInt(mo)-1, parseInt(dd), parseInt(hh), parseInt(mm));
}

function pad(n) { return String(Math.max(0,n)).padStart(2,'0'); }

function getCountdown(target) {
  const diff = target - Date.now();
  if (diff <= 0) return { days:'00', hours:'00', minutes:'00', seconds:'00', departed: true };
  const s = Math.floor(diff / 1000);
  return {
    days:    pad(Math.floor(s / 86400)),
    hours:   pad(Math.floor((s % 86400) / 3600)),
    minutes: pad(Math.floor((s % 3600) / 60)),
    seconds: pad(s % 60),
    departed: false,
  };
}

function formatDate(d) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ── SATORI JSX-compatible element builder ───────────────────
// Satori accepts React-element-style objects: { type, props }
function el(type, props, ...children) {
  return { type, props: { ...props, children: children.length === 1 ? children[0] : children } };
}

// ── LOAD FONT (fetch from Google Fonts CDN) ─────────────────
async function fetchFont(url) {
  const res = await fetch(url);
  return res.arrayBuffer();
}

// ── MAIN HANDLER ────────────────────────────────────────────
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const p = url.searchParams;

  // Params
  const departStr = p.get('depart') || '';
  const ship      = p.get('ship')   || 'Adventure';
  const destKey   = (p.get('dest')  || 'caribbean').toLowerCase();

  // Resolve destination
  const dest = DESTS[destKey] || DESTS.caribbean;

  // Parse date & countdown
  const targetDate = parseDepart(departStr);
  const cd = targetDate ? getCountdown(targetDate) : { days:'--', hours:'--', minutes:'--', seconds:'--', departed: false };
  const dateLabel = targetDate ? formatDate(targetDate) : 'Date TBD';
  const shipName = ship.charAt(0).toUpperCase() + ship.slice(1);

  // Cache header — revalidate every 60 seconds (countdown changes)
  const headers = {
    'Content-Type': 'image/png',
    'Cache-Control': 'public, max-age=60, s-maxage=60',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    await ensureWasm();

    // Load fonts
    const [playfair, montserrat] = await Promise.all([
      fetchFont('https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQZNLo_U2r.woff'),
      fetchFont('https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew-.woff'),
    ]);

    // ── BUILD THE BANNER ELEMENT (600×120) ──────────────────
    const W = 600, H = 120;
    const [bg1, bg2] = dest.bg;

    // Porthole box component
    const portholeBox = (num, lbl) => el('div', {
      style: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
      }
    },
      el('div', {
        style: {
          width: '52px', height: '52px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          border: `2px solid ${dest.accent}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 0 3px rgba(255,255,255,0.04)`,
        }
      },
        el('span', { style: { fontFamily: 'Playfair', fontSize: '20px', fontWeight: 700, color: '#F5C842', lineHeight: 1 } }, num)
      ),
      el('span', { style: { fontFamily: 'Montserrat', fontSize: '7px', color: 'rgba(240,248,255,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase' } }, lbl)
    );

    const bannerEl = el('div', {
      style: {
        width: `${W}px`, height: `${H}px`,
        display: 'flex', flexDirection: 'row',
        background: `linear-gradient(135deg, ${bg1} 0%, ${bg2} 100%)`,
        borderRadius: '10px',
        overflow: 'hidden',
        fontFamily: 'Montserrat',
        position: 'relative',
      }
    },
      // Left: text info
      el('div', {
        style: {
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '16px 18px', flex: 1, gap: '4px',
        }
      },
        el('span', { style: { fontFamily: 'Montserrat', fontSize: '9px', color: dest.accent, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 } }, dest.label),
        el('div', { style: { display: 'flex', flexDirection: 'row', alignItems: 'baseline', gap: '5px' } },
          el('span', { style: { fontFamily: 'Playfair', fontSize: '11px', color: 'rgba(240,248,255,0.5)', fontStyle: 'italic' } }, 'The'),
          el('span', { style: { fontFamily: 'Playfair', fontSize: '18px', fontWeight: 700, color: '#ffffff' } }, shipName),
          el('span', { style: { fontFamily: 'Playfair', fontSize: '11px', color: '#F5C842', fontStyle: 'italic' } }, 'of the Seas'),
        ),
        el('span', { style: { fontFamily: 'Montserrat', fontSize: '8px', color: 'rgba(240,248,255,0.4)', letterSpacing: '1px' } }, `Sails ${dateLabel}`),
        // Countdown row
        el('div', { style: { display: 'flex', flexDirection: 'row', gap: '6px', marginTop: '6px', alignItems: 'center' } },
          ...(cd.departed
            ? [el('span', { style: { fontFamily: 'Playfair', fontSize: '16px', color: '#F5C842' } }, '🛳️ Bon Voyage!')]
            : [
                portholeBox(cd.days, 'Days'),
                portholeBox(cd.hours, 'Hrs'),
                portholeBox(cd.minutes, 'Min'),
                portholeBox(cd.seconds, 'Sec'),
              ]
          ),
        ),
      ),

      // Right: ship + wave scene
      el('div', {
        style: {
          width: '180px', height: `${H}px`,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'flex-end',
          position: 'relative',
          overflow: 'hidden',
        }
      },
        // Wave background
        el('div', {
          style: {
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '50px',
            background: dest.water,
          }
        }),
        el('div', {
          style: {
            position: 'absolute', bottom: '30px', left: 0, right: 0, height: '20px',
            background: bg2, opacity: '0.6',
            borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
          }
        }),
        // Simple ship silhouette SVG
        el('div', {
          style: {
            position: 'absolute', bottom: '28px', left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
          }
        },
          // Ship hull block (simplified)
          el('div', { style: { position: 'relative', width: '90px', height: '50px', display: 'flex', alignItems: 'flex-end' } },
            el('div', { style: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '14px', background: '#1a3d6b', borderRadius: '2px 2px 4px 4px' } }),
            el('div', { style: { position: 'absolute', bottom: '12px', left: '15px', width: '60px', height: '18px', background: '#1e4a80', borderRadius: '2px 2px 0 0' } }),
            el('div', { style: { position: 'absolute', bottom: '28px', left: '28px', width: '34px', height: '12px', background: '#245a9e', borderRadius: '2px 2px 0 0' } }),
            el('div', { style: { position: 'absolute', bottom: '38px', left: '38px', width: '6px', height: '10px', background: '#1a3d6b', borderRadius: '2px 2px 0 0' } }),
            el('div', { style: { position: 'absolute', bottom: '11px', left: '16px', right: '16px', height: '2px', background: '#F5C842', opacity: '0.7' } }),
          )
        ),
        // Watermark
        el('div', {
          style: {
            position: 'absolute', bottom: '4px', right: '8px',
            fontFamily: 'Montserrat', fontSize: '7px',
            color: 'rgba(240,248,255,0.2)', letterSpacing: '0.5px',
          }
        }, 'mycruise.fyi'),
        // Accent bar
        el('div', {
          style: {
            position: 'absolute', top: 0, right: 0, width: '4px', height: `${H}px`,
            background: dest.accent, opacity: '0.3',
          }
        }),
      )
    );

    // ── RENDER SVG via Satori ───────────────────────────────
    const svg = await satori(bannerEl, {
      width: W,
      height: H,
      fonts: [
        { name: 'Montserrat', data: montserrat, weight: 400, style: 'normal' },
        { name: 'Playfair',   data: playfair,   weight: 700, style: 'normal' },
      ],
    });

    // ── CONVERT SVG → PNG via resvg-wasm ───────────────────
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: W } });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    return new Response(pngBuffer, { headers });

  } catch (err) {
    // Fallback: return a plain SVG on error
    console.error('sig.png error:', err);
    const fallback = `<svg width="600" height="120" xmlns="http://www.w3.org/2000/svg">
      <rect width="600" height="120" rx="10" fill="#071828"/>
      <text x="300" y="65" text-anchor="middle" font-family="serif" font-size="18" fill="#F5C842">🛳️ mycruise.fyi</text>
    </svg>`;
    return new Response(fallback, { headers: { 'Content-Type': 'image/svg+xml', 'Access-Control-Allow-Origin': '*' } });
  }
}
