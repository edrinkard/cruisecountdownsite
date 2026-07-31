// Cloudflare Pages Function — /api/sig.png
// Uses satori only (SVG output) + returns SVG as image
// Avoids resvg-wasm which has WASM loading issues on CF Pages edge runtime

import satori from 'satori';

// ── DESTINATION CONFIG ──────────────────────────────────────
const DESTS = {
  alaska:    { label: '🏔 Alaska Expedition',   bg1: '#071828', bg2: '#0d2a40', accent: '#7ee8e8', water: '#0f2e45' },
  caribbean: { label: '🌴 Caribbean Escape',    bg1: '#021830', bg2: '#052840', accent: '#00d4aa', water: '#0a5070' },
  europe:    { label: '🏰 European Voyage',     bg1: '#1a0e2e', bg2: '#251542', accent: '#c9a0e0', water: '#2a1848' },
  asia:      { label: '🏯 Asian Adventure',     bg1: '#1a0808', bg2: '#2d1010', accent: '#ff6b6b', water: '#260f0f' },
  australia: { label: '🦘 Australian Journey',  bg1: '#0d1f0a', bg2: '#152d10', accent: '#76c442', water: '#152e0f' },
  bahamas:   { label: '🐚 Bahamas Getaway',     bg1: '#012030', bg2: '#023050', accent: '#00e5ff', water: '#015080' },
  hawaii:    { label: '🌺 Hawaiian Escape',      bg1: '#1a0530', bg2: '#280a48', accent: '#ff4081', water: '#220a40' },
  mexico:    { label: '🌵 Mexico Adventure',    bg1: '#1a0e00', bg2: '#2d1800', accent: '#ff9800', water: '#261800' },
  canada:    { label: '🍁 Canadian Voyage',     bg1: '#0a0a1a', bg2: '#0f0f28', accent: '#ef5350', water: '#101d35' },
};

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

async function fetchFont(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font fetch failed: ${res.status}`);
  return res.arrayBuffer();
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const p = url.searchParams;

  const departStr = p.get('depart') || '';
  const ship      = (p.get('ship') || 'Adventure').replace(/\b\w/g, c => c.toUpperCase());
  const destKey   = (p.get('dest') || 'caribbean').toLowerCase();
  const dest      = DESTS[destKey] || DESTS.caribbean;

  const targetDate = parseDepart(departStr);
  const cd = targetDate ? getCountdown(targetDate) : { days:'--', hours:'--', minutes:'--', seconds:'--', departed: false };
  const dateLabel = targetDate ? formatDate(targetDate) : 'Date TBD';

  try {
    // Fetch fonts from Google's CDN
    const [fontRegular, fontBold] = await Promise.all([
      fetchFont('https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew-.woff'),
      fetchFont('https://fonts.gstatic.com/s/montserrat/v26/JTUFjIg1_i6t8kCHKm459Wx7xQYXK0vOoz6jq6R9WXh0oA.woff'),
    ]);

    // Helper to make satori elements
    const h = (type, style, ...children) => ({
      type, props: { style, children: children.length === 1 ? children[0] : children }
    });

    // Countdown box
    const box = (num, lbl) => h('div',
      { display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' },
      h('div', {
        width:'48px', height:'48px', borderRadius:'24px',
        background:'rgba(255,255,255,0.07)',
        border:`1.5px solid ${dest.accent}55`,
        display:'flex', alignItems:'center', justifyContent:'center',
      },
        h('span', { fontSize:'19px', fontWeight:700, color:'#F5C842', fontFamily:'Montserrat' }, num)
      ),
      h('span', { fontSize:'7px', color:'rgba(240,248,255,0.4)', letterSpacing:'1.5px', fontFamily:'Montserrat' }, lbl)
    );

    const banner = h('div', {
      width:'600px', height:'120px',
      display:'flex', flexDirection:'row',
      background:`linear-gradient(135deg, ${dest.bg1} 0%, ${dest.bg2} 100%)`,
      borderRadius:'10px', overflow:'hidden',
    },
      // ── LEFT PANEL ──
      h('div', {
        display:'flex', flexDirection:'column', justifyContent:'center',
        padding:'14px 16px', gap:'5px', flex:1,
      },
        // Destination label
        h('span', {
          fontSize:'8px', fontWeight:700, color: dest.accent,
          letterSpacing:'2px', fontFamily:'Montserrat',
        }, dest.label),

        // Ship name row
        h('div', { display:'flex', flexDirection:'row', alignItems:'baseline', gap:'4px' },
          h('span', { fontSize:'10px', color:'rgba(240,248,255,0.45)', fontFamily:'Montserrat' }, 'The'),
          h('span', { fontSize:'20px', fontWeight:700, color:'#ffffff', fontFamily:'Montserrat' }, ship),
          h('span', { fontSize:'10px', color:'#F5C842', fontFamily:'Montserrat' }, 'of the Seas'),
        ),

        // Date
        h('span', { fontSize:'8px', color:'rgba(240,248,255,0.38)', letterSpacing:'0.8px', fontFamily:'Montserrat' },
          `Sails ${dateLabel}`
        ),

        // Countdown row
        h('div', { display:'flex', flexDirection:'row', gap:'5px', marginTop:'4px', alignItems:'center' },
          cd.departed
            ? h('span', { fontSize:'15px', color:'#F5C842', fontFamily:'Montserrat' }, 'Bon Voyage!')
            : h('div', { display:'flex', flexDirection:'row', gap:'5px' },
                box(cd.days,    'DAYS'),
                box(cd.hours,   'HRS'),
                box(cd.minutes, 'MIN'),
                box(cd.seconds, 'SEC'),
              )
        ),
      ),

      // ── RIGHT PANEL: wave scene ──
      h('div', {
        width:'160px', height:'120px',
        display:'flex', flexDirection:'column',
        justifyContent:'flex-end',
        position:'relative', overflow:'hidden',
        background:`linear-gradient(180deg, ${dest.bg1} 0%, ${dest.water} 100%)`,
      },
        // wave strip
        h('div', {
          position:'absolute', bottom:'0', left:'0', right:'0', height:'45px',
          background: dest.water,
        }),
        // wave curve
        h('div', {
          position:'absolute', bottom:'35px', left:'-10px', right:'-10px', height:'18px',
          background: dest.bg2,
          borderRadius:'50%',
        }),
        // ship hull
        h('div', {
          position:'absolute', bottom:'32px', left:'35px',
          width:'90px', height:'46px', display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'flex-end',
        },
          // funnel
          h('div', { position:'absolute', top:'0', left:'37px', width:'14px', height:'14px', background:'#1a3d6b', borderRadius:'2px' }),
          h('div', { position:'absolute', top:'6px', left:'37px', width:'14px', height:'4px', background:'#F5C842' }),
          // bridge
          h('div', { position:'absolute', top:'12px', left:'23px', width:'44px', height:'12px', background:'#245a9e', borderRadius:'2px 2px 0 0' }),
          // superstructure
          h('div', { position:'absolute', top:'22px', left:'12px', width:'66px', height:'14px', background:'#1e4a80', borderRadius:'1px' }),
          // hull
          h('div', { position:'absolute', bottom:'0', left:'0', right:'0', height:'12px', background:'#1a3d6b', borderRadius:'2px 2px 3px 3px' }),
          // gold stripe
          h('div', { position:'absolute', bottom:'9px', left:'4px', right:'4px', height:'2px', background:'#F5C842', opacity:'0.7' }),
        ),
        // watermark
        h('div', {
          position:'absolute', bottom:'3px', right:'6px',
          fontSize:'7px', color:'rgba(240,248,255,0.2)', fontFamily:'Montserrat',
        }, 'mycruise.fyi'),
        // accent bar
        h('div', {
          position:'absolute', top:'0', right:'0', width:'3px', height:'120px',
          background: dest.accent, opacity:'0.35',
        }),
      )
    );

    const svg = await satori(banner, {
      width: 600,
      height: 120,
      fonts: [
        { name: 'Montserrat', data: fontRegular, weight: 400, style: 'normal' },
        { name: 'Montserrat', data: fontBold,    weight: 700, style: 'normal' },
      ],
    });

    // Return as SVG image — works in all browsers and forum [IMG] tags
    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60, s-maxage=60',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (err) {
    console.error('sig error:', err?.message || err);
    // Minimal fallback SVG
    const fallback = `<svg width="600" height="120" xmlns="http://www.w3.org/2000/svg">
      <rect width="600" height="120" rx="10" fill="${dest.bg1}"/>
      <text x="300" y="55" text-anchor="middle" font-family="serif" font-size="16" fill="${dest.accent}">🛳 ${ship} of the Seas</text>
      <text x="300" y="78" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#F5C842">${cd.days}d ${cd.hours}h ${cd.minutes}m until departure</text>
      <text x="300" y="108" text-anchor="middle" font-family="sans-serif" font-size="9" fill="rgba(240,248,255,0.3)">mycruise.fyi</text>
    </svg>`;
    return new Response(fallback, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
