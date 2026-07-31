import satori from 'satori';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Load fonts from the installed npm package at build time
// @fontsource/montserrat ships woff2 files we can read directly
const __dirname = dirname(fileURLToPath(import.meta.url));

function loadFont(weight) {
  // Path inside the installed @fontsource/montserrat package
  const fontPath = join(__dirname, '../../node_modules/@fontsource/montserrat/files',
    `montserrat-latin-${weight}-normal.woff2`);
  return readFileSync(fontPath);
}

let fontReg, fontBold;
try {
  fontReg  = loadFont(400);
  fontBold = loadFont(700);
} catch(e) {
  console.error('Font load error:', e.message);
}

const DESTS = {
  alaska:    { label:'Alaska Expedition',  emoji:'🏔', bg1:'#071828', bg2:'#0d3050', accent:'#7ee8e8' },
  caribbean: { label:'Caribbean Escape',   emoji:'🌴', bg1:'#021830', bg2:'#053050', accent:'#00d4aa' },
  europe:    { label:'European Voyage',    emoji:'🏰', bg1:'#1a0e2e', bg2:'#2a1850', accent:'#c9a0e0' },
  asia:      { label:'Asian Adventure',    emoji:'🏯', bg1:'#1a0808', bg2:'#2d1010', accent:'#ff6b6b' },
  australia: { label:'Australian Journey', emoji:'🦘', bg1:'#0d1f0a', bg2:'#1a3a10', accent:'#76c442' },
  bahamas:   { label:'Bahamas Getaway',    emoji:'🐚', bg1:'#012030', bg2:'#023858', accent:'#00e5ff' },
  hawaii:    { label:'Hawaiian Escape',    emoji:'🌺', bg1:'#1a0530', bg2:'#2a0a48', accent:'#ff4081' },
  mexico:    { label:'Mexico Adventure',   emoji:'🌵', bg1:'#1a0e00', bg2:'#2d1800', accent:'#ff9800' },
  canada:    { label:'Canadian Voyage',    emoji:'🍁', bg1:'#0a0a1a', bg2:'#141428', accent:'#ef5350' },
};

function parseDepart(str){
  if(!str||str.length<8)return null;
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

function h(type, style, ...children){
  const c = children.length === 0 ? undefined : children.length === 1 ? children[0] : children;
  return { type, props: { style, children: c } };
}

function buildShip(accent){
  const W = 'rgba(255,255,255,0.92)';
  const G = '#F5C842';
  const win  = ()=>h('div',{width:'10px',height:'9px', borderRadius:'1px',background:'rgba(10,40,100,0.65)',marginRight:'3px'});
  const win2 = ()=>h('div',{width:'9px', height:'8px', borderRadius:'1px',background:'rgba(10,40,100,0.6)', marginRight:'3px'});

  return h('div',{display:'flex',flexDirection:'column',alignItems:'center',width:'150px'},
    // smoke
    h('div',{display:'flex',flexDirection:'row',alignItems:'flex-end',gap:'3px',marginBottom:'2px',marginLeft:'12px'},
      h('div',{width:'9px',height:'9px',borderRadius:'5px',background:'rgba(255,255,255,0.2)'}),
      h('div',{width:'7px',height:'7px',borderRadius:'4px',background:'rgba(255,255,255,0.13)'}),
      h('div',{width:'5px',height:'5px',borderRadius:'3px',background:'rgba(255,255,255,0.08)'}),
    ),
    // funnel
    h('div',{display:'flex',flexDirection:'column',alignItems:'center',marginLeft:'10px'},
      h('div',{width:'14px',height:'12px',borderRadius:'2px 2px 0 0',background:W}),
      h('div',{width:'14px',height:'4px',background:G}),
    ),
    // bridge
    h('div',{width:'62px',height:'16px',borderRadius:'2px 2px 0 0',background:W,
      display:'flex',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:'3px',paddingTop:'4px'},
      win2(), win2(), win2(), win2(),
    ),
    // superstructure
    h('div',{width:'104px',height:'18px',borderRadius:'2px 2px 0 0',background:W,
      display:'flex',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:'2px',paddingTop:'4px'},
      win(), win(), win(), win(), win(),
    ),
    // hull
    h('div',{width:'138px',height:'16px',borderRadius:'1px 1px 5px 5px',background:W,
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end',paddingBottom:'3px'},
      h('div',{width:'120px',height:'3px',background:G,borderRadius:'1px'}),
    ),
    // water
    h('div',{width:'150px',height:'8px',borderRadius:'0 0 6px 6px',
      background:`linear-gradient(180deg, ${accent}40 0%, ${accent}10 100%)`}),
  );
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
    if(!fontReg||!fontBold) throw new Error('Fonts not loaded at startup');

    const unit=(num,lbl)=>h('div',
      {display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'},
      h('div',{display:'flex',alignItems:'center',justifyContent:'center',
        width:'52px',height:'44px',
        background:'rgba(255,255,255,0.07)',
        border:'1px solid rgba(255,255,255,0.14)',
        borderRadius:'7px'},
        h('span',{fontSize:'21px',fontWeight:700,color:'#F5C842',fontFamily:'Montserrat'},num)
      ),
      h('span',{fontSize:'7px',fontWeight:700,color:'rgba(255,255,255,0.32)',letterSpacing:'1.5px',fontFamily:'Montserrat'},lbl)
    );

    const sep=()=>h('span',{fontSize:'16px',color:'rgba(255,255,255,0.15)',fontFamily:'Montserrat',
      display:'flex',alignItems:'center',height:'44px',paddingBottom:'14px'},':');

    const banner=h('div',{
      width:'600px',height:'130px',
      display:'flex',flexDirection:'row',
      background:`linear-gradient(135deg, ${dest.bg1} 0%, ${dest.bg2} 100%)`,
      borderRadius:'12px',
      overflow:'hidden',
    },
      h('div',{width:'168px',height:'130px',
        display:'flex',alignItems:'center',justifyContent:'center',
        borderRight:'1px solid rgba(255,255,255,0.06)',
        background:'rgba(0,0,0,0.18)'},
        buildShip(dest.accent)
      ),
      h('div',{display:'flex',flexDirection:'column',justifyContent:'center',
        padding:'10px 8px 10px 16px',flex:1,gap:'4px'},
        h('div',{display:'flex',flexDirection:'row',alignItems:'center'},
          h('div',{display:'flex',alignItems:'center',background:dest.accent,
            borderRadius:'20px',padding:'2px 10px'},
            h('span',{fontSize:'7px',fontWeight:700,color:dest.bg1,letterSpacing:'1.5px',fontFamily:'Montserrat'},
              dest.emoji+'  '+dest.label.toUpperCase())
          )
        ),
        h('div',{display:'flex',flexDirection:'row',alignItems:'baseline',gap:'4px'},
          h('span',{fontSize:'10px',color:'rgba(255,255,255,0.38)',fontFamily:'Montserrat'},'The'),
          h('span',{fontSize:'18px',fontWeight:700,color:'#ffffff',fontFamily:'Montserrat'},ship),
          h('span',{fontSize:'10px',color:'#F5C842',fontFamily:'Montserrat'},'of the Seas'),
        ),
        h('span',{fontSize:'8px',color:'rgba(255,255,255,0.28)',letterSpacing:'0.4px',fontFamily:'Montserrat'},
          'Sails '+dateLabel+'  ·  mycruise.fyi'),
        cd.departed
          ? h('span',{fontSize:'15px',fontWeight:700,color:'#F5C842',fontFamily:'Montserrat'},'Bon Voyage!')
          : h('div',{display:'flex',flexDirection:'row',alignItems:'center',gap:'3px'},
              unit(cd.days,'DAYS'),sep(),
              unit(cd.hours,'HRS'),sep(),
              unit(cd.minutes,'MIN'),sep(),
              unit(cd.seconds,'SEC'),
            ),
      ),
      h('div',{width:'4px',height:'130px',background:dest.accent,opacity:'0.45'}),
    );

    const svg=await satori(banner,{
      width:600,height:130,
      fonts:[
        {name:'Montserrat',data:fontReg, weight:400,style:'normal'},
        {name:'Montserrat',data:fontBold,weight:700,style:'normal'},
      ],
    });

    return new Response(svg,{
      headers:{'Content-Type':'image/svg+xml','Cache-Control':'public, max-age=60, s-maxage=60','Access-Control-Allow-Origin':'*'},
    });

  }catch(err){
    return new Response('ERROR: '+(err?.message||String(err)),{
      headers:{'Content-Type':'text/plain','Access-Control-Allow-Origin':'*'},
    });
  }
}
