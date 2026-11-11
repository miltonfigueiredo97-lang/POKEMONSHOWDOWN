/*
 * Pokémon Showdown animation canvas adapter. Choreography and PNG assets are
 * sourced from Pokémon Showdown; this renderer is an independent adapter.
 * Runs real BattleMoveAnims with Canvas2D to avoid CSS/WAAPI visibility bugs.
 */
(function () {
  'use strict';
  const FPS_DPR_MAX = 2;
  const FX_URL = '/assets/showdown/fx/';
  const $ = id => document.getElementById(id);
  const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
  const linear = (a, b, f) => a + (b - a) * f;
  const toNum = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const imageCache = new Map();
  let activePlayback = null;
  const easing = (name, t) => {
    t = clamp(t, 0, 1);
    if (['decel', 'ballistic', 'ballistic2', 'quadDown'].includes(name)) return 1 - Math.pow(1 - t, 2);
    if (['accel', 'quadUp'].includes(name)) return t * t;
    if (name === 'swing') return t * t * (3 - 2 * t);
    return t;
  };
  function texture(name) {
    const data = window.PSArenaNativeEffects?.[name];
    const file = typeof data?.url === 'string' ? data.url : (name + '.png');
    if (imageCache.has(file)) return imageCache.get(file);
    const img = new Image();
    const source = window.PSArenaLocalEffects?.[file] || FX_URL + file;
    const asset = {img, ready: false, error: false, file};
    asset.promise = new Promise(resolve => {
      const settled = valid => { asset.ready = valid; asset.error = !valid; resolve(asset); };
      img.onload = () => settled(img.naturalWidth > 0);
      img.onerror = () => {
        if (file !== 'impact.png' && window.PSArenaLocalEffects?.['impact.png']) {
          img.onerror = () => settled(false);
          img.onload = () => settled(img.naturalWidth > 0);
          img.src = window.PSArenaLocalEffects['impact.png'];
        } else settled(false);
      };
      img.src = typeof source === 'string' && source.startsWith('data:') ? source.replace(/\s/g, '') : source;
    });
    imageCache.set(file, asset);
    return asset;
  }
  function getPosition(img, field, fallbackX, fallbackY) {
    if (!img) return {x:field.width*fallbackX,y:field.height*fallbackY};
    const r = img.getBoundingClientRect();
    const b = field.area.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0)) return {x:field.width*fallbackX,y:field.height*fallbackY};
    return {x:r.left + r.width*.5 - b.left,y:r.top + r.height*.64 - b.top};
  }
  function getStage() {
    const area = $('effects'); if (!area) return null;
    const width = area.clientWidth, height = area.clientHeight;
    if (!width || !height) return null;
    const own = getPosition($('playerSprite'),{area,width,height},.29,.73);
    const foe = getPosition($('opponentSprite'),{area,width,height},.74,.47);
    return {area,width,height,own,foe,
      mapX(x) { return linear(own.x,foe.x,(toNum(x,0)+105)/210); },
      mapY(y,z=0) { return own.y - (toNum(y,0)+toNum(z,0)*.03)*(own.y-foe.y)/70; }
    };
  }
  const noop = () => ({animate(){return this;},delay(){return this;},css(){return this;},remove(){return this;},hide(){return this;},show(){return this;},addClass(){return this;},stop(){return this;}});
  class Mon {
    constructor(el,front,scene) {
      this.el = el; this.scene = scene; this.isFrontSprite = front;
      this.x = front ? 105 : -105; this.y = front ? 70 : 0; this.z = 0;
      this.state = {x:this.x,y:this.y,z:0,scale:1,opacity:1}; this.cursor=0;
      this.$el = noop();
    }
    behind(amount=0) {return this.z + (this.isFrontSprite ? -amount : amount);}
    leftof(amount=0) {return this.x + (this.isFrontSprite ? -amount : amount);}
    delay(ms=0) {this.cursor += toNum(ms,0);this.scene.duration=Math.max(this.scene.duration,this.cursor);return this;}
    anim(pos={},kind='linear') {
      const duration=clamp(toNum(pos.time,450),1,2600);
      const prior={...this.state},next={...prior,...pos};
      this.scene.motion.push({el:this.el,start:this.cursor,end:this.cursor+duration,prior,next,kind,mon:this});
      this.cursor+=duration;this.state=next;this.scene.duration=Math.max(this.scene.duration,this.cursor);return this;
    }
  }
  class Scene {
    constructor(stage) {
      this.s=stage;this.duration=400;this.effects=[];this.motion=[];
      this.$bg=noop();this.$bgEffect=noop();this.$battle=noop();this.$fx=noop();
      this.battle={mySide:{active:[],pokemon:[]},yourSide:{active:[],pokemon:[]},p1:{active:[]},p2:{active:[]}};
    }
    wait(ms) {this.duration=Math.max(this.duration,toNum(ms,0));}
    backgroundEffect() {return noop();}
    showEffect(name,start={},end={},kind='linear',after='fade',style={}) {
      const key=typeof name==='string'?name:name?.effectName||'impact';
      const meta=window.PSArenaNativeEffects?.[key]||{};
      const a={x:0,y:0,z:0,scale:1,opacity:1,...start};const b={...a,...end};
      const begin=clamp(toNum(start?.time,0),0,12000);
      const finish=clamp(toNum(end?.time,begin+420),begin+60,14000);
      const asset=texture(key);
      this.effects.push({key,asset,meta,a,b,begin,finish,kind,after,style});
      this.duration=Math.max(this.duration,finish);
      return {effectName:key,asset,animate:()=>this.showEffect(key,start,end,kind,after,style),css(){return this;},delay(){return this;},remove(){return this;}};
    }
    animateEffect(handle,...args) {
      if (typeof args[0]==='string')return this.showEffect(args[0],args[1],args[2],args[3],args[4]);
      return this.showEffect(handle?.effectName||'impact',args[0]||{},args[1]||{},args[2],args[3]);
    }
  }
  function createCanvas(stage) {
    const canvas=document.createElement('canvas');canvas.className='ps-fx-canvas';
    const dpr=clamp(window.devicePixelRatio||1,1,FPS_DPR_MAX);
    canvas.width=Math.round(stage.width*dpr);canvas.height=Math.round(stage.height*dpr);
    Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'40'});
    stage.area.append(canvas);
    const ctx=canvas.getContext('2d',{alpha:true});ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    return {canvas,ctx};
  }
  function drawEffect(ctx,scene,evt,at) {
    if (at<evt.begin || at>evt.finish || !evt.asset.ready)return false;
    const t=easing(evt.kind,(at-evt.begin)/(evt.finish-evt.begin));
    const s=scene.s,a=evt.a,b=evt.b;
    const x=s.mapX(linear(toNum(a.x,0),toNum(b.x,0),t));
    const y=s.mapY(linear(toNum(a.y,0),toNum(b.y,0),t),linear(toNum(a.z,0),toNum(b.z,0),t));
    let alpha=linear(toNum(a.opacity,1),toNum(b.opacity,1),t);
    if (['fade','gone','explode'].includes(evt.after))alpha*=Math.min(1,Math.max(0,(1-t)*3));
    if (alpha<=0)return false;
    const baseW=toNum(evt.meta.w,evt.asset.img.naturalWidth||64);
    const baseH=toNum(evt.meta.h,evt.asset.img.naturalHeight||64);
    const sx=linear(toNum(a.scale,1)*toNum(a.xscale,1),toNum(b.scale,1)*toNum(b.xscale,1),t);
    const sy=linear(toNum(a.scale,1)*toNum(a.yscale,1),toNum(b.scale,1)*toNum(b.yscale,1),t);
    const ratio=clamp((s.width/640+s.height/360)*.5,.6,2.4);
    const w=clamp(baseW*sx*ratio,1,600),h=clamp(baseH*sy*ratio,1,600);
    ctx.save();ctx.globalAlpha=clamp(alpha,0,1);
    if(evt.style?.filter)try{ctx.filter=evt.style.filter;}catch{}
    ctx.translate(x,y);ctx.rotate(linear(toNum(a.rotate,0),toNum(b.rotate,0),t)*Math.PI/180);
    ctx.drawImage(evt.asset.img,-w/2,-h/2,w,h);
    ctx.restore();return true;
  }
  function startMotion(motions) {
    const active=[];
    for (const evt of motions){
      if(!evt.el?.animate)continue;
      const stage=evt.mon.scene.s;
      const pose=p=>({transform:`translateX(-50%) translate(${(toNum(p.x,evt.mon.x)-evt.mon.x)*stage.width/640}px,${-(toNum(p.y,evt.mon.y)-evt.mon.y)*stage.height/360}px) scale(${clamp(toNum(p.scale,1),.06,4)})`,opacity:toNum(p.opacity,1)});
      try{active.push(evt.el.animate([pose(evt.prior),pose(evt.next)],{delay:evt.start,duration:evt.end-evt.start,easing:'ease-in-out',fill:'forwards'}))}catch{}
    }
    return active;
  }
  async function playNativeMove(meta) {
    const stage=getStage(),moves=window.PSArenaNativeMoveAnims;
    if(!stage||!moves)return false;
    if(activePlayback)activePlayback.stop();
    const scene=new Scene(stage);
    const side=window.PSArenaViewSide?.()??0,player=meta?.who===side;
    const a=new Mon($(player?'playerSprite':'opponentSprite'),!player,scene);
    const b=new Mon($(player?'opponentSprite':'playerSprite'),player,scene);
    scene.battle.mySide.active=[{sprite:a}];scene.battle.yourSide.active=[{sprite:b}];
    scene.battle.p1.active=[{sprite:a}];scene.battle.p2.active=[{sprite:b}];
    const id=String(meta?.move||'').toLowerCase().replace(/[^a-z0-9]/g,'');
    const chosen=moves.moves?.[id];
    let native=typeof chosen?.anim==='function',exception=null;
    try{
      if(native)chosen.anim(scene,[a,b]);
      else moves.other?.[meta?.category==='physical'?'contactattack':'attack']?.anim(scene,[a,b]);
    }catch(e){exception=e;console.warn('[Pokémon Arena] Showdown FX fallback',id,e)}
    if(!scene.effects.length && !scene.motion.length){
      // The official Showdown battle renderer adds generic hit sprites for some moves.
      scene.showEffect('impact',{x:b.x,y:b.y,scale:.7,opacity:1,time:30},{scale:1.5,opacity:.25,time:480},'decel','fade');
    }else if(!scene.effects.length && meta?.category==='physical'){
      scene.showEffect('hitmarker',{x:b.x,y:b.y,scale:.5,opacity:1,time:180},{scale:1.2,opacity:0,time:600},'decel','fade');
    }
    // Reserve one more beat so these effects are visually legible.
    scene.duration=clamp(scene.duration+180,500,6000);
    await Promise.all(scene.effects.map(e=>e.asset.promise));
    const {canvas,ctx}=createCanvas(stage);
    const motions=startMotion(scene.motion);
    let frameCount=0,paintedFrames=0,paintedSprites=0;
    const duration=scene.duration*1.1;
    const run=new Promise(resolve=>{
      let raf=0,ended=false;const started=performance.now();
      const stop=()=>{if(ended)return;ended=true;if(raf)cancelAnimationFrame(raf);canvas.remove();for(const m of motions)try{m.cancel()}catch{};activePlayback=null;resolve()};
      activePlayback={stop};
      const loop=now=>{
        if(ended)return;
        const elapsed=(now-started)/1.1;
        ctx.clearRect(0,0,stage.width,stage.height);
        let painted=0;for(const evt of scene.effects)if(drawEffect(ctx,scene,evt,elapsed))painted++;
        frameCount++;if(painted){paintedFrames++;paintedSprites+=painted;}
        if(now-started>=duration){stop();return;}
        raf=requestAnimationFrame(loop);
      };
      raf=requestAnimationFrame(loop);
    });
    await run;
    window.PSArenaFXDebug={renderer:'canvas2d',move:id,native,exception:exception?.message||null,images:scene.effects.length,loaded:scene.effects.filter(e=>e.asset.ready).length,paintedFrames,paintedSprites,frameCount,localTextureCount:Object.keys(window.PSArenaLocalEffects||{}).length};
    return native;
  }
  const old=window.PSArenaVisuals||{};
  window.PSArenaVisuals={...old,playNativeMove};
  window.PSArenaCanvasFX={playNativeMove,debug:()=>window.PSArenaFXDebug};
})();
