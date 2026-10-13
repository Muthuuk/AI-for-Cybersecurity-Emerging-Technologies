/* Scenes: animated SVG and 3D (Three.js) teaching visuals for the course player.
   Scenes.mount(host, spec) -> { highlight(i), dispose() }
   highlight(i): i = index of the item to emphasise; null = none; -1 = all.
   Every scene works without Three.js (falls back to 2D) and respects reduced motion. */
(function(){
'use strict';
const NS = 'http://www.w3.org/2000/svg';
const PAL = ['#38BDF8','#34D399','#FBBF24','#A78BFA','#F87171','#22D3EE','#FB923C','#F472B6'];
const INK = '#E6EEF5', MUTED = '#93A7BC', LINE = '#2C4157', BG1 = '#0B1626', BG2 = '#13263D';
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const col = (spec, i) => (spec.items && spec.items[i] && spec.items[i].color) || PAL[i % PAL.length];

function S(tag, attrs, parent){ const e = document.createElementNS(NS, tag); if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
function txt(parent, x, y, str, o){ o = o || {}; const t = S('text', {x, y, fill:o.fill||INK, 'font-size':o.size||30, 'font-weight':o.weight||500, 'text-anchor':o.anchor||'middle', 'dominant-baseline':o.base||'middle', 'font-family':'Public Sans, Segoe UI, Arial, sans-serif'}, parent);
  const lines = Array.isArray(str) ? str : String(str).split('|'); const lh = (o.size||30)*1.18; const y0 = y - (lines.length-1)*lh/2;
  if (lines.length === 1) t.textContent = lines[0]; else lines.forEach((l,i)=>{ const ts = S('tspan',{x, y:y0+i*lh}, t); ts.textContent = l; });
  if (o.opacity!=null) t.setAttribute('opacity', o.opacity); return t; }
function wrapWords(s, n){ const out=[]; let cur=''; String(s).split(/\s+/).forEach(w=>{ if ((cur+' '+w).trim().length>n){ if(cur) out.push(cur); cur=w; } else cur=(cur+' '+w).trim(); }); if(cur) out.push(cur); return out; }

function base(host, spec){
  const svg = S('svg', {viewBox:'0 0 1600 900', width:'100%', height:'100%', role:'img', 'aria-label': spec.alt || spec.title || 'Animated diagram', preserveAspectRatio:'xMidYMid meet'});
  const defs = S('defs', null, svg);
  const g = S('linearGradient', {id:'bgG', x1:0, y1:0, x2:1, y2:1}, defs); S('stop',{offset:0,'stop-color':BG1},g); S('stop',{offset:1,'stop-color':BG2},g);
  const glow = S('filter',{id:'glow',x:'-50%',y:'-50%',width:'200%',height:'200%'},defs); S('feGaussianBlur',{stdDeviation:6,result:'b'},glow); const m = S('feMerge',null,glow); S('feMergeNode',{in:'b'},m); S('feMergeNode',{in:'SourceGraphic'},m);
  const mk = S('marker',{id:'arw',viewBox:'0 0 10 10',refX:8,refY:5,markerWidth:7,markerHeight:7,orient:'auto-start-reverse'},defs); S('path',{d:'M0 0L10 5L0 10z',fill:MUTED},mk);
  S('rect',{width:1600,height:900,fill:'url(#bgG)'},svg);
  // faint grid
  const grid = S('g',{opacity:0.08},svg); for (let x=0;x<=1600;x+=80) S('line',{x1:x,y1:0,x2:x,y2:900,stroke:'#7FB3E6'},grid); for (let y=0;y<=900;y+=80) S('line',{x1:0,y1:y,x2:1600,y2:y,stroke:'#7FB3E6'},grid);
  if (spec.title) txt(svg, 70, 64, spec.title, {anchor:'start', size:40, weight:700});
  if (spec.subtitle) txt(svg, 70, 110, spec.subtitle, {anchor:'start', size:26, fill:MUTED});
  host.appendChild(svg); return svg;
}
function loop(fn){ let id, alive = true, t0 = performance.now(); const f = now => { if (!alive) return; fn(Math.max(0,(now-t0)/1000)); id = requestAnimationFrame(f); }; id = requestAnimationFrame(f); return () => { alive = false; cancelAnimationFrame(id); }; }
function emph(els, i){ els.forEach((e,k)=>{ const on = i==null || i===-1 || i===k; e.style.transition='opacity .45s, transform .45s'; e.style.opacity = on ? 1 : 0.28; e.classList.toggle('on', i!=null && (i===k || i===-1)); }); }

/* ---------- 2D scene types ---------- */
const T2 = {};

// Horizontal process with travelling token. spec.items:[{label, sub, badge, icon}], spec.loop:'label'
T2.flow = function(host, spec){
  const svg = base(host, spec); const items = spec.items; const n = items.length;
  const top = spec.title ? 250 : 200, hgt = spec.boxH || 300, gap = 46, x0 = 70, w = (1600 - 2*x0 - gap*(n-1))/n;
  const groups = []; const centers = [];
  items.forEach((it,i)=>{ const x = x0 + i*(w+gap), c = col(spec,i); const gg = S('g',null,svg); groups.push(gg);
    S('rect',{x, y:top, width:w, height:hgt, rx:22, fill:c, 'fill-opacity':0.13, stroke:c, 'stroke-width':3}, gg);
    S('rect',{x, y:top, width:w, height:14, rx:7, fill:c}, gg);
    const fs = w < 230 ? 26 : 30;
    txt(gg, x+w/2, top+62, wrapWords(it.label, w<230?11:16), {size:fs, weight:700});
    if (it.sub) txt(gg, x+w/2, top+hgt*0.62, [].concat(...String(it.sub).split('|').map(s=>wrapWords(s, w<230?14:20))), {size:w<230?20:23, fill:MUTED});
    if (it.badge){ const bw = Math.min(w, Math.max(160, String(it.badge).length*15+40)); S('rect',{x:x+w/2-bw/2,y:top+hgt+26,width:bw,height:54,rx:27,fill:c},gg); txt(gg,x+w/2,top+hgt+54,it.badge,{size:26,weight:700,fill:'#0B1626'}); }
    if (i<n-1) S('line',{x1:x+w+6,y1:top+hgt/2,x2:x+w+gap-6,y2:top+hgt/2,stroke:MUTED,'stroke-width':4,'marker-end':'url(#arw)'},svg);
    centers.push([x+w/2, top+hgt/2]);
    if (it.icon==='spikes'){ const sp = S('g',{class:'spk'},gg); for(let k=0;k<7;k++) S('line',{x1:x+20+k*(w-40)/7,y1:top+hgt-70,x2:x+20+k*(w-40)/7,y2:top+hgt-30,stroke:c,'stroke-width':4,'stroke-linecap':'round'},sp); gg._spk = sp; }
  });
  if (spec.loop){ const xa = centers[n-1][0], xb = centers[0][0], yb = top+hgt+(items.some(i=>i.badge)?110:40);
    S('path',{d:`M${xa} ${top+hgt+4} C ${xa} ${yb+120}, ${xb} ${yb+120}, ${xb} ${top+hgt+8}`, fill:'none', stroke:MUTED,'stroke-width':3,'stroke-dasharray':'12 10','marker-end':'url(#arw)'},svg);
    txt(svg, 800, yb+92, spec.loop, {size:26, fill:MUTED}); }
  if (spec.note) txt(svg, 800, 850, spec.note, {size:26, fill:'#FDE68A'});
  const tok = S('circle',{r:16,fill:'#fff',filter:'url(#glow)'},svg);
  const stop = loop(t=>{ const p = reduce()? 0 : (t*0.35)%1; const f = p*(n-1); const k = Math.min(n-2, Math.floor(f)); const u = f-k;
    const a = centers[Math.max(0,k)], b = centers[Math.min(n-1,k+1)]; tok.setAttribute('cx', a[0]+(b[0]-a[0])*u); tok.setAttribute('cy', top-30);
    groups.forEach(gg=>{ if (gg._spk) [...gg._spk.children].forEach((l,j)=>{ const on = reduce()?1:((Math.sin(t*6+j*1.7)>0.55)?1:0.15); l.setAttribute('opacity', on); }); }); });
  return { highlight:i=>emph(groups,i), dispose:stop };
};

// Animated bars, optional 'after' value (shrink), optional log scale.
T2.bars = function(host, spec){
  const svg = base(host, spec); const items = spec.items; const n = items.length;
  const top = spec.title ? 210 : 150, rowH = Math.min(150, (760-top)/n + 40), labW = 430, maxW = 1600 - 70 - labW - 420;
  const vmax = Math.max(...items.map(it=>it.value)); const sc = v => spec.log ? (Math.log10(Math.max(v,1))/Math.log10(vmax))*maxW : (v/vmax)*maxW;
  const rows = []; const bars = [];
  items.forEach((it,i)=>{ const y = top + i*rowH, c = col(spec,i); const gg = S('g',null,svg); rows.push(gg);
    txt(gg, 70, y+30, wrapWords(it.label,24), {anchor:'start', size:28, weight:600});
    const r = S('rect',{x:70+labW, y:y+6, height:48, width:0, rx:10, fill:c}, gg);
    const vt = txt(gg, 70+labW+12, y+30, '', {anchor:'start', size:28, weight:700});
    bars.push({r, vt, it}); });
  if (spec.note) txt(svg, 800, 860, spec.note, {size:26, fill:MUTED});
  const stop = loop(t=>{ bars.forEach((b,i)=>{ const it=b.it; const g1 = reduce()?1:Math.min(1, Math.max(0,(t-i*0.25)/1.2)); let v = it.value*g1, lab = it.text || (it.value+(it.unit||''));
      if (it.after!=null){ const g2 = reduce()?1:Math.min(1, Math.max(0,(t-2.2-i*0.2)/1.2)); v = it.value + (it.after-it.value)*g2; if (g2>0.98) lab = it.afterText || (it.after+(it.unit||'')); if (it.after===0 && g2>0.98) b.r.setAttribute('fill','#F87171'); }
      const w = Math.max(4, sc(v)); b.r.setAttribute('width', w); b.vt.setAttribute('x', 70+labW+w+16); b.vt.textContent = lab; }); });
  return { highlight:i=>emph(rows,i), dispose:stop };
};

// Big counting statistics tiles.
T2.stats = function(host, spec){
  const svg = base(host, spec); const items = spec.items, n = items.length; const cols = Math.min(n, spec.cols||4), rowsN = Math.ceil(n/cols);
  const top = spec.title ? 190 : 120, gap = 36, w = (1600-140-gap*(cols-1))/cols, hgt = Math.min(300, (900-top-60-gap*(rowsN-1))/rowsN);
  const tiles = [], nums = [];
  items.forEach((it,i)=>{ const x = 70 + (i%cols)*(w+gap), y = top + Math.floor(i/cols)*(hgt+gap), c = col(spec,i); const gg = S('g',null,svg); tiles.push(gg);
    S('rect',{x,y,width:w,height:hgt,rx:24,fill:c,'fill-opacity':0.12,stroke:c,'stroke-width':3},gg);
    const vlen = String((it.pre||'')+it.v+(it.suf||'')).length; nums.push({t:txt(gg, x+w/2, y+hgt*0.4, '', {size:Math.min(96,hgt*0.36, w*1.55/Math.max(4,vlen)), weight:800, fill:c}), it});
    txt(gg, x+w/2, y+hgt*0.76, wrapWords(it.label, Math.round(w/17)), {size:25, fill:INK}); });
  const stop = loop(t=>{ nums.forEach((o,i)=>{ const g = reduce()?1:Math.min(1,Math.max(0,(t-i*0.2)/1.4)); const v = o.it.v; const shown = typeof v === 'number' ? (Number.isInteger(v)? Math.round(v*g).toLocaleString('en-GB') : (v*g).toFixed(1)) : v; o.t.textContent = (o.it.pre||'') + shown + (o.it.suf||''); }); });
  return { highlight:i=>emph(tiles,i), dispose:stop };
};

// Two columns joined by animated links. spec.left:[{label,sub}], spec.right:[...]
T2.map = function(host, spec){
  const svg = base(host, spec); const L = spec.left, R = spec.right, n = L.length;
  const top = spec.title ? 200 : 140, rowH = (860-top)/n, bw = 560, xl = 70, xr = 1600-70-bw;
  if (spec.leftTitle) txt(svg, xl+bw/2, top-30, spec.leftTitle, {size:24, fill:MUTED, weight:700});
  if (spec.rightTitle) txt(svg, xr+bw/2, top-30, spec.rightTitle, {size:24, fill:MUTED, weight:700});
  const rows = [], links = [];
  for (let i=0;i<n;i++){ const y = top + i*rowH + 8, hh = rowH-22, c = PAL[i%PAL.length]; const gg = S('g',null,svg); rows.push(gg);
    S('rect',{x:xl,y,width:bw,height:hh,rx:16,fill:'#F87171','fill-opacity':0.12,stroke:'#F87171','stroke-width':2},gg);
    txt(gg, xl+24, y+hh*0.36, L[i].label, {anchor:'start', size:27, weight:700}); if (L[i].sub) txt(gg, xl+24, y+hh*0.72, L[i].sub, {anchor:'start', size:21, fill:MUTED});
    S('rect',{x:xr,y,width:bw,height:hh,rx:16,fill:c,'fill-opacity':0.12,stroke:c,'stroke-width':2},gg);
    txt(gg, xr+24, y+hh*0.36, R[i].label, {anchor:'start', size:27, weight:700}); if (R[i].sub) txt(gg, xr+24, y+hh*0.72, R[i].sub, {anchor:'start', size:21, fill:MUTED});
    const ln = S('line',{x1:xl+bw+8,y1:y+hh/2,x2:xr-10,y2:y+hh/2,stroke:c,'stroke-width':4,'marker-end':'url(#arw)','stroke-dasharray':'400','stroke-dashoffset':'400'},gg); links.push(ln); }
  const stop = loop(t=>{ links.forEach((l,i)=>{ const g = reduce()?1:Math.min(1,Math.max(0,(t-0.4-i*0.45)/0.8)); l.setAttribute('stroke-dashoffset', 400*(1-g)); }); });
  return { highlight:i=>emph(rows,i), dispose:stop };
};

// Timeline with an arc from first to last point. spec.items:[{when,label,sub}], spec.arc:'label'
T2.timeline = function(host, spec){
  const svg = base(host, spec); const items = spec.items, n = items.length; const y = 470, x0 = 170, x1 = 1430;
  S('line',{x1:x0-80,y1:y,x2:x1+80,y2:y,stroke:LINE,'stroke-width':6},svg);
  const pts = [];
  items.forEach((it,i)=>{ const x = x0 + i*(x1-x0)/(n-1), c = col(spec,i); const gg = S('g',null,svg); pts.push(gg);
    S('line',{x1:x,y1:y-150,x2:x,y2:y,stroke:c,'stroke-width':2,'stroke-dasharray':'6 6'},gg);
    S('circle',{cx:x,cy:y,r:24,fill:c,filter:'url(#glow)'},gg);
    txt(gg, x, y+62, it.when, {size:30, weight:800, fill:c}); if (it.date) txt(gg, x, y+100, it.date, {size:22, fill:MUTED});
    S('rect',{x:x-160,y:y-310,width:320,height:150,rx:16,fill:c,'fill-opacity':0.12,stroke:c,'stroke-width':2},gg);
    txt(gg, x, y-272, it.label, {size:25, weight:700}); if (it.sub) txt(gg, x, y-208, [].concat(...String(it.sub).split('|').map(s=>wrapWords(s,24))), {size:20, fill:MUTED}); });
  let pk = null;
  if (spec.arc){ const xa = x0, xb = x1, ya = y+150; const p = S('path',{d:`M${xa} ${ya} C ${xa+300} ${ya+150}, ${xb-300} ${ya+150}, ${xb} ${ya}`, fill:'none', stroke:'#FB923C','stroke-width':4,'stroke-dasharray':'14 10','marker-end':'url(#arw)'},svg);
    txt(svg, 800, ya+150, spec.arc, {size:26, fill:'#FDBA74', weight:600}); pk = {p, el:S('rect',{width:36,height:28,rx:5,fill:'#FBBF24'},svg)}; }
  const stop = loop(t=>{ if (!pk) return; const L = pk.p.getTotalLength(); const u = reduce()?0.5:(t*0.18)%1; const q = pk.p.getPointAtLength(L*u); pk.el.setAttribute('x', q.x-18); pk.el.setAttribute('y', q.y-14); });
  return { highlight:i=>emph(pts,i), dispose:stop };
};

// Spectrum with sliding marker. spec.items:[{label,sub,best}], spec.leftLabel, spec.rightLabel
T2.spectrum = function(host, spec){
  const svg = base(host, spec); const items = spec.items, n = items.length; const y = 330, x0 = 160, x1 = 1440;
  const defs = svg.querySelector('defs'); const lg = S('linearGradient',{id:'spG',x1:0,y1:0,x2:1,y2:0},defs); S('stop',{offset:0,'stop-color':'#22D3EE'},lg); S('stop',{offset:0.5,'stop-color':'#34D399'},lg); S('stop',{offset:1,'stop-color':'#A78BFA'},lg);
  S('rect',{x:x0-40,y:y-16,width:x1-x0+80,height:32,rx:16,fill:'url(#spG)'},svg);
  if (spec.leftLabel) txt(svg, x0-40, y-105, spec.leftLabel, {anchor:'start', size:26, weight:700, fill:'#67E8F9'});
  if (spec.rightLabel) txt(svg, x1+40, y-105, spec.rightLabel, {anchor:'end', size:26, weight:700, fill:'#C4B5FD'});
  const cards = [], xs = [];
  items.forEach((it,i)=>{ const x = x0 + i*(x1-x0)/(n-1), c = col(spec,i); xs.push(x); const gg = S('g',null,svg); cards.push(gg);
    S('circle',{cx:x,cy:y,r:20,fill:'#fff'},gg); const w = 420; const bx = Math.min(1600-70-w, Math.max(70, x-w/2));
    S('rect',{x:bx,y:y+70,width:w,height:380,rx:20,fill:c,'fill-opacity':0.12,stroke:c,'stroke-width':3},gg);
    txt(gg, bx+w/2, y+120, it.label, {size:30, weight:800, fill:c});
    txt(gg, bx+w/2, y+215, [].concat(...String(it.sub).split('|').map(s=>wrapWords(s,26))), {size:23});
    if (it.best) txt(gg, bx+w/2, y+380, wrapWords('Best for: '+it.best, 28), {size:21, fill:MUTED}); });
  const person = S('g',null,svg); S('circle',{cx:0,cy:-34,r:16,fill:'#FDE68A'},person); S('path',{d:'M-22 8 Q0 -22 22 8 Z',fill:'#FDE68A'},person);
  let target = xs[0], cur = xs[0];
  const stop = loop(t=>{ cur += (target-cur)*0.08; const bob = reduce()?0:Math.sin(t*3)*3; person.setAttribute('transform',`translate(${cur} ${y-34+bob})`); });
  return { highlight:i=>{ emph(cards,i); if (i!=null && i>=0) target = xs[i]; }, dispose:stop };
};

// Hub with satellites. spec.center:{label}, spec.items:[{label,sub,w}], spec.mode:'in'|'gap'|'quad'
T2.ring = function(host, spec){
  const svg = base(host, spec); const items = spec.items, n = items.length; const cx = spec.mode==='gap' ? 540 : 800, cy = spec.title ? 520 : 460, R = spec.mode==='gap' ? 290 : 290;
  const sats = [], lines = [];
  items.forEach((it,i)=>{ const a = -Math.PI/2 + i*2*Math.PI/n + (spec.mode==='gap' ? -0.35 : 0); const x = cx + Math.cos(a)*R*(spec.mode==='gap'?1.2:1.35), y = cy + Math.sin(a)*R*(spec.mode==='gap'?0.95:0.84); const c = col(spec,i);
    const ln = S('line',{x1:x,y1:y,x2:cx,y2:cy,stroke:c,'stroke-width':it.w||4,'stroke-opacity':0.7},svg); lines.push(ln);
    const gg = S('g',null,svg); sats.push(gg); S('circle',{cx:x,cy:y,r:spec.satR||98,fill:c,'fill-opacity':0.9},gg);
    txt(gg, x, y-(it.sub?14:0), wrapWords(it.label,12), {size:24, weight:800, fill:'#0B1626'}); if (it.sub) txt(gg, x, y+40, wrapWords(it.sub,16), {size:18, fill:'#0B1626'}); });
  const cg = S('g',null,svg); S('circle',{cx,cy,r:spec.centerR||118,fill:'#1E3A5F',stroke:'#7DD3FC','stroke-width':4,filter:'url(#glow)'},cg); txt(cg, cx, cy, wrapWords(spec.center.label,12), {size:28, weight:800});
  let pulses = items.map((_,i)=>S('circle',{r:9,fill:'#fff'},svg));
  if (spec.mode==='gap'){ const px = 1420, py = cy+40; S('line',{x1:cx+120,y1:cy+20,x2:px-90,y2:py,stroke:'#F87171','stroke-width':4,'stroke-dasharray':'10 12'},svg);
    S('rect',{x:1060,y:cy-20,width:220,height:90,rx:12,fill:'#3B1D1D',stroke:'#F87171','stroke-width':3,'stroke-dasharray':'10 8'},svg); txt(svg, 1170, cy+25, 'Who is|accountable?', {size:22, weight:700, fill:'#FCA5A5'});
    const pg = S('g',null,svg); S('circle',{cx:px,cy:py-60,r:42,fill:'#CBD5E1'},pg); S('path',{d:`M${px-70} ${py+80} Q${px} ${py-30} ${px+70} ${py+80} Z`,fill:'#CBD5E1'},pg); txt(svg, px, py+120, spec.person||'Affected person', {size:24, weight:700}); }
  if (spec.note) txt(svg, 800, 868, spec.note, {size:24, fill:'#FDE68A'});
  const stop = loop(t=>{ items.forEach((it,i)=>{ const l = lines[i]; const x1=+l.getAttribute('x1'), y1=+l.getAttribute('y1'); const u = reduce()?0.5:((t*0.5 + i/n)%1); pulses[i].setAttribute('cx', x1+(cx-x1)*u); pulses[i].setAttribute('cy', y1+(cy-y1)*u); pulses[i].setAttribute('opacity', spec.mode==='gap' ? 0.8 : 1); }); });
  return { highlight:i=>{ emph(sats,i); lines.forEach((l,k)=>l.setAttribute('stroke-opacity', i==null||i===-1||i===k ? 0.8 : 0.15)); }, dispose:stop };
};

// Side-by-side panels. spec.items:[{label, lines:[...], color}]
T2.panels = function(host, spec){
  const svg = base(host, spec); const items = spec.items, n = items.length; const top = spec.title ? 180 : 120, gap = 40, w = (1600-140-gap*(n-1))/n, hgt = 900-top-(spec.note?110:60);
  const ps = [];
  items.forEach((it,i)=>{ const x = 70 + i*(w+gap), c = col(spec,i); const gg = S('g',null,svg); ps.push(gg);
    S('rect',{x,y:top,width:w,height:hgt,rx:24,fill:c,'fill-opacity':0.1,stroke:c,'stroke-width':3},gg);
    txt(gg, x+w/2, top+50, it.label, {size:32, weight:800, fill:c});
    const lines = it.lines || []; const lh = Math.min(70, (hgt-110)/Math.max(1,lines.length));
    lines.forEach((l,k)=>{ const ww = wrapWords(l, Math.round(w/15)); txt(gg, x+36, top+120+k*lh, ww.length>1? ww.slice(0,2).join(' ') : ww[0], {anchor:'start', size: ww.join(' ').length > w/13 ? 21 : 25}); S('circle',{cx:x+20,cy:top+120+k*lh,r:6,fill:c},gg); });
    if (it.big) txt(gg, x+w/2, top+hgt-70, it.big, {size:56, weight:800, fill:c}); });
  if (spec.note) txt(svg, 800, 860, spec.note, {size:26, fill:'#FDE68A'});
  return { highlight:i=>emph(ps,i), dispose:()=>{} };
};

/* ---------- 3D scene types (Three.js) ---------- */
const T3 = {};
function three(host, spec, build){
  if (!window.THREE) return null;
  const THREE = window.THREE; const wrap = document.createElement('div'); wrap.className = 'scene3d'; host.appendChild(wrap);
  let renderer; try { renderer = new THREE.WebGLRenderer({antialias:true, alpha:false}); } catch(e){ wrap.remove(); return null; }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio||1)); renderer.setClearColor(0x0B1626); wrap.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0B1626, 18, 42);
  const cam = new THREE.PerspectiveCamera(40, 16/9, 0.1, 100); cam.position.set(0, 4.5, 15); cam.lookAt(0, 0, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 0.55)); const dl = new THREE.DirectionalLight(0xffffff, 0.85); dl.position.set(5, 10, 7); scene.add(dl);
  const pl = new THREE.PointLight(0x38bdf8, 0.6, 40); pl.position.set(-6, 3, 6); scene.add(pl);
  const overlay = document.createElement('div'); overlay.className = 'scene-ov'; wrap.appendChild(overlay);
  if (spec.title){ const t = document.createElement('div'); t.className = 'scene-title'; t.textContent = spec.title; overlay.appendChild(t); }
  if (spec.subtitle){ const t = document.createElement('div'); t.className = 'scene-sub'; t.textContent = spec.subtitle; overlay.appendChild(t); }
  if (spec.note){ const t = document.createElement('div'); t.className = 'scene-note'; t.textContent = spec.note; overlay.appendChild(t); }
  const labels = [];
  function label(html, cls){ const d = document.createElement('div'); d.className = 'scene-lab ' + (cls||''); d.innerHTML = html; overlay.appendChild(d); const o = {d, pos:new THREE.Vector3()}; labels.push(o); return o; }
  const api = build({THREE, scene, cam, label, renderer});
  const v = new THREE.Vector3();
  function size(){ const w = wrap.clientWidth || 640, hh = wrap.clientHeight || 360; renderer.setSize(w, hh, false); cam.aspect = w/hh; cam.updateProjectionMatrix(); wrap.style.setProperty('--fs', (w/58).toFixed(1)+'px'); }
  const ro = window.ResizeObserver ? new ResizeObserver(size) : null; if (ro) ro.observe(wrap); size();
  const stop = loop(t=>{ api.update && api.update(reduce()? 0 : t); renderer.render(scene, cam);
    const w = wrap.clientWidth, hh = wrap.clientHeight; labels.forEach(o=>{ v.copy(o.pos).project(cam); o.d.style.transform = `translate(-50%,-50%) translate(${((v.x+1)/2*w).toFixed(1)}px, ${((1-v.y)/2*hh).toFixed(1)}px)`; o.d.style.display = v.z<1 ? '' : 'none'; }); });
  return { highlight:i=>api.highlight && api.highlight(i), dispose:()=>{ stop(); ro && ro.disconnect(); scene.traverse(o=>{ if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(m=>m.dispose()); }); renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss(); } };
}
const hex = c => parseInt(c.replace('#',''),16);

// Stacked layers / tiers. spec.items:[{label, sub}] bottom→top, spec.flow:'up'|'down'|'both'
T3.stack = function(host, spec){
  return three(host, spec, ({THREE, scene, cam, label})=>{
    const n = spec.items.length, gap = n>4 ? 1.15 : 1.5, grp = new THREE.Group(); scene.add(grp); const slabs = [];
    cam.position.set(0, 3.2, 15.5); cam.lookAt(0, 0.2, 0);
    spec.items.forEach((it,i)=>{ const c = hex(col(spec,i)); const y = (i-(n-1)/2)*gap;
      const m = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.42, 3.4), new THREE.MeshStandardMaterial({color:c, transparent:true, opacity:0.88, roughness:0.35, metalness:0.15, emissive:c, emissiveIntensity:0.08}));
      m.position.set(-1.6, y, 0); grp.add(m); const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({color:0xffffff, transparent:true, opacity:0.35})); m.add(e);
      const L = label(`<b>${it.label}</b>${it.sub?`<span>${it.sub}</span>`:''}`, 'side'); slabs.push({m, L, y, base:y}); });
    const parts = []; const pg = new THREE.SphereGeometry(0.09, 10, 10);
    for (let k=0;k<26;k++){ const p = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({color: k%2? 0xffffff : 0xFDE68A})); grp.add(p); parts.push({p, x:-1.6+(Math.random()-0.5)*5, z:(Math.random()-0.5)*2.6, s:Math.random(), dir: spec.flow==='down'?-1: spec.flow==='both' ? (k%2?1:-1) : 1}); }
    let hi = null; const top = (n-1)/2*gap;
    return { update:t=>{ grp.rotation.y = -0.35 + Math.sin(t*0.25)*0.28;
        slabs.forEach((s,i)=>{ const on = hi==null || hi===-1 || hi===i; const ty = s.base + (hi===i ? 0.25 : 0); s.m.position.y += (ty-s.m.position.y)*0.1; s.m.material.opacity += ((on?0.9:0.22)-s.m.material.opacity)*0.12; s.m.material.emissiveIntensity = hi===i ? 0.45 : 0.08;
          s.L.pos.set(1.7, s.m.position.y, 1.75).applyMatrix4(grp.matrixWorld); s.L.d.style.opacity = on ? 1 : 0.35; });
        parts.forEach(o=>{ const u = ((o.s + t*0.16*o.dir) % 1 + 1) % 1; o.p.position.set(o.x, -top-0.4 + u*(2*top+0.8), o.z); }); },
      highlight:i=>{ hi = i; } };
  });
};

// Hub-and-spoke federated learning, or BFT replica network. spec.mode:'fl'|'bft', spec.items:[{label}], spec.center:{label}, spec.faulty:[idx]
T3.hub = function(host, spec){
  return three(host, spec, ({THREE, scene, cam, label})=>{
    const n = spec.items.length, R = 4.6, grp = new THREE.Group(); scene.add(grp); const nodes = []; const faulty = spec.faulty || [];
    cam.position.set(0, spec.mode==='fl' ? 10.5 : 8, spec.mode==='fl' ? 10.5 : 12); cam.lookAt(0, spec.mode==='fl' ? -1.2 : -0.3, 0);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.02, 8, 120), new THREE.MeshBasicMaterial({color:0x2C4157})); ring.rotation.x = Math.PI/2; grp.add(ring);
    let center = null;
    if (spec.mode==='fl'){ center = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 1), new THREE.MeshStandardMaterial({color:0x1E3A5F, emissive:0x38BDF8, emissiveIntensity:0.35, flatShading:true})); center.position.y = 1.2; grp.add(center);
      const L = label(`<b>${spec.center.label}</b>${spec.center.sub?`<span>${spec.center.sub}</span>`:''}`, 'c'); L.pos.set(0, 3.1, 0); }
    spec.items.forEach((it,i)=>{ const a = i*2*Math.PI/n - Math.PI/2 + (spec.mode==='fl' ? Math.PI/n : 0); const x = Math.cos(a)*R, z = Math.sin(a)*R; const bad = faulty.includes(i); const c = bad ? 0xF87171 : hex(col(spec,i));
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.62, 28, 20), new THREE.MeshStandardMaterial({color:c, emissive:c, emissiveIntensity:0.2, roughness:0.4})); m.position.set(x, 0, z); grp.add(m);
      if (spec.mode==='fl'){ const box = new THREE.Mesh(new THREE.BoxGeometry(0.7,0.7,0.7), new THREE.MeshStandardMaterial({color:0x334155, emissive:0xFBBF24, emissiveIntensity:0.15})); box.position.set(x, -1.25, z); grp.add(box);
        const lock = new THREE.Mesh(new THREE.TorusGeometry(0.2,0.06,8,16,Math.PI), new THREE.MeshBasicMaterial({color:0xFBBF24})); lock.position.set(x,-0.82,z); grp.add(lock); }
      const L = label(`<b>${it.label}</b>${it.sub?`<span>${it.sub}</span>`:''}`, bad?'bad':''); L.pos.set(x, spec.mode==='fl' ? -2.2 : 1.2, z); nodes.push({m, x, z, bad, L}); });
    const pk = []; const pg = new THREE.SphereGeometry(0.13, 10, 10);
    function packet(color){ const p = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({color})); p.visible = false; grp.add(p); pk.push(p); return p; }
    let hi = null;
    if (spec.mode==='fl'){
      const ups = nodes.map(()=>packet(0xFDE68A)), downs = nodes.map(()=>packet(0x67E8F9));
      return { update:t=>{ grp.rotation.y = t*0.12; center.rotation.y = t*0.5;
          nodes.forEach((nd,i)=>{ const u = ((t*0.35 + i*0.13) % 2); const up = u < 1; const s = up ? u : u-1; const a = ups[i], b = downs[i];
            a.visible = up && hi!==2; b.visible = !up && hi!==1; const from = up ? nd.m.position : center.position, to = up ? center.position : nd.m.position;
            const p = up ? a : b; p.position.lerpVectors(from, to, s); p.position.y += Math.sin(s*Math.PI)*0.8;
            nd.m.material.emissiveIntensity = 0.2 + 0.25*Math.max(0, Math.sin(t*2+i)); }); },
        highlight:i=>{ hi = i; } };
    }
    // BFT: phases 0 pre-prepare, 1 prepare, 2 commit, 3 consensus
    const PH = spec.phases || ['1 · Pre-prepare: primary proposes','2 · Prepare: everyone shares what they got','3 · Commit: confirm matching messages','Consensus reached (2f+1 agree)']; const phl = label('', 'big'); phl.pos.set(0, -3.2, 3.2); let lastPh = -1;
    const pairs = []; nodes.forEach((a,i)=>nodes.forEach((b,j)=>{ if (i!==j) pairs.push([i,j, packet(a.bad?0xF87171:0xFFFFFF)]); }));
    return { update:t=>{ grp.rotation.y = Math.sin(t*0.15)*0.4; const ph = hi==null||hi<0 ? Math.floor(t/2.4)%4 : hi; const s = (t % 2.4)/2.4;
        pairs.forEach(([i,j,p])=>{ let show = ph===1||ph===2 ? true : ph===0 ? i===0 : false; p.visible = show && s<0.95; if (show){ p.position.lerpVectors(nodes[i].m.position, nodes[j].m.position, s); p.position.y += Math.sin(s*Math.PI)*0.6; } });
        nodes.forEach(nd=>{ const ok = ph===3 && !nd.bad; nd.m.material.emissive.setHex(ok ? 0x34D399 : nd.bad ? 0xF87171 : 0x38BDF8); nd.m.material.emissiveIntensity = ok ? 0.6 + 0.2*Math.sin(t*4) : 0.25; });
        if (ph !== lastPh){ phl.d.innerHTML = `<b>${PH[ph]}</b>`; lastPh = ph; } },
      highlight:i=>{ hi = i; } };
  });
};

// Temple: four pillars on a base under a roof. spec.items:[{label,sub}], spec.roof, spec.base
T3.temple = function(host, spec){
  return three(host, spec, ({THREE, scene, cam, label})=>{
    const grp = new THREE.Group(); scene.add(grp); cam.position.set(0, 2.6, 15); cam.lookAt(0, 0.4, 0);
    const slab = (w, y, c) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.6, 3), new THREE.MeshStandardMaterial({color:c, roughness:0.5})); m.position.y = y; grp.add(m); return m; };
    const baseM = slab(10.6, -2.6, 0x1E3A5F), roof = slab(10.6, 2.9, 0x1E3A5F);
    const lb = label(`<b>${spec.base}</b>`, 'c'); lb.pos.set(0, -2.6, 1.7); const lr = label(`<b>${spec.roof}</b>`, 'c'); lr.pos.set(0, 2.9, 1.7);
    const pills = spec.items.map((it,i)=>{ const c = hex(col(spec,i)); const x = -3.9 + i*2.6;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.7, 4.9, 32), new THREE.MeshStandardMaterial({color:c, emissive:c, emissiveIntensity:0.1, roughness:0.35})); m.position.set(x, 0.15, 0); grp.add(m);
      const L = label(`<b>${it.label}</b>`, 'pill'); return {m, L, x}; });
    let hi = null;
    return { update:t=>{ grp.rotation.y = Math.sin(t*0.3)*0.32; let tilt = 0;
        pills.forEach((p,i)=>{ const removed = hi === 10+i; const on = hi==null||hi===-1||hi===i; p.m.position.y += ((removed?-6:0.15)-p.m.position.y)*0.08; p.m.material.emissiveIntensity = hi===i ? 0.55 : 0.1; p.L.pos.set(p.x, -1.6, 1.3).applyMatrix4(grp.matrixWorld); p.L.d.style.opacity = removed ? 0.2 : on ? 1 : 0.4; if (removed) tilt = (i<2?1:-1)*0.12; });
        roof.rotation.z += (tilt-roof.rotation.z)*0.06; lb.pos.set(0,-2.6,1.7).applyMatrix4(grp.matrixWorld); lr.pos.set(0,2.9,1.7).applyMatrix4(grp.matrixWorld); },
      highlight:i=>{ hi = i; } };
  });
};

// Neural network that is compressed: phases 0 full, 1 distilled, 2 pruned, 3 quantized, 4 final
T3.shrink = function(host, spec){
  return three(host, spec, ({THREE, scene, cam, label})=>{
    const grp = new THREE.Group(); scene.add(grp); cam.position.set(0, 1.5, 14); cam.lookAt(0, 0, 0);
    const layers = [7, 9, 9, 9, 4]; const nodes = []; const sg = new THREE.SphereGeometry(0.2, 14, 12), bg = new THREE.BoxGeometry(0.34, 0.34, 0.34);
    layers.forEach((cnt, li)=>{ for (let k=0;k<cnt;k++){ const m = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({color:0x38BDF8, emissive:0x38BDF8, emissiveIntensity:0.3})); m.position.set((li-2)*2.4, (k-(cnt-1)/2)*0.72, (Math.random()-0.5)*0.6); grp.add(m); nodes.push({m, li, k, keep: li===0||li===4|| k%2===0}); } });
    const pos = []; const edges = [];
    nodes.forEach(a=>nodes.forEach(b=>{ if (b.li===a.li+1){ edges.push({a,b,keep: Math.random()<0.12}); pos.push(a.m.position.x,a.m.position.y,a.m.position.z,b.m.position.x,b.m.position.y,b.m.position.z); } }));
    const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const colors = new Float32Array(edges.length*6).fill(0.5); eg.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const lines = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({vertexColors:true, transparent:true, opacity:0.55})); grp.add(lines);
    const tag = label('', 'big'); tag.pos.set(0, 4.3, 0);
    const steps = spec.steps || ['Original model','Distillation','Pruning','Quantization','Compressed model'];
    let hi = null, scale = 1;
    return { update:t=>{ const ph = hi==null||hi<0 ? Math.floor(t/3)%5 : hi; grp.rotation.y = Math.sin(t*0.35)*0.45;
        const target = [1, 0.72, 0.72, 0.62, 0.5][ph]; scale += (target-scale)*0.05; grp.scale.setScalar(scale);
        nodes.forEach(nd=>{ const hide = ph>=1 && !nd.keep; nd.m.visible = !hide; nd.m.geometry = ph>=3 ? bg : sg; nd.m.material.color.setHex(ph>=3 ? 0x34D399 : 0x38BDF8); nd.m.material.emissive.setHex(ph>=3 ? 0x34D399 : 0x38BDF8); });
        const c = eg.attributes.color.array; edges.forEach((e,i)=>{ let vis = 1; if (ph>=1 && (!e.a.keep || !e.b.keep)) vis = 0; if (ph>=2 && !e.keep) vis = 0; const r = ph>=3 ? [0.2,0.83,0.6] : [0.45,0.75,0.95]; for (let k=0;k<2;k++){ c[i*6+k*3]=r[0]*vis; c[i*6+k*3+1]=r[1]*vis; c[i*6+k*3+2]=r[2]*vis; } }); eg.attributes.color.needsUpdate = true;
        const info = (spec.info||[])[ph] || ''; tag.d.innerHTML = `<b>${steps[ph]}</b>${info?`<span>${info}</span>`:''}`; },
      highlight:i=>{ hi = i; } };
  });
};

// Rotating lattice with a hidden target point (lattice-based cryptography intuition)
T3.lattice = function(host, spec){
  return three(host, spec, ({THREE, scene, cam, label})=>{
    const grp = new THREE.Group(); scene.add(grp); cam.position.set(0, 3, 16); cam.lookAt(0,0,0);
    const N = 6, g = new THREE.SphereGeometry(0.07, 8, 8), mat = new THREE.MeshBasicMaterial({color:0x7DD3FC});
    const skew = new THREE.Matrix4().set(1,0.35,0.15,0, 0.1,1,0.3,0, 0.2,0.1,1,0, 0,0,0,1);
    for (let i=0;i<N;i++) for (let j=0;j<N;j++) for (let k=0;k<N;k++){ const p = new THREE.Mesh(g, mat); p.position.set((i-(N-1)/2)*1.2,(j-(N-1)/2)*1.2,(k-(N-1)/2)*1.2).applyMatrix4(skew); grp.add(p); }
    const secret = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshBasicMaterial({color:0x34D399})); secret.position.set(0.6,0.6,0.6).applyMatrix4(skew); grp.add(secret);
    const noisy = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshBasicMaterial({color:0xF87171})); noisy.position.copy(secret.position).add(new THREE.Vector3(0.45,-0.3,0.35)); grp.add(noisy);
    const l1 = label('<b>Hidden point</b><span>the secret</span>', 'good'), l2 = label('<b>Noisy point</b><span>what an attacker sees</span>', 'bad');
    let hi = null;
    return { update:t=>{ grp.rotation.y = t*0.15; grp.rotation.x = 0.25+Math.sin(t*0.2)*0.1; const show = hi==null||hi<0||hi>=1;
        secret.visible = show; noisy.visible = show; l1.pos.copy(secret.position).add(new THREE.Vector3(-2.2,1.6,0)).applyMatrix4(grp.matrixWorld); l2.pos.copy(noisy.position).add(new THREE.Vector3(2.4,-1.6,0)).applyMatrix4(grp.matrixWorld); l1.d.style.display = l2.d.style.display = show ? '' : 'none'; },
      highlight:i=>{ hi = i; } };
  });
};

/* ---------- fallbacks when 3D is unavailable ---------- */
function fallback(type, spec){
  if (type==='stack') return ['flow', Object.assign({}, spec, {items: spec.items.slice()})];
  if (type==='hub') return ['ring', Object.assign({}, spec, {center: spec.center || {label: spec.mode==='bft' ? 'Agree on one answer' : 'Shared model'}})];
  if (type==='temple') return ['panels', Object.assign({}, spec, {items: spec.items.map(it=>({label:it.label, lines:String(it.sub||'').split(/,\s*/)}))})];
  if (type==='shrink') return ['flow', Object.assign({}, spec, {items: (spec.steps||['Original','Distil','Prune','Quantize','Output']).map((s,i)=>({label:s, sub:(spec.info||[])[i]||''}))})];
  if (type==='lattice') return ['panels', Object.assign({}, spec, {items:[{label:'Lattice problem', lines:['Points arranged in a huge grid','Secret = one hidden point','Attacker sees only a noisy nearby point','Finding the true point is believed hard, even for quantum computers']}]})];
  return null;
}

window.Scenes = {
  mount(host, spec){
    host.innerHTML = ''; const type = spec.type;
    let r = null;
    try { if (T3[type]) r = T3[type](host, spec); } catch(e){ console.warn('3D scene failed', e); host.innerHTML = ''; r = null; }
    if (!r && T3[type]){ const fb = fallback(type, spec); if (fb) r = T2[fb[0]](host, fb[1]); }
    if (!r && T2[type]) r = T2[type](host, spec);
    if (!r){ host.textContent = spec.title || ''; r = {highlight(){}, dispose(){}}; }
    let dead = false; const d0 = r.dispose; const watch = setInterval(()=>{ if (!host.isConnected) out.dispose(); }, 1500);
    const out = { highlight:i=>{ if (!dead) r.highlight(i); }, dispose:()=>{ if (dead) return; dead = true; clearInterval(watch); try { d0(); } catch(e){} } };
    return out;
  }
};
})();
