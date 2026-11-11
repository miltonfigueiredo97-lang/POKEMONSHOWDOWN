/* Web Animations adapter for Pokémon Showdown's original licensed animation scripts. */
(function pokemonSceneBridge() {
  "use strict";
  const FX="/assets/showdown/fx/";
  const $=id=>document.getElementById(id);
  const sleep=ms=>new Promise(done=>setTimeout(done,ms));
  const cap=(n,a,b)=>Math.max(a,Math.min(b,n));
  const easing=(v)=>({linear:"linear",decel:"ease-out",accel:"ease-in",swing:"ease-in-out",ballistic:"ease-out",ballistic2:"ease-in-out"})[v]||"ease-in-out";
  function stage(){const area=$("effects");if(!area)return null;return {area,width:area.clientWidth||640,height:area.clientHeight||360,sx:(area.clientWidth||640)/640,sy:(area.clientHeight||360)/360};}
  function coords(s,p){return {x:s.width/2+(Number(p.x)||0)*s.sx,y:(245-(Number(p.y)||0)-(Number(p.z)||0)*.05)*s.sy};}
  function dummy(){
    return {animate(){return this;},css(){return this;},delay(){return this;},hide(){return this;},show(){return this;},remove(){return this;},find(){return this;},addClass(){return this;},removeClass(){return this;},stop(){return this;}};
  }
  class Scene {
    constructor(s){
      this.s=s;this.duration=420;this.effects=[];this.pendingImages=[];this.timeline=[];this.started=null;this.mons=[];this.failedTextures=0;this.assetFallbacks=0;
      this.$bg=dummy();this.$bgEffect=dummy();this.$battle=dummy();this.$fx=dummy();
      this.battle={mySide:{active:[],pokemon:[]},yourSide:{active:[],pokemon:[]},p1:{active:[]},p2:{active:[]}};
    }
    wait(t){this.duration=Math.max(this.duration,Math.min(6400,(Number(t)||0)*1.25));}
    backgroundEffect(path,opacity=.4,time=500){
      if(typeof path!=="string")return;
      const img=document.createElement("div");img.className="ps-native-weather";img.style.backgroundImage=path;img.style.opacity=String(opacity||.4);this.s.area.append(img);
      setTimeout(()=>img.remove(),cap(Number(time)||500,200,2200));this.wait(time);
    }
    showEffect(effect,start={},end={},transition="linear",after="fade",options={}){
      const manifest=window.PSArenaNativeEffects||{};
      let name=typeof effect==="string"?effect:(effect?.effectName||"impact");
      let meta=manifest[name]||{url:name+".png",w:80,h:80};
      const url=meta.url||"impact.png";
      const img=document.createElement("img");img.className="ps-native-effect";img.alt="";img.draggable=false;
      // Native FX textures must load before their short timeline begins.
      // Previously an uncached image could load AFTER the animation finished.
      const ready=new Promise(resolve=>{
        let settled=false;
        const finish=ok=>{
          if(settled)return;
          settled=true;clearTimeout(safety);
          if(!ok)this.failedTextures++;
          resolve(ok);
        };
        const safety=setTimeout(()=>finish(false),3000);
        img.onload=()=>{
          if(typeof img.decode==="function")
            img.decode().then(()=>finish(true)).catch(()=>finish(img.naturalWidth>0));
          else finish(img.naturalWidth>0);
        };
        img.onerror=()=>{
          if(!img.dataset.fxFallback){
            this.assetFallbacks++;
            img.dataset.fxFallback="1";
            img.src=FX+"impact.png";
          }else finish(false);
        };
        img.src=FX+url;
      });
      this.pendingImages.push(ready);
      const a={x:0,y:0,z:0,scale:1,opacity:1,...start},b={...a,...end};
      const aa=coords(this.s,a),bb=coords(this.s,b),w=(Number(meta.w)||80)*this.s.sx,h=(Number(meta.h)||80)*this.s.sy;
      const fromTime=cap(Number(start?.time||0)*1.25,0,9000),endTime=cap(Number(end?.time??((start?.time||0)+430))*1.25,0,10500),dur=cap(endTime-fromTime,170,3500);
      img.style.left=aa.x+"px";img.style.top=aa.y+"px";img.style.width=w+"px";img.style.height=h+"px";img.style.opacity="0";img.style.position="absolute";
      if(options&&typeof options==="object"&&options.filter)img.style.filter=options.filter;
      this.s.area.append(img);
      const trans=p=>{
        const scale=cap(Number(p.scale??1),.03,6),sx=cap(Number(p.xscale??1),.1,7),sy=cap(Number(p.yscale??1),.1,7);
        return `translate(-50%,-50%) rotate(${Number(p.rotate||0)}deg) scale(${scale*sx},${scale*sy})`;
      };
      const frames=[{left:aa.x+"px",top:aa.y+"px",transform:trans(a),opacity:a.opacity??1},{left:bb.x+"px",top:bb.y+"px",transform:trans(b),opacity:after==="fade"||after==="gone"||after==="explode"?0:(b.opacity??1)}];
      this.timeline.push(()=>{
        try{
          const anim=img.animate(frames,{delay:fromTime,duration:dur,easing:easing(transition),fill:"both"});
          anim.onfinish=()=>img.remove();anim.oncancel=()=>img.remove();
        }catch(e){
          img.style.opacity=String(a.opacity);
          img.style.transform=frames[0].transform;
          setTimeout(()=>img.remove(),Math.max(300,fromTime+dur));
        }
      });
      this.duration=Math.max(this.duration,fromTime+dur);
      const handle={effectName:name,el:img,animate(){return this;},delay(){return this;},css(){return this;},remove(){img.remove();return this;}};
      this.effects.push(handle);return handle;
    }
    animateEffect(handle,...args){
      if(typeof args[0]==="string")return this.showEffect(args[0],args[1],args[2],args[3],args[4]);
      return this.showEffect(handle?.effectName||"impact",args[0],args[1],args[2],args[3]);
    }
    async start(){
      if(!this.started)this.started=(async()=>{
        await Promise.all(this.pendingImages);
        for(const fn of this.timeline)fn();
      })();
      await this.started;
    }
    clean(){
      for(const v of this.effects){try{v.el.remove()}catch{}}
      for(const mon of this.mons)for(const anim of mon.animations){try{anim.cancel()}catch{}}
    }
    async finish(){
      await this.start();
      await sleep(cap(this.duration+150,450,6500));
      this.clean();
      window.PSArenaFXDebug={effects:this.effects.length,failedTextures:this.failedTextures,assetFallbacks:this.assetFallbacks,loadedNative:!!window.PSArenaNativeMoveAnims,at:new Date().toISOString()};
    }
  }
  class Mon{
    constructor(img,s,front){
      this.img=img;this.s=s;this.isFrontSprite=front;this.x=front?105:-105;this.y=front?70:0;this.z=0;this.cursor=0;
      this.state={x:this.x,y:this.y,z:this.z,scale:1,opacity:1};this.$el=dummy();this.animations=[];this.scene=null;
    }
    behind(n=0){return this.z+(this.isFrontSprite?-n:n);}
    leftof(n=0){return this.x+(this.isFrontSprite?-n:n);}
    delay(ms){this.cursor+=Number(ms||0)*1.25;if(this.scene)this.scene.duration=Math.max(this.scene.duration,this.cursor+100);return this;}
    anim(p={},transition="linear"){
      if(!this.img)return this;
      const old=this.state,nn={...old,...p},duration=cap((Number(p.time??450))*1.25,1,4000),delay=this.cursor;
      const pose=v=>{
        const dx=(Number(v.x??this.x)-this.x)*this.s.sx,dy=-(Number(v.y??this.y)-this.y)*this.s.sy;
        return {transform:`translateX(-50%) translate(${dx}px,${dy}px) scale(${cap(Number(v.scale??1),.04,3)})`,opacity:v.opacity??1};
      };
      const startAnimation=()=>{
        try{
          const animation=this.img.animate([pose(old),pose(nn)],{delay,duration,easing:easing(transition),fill:"forwards"});
          this.animations.push(animation);
        }catch{}
      };
      if(this.scene)this.scene.timeline.push(startAnimation);
      else startAnimation();
      this.cursor+=duration;this.state=nn;if(this.scene)this.scene.duration=Math.max(this.scene.duration,this.cursor+150);return this;
    }
  }
  async function playNativeMove(meta){
    const s=stage();if(!s)return false;
    const side=window.PSArenaViewSide?.()??0;
    const attacker=meta?.who===side?$("playerSprite"):$("opponentSprite");
    const target=meta?.who===side?$("opponentSprite"):$("playerSprite");
    const player=meta?.who===side;
    const a=new Mon(attacker,s,!player),b=new Mon(target,s,player);
    const scene=new Scene(s);
    scene.mons.push(a,b);
    a.scene=scene;b.scene=scene;
    scene.battle.mySide.active=[{sprite:a}];scene.battle.yourSide.active=[{sprite:b}];
    const anims=window.PSArenaNativeMoveAnims;
    const key=String(meta?.move||"").toLowerCase().replace(/[^a-z0-9]/g,"");
    const chosen=anims?.moves?.[key];
    let used=false;
    try{
      if(typeof chosen?.anim==="function"){chosen.anim(scene,[a,b]);used=true;}
      else {const misc=meta?.category==="physical"?"contactattack":"attack";anims?.other?.[misc]?.anim(scene,[a,b]);}
    }catch(e){
      console.warn("[Arena] efeito nativo não suportado integralmente:",key,e);
      if(!scene.effects.length)try{anims?.other?.attack?.anim(scene,[a,b]);}catch{}
    }
    await scene.finish();return used;
  }
  async function playNativeSwitch(who,view,nextGame,update) {
    const s=stage();if(!s)return false;
    const front=who!==view;
    const sprite=$(front?"opponentSprite":"playerSprite");
    if(!sprite)return false;
    const mon=new Mon(sprite,s,front);
    const out=new Scene(s);
    // The Showdown sprite texture and trajectory, without fabricated ball art.
    out.showEffect("pokeball",{
      x:mon.x,y:mon.y-40,z:mon.z,scale:.7,opacity:1,time:0
    },{
      x:mon.x,y:mon.y,z:mon.behind(50),scale:.7,opacity:0,time:400
    },"ballistic2");
    await out.start();
    const recall=sprite.animate([
      {transform:"translateX(-50%) translateY(0px) scale(1)",opacity:1},
      {transform:"translateX(-50%) translateY(40px) scale(0)",opacity:0}
    ],{duration:400,easing:"ease-in",fill:"forwards"});
    await sleep(415);
    try{recall.cancel()}catch{}
    if(typeof update==="function")update(nextGame);
    const incoming=$(front?"opponentSprite":"playerSprite");
    if(incoming){
      const intro=new Scene(s);
      intro.showEffect("pokeball",{
        x:mon.x,y:mon.y+30,z:mon.behind(50),scale:.7,opacity:0,time:0
      },{
        x:mon.x,y:mon.y-10,z:mon.z,scale:.7,opacity:1,time:300
      },"ballistic2","fade");
      await intro.start();
      incoming.animate([
        {transform:"translateX(-50%) translateY(10px) scale(0)",opacity:0},
        {transform:"translateX(-50%) translateY(-30px) scale(1)",opacity:1,offset:.62},
        {transform:"translateX(-50%) translateY(0px) scale(1)",opacity:1}
      ],{delay:300,duration:700,easing:"ease-out",fill:"none"});
      await sleep(1020);
      intro.clean();
    }
    out.clean();
    return true;
  }
  window.PSArenaVisuals={playNativeMove,playNativeSwitch,stage};
})();
