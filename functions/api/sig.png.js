import satori from 'satori';

const DESTS = {
  alaska:    { label: 'Alaska Expedition',   emoji: '🏔', bg1: '#071828', bg2: '#0d3050', accent: '#7ee8e8', gold: '#F5C842' },
  caribbean: { label: 'Caribbean Escape',    emoji: '🌴', bg1: '#021830', bg2: '#053050', accent: '#00d4aa', gold: '#F5C842' },
  europe:    { label: 'European Voyage',     emoji: '🏰', bg1: '#1a0e2e', bg2: '#2a1850', accent: '#c9a0e0', gold: '#F5C842' },
  asia:      { label: 'Asian Adventure',     emoji: '🏯', bg1: '#1a0808', bg2: '#2d1010', accent: '#ff6b6b', gold: '#F5C842' },
  australia: { label: 'Australian Journey',  emoji: '🦘', bg1: '#0d1f0a', bg2: '#1a3a10', accent: '#76c442', gold: '#F5C842' },
  bahamas:   { label: 'Bahamas Getaway',     emoji: '🐚', bg1: '#012030', bg2: '#023858', accent: '#00e5ff', gold: '#F5C842' },
  hawaii:    { label: 'Hawaiian Escape',      emoji: '🌺', bg1: '#1a0530', bg2: '#2a0a48', accent: '#ff4081', gold: '#F5C842' },
  mexico:    { label: 'Mexico Adventure',    emoji: '🌵', bg1: '#1a0e00', bg2: '#2d1800', accent: '#ff9800', gold: '#F5C842' },
  canada:    { label: 'Canadian Voyage',     emoji: '🍁', bg1: '#0a0a1a', bg2: '#141428', accent: '#ef5350', gold: '#F5C842' },
};

function parseDepart(str) {
  if (!str || str.length < 8) return null;
  const mo=str.slice(0,2),dd=str.slice(2,4),yy=str.slice(4,6);
  const hh=str.slice(6,8)||'10',mm=str.slice(8,10)||'00';
  return new Date(2000+parseInt(yy),parseInt(mo)-1,parseInt(dd),parseInt(hh),parseInt(mm));
}
function pad(n){return String(Math.max(0,n)).padStart(2,'0');}
function getCountdown(target){
  const diff=target-Date.now();
  if(diff<=0)return{days:'00',hours:'00',minutes:'00',seconds:'00',departed:true};
  const s=Math.floor(diff/1000);
  return{days:pad(Math.floor(s/86400)),hours:pad(Math.floor((s%86400)/3600)),minutes:pad(Math.floor((s%3600)/60)),seconds:pad(s%60),departed:false};
}
function formatDate(d){
  return d.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
}

// Ship SVG as inline path data rendered via satori's img support
// We embed the ship as an SVG data-uri for the left panel
const SHIP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" fill="none">
  <!-- water -->
  <path d="M0,110 Q25,102 50,110 Q75,118 100,110 Q125,102 150,110 Q175,118 200,110 L200,140 L0,140 Z" fill="rgba(255,255,255,0.12)"/>
  <!-- hull -->
  <path d="M15,90 L185,90 L175,112 L25,112 Z" fill="rgba(255,255,255,0.9)"/>
  <!-- gold waterline -->
  <rect x="28" y="107" width="144" height="3" fill="#F5C842" opacity="0.85"/>
  <!-- superstructure base -->
  <rect x="50" y="62" width="120" height="30" rx="3" fill="rgba(255,255,255,0.85)"/>
  <!-- windows row -->
  <rect x="58" y="68" width="14" height="10" rx="2" fill="rgba(10,40,80,0.6)"/>
  <rect x="78" y="68" width="14" height="10" rx="2" fill="rgba(10,40,80,0.6)"/>
  <rect x="98" y="68" width="14" height="10" rx="2" fill="rgba(10,40,80,0.6)"/>
  <rect x="118" y="68" width="14" height="10" rx="2" fill="rgba(10,40,80,0.6)"/>
  <rect x="138" y="68" width="14" height="10" rx="2" fill="rgba(10,40,80,0.6)"/>
  <!-- window reflections -->
  <rect x="59" y="69" width="5" height="3" rx="1" fill="rgba(255,255,255,0.4)"/>
  <rect x="79" y="69" width="5" height="3" rx="1" fill="rgba(255,255,255,0.4)"/>
  <rect x="99" y="69" width="5" height="3" rx="1" fill="rgba(255,255,255,0.4)"/>
  <rect x="119" y="69" width="5" height="3" rx="1" fill="rgba(255,255,255,0.4)"/>
  <rect x="139" y="69" width="5" height="3" rx="1" fill="rgba(255,255,255,0.4)"/>
  <!-- bridge level -->
  <rect x="72" y="40" width="80" height="24" rx="3" fill="rgba(255,255,255,0.8)"/>
  <rect x="80" y="45" width="12" height="10" rx="2" fill="rgba(10,40,80,0.55)"/>
  <rect x="97" y="45" width="12" height="10" rx="2" fill="rgba(10,40,80,0.55)"/>
  <rect x="114" y="45" width="12" height="10" rx="2" fill="rgba(10,40,80,0.55)"/>
  <rect x="131" y="45" width="12" height="10" rx="2" fill="rgba(10,40,80,0.55)"/>
  <!-- funnel -->
  <rect x="98" y="20" width="18" height="22" rx="4" fill="rgba(255,255,255,0.85)"/>
  <rect x="98" y="28" width="18" height="7" fill="#F5C842" opacity="0.9"/>
  <!-- smoke puffs -->
  <circle cx="107" cy="14" r="5" fill="rgba(255,255,255,0.2)"/>
  <circle cx="113" cy="9" r="4" fill="rgba(255,255,255,0.13)"/>
  <circle cx="103" cy="7" r="3" fill="rgba(255,255,255,0.1)"/>
  <!-- bow -->
  <path d="M185,90 L196,105 L175,112 Z" fill="rgba(255,255,255,0.7)"/>
  <!-- flag -->
  <line x1="107" y1="6" x2="107" y2="20" stroke="#F5C842" stroke-width="1.5"/>
  <path d="M107,6 L118,9 L107,13 Z" fill="#F5C842"/>
  <!-- anchor on hull -->
  <text x="100" y="104" font-family="serif" font-size="10" fill="#F5C842" opacity="0.5" text-anchor="middle">⚓</text>
</svg>`;

const SHIP_DATA_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SHIP_SVG)}`;

async function fetchFont(url){
  const r=await fetch(url);
  if(!r.ok)throw new Error(`Font ${r.status}`);
  return r.arrayBuffer();
}

export async function onRequest(context){
  const url=new URL(context.request.url);
  const p=url.searchParams;
  const departStr=p.get('depart')||'';
  const ship=(p.get('ship')||'Adventure').replace(/\b\w/g,c=>c.toUpperCase());
  const destKey=(p.get('dest')||'caribbean').toLowerCase();
  const dest=DESTS[destKey]||DESTS.caribbean;

  const targetDate=parseDepart(departStr);
  const cd=targetDate?getCountdown(targetDate):{days:'--',hours:'--',minutes:'--',seconds:'--',departed:false};
  const dateLabel=targetDate?formatDate(targetDate):'Date TBD';

  try{
    const [fontReg,fontBold]=await Promise.all([
      fetchFont('https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew-.woff'),
      fetchFont('https://fonts.gstatic.com/s/montserrat/v26/JTUFjIg1_i6t8kCHKm459Wx7xQYXK0vOoz6jq6R9WXh0oA.woff'),
    ]);

    const h=(type,style,...children)=>({type,props:{style,children:children.length===1?children[0]:children}});

    // ── COUNTDOWN UNIT ──
    const unit=(num,lbl)=>h('div',
      {display:'flex',flexDirection:'column',alignItems:'center',gap:'3px'},
      h('div',{
        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
        width:'56px',height:'52px',
        background:'rgba(255,255,255,0.08)',
        border:`1px solid ${dest.accent}44`,
        borderRadius:'8px',
      },
        h('span',{fontSize:'24px',fontWeight:700,color:'#F5C842',fontFamily:'Montserrat',lineHeight:'1'},num),
      ),
      h('span',{fontSize:'7px',fontWeight:700,color:'rgba(255,255,255,0.4)',letterSpacing:'1.5px',fontFamily:'Montserrat'},lbl)
    );

    // separator dot
    const dot=h('span',{fontSize:'22px',color:'rgba(255,255,255,0.2)',fontFamily:'Montserrat',paddingBottom:'18px'},'·');

    const banner=h('div',{
      width:'600px',height:'130px',
      display:'flex',flexDirection:'row',
      background:`linear-gradient(135deg, ${dest.bg1} 0%, ${dest.bg2} 100%)`,
      borderRadius:'12px',
      overflow:'hidden',
      fontFamily:'Montserrat',
    },
      // ── LEFT: ship image panel ──
      h('div',{
        width:'170px',height:'130px',
        display:'flex',alignItems:'center',justifyContent:'center',
        background:'rgba(255,255,255,0.04)',
        borderRight:`1px solid rgba(255,255,255,0.08)`,
        position:'relative',
        overflow:'hidden',
      },
        // glow behind ship
        h('div',{
          position:'absolute',
          width:'120px',height:'120px',
          borderRadius:'60px',
          background:dest.accent,
          opacity:'0.06',
        }),
        h('img',{
          src:SHIP_DATA_URI,
          width:'148',height:'104',
        })
      ),

      // ── RIGHT: text + countdown ──
      h('div',{
        display:'flex',flexDirection:'column',justifyContent:'center',
        padding:'12px 16px 12px 20px',
        flex:1,gap:'6px',
      },
        // destination badge
        h('div',{display:'flex',flexDirection:'row',alignItems:'center',gap:'6px'},
          h('span',{
            fontSize:'8px',fontWeight:700,color:dest.bg1,
            background:dest.accent,
            padding:'2px 8px',borderRadius:'20px',
            letterSpacing:'1.5px',fontFamily:'Montserrat',
          },dest.emoji+' '+dest.label.toUpperCase()),
        ),

        // ship name
        h('div',{display:'flex',flexDirection:'row',alignItems:'baseline',gap:'5px',flexWrap:'nowrap'},
          h('span',{fontSize:'11px',color:'rgba(255,255,255,0.45)',fontFamily:'Montserrat'},'The'),
          h('span',{fontSize:'21px',fontWeight:700,color:'#ffffff',fontFamily:'Montserrat',lineHeight:'1.1'},ship),
          h('span',{fontSize:'11px',color:'#F5C842',fontFamily:'Montserrat'},'of the Seas'),
        ),

        // date line
        h('span',{fontSize:'8px',color:'rgba(255,255,255,0.35)',letterSpacing:'0.8px',fontFamily:'Montserrat'},
          '⚓  Sails '+dateLabel
        ),

        // countdown boxes
        cd.departed
          ? h('span',{fontSize:'18px',fontWeight:700,color:'#F5C842',fontFamily:'Montserrat'},'🛳 Bon Voyage!')
          : h('div',{display:'flex',flexDirection:'row',alignItems:'center',gap:'4px',marginTop:'2px'},
              unit(cd.days,'DAYS'), dot,
              unit(cd.hours,'HRS'), dot,
              unit(cd.minutes,'MIN'), dot,
              unit(cd.seconds,'SEC'),
            ),
      ),

      // ── FAR RIGHT: accent stripe ──
      h('div',{
        width:'5px',height:'130px',
        background:`linear-gradient(180deg, ${dest.accent} 0%, transparent 100%)`,
        opacity:'0.5',
      }),
    );

    const svg=await satori(banner,{
      width:600,height:130,
      fonts:[
        {name:'Montserrat',data:fontReg, weight:400,style:'normal'},
        {name:'Montserrat',data:fontBold,weight:700,style:'normal'},
      ],
    });

    return new Response(svg,{
      headers:{
        'Content-Type':'image/svg+xml',
        'Cache-Control':'public, max-age=60, s-maxage=60',
        'Access-Control-Allow-Origin':'*',
      },
    });

  }catch(err){
    console.error('sig error:',err?.message||err);
    const fallback=`<svg width="600" height="130" xmlns="http://www.w3.org/2000/svg">
      <rect width="600" height="130" rx="12" fill="${dest.bg1}"/>
      <text x="300" y="55" text-anchor="middle" font-family="serif" font-size="16" fill="${dest.accent}">${dest.emoji} ${ship} of the Seas</text>
      <text x="300" y="82" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#F5C842">${cd.days}d  ${cd.hours}h  ${cd.minutes}m until departure</text>
      <text x="300" y="105" text-anchor="middle" font-family="sans-serif" font-size="9" fill="rgba(240,248,255,0.25)">Sails ${dateLabel}  ·  mycruise.fyi</text>
    </svg>`;
    return new Response(fallback,{
      headers:{'Content-Type':'image/svg+xml','Cache-Control':'public, max-age=60','Access-Control-Allow-Origin':'*'},
    });
  }
}
