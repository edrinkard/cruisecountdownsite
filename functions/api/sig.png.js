import satori from 'satori';

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
async function fetchFont(url){
  const r=await fetch(url);
  if(!r.ok)throw new Error(`Font ${r.status}`);
  return r.arrayBuffer();
}

// Build ship out of pure divs — no images, no SVG, fully satori-compatible
function buildShip(accent) {
  const h=(type,style,...children)=>({type,props:{style,children:children.length===1?children[0]:children.length===0?undefined:children}});
  const W = '#ffffff';
  const G = '#F5C842';

  return h('div',{position:'relative',width:'150px',height:'110px',display:'flex',alignItems:'flex-end',justifyContent:'center'},
    // smoke puffs
    h('div',{position:'absolute',top:'2px',left:'74px',width:'10px',height:'10px',borderRadius:'5px',background:'rgba(255,255,255,0.15)'}),
    h('div',{position:'absolute',top:'0px',left:'82px',width:'8px',height:'8px',borderRadius:'4px',background:'rgba(255,255,255,0.1)'}),
    // funnel
    h('div',{position:'absolute',top:'12px',left:'70px',width:'14px',height:'18px',borderRadius:'3px 3px 0 0',background:W,opacity:'0.9'}),
    // funnel stripe
    h('div',{position:'absolute',top:'20px',left:'70px',width:'14px',height:'5px',background:G,opacity:'0.9'}),
    // bridge top
    h('div',{position:'absolute',top:'28px',left:'52px',width:'54px',height:'18px',borderRadius:'3px 3px 0 0',background:W,opacity:'0.85'}),
    // bridge windows
    h('div',{position:'absolute',top:'31px',left:'57px',width:'9px',height:'8px',borderRadius:'1px',background:'rgba(20,60,120,0.7)'}),
    h('div',{position:'absolute',top:'31px',left:'70px',width:'9px',height:'8px',borderRadius:'1px',background:'rgba(20,60,120,0.7)'}),
    h('div',{position:'absolute',top:'31px',left:'83px',width:'9px',height:'8px',borderRadius:'1px',background:'rgba(20,60,120,0.7)'}),
    // superstructure
    h('div',{position:'absolute',top:'44px',left:'34px',width:'90px',height:'22px',borderRadius:'2px 2px 0 0',background:W,opacity:'0.85'}),
    // super windows row
    h('div',{position:'absolute',top:'48px',left:'40px',width:'10px',height:'9px',borderRadius:'1px',background:'rgba(20,60,120,0.6)'}),
    h('div',{position:'absolute',top:'48px',left:'55px',width:'10px',height:'9px',borderRadius:'1px',background:'rgba(20,60,120,0.6)'}),
    h('div',{position:'absolute',top:'48px',left:'70px',width:'10px',height:'9px',borderRadius:'1px',background:'rgba(20,60,120,0.6)'}),
    h('div',{position:'absolute',top:'48px',left:'85px',width:'10px',height:'9px',borderRadius:'1px',background:'rgba(20,60,120,0.6)'}),
    h('div',{position:'absolute',top:'48px',left:'100px',width:'10px',height:'9px',borderRadius:'1px',background:'rgba(20,60,120,0.6)'}),
    // hull
    h('div',{position:'absolute',top:'64px',left:'10px',width:'130px',height:'22px',borderRadius:'2px 2px 6px 6px',background:W,opacity:'0.9'}),
    // gold waterline stripe
    h('div',{position:'absolute',top:'78px',left:'14px',width:'118px',height:'3px',background:G,opacity:'0.85'}),
    // bow tip
    h('div',{position:'absolute',top:'66px',left:'136px',width:'14px',height:'18px',borderRadius:'0 6px 6px 0',background:W,opacity:'0.75'}),
    // water wave 1
    h('div',{position:'absolute',top:'88px',left:'0px',width:'155px',height:'12px',borderRadius:'50%',background:accent,opacity:'0.15'}),
    // water wave 2
    h('div',{position:'absolute',top:'94px',left:'10px',width:'135px',height:'10px',borderRadius:'50%',background:accent,opacity:'0.1'}),
    // anchor text on hull
    h('div',{position:'absolute',top:'67px',left:'68px',fontSize:'10px',color:G,opacity:'0.5',fontFamily:'Montserrat'},'⚓'),
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
    const [fontReg,fontBold]=await Promise.all([
      fetchFont('https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew-.woff'),
      fetchFont('https://fonts.gstatic.com/s/montserrat/v26/JTUFjIg1_i6t8kCHKm459Wx7xQYXK0vOoz6jq6R9WXh0oA.woff'),
    ]);

    const h=(type,style,...children)=>({type,props:{style,children:children.length===1?children[0]:children.length===0?undefined:children}});

    // countdown unit box
    const unit=(num,lbl)=>h('div',
      {display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'},
      h('div',{
        display:'flex',alignItems:'center',justifyContent:'center',
        width:'52px',height:'46px',
        background:'rgba(255,255,255,0.07)',
        border:`1px solid rgba(255,255,255,0.15)`,
        borderRadius:'8px',
      },
        h('span',{fontSize:'22px',fontWeight:700,color:'#F5C842',fontFamily:'Montserrat',lineHeight:'1'},num)
      ),
      h('span',{fontSize:'7px',fontWeight:700,color:'rgba(255,255,255,0.35)',letterSpacing:'1.5px',fontFamily:'Montserrat'},lbl)
    );

    const sep=h('span',{fontSize:'18px',color:'rgba(255,255,255,0.18)',fontFamily:'Montserrat',paddingBottom:'16px'},':');

    const banner=h('div',{
      width:'600px',height:'130px',
      display:'flex',flexDirection:'row',
      background:`linear-gradient(135deg, ${dest.bg1} 0%, ${dest.bg2} 100%)`,
      borderRadius:'12px',
      overflow:'hidden',
      fontFamily:'Montserrat',
    },
      // LEFT: ship panel
      h('div',{
        width:'175px',height:'130px',
        display:'flex',alignItems:'center',justifyContent:'center',
        borderRight:'1px solid rgba(255,255,255,0.07)',
        background:'rgba(0,0,0,0.15)',
        overflow:'hidden',
        position:'relative',
      },
        // glow
        h('div',{position:'absolute',width:'100px',height:'100px',borderRadius:'50px',background:dest.accent,opacity:'0.07'}),
        buildShip(dest.accent)
      ),

      // RIGHT: info + countdown
      h('div',{
        display:'flex',flexDirection:'column',justifyContent:'center',
        padding:'10px 14px 10px 18px',
        flex:1,gap:'5px',
      },
        // destination pill
        h('div',{display:'flex',flexDirection:'row',alignItems:'center'},
          h('div',{
            display:'flex',alignItems:'center',
            background:dest.accent,
            borderRadius:'20px',
            padding:'2px 10px',
          },
            h('span',{fontSize:'7px',fontWeight:700,color:dest.bg1,letterSpacing:'1.5px',fontFamily:'Montserrat'},
              dest.emoji+'  '+dest.label.toUpperCase()
            )
          )
        ),

        // ship name
        h('div',{display:'flex',flexDirection:'row',alignItems:'baseline',gap:'4px'},
          h('span',{fontSize:'10px',color:'rgba(255,255,255,0.4)',fontFamily:'Montserrat'},'The'),
          h('span',{fontSize:'19px',fontWeight:700,color:'#ffffff',fontFamily:'Montserrat',lineHeight:'1.15'},ship),
          h('span',{fontSize:'10px',color:'#F5C842',fontFamily:'Montserrat'},'of the Seas'),
        ),

        // sail date
        h('span',{fontSize:'8px',color:'rgba(255,255,255,0.3)',letterSpacing:'0.5px',fontFamily:'Montserrat'},
          '⚓  Sails '+dateLabel+'   ·   mycruise.fyi'
        ),

        // countdown
        cd.departed
          ? h('span',{fontSize:'16px',fontWeight:700,color:'#F5C842',fontFamily:'Montserrat'},'🛳  Bon Voyage!')
          : h('div',{display:'flex',flexDirection:'row',alignItems:'center',gap:'4px',marginTop:'1px'},
              unit(cd.days,'DAYS'), sep,
              unit(cd.hours,'HRS'), sep,
              unit(cd.minutes,'MIN'), sep,
              unit(cd.seconds,'SEC'),
            ),
      ),

      // accent bar on right edge
      h('div',{width:'4px',height:'130px',background:dest.accent,opacity:'0.4'}),
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
      <text x="300" y="52" text-anchor="middle" font-family="serif" font-size="15" fill="${dest.accent}">${dest.emoji} ${ship} of the Seas</text>
      <text x="300" y="78" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#F5C842">${cd.days}d  ${cd.hours}h  ${cd.minutes}m  ${cd.seconds}s</text>
      <text x="300" y="100" text-anchor="middle" font-family="sans-serif" font-size="9" fill="rgba(255,255,255,0.25)">Sails ${dateLabel}  ·  mycruise.fyi</text>
    </svg>`;
    return new Response(fallback,{headers:{'Content-Type':'image/svg+xml','Cache-Control':'public, max-age=60','Access-Control-Allow-Origin':'*'}});
  }
}
