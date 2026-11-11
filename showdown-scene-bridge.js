/* Web Animations adapter for Pokémon Showdown's original licensed animation scripts. */
(function pokemonSceneBridge() {
  "use strict";
  const FX="https://play.pokemonshowdown.com/fx/";
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
      this.s=s;this.duration=320;this.effects=[];
      this.$bg=dummy();this.$bgEffect=dummy();this.$battle=dummy();this.$fx=dummy();
      this.battle={mySide:{active:[],pokemon:[]},yourSide:{active:[],pokemon:[]},p1:{active:[]},p2:{active:[]}};
    }
    wait(t){this.duration=Math.max(this.duration,Math.min(4000,(Number(t)||0)*.85));}
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
      img.src=FX+url;img.onerror=()=>{if(!img.dataset.fxFallback){img.dataset.fxFallback="1";img.src=FX+"impact.png";}};
      const a={x:0,y:0,z:0,scale:1,opacity:1,...start},b={...a,...end};
      const aa=coords(this.s,a),bb=coords(this.s,b),w=(Number(meta.w)||80)*this.s.sx,h=(Number(meta.h)||80)*this.s.sy;
      const fromTime=cap(Number(start?.time||0)*.85,0,7500),endTime=cap(Number(end?.time??((start?.time||0)+430))*.85,0,9200),dur=cap(endTime-fromTime,110,2600);
      img.style.left=aa.x+"px";img.style.top=aa.y+"px";img.style.width=w+"px";img.style.height=h+"px";img.style.opacity="0";img.style.position="absolute";
      if(options&&typeof options==="object"&&options.filter)img.style.filter=options.filter;
      this.s.area.append(img);
      const trans=p=>{
        const scale=cap(Number(p.scale??1),.03,6),sx=cap(Number(p.xscale??1),.1,7),sy=cap(Number(p.yscale??1),.1,7);
        return `translate(-50%,-50%) rotate(${Number(p.rotate||0)}deg) scale(${scale*sx},${scale*sy})`;
      };
      const frames=[{left:aa.x+"px",top:aa.y+"px",transform:trans(a),opacity:a.opacity??1},{left:bb.x+"px",top:bb.y+"px",transform:trans(b),opacity:after==="fade"||after==="gone"||after==="explode"?0:(b.opacity??1)}];
      const anim=img.animate(frames,{delay:fromTime,duration:dur,easing:easing(transition),fill:"both"});
      anim.onfinish=()=>img.remove();anim.oncancel=()=>img.remove();
      this.duration=Math.max(this.duration,fromTime+dur);
      const handle={effectName:name,el:img,animate(){return this;},delay(){return this;},css(){return this;},remove(){img.remove();return this;}};
      this.effects.push(handle);return handle;
    }
    animateEffect(handle,...args){
      if(typeof args[0]==="string")return this.showEffect(args[0],args[1],args[2],args[3],args[4]);
      return this.showEffect(handle?.effectName||"impact",args[0],args[1],args[2],args[3]);
    }
    async finish(){await sleep(cap(this.duration+80,290,4200));for(const v of this.effects)v.el.remove();}
  }
  class Mon{
    constructor(img,s,front){
      this.img=img;this.s=s;this.isFrontSprite=front;this.x=front?105:-105;this.y=front?70:0;this.z=0;this.cursor=0;
      this.state={x:this.x,y:this.y,z:this.z,scale:1,opacity:1};this.$el=dummy();
    }
    behind(n=0){return this.z+(this.isFrontSprite?-n:n);}
    leftof(n=0){return this.x+(this.isFrontSprite?-n:n);}
    delay(ms){this.cursor+=Number(ms||0)*.85;return this;}
    anim(p={},transition="linear"){
      if(!this.img)return this;
      const old=this.state,nn={...old,...p},duration=cap((Number(p.time??450))*.85,1,2500),delay=this.cursor;
      const pose=v=>{
        const dx=(Number(v.x??this.x)-this.x)*this.s.sx,dy=-(Number(v.y??this.y)-this.y)*this.s.sy;
        return {transform:`translateX(-50%) translate(${dx}px,${dy}px) scale(${cap(Number(v.scale??1),.04,3)})`,opacity:v.opacity??1};
      };
      try{this.img.animate([pose(old),pose(nn)],{delay,duration,easing:easing(transition),fill:"none"});}catch{}
      this.cursor+=duration;this.state=nn;return this;
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
  async function playNativeSwitch(who,view,nextGame,update){
    const s=stage();if(!s)return false;
    const enemy=who!==view;
    const sprite=$(enemy?"opponentSprite":"playerSprite");if(!sprite)return false;
    const x=s.width*(enemy?.68:.31),y=s.height*(enemy?.47:.76);
    const ball=document.createElement("img");ball.className="ps-native-ball";ball.alt="";ball.src=FX+"pokeball.png";
    ball.style.left=x+"px";ball.style.top=y+"px";s.area.append(ball);
    const scene=new Scene(s);
    scene.showEffect("shine",{x:enemy?110:-110,y:enemy?70:0,scale:.15,opacity:.3,time:150},{scale:1.6,opacity:0,time:400},"decel","fade");
    const recall=sprite.animate([{transform:"translateX(-50%) scale(1)",opacity:1},{transform:"translateX(-50%) scale(.08)",opacity:0,filter:"brightness(3)"}],{duration:240,fill:"forwards"});
    const motion=ball.animate([{transform:"translate(-50%,-50%) translate(-52px,45px) scale(.7) rotate(-60deg)",opacity:0},{transform:"translate(-50%,-50%) translate(0,-30px) scale(1.15) rotate(50deg)",opacity:1,offset:.42},{transform:"translate(-50%,-50%) scale(.85) rotate(180deg)",opacity:1,offset:.7},{transform:"translate(-50%,-50%) scale(1.4) rotate(225deg)",opacity:0}],{duration:650,fill:"forwards",easing:"ease-out"});
    await sleep(280);try{recall.cancel();}catch{}
    if(typeof update==="function")update(nextGame);
    const replacement=$(enemy?"opponentSprite":"playerSprite");
    if(replacement)replacement.animate([{transform:"translateX(-50%) scale(.1)",opacity:0,filter:"brightness(3)"},{transform:"translateX(-50%) scale(1.13)",opacity:1,offset:.7},{transform:"translateX(-50%) scale(1)",opacity:1}],{delay:70,duration:370,fill:"none",easing:"ease-out"});
    await sleep(420);try{motion.cancel();}catch{} ball.remove();return true;
  }
  window.PSArenaVisuals={playNativeMove,playNativeSwitch,stage};
})();
