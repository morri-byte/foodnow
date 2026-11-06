/* FoodNow – genererede mad-illustrationer (SVG).
   Hver ret har look:"stil:farve1,farve2,farve3". Samme ret giver altid samme billede.
   Når der kommer rigtige fotos, sættes r.img = "billeder/xxx.jpg", så bruges fotoet i stedet. */
(function(){
  let uid = 0;
  function hash(str){ let h = 2166136261; for (let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h>>>0; }
  function rng(seed){ let s = seed || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s>>>0) % 10000) / 10000; }; }
  function shade(hex, amt){
    const n = parseInt(hex.slice(1),16); let r=(n>>16)&255, g=(n>>8)&255, b=n&255;
    const t = amt<0?0:255, p = Math.abs(amt);
    r=Math.round((t-r)*p+r); g=Math.round((t-g)*p+g); b=Math.round((t-b)*p+b);
    return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
  }
  const BG = { k:['#f6e7d3','#f1d9bd'], s:['#e4f0dc','#d2e6c6'], v:['#e7efe1','#d6e4cc'] };

  function blob(cx, cy, rx, ry, rot, fill, R, wob){
    // organisk form af 8 punkter
    const pts=[]; const n=8;
    for(let i=0;i<n;i++){ const a=i/n*Math.PI*2; const k=1+(R()-.5)*(wob||.25); pts.push([cx+Math.cos(a)*rx*k, cy+Math.sin(a)*ry*k]); }
    let d='M'+((pts[0][0]+pts[n-1][0])/2)+','+((pts[0][1]+pts[n-1][1])/2);
    for(let i=0;i<n;i++){ const p=pts[i], q=pts[(i+1)%n]; d+=` Q${p[0].toFixed(1)},${p[1].toFixed(1)} ${((p[0]+q[0])/2).toFixed(1)},${((p[1]+q[1])/2).toFixed(1)}`; }
    return `<path d="${d}Z" fill="${fill}" transform="rotate(${rot} ${cx} ${cy})"/>`;
  }
  function leaf(x,y,s,rot,fill){ return `<path d="M${x},${y} q${s*.6},${-s*.5} ${s*1.2},0 q${-s*.6},${s*.5} ${-s*1.2},0Z" fill="${fill}" transform="rotate(${rot} ${x} ${y})"/>`; }
  function dots(R, n, cx, cy, rad, size, colors){
    let o=''; for(let i=0;i<n;i++){ const a=R()*Math.PI*2, d=Math.sqrt(R())*rad; o+=`<circle cx="${(cx+Math.cos(a)*d).toFixed(1)}" cy="${(cy+Math.sin(a)*d).toFixed(1)}" r="${(size*(.6+R()*.6)).toFixed(1)}" fill="${colors[i%colors.length]}"/>`; } return o;
  }
  function herbs(R, n, cx, cy, rad, col){
    let o=''; for(let i=0;i<n;i++){ const a=R()*Math.PI*2, d=Math.sqrt(R())*rad; o+=leaf(cx+Math.cos(a)*d, cy+Math.sin(a)*d, 6+R()*6, R()*360, i%2?col:shade(col,-.18)); } return o;
  }
  function plateBase(id, cx, cy, r){
    return `<circle cx="${cx}" cy="${cy+6}" r="${r}" fill="rgba(60,40,20,.18)" filter="url(#bl${id})"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#pl${id})"/>
      <circle cx="${cx}" cy="${cy}" r="${r*.74}" fill="#fbfaf7" stroke="rgba(0,0,0,.05)" stroke-width="2"/>`;
  }
  function bowlBase(id, cx, cy, r, inner){
    return `<circle cx="${cx}" cy="${cy+7}" r="${r}" fill="rgba(60,40,20,.2)" filter="url(#bl${id})"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#bw${id})"/>
      <circle cx="${cx}" cy="${cy}" r="${r*.84}" fill="${inner}"/>`;
  }

  const STYLES = {
    plate(id,R,c){ let o=plateBase(id,200,150,118);
      o+=blob(205,196,44,22,R()*20,shade(c[2],.08),R,.25);
      o+=blob(160,140,62,44,R()*40-20,c[0],R,.18)+blob(158,134,48,30,R()*40-20,shade(c[0],.14),R,.2)+blob(150,128,22,10,-20,shade(c[0],.3),R,.3);
      for(let i=0;i<7;i++){ const a=-1.2+i*.42; o+=blob(200+Math.cos(a)*62+R()*8,150+Math.sin(a)*62+R()*8,20,16,R()*90,i%2?c[1]:shade(c[1],-.1),R,.3); }
      o+=herbs(R,9,205,196,30,c[2])+herbs(R,4,160,130,30,'#5c9a46');
      return o; },
    bowl(id,R,c){ let o=bowlBase(id,200,150,116,c[1]);
      o+=dots(R,40,230,150,60,7,[c[1],shade(c[1],-.06),shade(c[1],.08)]);
      o+=blob(178,150,70,66,R()*40,c[0],R,.18)+blob(174,144,52,44,0,shade(c[0],.15),R,.22);
      for(let i=0;i<6;i++) o+=blob(170+R()*40-20,148+R()*40-20,8,6,R()*90,shade(c[0],-.25),R,.4);
      o+=herbs(R,9,190,140,60,c[2]); return o; },
    soup(id,R,c){ let o=bowlBase(id,200,150,116,c[0]);
      o+=`<circle cx="200" cy="150" r="94" fill="${shade(c[0],.12)}"/><circle cx="180" cy="128" r="40" fill="${shade(c[0],.25)}" opacity=".5"/>`;
      for(let i=0;i<10;i++) o+=blob(200+(R()-.5)*130,150+(R()-.5)*120,9+R()*7,8+R()*5,R()*90,i%2?c[1]:shade(c[1],-.12),R,.4);
      o+=herbs(R,10,200,150,70,c[2]); return o; },
    salad(id,R,c){ let o=bowlBase(id,200,150,118,'#f5f2ea');
      for(let i=0;i<30;i++){ const a=R()*Math.PI*2, d=Math.sqrt(R())*76; o+=leaf(200+Math.cos(a)*d-14, 150+Math.sin(a)*d, 26+R()*16, R()*360, i%3? c[0]==='#2c2c2c'?'#6aa84f':shade(c[0],(R()-.5)*.3) : '#7cb342'); }
      o+=dots(R,18,200,150,72,10,[c[1],shade(c[1],-.15)]);
      o+=dots(R,10,200,150,70,6,[c[2],shade(c[2],.15)]);
      o+=herbs(R,6,200,150,60,'#4f8a3c'); return o; },
    pasta(id,R,c){ let o=plateBase(id,200,150,118);
      for(let i=0;i<14;i++){ const y=110+i*6, x=140+R()*20; o+=`<path d="M${x},${y} q20,${-14+R()*28} 40,0 t40,0 t40,0" stroke="${i%2?c[0]:shade(c[0],-.1)}" stroke-width="7" fill="none" stroke-linecap="round"/>`; }
      o+=blob(198,148,46,38,R()*40,c[1],R,.3)+blob(196,146,30,24,0,shade(c[1],.12),R,.3);
      o+=dots(R,8,200,150,40,5,[c[2]==='#f5efe0'?'#f2e6c4':c[2],'#f5efe0']);
      o+=herbs(R,5,205,140,30,'#4f8a3c'); return o; },
    pizza(id,R,c){ let o=`<circle cx="200" cy="157" r="120" fill="rgba(60,40,20,.2)" filter="url(#bl${id})"/>
      <circle cx="200" cy="150" r="120" fill="#b8865a"/><circle cx="200" cy="150" r="112" fill="${c[0]}"/>
      <circle cx="200" cy="150" r="98" fill="${c[1]}"/>`;
      for(let i=0;i<9;i++) o+=blob(200+(R()-.5)*140,150+(R()-.5)*140,18,14,R()*90,c[2],R,.35);
      o+=dots(R,14,200,150,80,8,['#9c4a2f','#5c9a46','#2c2c2c']);
      for(let i=1;i<4;i++) o+=`<line x1="${200-Math.cos(i)*112}" y1="${150-Math.sin(i)*112}" x2="${200+Math.cos(i)*112}" y2="${150+Math.sin(i)*112}" stroke="rgba(0,0,0,.12)" stroke-width="2"/>`;
      return o; },
    pan(id,R,c){ let o=`<rect x="300" y="138" width="90" height="22" rx="10" fill="#2b2b2b"/>
      <circle cx="190" cy="157" r="118" fill="rgba(0,0,0,.25)" filter="url(#bl${id})"/>
      <circle cx="190" cy="150" r="118" fill="#2f2f30"/><circle cx="190" cy="150" r="104" fill="#3d3d3f"/>`;
      for(let i=0;i<14;i++) o+=blob(190+(R()-.5)*150,150+(R()-.5)*150,16,13,R()*90,[c[0],c[1],shade(c[0],-.1)][i%3],R,.35);
      o+=dots(R,8,190,150,80,7,[c[2]]); o+=herbs(R,6,190,150,70,'#5c9a46'); return o; },
    wrap(id,R,c){ let o=plateBase(id,200,150,118);
      for(let k=0;k<2;k++){ const x=158+k*80, y=138+k*20;
        o+=`<path d="M${x-70},${y+26} Q${x},${y-84} ${x+70},${y+26} Z" fill="${c[0]}" stroke="${shade(c[0],-.15)}" stroke-width="3" transform="rotate(${-18+k*30} ${x} ${y})"/>`;
        o+=dots(R,12,x,y-2,30,9,[c[1],c[2],'#f5efe0',shade(c[1],.2)]); o+=herbs(R,6,x,y-8,32,'#6aa84f'); }
      return o; },
    burger(id,R,c){ let o=`<ellipse cx="200" cy="250" rx="130" ry="18" fill="rgba(60,40,20,.2)" filter="url(#bl${id})"/>
      <rect x="95" y="208" width="210" height="36" rx="16" fill="${c[0]}"/>
      <path d="M90,205 q30,-12 55,0 t55,0 t55,0 t55,0 l0,12 l-220,0z" fill="${c[2]}"/>
      <rect x="92" y="170" width="216" height="40" rx="18" fill="${c[1]}"/>
      <path d="M98,170 l204,0 l-14,18 l-14,-10 l-20,14 l-20,-12 l-22,12 l-20,-10 l-22,12 l-20,-12 l-20,12 l-18,-12z" fill="#f2c94a"/>
      <path d="M95,168 Q95,70 200,68 Q305,70 305,168 Z" fill="${c[0]}"/>
      <path d="M120,130 Q140,92 200,88" stroke="${shade(c[0],.3)}" stroke-width="10" fill="none" stroke-linecap="round" opacity=".6"/>`;
      o+=dots(R,14,200,115,70,3,['#fff6dc']); return o; },
    sandwich(id,R,c){ let o=`<rect x="70" y="80" width="260" height="150" rx="16" fill="rgba(60,40,20,.2)" filter="url(#bl${id})"/>
      <rect x="70" y="70" width="260" height="150" rx="14" fill="#c9a77a"/>`;
      for(let k=0;k<2;k++){ const x=95+k*115;
        o+=`<rect x="${x}" y="95" width="95" height="100" rx="8" fill="${c[0]}"/>`;
        o+=blob(x+48,140,42,36,R()*30,c[1],R,.3)+dots(R,6,x+48,140,30,8,[c[2],shade(c[2],-.15)])+herbs(R,4,x+48,132,26,'#5c9a46'); }
      return o; }
  };

  window.dishArt = function(r, opts){
    opts = opts||{};
    if (r.img) return `<img src="${r.img}" alt="Foto af ${r.n.replace(/"/g,'')}" loading="lazy" decoding="async" class="dishImg">`;
    const id = 'a'+(uid++);
    const [style, cols] = (r.look||'plate:#c9853f,#f2e4bf,#5c9a46').split(':');
    const c = cols.split(',');
    const R = rng(hash(r.id));
    const bg = BG[r.c]||BG.k;
    const fn = STYLES[style]||STYLES.plate;
    // let mønster på dugen
    let cloth=''; const R2=rng(hash(r.id+'bg'));
    for(let i=0;i<14;i++) cloth+=`<circle cx="${(R2()*400).toFixed(0)}" cy="${(R2()*300).toFixed(0)}" r="${(2+R2()*3).toFixed(1)}" fill="rgba(255,255,255,.35)"/>`;
    return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" class="dishSvg" role="img" aria-label="Illustration af ${r.n.replace(/"/g,'')}">
      <defs>
        <radialGradient id="pl${id}" cx="45%" cy="40%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e9e5dc"/></radialGradient>
        <radialGradient id="bw${id}" cx="45%" cy="38%"><stop offset="0" stop-color="#fdfcf8"/><stop offset=".85" stop-color="#e2ddd2"/><stop offset="1" stop-color="#cfc8ba"/></radialGradient>
        <linearGradient id="bg${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient>
        <filter id="bl${id}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="8"/></filter>
      </defs>
      <rect width="400" height="300" fill="url(#bg${id})"/>${cloth}
      ${fn(id,R,c)}
    </svg>`;
  };
})();
