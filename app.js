/* Pokémon Arena — protótipo particular independente.
   Este MVP usa regras próprias simplificadas (NÃO o motor oficial do Showdown).
   Nenhuma ação de combate depende de uma API remota; imagens usam o CDN do Showdown.
   PvP via PeerJS utiliza serviço público de sinalização, não é servidor dedicado privado. */
'use strict';

const TYPE_COLORS={Normal:'#b8b5a3',Fire:'#fb9162',Water:'#69b4ff',Electric:'#f7df65',Grass:'#72d19b',Ice:'#8cdfe1',Fighting:'#eb7775',Poison:'#b58ad8',Ground:'#d8b27a',Flying:'#a6baf0',Psychic:'#fb91bc',Bug:'#a9c86a',Rock:'#c2ab85',Ghost:'#a895d6',Dragon:'#8b8bea',Dark:'#9d8b8d',Steel:'#a5bdce',Fairy:'#ebb1e9'};
// Efetividades positivas/negativas/imunidades. Tipos não listados são neutros.
const TYPE_MATCH={Normal:{Rock:.5,Ghost:0,Steel:.5},Fire:{Fire:.5,Water:.5,Grass:2,Ice:2,Bug:2,Rock:.5,Dragon:.5,Steel:2},Water:{Fire:2,Water:.5,Grass:.5,Ground:2,Rock:2,Dragon:.5},Electric:{Water:2,Electric:.5,Grass:.5,Ground:0,Flying:2,Dragon:.5},Grass:{Fire:.5,Water:2,Grass:.5,Poison:.5,Ground:2,Flying:.5,Bug:.5,Rock:2,Dragon:.5,Steel:.5},Ice:{Fire:.5,Water:.5,Grass:2,Ice:.5,Ground:2,Flying:2,Dragon:2,Steel:.5},Fighting:{Normal:2,Ice:2,Poison:.5,Flying:.5,Psychic:.5,Bug:.5,Rock:2,Ghost:0,Dark:2,Steel:2,Fairy:.5},Poison:{Grass:2,Poison:.5,Ground:.5,Rock:.5,Ghost:.5,Steel:0,Fairy:2},Ground:{Fire:2,Electric:2,Grass:.5,Poison:2,Flying:0,Bug:.5,Rock:2,Steel:2},Flying:{Electric:.5,Grass:2,Fighting:2,Bug:2,Rock:.5,Steel:.5},Psychic:{Fighting:2,Poison:2,Psychic:.5,Dark:0,Steel:.5},Bug:{Fire:.5,Grass:2,Fighting:.5,Poison:.5,Flying:.5,Psychic:2,Ghost:.5,Dark:2,Steel:.5,Fairy:.5},Rock:{Fire:2,Ice:2,Fighting:.5,Ground:.5,Flying:2,Bug:2,Steel:.5},Ghost:{Normal:0,Psychic:2,Ghost:2,Dark:.5},Dragon:{Dragon:2,Steel:.5,Fairy:0},Dark:{Fighting:.5,Psychic:2,Ghost:2,Dark:.5,Fairy:.5},Steel:{Fire:.5,Water:.5,Electric:.5,Ice:2,Rock:2,Steel:.5,Fairy:2},Fairy:{Fire:.5,Fighting:2,Poison:.5,Dragon:2,Dark:2,Steel:.5}};
// Nome -> [tipo, força, categoria física/especial/status, precisão, efeito opcional, prioridade].
const MOVES={
 'Flamethrower':['Fire',90,'special',100,'burn10'], 'Fire Blast':['Fire',110,'special',85,'burn10'], 'Flare Blitz':['Fire',120,'physical',100,'recoil'], 'Pyro Ball':['Fire',120,'physical',90,'burn10'], 'Torch Song':['Fire',80,'special',100,'spaboost'], 'Bitter Blade':['Fire',90,'physical',100,'drain'], 'Fiery Dance':['Fire',80,'special',100,'spaboost50'],
 'Surf':['Water',90,'special',100], 'Hydro Pump':['Water',110,'special',80], 'Waterfall':['Water',80,'physical',100], 'Snipe Shot':['Water',80,'special',100], 'Water Shuriken':['Water',60,'special',100,undefined,1], 'Water Pulse':['Water',60,'special',100],
 'Thunderbolt':['Electric',90,'special',100,'par10'], 'Thunder':['Electric',110,'special',70,'par30'], 'Volt Switch':['Electric',70,'special',100], 'Overdrive':['Electric',80,'special',100],
 'Giga Drain':['Grass',75,'special',100,'drain'], 'Leaf Blade':['Grass',90,'physical',100], 'Wood Hammer':['Grass',120,'physical',100,'recoil'], 'Drum Beating':['Grass',80,'physical',100], 'Flower Trick':['Grass',70,'physical',100,'alwayscrit'],
 'Ice Beam':['Ice',90,'special',100], 'Ice Fang':['Ice',65,'physical',95],
 'Close Combat':['Fighting',120,'physical',100,'defdrop'], 'Aura Sphere':['Fighting',80,'special',100], 'Drain Punch':['Fighting',75,'physical',100,'drain'], 'Focus Blast':['Fighting',120,'special',70], 'High Jump Kick':['Fighting',130,'physical',90], 'Superpower':['Fighting',120,'physical',100,'atkdrop'],
 'Sludge Bomb':['Poison',90,'special',100,'poison30'],
 'Earthquake':['Ground',100,'physical',100], 'Earth Power':['Ground',90,'special',100],
 'Air Slash':['Flying',75,'special',95], 'Hurricane':['Flying',110,'special',70], 'Brave Bird':['Flying',120,'physical',100,'recoil'], 'Dragon Ascent':['Flying',120,'physical',100,'defdrop'],
 'Psychic':['Psychic',90,'special',100], 'Psycho Cut':['Psychic',70,'physical',100], 'Zen Headbutt':['Psychic',80,'physical',90],
 'X-Scissor':['Bug',80,'physical',100], 'Bug Buzz':['Bug',90,'special',100], 'U-turn':['Bug',70,'physical',100],
 'Stone Edge':['Rock',100,'physical',80], 'Rock Slide':['Rock',75,'physical',90],
 'Shadow Ball':['Ghost',80,'special',100], 'Shadow Claw':['Ghost',70,'physical',100], 'Shadow Sneak':['Ghost',40,'physical',100,undefined,1], 'Rage Fist':['Ghost',70,'physical',100],
 'Dragon Pulse':['Dragon',85,'special',100], 'Dragon Claw':['Dragon',80,'physical',100], 'Dragon Darts':['Dragon',100,'physical',100],
 'Crunch':['Dark',80,'physical',100], 'Dark Pulse':['Dark',80,'special',100], 'Night Daze':['Dark',85,'special',95], 'Night Slash':['Dark',70,'physical',100], 'Knock Off':['Dark',65,'physical',100], 'Foul Play':['Dark',95,'physical',100], 'Sucker Punch':['Dark',70,'physical',100,undefined,1],
 'Flash Cannon':['Steel',80,'special',100], 'Iron Head':['Steel',80,'physical',100], 'Iron Tail':['Steel',100,'physical',75], 'Meteor Mash':['Steel',90,'physical',90], 'Bullet Punch':['Steel',40,'physical',100,undefined,1], 'Gigaton Hammer':['Steel',160,'physical',100,'gigaton'],
 'Moonblast':['Fairy',95,'special',100], 'Dazzling Gleam':['Fairy',80,'special',100], 'Play Rough':['Fairy',90,'physical',90],
 'Tackle':['Normal',40,'physical',100], 'Swift':['Normal',60,'special',100], 'Quick Attack':['Normal',40,'physical',100,undefined,1], 'Extreme Speed':['Normal',80,'physical',100,undefined,2], 'Body Slam':['Normal',85,'physical',100,'par30'], 'Boomburst':['Normal',140,'special',100], 'Rapid Spin':['Normal',50,'physical',100],
 'Roost':['Flying',0,'status',100,'heal'], 'Recover':['Normal',0,'status',100,'heal'], 'Rest':['Psychic',0,'status',100,'rest'], 'Moonlight':['Fairy',0,'status',100,'heal'], 'Morning Sun':['Normal',0,'status',100,'heal'], 'Slack Off':['Normal',0,'status',100,'heal'], 'Wish':['Normal',0,'status',100,'heal'],
 'Calm Mind':['Psychic',0,'status',100,'calm'], 'Swords Dance':['Normal',0,'status',100,'swords'], 'Dragon Dance':['Dragon',0,'status',100,'dragon'], 'Bulk Up':['Fighting',0,'status',100,'bulk'], 'Quiver Dance':['Bug',0,'status',100,'quiver'],
 'Thunder Wave':['Electric',0,'status',90,'par'], 'Will-O-Wisp':['Fire',0,'status',85,'burn'], 'Toxic':['Poison',0,'status',90,'poison'], 'Sleep Powder':['Grass',0,'status',75,'sleep'], 'Hypnosis':['Psychic',0,'status',60,'sleep'], 'Sing':['Normal',0,'status',55,'sleep'], 'Protect':['Normal',0,'status',100,'protect',4], "King's Shield":['Steel',0,'status',100,'protect',4]
};
// Catálogo de demonstração: atributos base aproximados aos jogos, nível 50, sem EV/IV/item/ability.
const ROWS=[
 ['Charizard',6,'Fire/Flying',78,84,78,109,85,100,'Flamethrower','Air Slash','Dragon Pulse','Roost'],
 ['Blastoise',9,'Water',79,83,100,85,105,78,'Surf','Ice Beam','Dark Pulse','Rapid Spin'],
 ['Venusaur',3,'Grass/Poison',80,82,83,100,100,80,'Giga Drain','Sludge Bomb','Sleep Powder','Earth Power'],
 ['Pikachu',25,'Electric',35,55,40,50,50,90,'Thunderbolt','Quick Attack','Iron Tail','Thunder Wave'],
 ['Gengar',94,'Ghost/Poison',60,65,60,130,75,110,'Shadow Ball','Sludge Bomb','Dazzling Gleam','Hypnosis'],
 ['Lucario',448,'Fighting/Steel',70,110,70,115,70,90,'Aura Sphere','Flash Cannon','Extreme Speed','Dark Pulse'],
 ['Dragonite',149,'Dragon/Flying',91,134,95,100,100,80,'Dragon Claw','Hurricane','Earthquake','Roost'],
 ['Garchomp',445,'Dragon/Ground',108,130,95,80,85,102,'Earthquake','Dragon Claw','Stone Edge','Swords Dance'],
 ['Greninja',658,'Water/Dark',72,95,67,103,71,122,'Surf','Dark Pulse','Ice Beam','Water Shuriken'],
 ['Snorlax',143,'Normal',160,110,65,65,110,30,'Body Slam','Earthquake','Crunch','Rest'],
 ['Alakazam',65,'Psychic',55,50,45,135,95,120,'Psychic','Shadow Ball','Focus Blast','Recover'],
 ['Tyranitar',248,'Rock/Dark',100,134,110,95,100,61,'Stone Edge','Crunch','Earthquake','Dragon Dance'],
 ['Scizor',212,'Bug/Steel',70,130,100,55,80,65,'Bullet Punch','X-Scissor','Swords Dance','U-turn'],
 ['Metagross',376,'Steel/Psychic',80,135,130,95,90,70,'Meteor Mash','Zen Headbutt','Bullet Punch','Earthquake'],
 ['Gyarados',130,'Water/Flying',95,125,79,60,100,81,'Waterfall','Crunch','Ice Fang','Dragon Dance'],
 ['Arcanine',59,'Fire',90,110,80,100,80,95,'Flare Blitz','Extreme Speed','Crunch','Morning Sun'],
 ['Sylveon',700,'Fairy',95,65,65,110,130,60,'Moonblast','Quick Attack','Shadow Ball','Calm Mind'],
 ['Umbreon',197,'Dark',95,65,110,60,130,65,'Foul Play','Moonlight','Toxic','Protect'],
 ['Espeon',196,'Psychic',65,65,60,130,95,110,'Psychic','Dazzling Gleam','Shadow Ball','Calm Mind'],
 ['Jolteon',135,'Electric',65,65,60,110,95,130,'Thunderbolt','Shadow Ball','Volt Switch','Thunder Wave'],
 ['Vaporeon',134,'Water',130,65,60,110,95,65,'Surf','Ice Beam','Wish','Protect'],
 ['Glaceon',471,'Ice',65,60,110,130,95,65,'Ice Beam','Shadow Ball','Water Pulse','Protect'],
 ['Leafeon',470,'Grass',65,110,130,60,65,95,'Leaf Blade','X-Scissor','Swords Dance','Quick Attack'],
 ['Flareon',136,'Fire',65,130,60,95,110,65,'Flare Blitz','Quick Attack','Superpower','Will-O-Wisp'],
 ['Mewtwo',150,'Psychic',106,110,90,154,90,130,'Psychic','Aura Sphere','Ice Beam','Recover'],
 ['Rayquaza',384,'Dragon/Flying',105,150,90,150,90,95,'Dragon Ascent','Dragon Claw','Extreme Speed','Flamethrower'],
 ['Ceruledge',937,'Fire/Ghost',75,125,80,60,100,85,'Bitter Blade','Shadow Claw','Swords Dance','Will-O-Wisp'],
 ['Skeledirge',911,'Fire/Ghost',104,75,100,110,75,66,'Torch Song','Shadow Ball','Earth Power','Slack Off'],
 ['Meowscarada',908,'Grass/Dark',76,110,70,81,70,123,'Flower Trick','Knock Off','U-turn','Play Rough'],
 ['Tinkaton',959,'Fairy/Steel',85,75,77,70,105,94,'Gigaton Hammer','Play Rough','Knock Off','Thunder Wave'],
 ['Annihilape',979,'Fighting/Ghost',110,115,80,50,90,90,'Rage Fist','Drain Punch','Bulk Up','Shadow Claw'],
 ['Dragapult',887,'Dragon/Ghost',88,120,75,100,75,142,'Dragon Darts','Shadow Ball','Flamethrower','U-turn'],
 ['Zoroark',571,'Dark',60,105,60,120,60,105,'Night Daze','Flamethrower','Focus Blast','U-turn'],
 ['Bisharp',625,'Dark/Steel',65,125,100,60,70,70,'Night Slash','Iron Head','Sucker Punch','Swords Dance'],
 ['Corviknight',823,'Flying/Steel',98,87,105,53,85,67,'Brave Bird','Iron Head','Roost','U-turn'],
 ['Mimikyu',778,'Ghost/Fairy',55,90,80,50,105,96,'Play Rough','Shadow Claw','Shadow Sneak','Swords Dance'],
 ['Rillaboom',812,'Grass',100,125,90,60,70,85,'Drum Beating','Wood Hammer','Knock Off','U-turn'],
 ['Cinderace',815,'Fire',80,116,75,65,75,119,'Pyro Ball','High Jump Kick','U-turn','Sucker Punch'],
 ['Inteleon',818,'Water',70,85,65,125,65,120,'Snipe Shot','Ice Beam','Dark Pulse','U-turn'],
 ['Aegislash',681,'Steel/Ghost',60,50,140,50,140,60,'Shadow Ball','Flash Cannon',"King's Shield",'Shadow Sneak'],
 ['Toxtricity',849,'Electric/Poison',75,98,70,114,70,75,'Overdrive','Sludge Bomb','Boomburst','Volt Switch'],
 ['Volcarona',637,'Bug/Fire',85,60,65,135,105,100,'Fiery Dance','Bug Buzz','Giga Drain','Quiver Dance'],
 ['Lapras',131,'Water/Ice',130,85,80,85,95,60,'Surf','Ice Beam','Thunderbolt','Sing'],
 ['Gardevoir',282,'Psychic/Fairy',68,65,65,125,115,80,'Moonblast','Psychic','Shadow Ball','Calm Mind'],
 ['Gallade',475,'Psychic/Fighting',68,125,65,65,115,80,'Psycho Cut','Close Combat','Leaf Blade','Swords Dance'],
 ['Excadrill',530,'Ground/Steel',110,135,60,50,65,88,'Earthquake','Iron Head','Rock Slide','Swords Dance']
];
// Restore moves selected in the separate team builder, with PokéAPI PP, accuracy, power and category.
try{const savedMoves=JSON.parse(localStorage.getItem('arena-extra-moves')||'{}');if(savedMoves&&typeof savedMoves==='object')for(const [name,entry] of Object.entries(savedMoves)){if(/^[\w '-]{1,70}$/.test(name)&&Array.isArray(entry)&&entry.length>=4&&['physical','special','status'].includes(entry[2])&&TYPE_COLORS[entry[0]])MOVES[name]=entry;}}catch{}
const DEX=ROWS.map(([name,id,types,hp,atk,def,spa,spd,spe,...moves])=>({name,id,slug:name.toLowerCase().replace(/[^a-z0-9]+/g,''),types:types.split('/'),hp,atk,def,spa,spd,spe,moves}));
const LOOKUP=new Map(DEX.map(p=>[p.id,p]));
function restoreExtraDex(){try{const cached=JSON.parse(localStorage.getItem('arena-extra-dex')||'[]');if(!Array.isArray(cached))return;for(const p of cached.slice(0,2200)){if(!Number.isInteger(p.id)||!Array.isArray(p.moves)||p.moves.length!==4||p.moves.some(m=>!MOVES[m])||LOOKUP.has(p.id))continue;DEX.push(p);LOOKUP.set(p.id,p);}}catch{}}
function saveExtraDex(){try{localStorage.setItem('arena-extra-dex',JSON.stringify(DEX.slice(ROWS.length)));}catch{}}
restoreExtraDex();
const DEFAULT_TEAM=[6,658,445,94,448,700];
const el=id=>document.getElementById(id);
const $=id=>el(id);
let selectedTeam=loadTeam(),game=null,mode='none',viewSide=0,queue=[null,null],processing=false,editingTeam=[...selectedTeam];
window.PSArenaViewSide=()=>viewSide;
let network={peer:null,conn:null,role:null,room:null};
let sound=false,feed=[];
function loadTeam(){try{const arr=JSON.parse(localStorage.getItem('arena-team')||'null');if(Array.isArray(arr)&&arr.length===6&&arr.every(x=>LOOKUP.has(x))&&new Set(arr).size===6)return arr;}catch{}return [...DEFAULT_TEAM];}
function saveTeam(){selectedTeam=[...editingTeam];try{localStorage.setItem('arena-team',JSON.stringify(selectedTeam));}catch{}renderTeam();closeModal();void cloudSaveTeam();}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const pct=p=>Math.max(0,Math.min(100,Math.round(p.hp/p.maxHp*100)));
const anyAlive=s=>s.team.some(p=>p.hp>0);
const active=s=>s.team[s.active];
const NATURES_MOD={Hardy:[],Lonely:['atk','def'],Brave:['atk','spe'],Adamant:['atk','spa'],Naughty:['atk','spd'],Bold:['def','atk'],Docile:[],Relaxed:['def','spe'],Impish:['def','spa'],Lax:['def','spd'],Timid:['spe','atk'],Hasty:['spe','def'],Serious:[],Jolly:['spe','spa'],Naive:['spe','spd'],Modest:['spa','atk'],Mild:['spa','def'],Quiet:['spa','spe'],Bashful:[],Rash:['spa','spd'],Calm:['spd','atk'],Gentle:['spd','def'],Sassy:['spd','spe'],Careful:['spd','spa'],Quirky:[]};
function savedBuilds(){try{const a=JSON.parse(localStorage.getItem('arena-team-builds')||'[]');return Array.isArray(a)?a:[];}catch{return [];}}
function makePoke(id,config=null){const p=LOOKUP.get(id);if(!p)throw Error('Pokémon ainda não carregado: '+id);const c=config?.id===id?config:null;const level=Math.max(1,Math.min(100,c?.level||50));
 const nature=c?.nature||'Serious', mods=NATURES_MOD[nature]||[];
 const values={};for(const k of ['hp','atk','def','spa','spd','spe']){
  const b=p[k],iv=Math.max(0,Math.min(31,c?.ivs?.[k]??31)),ev=Math.max(0,Math.min(252,c?.evs?.[k]??0));const raw=Math.floor((2*b+iv+Math.floor(ev/4))*level/100);values[k]=k==='hp'?(p.name==='Shedinja'?1:raw+level+10):Math.floor((raw+5)*(mods[0]===k?1.1:mods[1]===k?.9:1));
 }
 const moves=Array.isArray(c?.moves)&&c.moves.length===4&&c.moves.every(m=>MOVES[m])?[...c.moves]:[...p.moves];
 const maxHp=values.hp;
 return {...p,...values,level,nature,evs:c?.evs||null,ivs:c?.ivs||null,ability:c?.ability||'',item:c?.item||'',moves,maxHp,hp:maxHp,status:null,sleep:0,stages:{atk:0,def:0,spa:0,spd:0,spe:0},protect:false,lastMove:null,pps:moves.map(m=>MOVES[m]?.[6]|| (MOVES[m]?.[2]==='status'?10:15))};}
function side(name,ids,isPlayer=false){const builds=isPlayer?savedBuilds():[];return {name,active:0,team:ids.map((id,i)=>makePoke(id,builds[i]))};}
function randomTeam(exclude=[]){const pool=DEX.map(p=>p.id).filter(id=>!exclude.includes(id));for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}return pool.slice(0,6);}
function newGame(kind='pve',guestTeam=null){if(kind==='online-host'&&!guestTeam)return;mode=kind;viewSide=0;queue=[null,null];processing=false;feed=[];game={turn:1,finished:false,winner:null,side:[side('Você',selectedTeam,true),side(kind==='pve'?'Treinador IA':kind==='local'?'Jogador 2':'Convidado',guestTeam||randomTeam(selectedTeam))],message:'A batalha começou! Escolha seu primeiro movimento.'};if(kind==='local'){game.side[0].name='Jogador 1';}elsFeed();render();if(kind==='pve')addFeed('A IA está pronta para o combate.');}
function stage(stat){return stat>=0?(2+stat)/2:2/(2-stat);}
function mult(moveType,defender){return defender.types.reduce((m,t)=>m*(TYPE_MATCH[moveType]?.[t]??1),1);}
function expected(m,a,d){const [t,power,category,,eff]=MOVES[m];if(category==='status')return eff==='heal'&&a.hp/a.maxHp<.7?90:eff==='swords'||eff==='calm'?38:eff==='par'||eff==='burn'||eff==='sleep'?32:8;const type=mult(t,d);if(!type)return 0;const atk=category==='special'?a.spa:a.atk;const def=category==='special'?d.spd:d.def;return power*atk/def*(a.types.includes(t)?1.5:1)*type;}
function pickAI(){const a=active(game.side[1]),d=active(game.side[0]);let choices=a.moves.map((m,i)=>({m,i,v:expected(m,a,d)+(Math.random()*12)})).filter(x=>a.pps[x.i]>0);choices.sort((a,b)=>b.v-a.v);if(!choices.length)return{kind:'move',idx:0};const best=choices[0];if((a.hp/a.maxHp<.22||Math.max(...choices.map(x=>x.v))<36)&&game.side[1].team.some((p,i)=>i!==game.side[1].active&&p.hp>0)){const opts=game.side[1].team.map((p,i)=>({p,i,v:p.hp>0&&i!==game.side[1].active?Math.max(...p.moves.map(m=>expected(m,p,d))):0})).sort((a,b)=>b.v-a.v);if(opts[0]&&opts[0].v>best.v*1.6)return {kind:'switch',idx:opts[0].i};}return{kind:'move',idx:best.i};}
function pushEvent(events,message,meta={}){events.push({message,meta,game:structuredClone(game)});}
// Core Gen 3+ damage formula, level/IV/EV/nature, STAB, type, burn, critical and random roll.
// NOTE: This lightweight engine still lacks the full Showdown event/ability/item/weather logic.
function damage(a,d,m,critical){const [t,power,category]=MOVES[m];
 let attack=(category==='physical'?a.atk*stage(a.stages.atk):a.spa*stage(a.stages.spa));
 let defense=Math.max(1,category==='physical'?d.def*stage(d.stages.def):d.spd*stage(d.stages.spd));
 if(category==='physical'&&a.item==='choice-band')attack*=1.5;
 if(category==='special'&&a.item==='choice-specs')attack*=1.5;
 if(category==='special'&&d.item==='assault-vest')defense*=1.5;
 const level=a.level||50;
 let val=Math.floor(Math.floor((Math.floor(2*level/5)+2)*power*attack/defense)/50)+2;
 let modifier=(a.types.includes(t)?(a.ability==='adaptability'?2:1.5):1)*mult(t,d)*(critical?1.5:1)*(.85+Math.random()*.15);
 if(a.status==='brn'&&category==='physical'&&a.ability!=='guts')modifier*=.5;
 if(a.item==='life-orb')modifier*=1.3;
 if(a.item==='expert-belt'&&mult(t,d)>1)modifier*=1.2;
 return Math.max(1,Math.floor(val*modifier));}
const STATUS_NAME={par:'PAR',brn:'BRN',psn:'PSN',slp:'SLP'};
function applyStatus(d,status,events){if(d.status)return false;if(status==='par'&&d.types.includes('Electric'))return false;if(status==='brn'&&d.types.includes('Fire'))return false;if(status==='psn'&&(d.types.includes('Poison')||d.types.includes('Steel')))return false;d.status=status;if(status==='slp')d.sleep=1+Math.floor(Math.random()*3);pushEvent(events,`${d.name} recebeu o estado ${STATUS_NAME[status]}!`,{type:'status'});return true;}
function useMove(who,idx,events){const own=game.side[who],opp=game.side[1-who],a=active(own),d=active(opp);if(a.hp<=0)return;if(a.status==='slp'){a.sleep--;if(a.sleep>0){pushEvent(events,`${a.name} está dormindo!`);return;}a.status=null;pushEvent(events,`${a.name} acordou!`);}if(a.status==='par'&&Math.random()<.25){pushEvent(events,`${a.name} está paralisado e não conseguiu atacar!`);return;}
 let m=a.moves[idx];if(!m||!MOVES[m]||a.pps[idx]<=0){const fallback=a.pps.findIndex(pp=>pp>0);if(fallback<0){a.hp=Math.max(0,a.hp-12);d.hp=Math.max(0,d.hp-12);pushEvent(events,`${a.name} usou Struggle!`,{who,target:1-who,type:'Normal',attack:true});return;}idx=fallback;m=a.moves[idx];}
 a.pps[idx]--;const [type,power,category,accuracy,effect]=MOVES[m];a.lastMove=m;
 const exempt=category==='status'&&['heal','rest','calm','swords','dragon','bulk','quiver','protect'].includes(effect);
 if(!exempt&&Math.random()*100>=accuracy){pushEvent(events,`${a.name} usou ${m}, mas errou!`,{who,type,attack:true,miss:true,target:1-who,move:m});return;}
 if(category==='status'){
  if(effect==='heal'){const heal=Math.min(a.maxHp-a.hp,Math.floor(a.maxHp*.5));a.hp+=heal;pushEvent(events,`${a.name} usou ${m} e recuperou ${heal} HP.`,{who,type:'Grass',heal:true,move:m});}
  else if(effect==='rest'){a.hp=a.maxHp;a.status='slp';a.sleep=2;pushEvent(events,`${a.name} descansou e restaurou seu HP!`,{who,type:'Psychic',heal:true,move:m});}
  else if(effect==='protect'){a.protect=true;pushEvent(events,`${a.name} se protegeu!`,{who,type,shield:true,move:m});}
  else if(['swords','calm','dragon','bulk','quiver'].includes(effect)){const changes={swords:{atk:2},calm:{spa:1,spd:1},dragon:{atk:1,spe:1},bulk:{atk:1,def:1},quiver:{spa:1,spd:1,spe:1}}[effect];Object.entries(changes).forEach(([s,v])=>a.stages[s]=Math.min(6,a.stages[s]+v));pushEvent(events,`${a.name} usou ${m}! Seus atributos aumentaram.`,{who,type,boost:true,move:m});}
  else{const status={par:'par',burn:'brn',poison:'psn',sleep:'slp'}[effect];if(!status){pushEvent(events,`${a.name} usou ${m}! Efeito complexo ainda não implementado neste protótipo.`,{who,type,move:m,attack:true,target:who});}else if(!applyStatus(d,status,events))pushEvent(events,`${m} não teve efeito em ${d.name}.`,{who,type,move:m,attack:true,target:1-who});else events[events.length-1].meta={who,type,move:m,attack:true,target:1-who};}
  return;
 }
 if(d.protect){pushEvent(events,`${a.name} usou ${m}, mas ${d.name} estava protegido!`,{who,type,attack:true,target:1-who,move:m});return;}
 const eff=mult(type,d);if(eff===0){pushEvent(events,`${a.name} usou ${m}, mas não afetou ${d.name}.`,{who,type,attack:true,target:1-who,move:m});return;}
 const crit=effect==='alwayscrit'||Math.random()<.0625;
 const hit=damage(a,d,m,crit);d.hp=Math.max(0,d.hp-hit);
 let suffix=eff>=2?' • Super efetivo!':eff<1?' • Pouco efetivo.':'';if(crit)suffix+=' • Acerto crítico!';
 pushEvent(events,`${a.name} usou ${m}! ${d.name} perdeu ${hit} HP.${suffix}`,{who,target:1-who,type,attack:true,effectiveness:eff,crit,move:m});
 if(effect==='drain'){const heal=Math.min(a.maxHp-a.hp,Math.floor(hit/2));a.hp+=heal;if(heal)pushEvent(events,`${a.name} recuperou ${heal} HP!`,{who,type:'Grass',heal:true,move:m});}
 if(effect==='recoil'){const recoil=Math.max(1,Math.floor(hit/3));a.hp=Math.max(0,a.hp-recoil);pushEvent(events,`${a.name} sofreu ${recoil} de recuo!`,{who,type:'Normal',hurt:true,target:who});}
 if(effect==='defdrop')a.stages.def=Math.max(-6,a.stages.def-1);
 if(effect==='atkdrop')a.stages.atk=Math.max(-6,a.stages.atk-1);
 if((effect==='par10'&&Math.random()<.1)||(effect==='par30'&&Math.random()<.3))applyStatus(d,'par',events);
 if(effect==='burn10'&&Math.random()<.1)applyStatus(d,'brn',events);
 if(effect==='poison30'&&Math.random()<.3)applyStatus(d,'psn',events);
 if(effect==='spaboost'||(effect==='spaboost50'&&Math.random()<.5)){a.stages.spa=Math.min(6,a.stages.spa+1);pushEvent(events,`O Ataque Especial de ${a.name} aumentou!`,{who,boost:true,type});}
 }
function doSwitch(who,idx,events){const s=game.side[who],from=active(s);if(!s.team[idx]||s.team[idx].hp<=0||idx===s.active)return;s.active=idx;pushEvent(events,`${s.name} recolheu ${from.name} e enviou ${active(s).name}!`,{who,type:'switch',switch:true});}
function chooseNext(who,events){const s=game.side[who];if(active(s).hp>0)return;if(!anyAlive(s))return;const idx=s.team.findIndex(p=>p.hp>0);s.active=idx;pushEvent(events,`${s.name} enviou ${active(s).name} para continuar!`,{who,switch:true,type:'switch'});}
function settleFaint(events){for(let who=0;who<2;who++){const p=active(game.side[who]);if(p.hp<=0)pushEvent(events,`${p.name} desmaiou!`,{who,type:'faint',target:who});}
 for(let who=0;who<2;who++)chooseNext(who,events);
 if(!anyAlive(game.side[0])||!anyAlive(game.side[1])){game.finished=true;game.winner=anyAlive(game.side[0])?0:anyAlive(game.side[1])?1:-1;pushEvent(events,game.winner<0?'Empate!':`${game.side[game.winner].name} venceu a batalha!`,{end:true});}}
function settleTurn(){const events=[],choices=[...queue],acts=[],turnStarters=game.side.map(s=>s.active);for(const p of game.side)active(p).protect=false;
 for(let who=0;who<2;who++){const c=choices[who];if(!c)continue;const poke=active(game.side[who]);let pr=c.kind==='switch'?6:MOVES[poke.moves[c.idx]]?.[5]||0;let spe=poke.spe*stage(poke.stages.spe)*(poke.status==='par'?.5:1);acts.push({who,c,pr,spe,tie:Math.random()});}
 acts.sort((a,b)=>b.pr-a.pr||b.spe-a.spe||b.tie-a.tie);
 for(const ac of acts){if(game.finished)break;const s=game.side[ac.who];if(!anyAlive(s)||!anyAlive(game.side[1-ac.who]))break;if(ac.c.kind==='switch'){doSwitch(ac.who,ac.c.idx,events);}else{if(active(s).hp<=0||s.active!==turnStarters[ac.who])continue;useMove(ac.who,ac.c.idx,events);}if(active(s).hp<=0||active(game.side[1-ac.who]).hp<=0){settleFaint(events);if(game.finished)break;}}
 if(!game.finished){for(let who=0;who<2;who++){const p=active(game.side[who]);if(p.hp>0&&(p.status==='brn'||p.status==='psn')){const d=Math.max(1,Math.floor(p.maxHp/8));p.hp=Math.max(0,p.hp-d);pushEvent(events,`${p.name} sofreu ${d} HP por ${p.status==='brn'?'queimadura':'veneno'}!`,{who,type:'status',target:who,hurt:true});}}
 if(game.side.some(s=>active(s).hp===0))settleFaint(events);
 }
 if(!game.finished){game.turn++;pushEvent(events,`Turno ${game.turn}. Escolha seu próximo movimento.`,{turn:true});}
 queue=[null,null];return events;
}
async function runTurn(){if(processing||!queue[0]||!queue[1]||!game||game.finished)return;processing=true;const before=structuredClone(game);const events=settleTurn();game=before;render();for(const ev of events){if(mode.startsWith('online')&&network.role==='host'&&network.conn?.open){network.conn.send({type:'event',event:ev});}if(ev.meta?.attack||ev.meta?.boost||ev.meta?.heal||ev.meta?.shield)await animateHit({...ev.meta,target:ev.meta.attack?ev.meta.target:ev.meta.who});else if(ev.meta?.switch)await animateSwitch(ev.meta,ev.game);game=ev.game;game.message=ev.message;addFeed(ev.message);if(ev.meta?.end)void cloudSaveBattle();render();await sleep(ev.meta?.attack?320:ev.meta?.end?550:210);}processing=false;if(mode==='local'&&!game.finished)viewSide=0;render();if(mode==='online-host'&&network.conn?.open)network.conn.send({type:'sync',game});}
function canAct(who){return game&&!game.finished&&!processing&&!queue[who]&&anyAlive(game.side[who]);}
function doAction(c){if(!game||game.finished||processing)return;const who=viewSide;
 if(mode==='online-guest'){if(!network.conn?.open)return showMessage('Conexão indisponível.');network.conn.send({type:'action',choice:c});showMessage('Sua escolha foi enviada. Aguardando o adversário...');disableMoves();return;}
 if(!canAct(who))return;
 if(c.kind==='switch'&&(c.idx===game.side[who].active||game.side[who].team[c.idx]?.hp<=0))return;
 queue[who]=c;closeModal();if(mode==='pve'){queue[1]=pickAI();void runTurn();}
 else if(mode==='local'){if(queue[0]&&!queue[1]){viewSide=1;showMessage('Jogador 2: escolha sua ação.');render();}else if(queue[0]&&queue[1]){viewSide=0;void runTurn();}}
 else if(mode==='online-host'){if(queue[0]&&queue[1])void runTurn();else{showMessage('Aguardando a escolha do convidado...');renderActions();}}
}
function formatStatus(p){return p.status?`<span class="status-tag">${STATUS_NAME[p.status]}</span>`:'';}
// Visual assets are loaded on demand, not redistributed in this repository.
// Sources: Pokémon Showdown CDN, PokeAPI sprites and community sprite mirrors for fallback.
const SPRITE_CDN='/assets/showdown/sprites/';
const POKE_SPRITES='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
const CHAMPIONS_MIRROR='https://raw.githubusercontent.com/KevinToodlepoot/pokemon-champions-sprites/main/sprites/';
let spriteStyle='champions',shinySprites=false;const BATTLE_FIELDS=[['Wallace • ORAS','sprites/gen6bgs/bg-leaderwallace.png'],['Cidade • ORAS','sprites/gen6bgs/bg-aquacordetown.png'],['Mar • ORAS','sprites/gen6bgs/bg-orassea.png'],['Meadow • Gen 6','sprites/gen6bgs/bg-meadow.jpg'],['Floresta • Gen 6','sprites/gen6bgs/bg-forest.jpg'],['Deserto • Gen 6','sprites/gen6bgs/bg-desert.jpg'],['Caverna • Gen 6','sprites/gen6bgs/bg-dampcave.jpg'],['Praia • Gen 6','sprites/gen6bgs/bg-beach.jpg']];let battlefieldIndex=0;function cycleBattlefield(){battlefieldIndex=(battlefieldIndex+1)%BATTLE_FIELDS.length;syncBattlefieldVisuals();}
const spriteCache=new Map();
const spriteMissing=new Set();
function spriteSlug(p){return String(p.slug||p.name||'').toLowerCase().replace(/[^a-z0-9]/g,'');}
function spriteSlugHyphen(p){return String(p.slug||p.name||'').toLowerCase().replace(/[\s_]+/g,'-').replace(/[^a-z0-9-]/g,'');}
function staticUrl(p,back=false){return `${POKE_SPRITES}${back?'back/':''}${p.id}.png`;}
function spriteCandidates(p,back=false,shiny=shinySprites,style=spriteStyle){
 const id=Number(p.id),slug=spriteSlug(p),slugHyphen=spriteSlugHyphen(p),arr=[];
 const add=url=>{if(url&&!arr.includes(url))arr.push(url);};
 const pk=(path)=>POKE_SPRITES+path;
 const pokeShow=pk('other/showdown/'+(back?'back/':'')+(shiny?'shiny/':'')+id+'.gif');
 const smogon=SPRITE_CDN+(back?(shiny?'ani-back-shiny/':'ani-back/'):(shiny?'ani-shiny/':'ani/'))+slug+'.gif';
 const gen5=pk('versions/generation-v/black-white/animated/'+(back?'back/':'')+(shiny?'shiny/':'')+id+'.gif');
 const champions=pk('versions/generation-ix/champions/'+(back?'back/':'')+(shiny?'shiny/':'')+id+'.webp');
 const scarlet=pk('versions/generation-ix/scarlet-violet/'+(back?'back/':'')+(shiny?'shiny/':'')+id+'.webp');
 const legends=pk('versions/generation-ix/legends-za/'+(back?'back/':'')+(shiny?'shiny/':'')+id+'.webp');
 const png=pk((back?'back/':'')+(shiny?'shiny/':'')+id+'.png');
 const home=pk('other/home/'+(shiny?'shiny/':'')+id+'.png');
 const artwork=pk('other/official-artwork/'+(shiny?'shiny/':'')+id+'.png');
 const championsMirror=!back&&!shiny?CHAMPIONS_MIRROR+slugHyphen+'.png':'';
 if(style==='champions'){
  add(champions);add(legends);add(scarlet);add(smogon);add(pokeShow);add(gen5);if(!back)add(championsMirror);add(png);
 }else if(style==='hd'){
  add(champions);add(legends);add(scarlet);if(back)add(png);if(!back){add(home);add(artwork);}add(pokeShow);add(smogon);
 }else if(style==='pixel'){
  add(gen5);add(pokeShow);add(smogon);add(champions);add(legends);add(scarlet);add(png);
 }else{
  add(smogon);add(pokeShow);add(champions);add(legends);add(scarlet);add(gen5);add(png);
 }
 if(shiny){
  add(pk('versions/generation-ix/champions/'+(back?'back/':'')+id+'.webp'));
  add(pk('other/showdown/'+(back?'back/':'')+id+'.gif'));
  add(SPRITE_CDN+(back?'ani-back/':'ani/')+slug+'.gif');
  add(pk((back?'back/':'')+id+'.png'));
 }
 if(!back){add(home);add(artwork);}
 else {add(pk('back/'+id+'.png'));add(pk('other/home/'+id+'.png'));}
 return arr;
}
function thumbCandidates(p){
 return [
  POKE_SPRITES+'versions/generation-ix/champions/icons/'+(shinySprites?'shiny/':'')+p.id+'.png',
  POKE_SPRITES+'other/home/'+(shinySprites?'shiny/':'')+p.id+'.png',
  POKE_SPRITES+'other/official-artwork/'+(shinySprites?'shiny/':'')+p.id+'.png',
  staticUrl(p)
 ];
}
function fallbackSpriteUrl(p){
 const c=TYPE_COLORS[p.types[0]]||'#a9ead6';const name=String(p.name).replace(/[&<>"]/g,'').slice(0,45);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><defs><radialGradient id="a"><stop stop-color="${c}" stop-opacity=".67"/><stop offset="1" stop-color="${c}" stop-opacity=".10"/></radialGradient></defs><circle cx="120" cy="105" r="89" fill="url(#a)"/><circle cx="120" cy="99" r="70" stroke="${c}" stroke-opacity=".7" stroke-width="7" fill="none"/><path d="M52 99h136" stroke="${c}" stroke-width="9"/><circle cx="120" cy="99" r="23" fill="#163846" stroke="${c}" stroke-width="9"/><circle cx="120" cy="99" r="8" fill="#d5fff1"/><text x="120" y="191" fill="#e8fffa" font-family="Arial,sans-serif" font-weight="bold" font-size="13" text-anchor="middle">${name}</text><text x="120" y="211" fill="${c}" font-family="Arial,sans-serif" font-size="12" text-anchor="middle">#${String(p.id).padStart(4,'0')}</text></svg>`;
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
function setSprite(img,p,back=false,small=false){
 if(!img||!p)return;
 const style=small?'thumb':spriteStyle;
 const key=[p.id,spriteSlug(p),back,shinySprites,style].join('|');
 if(img.dataset.spriteKey===key)return;
 img.dataset.spriteKey=key;
 img.alt=(back?'Costas de ':'')+p.name+(shinySprites?' shiny':'');
 img.src=fallbackSpriteUrl(p);
 const candidates=small?thumbCandidates(p):spriteCandidates(p,back);
 const remembered=spriteCache.get(key);
 const list=remembered?[remembered,...candidates.filter(x=>x!==remembered)]:candidates;
 let next=0;
 const attempt=()=>{
  if(img.dataset.spriteKey!==key)return;
  while(next<list.length && spriteMissing.has(list[next]))next++;
  if(next>=list.length)return;
  const url=list[next++];const test=new Image();
  test.onload=()=>{if(img.dataset.spriteKey===key){spriteCache.set(key,url);img.dataset.loadedSpriteUrl=url;img.src=url;syncSpriteClass(img,small,url);if(!small)applyBattleSpriteGeometry(img,p,test,back,url);}};
  test.onerror=()=>{spriteMissing.add(url);if(img.dataset.spriteKey===key)attempt();};
  test.src=url;
 };
 attempt();
 syncSpriteClass(img,small);
}
// Respect source aspect ratio, no stretching; closest to native Showdown display sizes.
function applyBattleSpriteGeometry(img,p,image,back,url){
 const w=Math.max(1,Number(image.naturalWidth)||96),h=Math.max(1,Number(image.naturalHeight)||96);
 const pixels=/\.gif(?:$|\?)|\/generation-v\/|\/pokemon\/(?:back\/|shiny\/)?\d+\.png(?:$|\?)/i.test(url);
 const maxW=back?236:218,maxH=back?238:212;
 const heightFactor=p?.height?Math.max(.78,Math.min(1.27,Math.pow(Number(p.height)/12,.2))):1;
 const nativeScale=pixels?1.55:1;
 const fit=Math.min(maxW/w,maxH/h,nativeScale);
 img.style.width=Math.max(70,Math.round(w*fit*heightFactor))+'px';
 img.style.height=Math.max(70,Math.round(h*fit*heightFactor))+'px';
 img.style.maxWidth='45%';img.style.maxHeight=back?'69%':'61%';
}
function syncSpriteClass(img,small=false,url=img?.dataset?.loadedSpriteUrl||''){
 if(!img||small)return;
 // Evita suavização ao usar PNG/GIF de baixa resolução como alternativa às animações WebP HD.
 const isLowRes=/\/generation-v\/|\/other\/showdown\/|\/sprites\/ani|\/pokemon\/(?:back\/|shiny\/)?\d+\.png(?:$|\?)/i.test(url);
 img.classList.toggle('pixelated',isLowRes||spriteStyle==='pixel'||(spriteStyle==='animated'&&!url.endsWith('.webp')));
 img.classList.toggle('hd-sprite',spriteStyle==='hd'&&!isLowRes);
 img.classList.toggle('champions-sprite',spriteStyle==='champions'&&!isLowRes);
}
function fallbackThumb(img,p){setSprite(img,p,false,true);}
function updateSpriteControls(){
 const a=$('spriteStyle'),b=$('shinyToggle');
 if(a)a.textContent='Visual: '+({champions:'Champions',animated:'Animado',pixel:'Gen 5',hd:'HD'}[spriteStyle]);
 if(b)b.textContent='✨ Shiny: '+(shinySprites?'ligado':'desligado');
}
function cycleSpriteStyle(){spriteStyle=({champions:'animated',animated:'pixel',pixel:'hd',hd:'champions'})[spriteStyle];
 for(const id of ['playerSprite','opponentSprite']) $(id).dataset.spriteKey='';
 render();updateSpriteControls();}
function toggleShinySprites(){shinySprites=!shinySprites;
 for(const id of ['playerSprite','opponentSprite']) $(id).dataset.spriteKey='';
 lastTeamRender='';render();updateSpriteControls();}
function syncBattlefieldVisuals(own,opp){
 const field=$('battlefield');if(!field)return;
 field.dataset.visual=spriteStyle;field.style.setProperty('--battle-bg',`url(/assets/showdown/${BATTLE_FIELDS[battlefieldIndex][1]})`);const b=$('sceneStyle');if(b)b.textContent='Campo: '+BATTLE_FIELDS[battlefieldIndex][0];
 const caption=field.querySelector('.scene-caption');
 if(caption){
  const playerType=own?.types?.[0]||'Normal';
  const enemyType=opp?.types?.[0]||'Normal';
  caption.innerHTML=`<span>◉</span> SHOWDOWN • ${BATTLE_FIELDS[battlefieldIndex][0]} <span class="scene-weather">${playerType} / ${enemyType}</span>`;
 }
 for(const id of ['playerSprite','opponentSprite'])syncSpriteClass($(id));
}
function detailStatValue(p,k){const v=p[k]||0;const boost=p.stages?.[k]||0;const effective=Math.floor(v*stage(boost)*(k==='spe'&&p.status==='par'?.5:1));return effective+(boost?` (${boost>0?'+':''}${boost})`:'');}
function displayInfo(prefix,p){$(prefix+'Name').textContent=p.name;$(prefix+'Level').textContent='Lv. 50';const amount=pct(p),fill=$(prefix+'Hp');fill.style.width=amount+'%';fill.className='meter-fill'+(amount<22?' danger':amount<50?' warning':'');$(prefix+'Pct').textContent=amount+'%';$(prefix+'Status').innerHTML=formatStatus(p);const info=$(prefix+'Info');let stats=info?.querySelector('.battle-stats-info');if(info&&!stats){stats=document.createElement('div');stats.className='battle-stats-info';info.append(stats);}if(stats)stats.innerHTML=`<div class="battle-stats-brief"><span>ATK ${detailStatValue(p,'atk')}</span><span>DEF ${detailStatValue(p,'def')}</span><span>SPA ${detailStatValue(p,'spa')}</span><span>SPD ${detailStatValue(p,'spd')}</span><strong>SPE ${detailStatValue(p,'spe')}</strong></div><div class="battle-detail">${p.ability?'Habilidade: '+escapeHTML(p.ability):'Habilidade: —'} · ${p.item?'Item: '+escapeHTML(p.item):'Sem item'}</div>`;}
function render(){renderTeam();if(!game)return;const own=active(game.side[viewSide]),opp=active(game.side[1-viewSide]);displayInfo('player',own);displayInfo('opponent',opp);syncBattlefieldVisuals(own,opp);setSprite($('playerSprite'),own,true);setSprite($('opponentSprite'),opp,false);$('battleHeading').textContent='BATALHA • '+(mode==='pve'?'PVE / IA':mode==='local'?'PVP LOCAL':'PVP ONLINE');$('turnLabel').textContent='TURNO '+String(game.turn).padStart(2,'0');$('battleMessage').textContent=game.message||'Escolha sua ação.';$('resetBattle').disabled=mode.startsWith('online')||mode==='none';$('switchButton').disabled=!canAct(viewSide)||mode==='online-guest'&&!network.conn?.open;$('actionHint').textContent=game.finished?'Batalha concluída':mode==='local'?game.side[viewSide].name+' • Escolha uma ação':mode.startsWith('online')?'Sala entre amigos':'Sua vez • Selecione o ataque';renderActions();}
function showMessage(msg){if(game)game.message=msg;$('battleMessage').textContent=msg;}
function renderActions(){const target=$('battleActions');if(!game)return;const p=active(game.side[viewSide]);if(game.finished){const win=game.winner===viewSide;target.innerHTML=`<div class="result-message"><strong>${game.winner===-1?'Empate!':win?'🏆 Vitória!':'Fim da batalha'}</strong><small>${win?'Sua equipe venceu a batalha!':'Você pode tentar novamente.'}</small></div>`;return;}
 if(processing||queue[viewSide]){target.innerHTML='<div class="placeholder-actions">◷ Aguardando o próximo turno...</div>';return;}
 target.innerHTML=p.moves.map((name,i)=>{const m=MOVES[name],type=m[0],pp=p.pps[i];return `<button class="move-btn" data-move="${i}" ${pp<=0?'disabled':''} title="${m[2]==='status'?'Movimento de suporte':'Poder '+m[1]+' • Precisão '+m[3]+'%'}"><img class="attack-icon" src="${moveFxUrl(name,type)}" alt="" loading="lazy"><span class="type-bubble" style="--type-color:${TYPE_COLORS[type]}"></span><span class="move-label">${escapeHTML(name)}</span><span class="move-detail">${pp}/${MOVES[name]?.[6]||(MOVES[name]?.[2]==='status'?10:15)} PP</span></button>`;}).join('');
 target.querySelectorAll('[data-move]').forEach(b=>b.addEventListener('click',()=>doAction({kind:'move',idx:+b.dataset.move})));}
function disableMoves(){$('battleActions').querySelectorAll('button').forEach(b=>b.disabled=true);}
function addFeed(s){feed.unshift(s);feed=feed.slice(0,35);elsFeed();}
function elsFeed(){$('eventFeed').innerHTML=feed.length?feed.slice(0,8).map(x=>`<div class="feed-entry">${escapeHTML(x)}</div>`).join(''):'<p class="feed-empty">Os turnos aparecerão aqui quando a batalha começar.</p>';}
let lastTeamRender='';
function renderTeam(){
 $('teamCount').textContent=selectedTeam.length+'/6';
 const key=selectedTeam.join(',')+'|'+shinySprites;if(key===lastTeamRender)return;lastTeamRender=key;
 $('teamPreview').innerHTML=selectedTeam.map(id=>{const p=LOOKUP.get(id);return `<button title="${escapeHTML(p.name)} — editar equipe" data-poke="${id}"><img alt="${escapeHTML(p.name)}" loading="lazy"></button>`;}).join('');
 $('teamPreview').querySelectorAll('button').forEach(b=>{b.addEventListener('click',openTeamModal);fallbackThumb(b.querySelector('img'),LOOKUP.get(+b.dataset.poke));});
}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function showModal(title,html){$('modalTitle').textContent=title;$('modalContent').innerHTML=html;$('modalBackdrop').classList.remove('hidden');}
function closeModal(){$('modalBackdrop').classList.add('hidden');}
let nationalDexIndex=[],dexIndexPromise=null;
async function loadNationalDexIndex(){
 if(nationalDexIndex.length)return nationalDexIndex;
 if(dexIndexPromise)return dexIndexPromise;
 dexIndexPromise=(async()=>{
  const resp=await fetch('https://pokeapi.co/api/v2/pokemon?limit=2000',{signal:AbortSignal.timeout(15000)});
  if(!resp.ok)throw new Error('PokéAPI indisponível');
  const data=await resp.json();
  nationalDexIndex=(data.results||[]).map(x=>({name:x.name,id:Number(x.url.match(/\/pokemon\/(\d+)\//)?.[1])}))
   .filter(x=>Number.isInteger(x.id)&&/^[a-z0-9-]{1,50}$/.test(x.name));
  if($('monPicker'))paintPicker();
  return nationalDexIndex;
 })().catch(err=>{dexIndexPromise=null;console.warn('Catálogo nacional indisponível:',err.message);return []});
 return dexIndexPromise;
}
function openTeamModal(){location.href='./team.html';return;editingTeam=[...selectedTeam];showModal('Monte sua equipe',`<div class="modal-copy">Escolha exatamente seis Pokémon. São <strong>${DEX.length} Pokémon prontos</strong> e um catálogo nacional pesquisável pela PokéAPI (internet necessária para carregar novas espécies). A equipe fica salva neste navegador.</div><div class="search-area"><input id="monSearch" placeholder="Pesquisar Pokémon..." aria-label="Pesquisar Pokémon"></div><div class="api-import"><input class="room-input" id="apiPokemon" placeholder="Qualquer Pokémon pelo nome em inglês ou número..."><button id="loadPokemon" class="secondary-btn">Buscar na PokéAPI</button></div><div class="api-feedback" id="apiFeedback">Não está na lista? Busque pela PokéAPI para adicionar outras espécies (requer internet).</div><div class="squad-picker" id="monPicker"></div><div class="selected-list" id="selectedList"></div><div class="modal-actions"><button id="cancelTeam" class="secondary-btn">Cancelar</button><button id="saveTeam" class="primary-btn">Salvar equipe (6/6)</button></div>`);$('monSearch').addEventListener('input',paintPicker);$('loadPokemon').onclick=fetchCustomPokemon;$('apiPokemon').onkeydown=e=>{if(e.key==='Enter')void fetchCustomPokemon();};$('cancelTeam').onclick=closeModal;$('saveTeam').onclick=()=>{if(editingTeam.length===6)saveTeam();};paintPicker();void loadNationalDexIndex();}
async function fetchCustomPokemon(queryOverride=null){const input=$('apiPokemon'),status=$('apiFeedback');const query=String(queryOverride||input.value).trim().toLowerCase().replace(/\s+/g,'-');if(!/^[a-z0-9-]{1,40}$/.test(query)){status.textContent='Digite um nome inglês ou número válido.';return;}const button=$('loadPokemon');button.disabled=true;status.textContent='Consultando a PokéAPI...';try{const response=await fetch('https://pokeapi.co/api/v2/pokemon/'+encodeURIComponent(query),{signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error('Pokémon não encontrado. Confira nome ou número.');const data=await response.json();let p=LOOKUP.get(data.id);if(!p){const stat=k=>data.stats.find(s=>s.stat.name===k)?.base_stat||70;const moveIds=new Set(data.moves.map(m=>m.move.name.replace(/[^a-z0-9]/g,'')));const attacks=Object.keys(MOVES).filter(m=>moveIds.has(m.toLowerCase().replace(/[^a-z0-9]/g,'')));attacks.sort((a,b)=>(MOVES[b][1]||0)-(MOVES[a][1]||0));const chosen=[];for(const m of attacks){if(chosen.length===4)break;if(!chosen.some(x=>MOVES[x][0]===MOVES[m][0]&&MOVES[x][2]===MOVES[m][2]))chosen.push(m);}for(const m of attacks){if(chosen.length===4)break;if(!chosen.includes(m))chosen.push(m);}for(const m of ['Tackle','Swift','Protect','Rest']){if(chosen.length===4)break;if(!chosen.includes(m))chosen.push(m);}p={id:data.id,name:data.name.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' '),slug:data.name,types:data.types.map(t=>t.type.name[0].toUpperCase()+t.type.name.slice(1)),hp:stat('hp'),atk:stat('attack'),def:stat('defense'),spa:stat('special-attack'),spd:stat('special-defense'),spe:stat('speed'),moves:chosen.slice(0,4)};DEX.push(p);LOOKUP.set(p.id,p);saveExtraDex();}if(!editingTeam.includes(p.id)&&editingTeam.length<6)editingTeam.push(p.id);$('monSearch').value=p.name;paintPicker();status.textContent=p.name+' carregado. Use a lista para incluí-lo na equipe.';}catch(err){status.textContent='Não foi possível carregar: '+err.message;}finally{button.disabled=false;}}
function paintPicker(){
 if(!$('monPicker'))return;
 const q=$('monSearch')?.value?.toLowerCase().trim()||'';
 const arr=DEX.filter(p=>p.name.toLowerCase().includes(q)).slice(0,70);
 const loadedIds=new Set(DEX.map(x=>x.id));
 const suggestions=q.length>=2?nationalDexIndex.filter(p=>!loadedIds.has(p.id)&&p.name.includes(q)).slice(0,24):[];
 const loaded=arr.map(p=>`<button class="pick-mon ${editingTeam.includes(p.id)?'selected':''}" data-id="${p.id}"><span class="pick-check">${editingTeam.includes(p.id)?'✓':''}</span><img alt="" loading="lazy"><strong>${escapeHTML(p.name)}</strong><small>${escapeHTML(p.types.join(' / '))}</small></button>`).join('');
 const more=suggestions.map(p=>`<button class="pick-mon" data-import="${p.name}" title="Buscar informações na PokéAPI"><span class="pick-check">+</span><img alt="" loading="lazy"><strong>${p.name.replace(/-/g,' ')}</strong><small>Carregar dados</small></button>`).join('');
 $('monPicker').innerHTML=loaded+more;
 $('monPicker').querySelectorAll('[data-id]').forEach(b=>{fallbackThumb(b.querySelector('img'),LOOKUP.get(+b.dataset.id));b.onclick=()=>{const id=+b.dataset.id;if(editingTeam.includes(id)){editingTeam=editingTeam.filter(x=>x!==id);}else if(editingTeam.length<6)editingTeam.push(id);paintPicker();};});
 $('monPicker').querySelectorAll('[data-import]').forEach(b=>{const name=b.dataset.import,p=nationalDexIndex.find(x=>x.name===name);if(p)fallbackThumb(b.querySelector('img'),{...p,types:['Normal']});b.onclick=()=>void fetchCustomPokemon(name);});
 $('selectedList').innerHTML=editingTeam.map(id=>`<span class="selected-chip">${escapeHTML(LOOKUP.get(id).name)}</span>`).join('');
 $('saveTeam').textContent=`Salvar equipe (${editingTeam.length}/6)`;$('saveTeam').disabled=editingTeam.length!==6;
}
function openSwitchModal(){if(!game||game.finished||processing||queue[viewSide])return;const s=game.side[viewSide];showModal('Trocar Pokémon',`<div class="modal-copy">Escolha um Pokémon saudável para entrar na batalha. A troca consome a sua ação do turno.</div><div class="switch-grid">${s.team.map((p,i)=>`<button class="switch-mon" data-switch="${i}" ${(i===s.active||p.hp<=0)?'disabled':''}><img alt=""><strong>${p.name}</strong><small>${p.hp>0?pct(p)+'% HP':'Desmaiado'}</small></button>`).join('')}</div>`);$('modalContent').querySelectorAll('[data-switch]').forEach(b=>{fallbackThumb(b.querySelector('img'),s.team[+b.dataset.switch]);b.onclick=()=>doAction({kind:'switch',idx:+b.dataset.switch});});}
// Sprites realmente presentes no CDN /fx/ do Showdown. Todos os golpes usam textura
// (algumas se repetem); coreografias individualizadas ainda não são completas.
const MOVE_FX={flamethrower:'fireball',fireblast:'flareball',flareblitz:'flareball',pyroball:'fireball',torchsong:'flareball',bitterblade:'fireball',hydropump:'waterwisp',surf:'waterwisp',waterfall:'waterwisp',watershuriken:'waterwisp',thunderbolt:'lightning',thunder:'lightning',voltswitch:'electroball',overdrive:'electroball',leafblade:'leaf1',gigadrain:'energyball',woodhammer:'leaf2',flowertrick:'petal',icebeam:'iceball',icefang:'icicle',shadowball:'shadowball',shadowclaw:'leftclaw',shadowsneak:'purplewisp',psychic:'mistball',psychocut:'purplewisp',aurasphere:'energyball',closecombat:'fist',drainpunch:'fist1',earthquake:'rock1',earthpower:'rock2',stoneedge:'rock3',rockslide:'rock2',dragondarts:'flareball',dragonclaw:'rightclaw',dragonpulse:'bluefireball',moonblast:'shine',moonlight:'moon',dazzlinggleam:'rainbow',gigatonhammer:'greenmetal1',ironhead:'greenmetal2',irontail:'greenmetal2',meteormash:'impact',flashcannon:'shine',bravebird:'feather',hurricane:'feather',airslash:'feather',sludgebomb:'poisonwisp',bugbuzz:'sound',uturn:'rightslash',swordsdance:'sword',calmmind:'shine',dragondance:'sword',protect:'shield',recover:'heart',rest:'heart'};
const TYPE_FX={Normal:'impact',Fire:'fireball',Water:'waterwisp',Electric:'lightning',Grass:'leaf1',Ice:'iceball',Fighting:'fist',Poison:'poisonwisp',Ground:'rock1',Flying:'feather',Psychic:'mistball',Bug:'web',Rock:'rock3',Ghost:'shadowball',Dragon:'bluefireball',Dark:'blackwisp',Steel:'greenmetal1',Fairy:'rainbow'};
function moveFxName(name,type){return MOVE_FX[String(name||'').toLowerCase().replace(/[^a-z]/g,'')]||TYPE_FX[type]||'impact';}
function moveFxUrl(name,type){let fx=moveFxName(name,type);if(fx==='shield')fx='shine';return '/assets/showdown/fx/'+fx+'.png';}

function effectSpriteData(type,color){
 const stroke='rgba(255,255,255,.92)';
 const fill=color||'#fff';
 const icons={
  Fire:`<path d="M32 6C18 20 20 35 20 42c0 8 5 16 14 16s18-8 18-20c0-10-6-19-20-32z" fill="${fill}" stroke="${stroke}" stroke-width="3"/><path d="M34 19c-7 8-8 13-8 18 0 5 3 10 8 10s10-5 10-12c0-5-3-10-10-16z" fill="#fff5b0" opacity=".7"/>`,
  Water:`<path d="M32 6C23 18 16 27 16 38a16 16 0 1032 0c0-11-7-20-16-32z" fill="${fill}" stroke="${stroke}" stroke-width="3"/>`,
  Electric:`<path d="M37 5L18 33h12l-4 26 19-28H33l4-26z" fill="${fill}" stroke="${stroke}" stroke-width="3"/>`,
  Grass:`<path d="M12 42C18 19 36 12 52 14 48 31 35 50 12 42z" fill="${fill}" stroke="${stroke}" stroke-width="3"/><path d="M13 43C23 32 32 27 48 18" stroke="#fff" stroke-width="3" fill="none"/>`,
  Ice:`<path d="M32 7v50M12 19l40 26M12 45l40-26" stroke="${stroke}" stroke-width="5"/><path d="M32 7v50M12 19l40 26M12 45l40-26" stroke="${fill}" stroke-width="3"/>`,
  Rock:`<polygon points="32,8 54,24 47,53 18,53 10,27" fill="${fill}" stroke="${stroke}" stroke-width="3"/>`,
  Ground:`<path d="M8 44l12-20 12 16 10-12 14 16" fill="none" stroke="${fill}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
  Flying:`<path d="M8 36c10-8 21-12 48-13-6 5-11 8-16 11 7 0 12 1 16 4-18 6-33 6-48-2z" fill="${fill}" stroke="${stroke}" stroke-width="3"/>`,
  Psychic:`<circle cx="32" cy="32" r="16" fill="${fill}" stroke="${stroke}" stroke-width="3"/><circle cx="32" cy="32" r="7" fill="#fff" opacity=".65"/>`,
  Ghost:`<path d="M18 52V26c0-10 7-18 16-18s16 8 16 18v26l-6-5-5 5-7-5-7 5-7-5z" fill="${fill}" stroke="${stroke}" stroke-width="3"/>`,
  Dragon:`<path d="M14 45c6-22 23-32 38-30-5 7-6 12-2 18-7 4-13 8-16 18-5-1-12-2-20-6z" fill="${fill}" stroke="${stroke}" stroke-width="3"/>`,
  Dark:`<path d="M41 10c-3 10-1 22 9 29-8 9-24 11-34 3C2 31 11 10 29 7c4 0 8 1 12 3z" fill="${fill}" stroke="${stroke}" stroke-width="3"/>`,
  Steel:`<polygon points="32,7 52,19 52,45 32,57 12,45 12,19" fill="${fill}" stroke="${stroke}" stroke-width="3"/>`,
  Fairy:`<path d="M32 9l6 11 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2z" fill="${fill}" stroke="${stroke}" stroke-width="3"/>`,
  Fighting:`<path d="M24 12h14l8 10-3 18-12 12-13-6-6-15 6-14z" fill="${fill}" stroke="${stroke}" stroke-width="3"/>`,
  Poison:`<path d="M18 12h28M24 12v12l-10 18h36L40 24V12" fill="none" stroke="${stroke}" stroke-width="4"/><path d="M18 42h28" stroke="${fill}" stroke-width="8" stroke-linecap="round"/>`,
  Bug:`<path d="M22 19c0-7 4-11 10-11s10 4 10 11v20c0 8-4 14-10 14s-10-6-10-14z" fill="${fill}" stroke="${stroke}" stroke-width="3"/><path d="M13 23l9 5M51 23l-9 5M14 36l8-1M50 36l-8-1" stroke="${stroke}" stroke-width="3"/>`,
  Normal:`<circle cx="32" cy="32" r="18" fill="${fill}" stroke="${stroke}" stroke-width="3"/>`
 };
 const art=icons[type]||icons.Normal;
 return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>${art}</svg>`)}`;
}
function spawnImpact(wrap,x,y,color){const hit=document.createElement('span');hit.className='fx-impact';hit.style.left=x+'px';hit.style.top=y+'px';hit.style.setProperty('--impact-color',color);wrap.append(hit);setTimeout(()=>hit.remove(),420);}
function spawnSwitchBurst(wrap,x,y){const ring=document.createElement('span');ring.className='switch-burst';ring.style.left=x+'px';ring.style.top=y+'px';wrap.append(ring);setTimeout(()=>ring.remove(),450);}
async function animateSwitch(meta,nextGame=null){
 const visuals=window.PSArenaVisuals;
 if(!visuals?.playNativeSwitch){if(nextGame){game=nextGame;render();}return;}
 await visuals.playNativeSwitch(meta.who,viewSide,nextGame||game,(updated)=>{if(updated){game=updated;render();}});
}
async function animateHit(meta){
 const visuals=window.PSArenaVisuals;
 if(!visuals?.playNativeMove){console.warn('Animação Showdown não carregada.');return;}
 const chosen=MOVES[meta?.move];
 return visuals.playNativeMove({...meta,category:chosen?.[2]||'special'});
}
// Salas P2P: sem contas, sem banco, sinalização PeerJS pública. Necessita de internet nos dois navegadores.
function loadPeerScript(){return new Promise((resolve,reject)=>{if(window.Peer)return resolve();const s=document.createElement('script');s.src='https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js';s.onload=resolve;s.onerror=()=>reject(new Error('Não foi possível carregar o PeerJS. Confira sua conexão.'));document.head.append(s);});}
function setOnlineStatus(s){const e=$('onlineStatus');if(e)e.textContent=s;}
function openOnlineModal(){showModal('Batalha privada online',`<p class="modal-copy">Crie uma sala e envie o código ao seu amigo, ou entre usando o código recebido. <strong>Experimental:</strong> a conexão usa sinalização de terceiros (PeerJS) e depende de internet nos dois dispositivos; não há senha ou autenticação de jogadores.</p><div class="room-grid"><div class="room-panel"><h3>◈ Criar sala</h3><p>Seu dispositivo será responsável pela batalha. Compartilhe o código somente com seu amigo.</p><button class="primary-btn" id="hostRoom">Criar sala privada</button><div class="room-key" id="roomCode"></div></div><div class="room-panel"><h3>◎ Entrar na sala</h3><p>Use o código de seis letras de um amigo. Sua equipe escolhida será enviada ao anfitrião.</p><input class="room-input" id="joinCode" maxlength="6" placeholder="Ex.: XK29AZ" aria-label="Código de sala"><button class="primary-btn" id="joinRoom">Conectar</button></div></div><div id="onlineStatus" class="online-status" aria-live="polite"></div>`);$('hostRoom').onclick=hostRoom;$('joinRoom').onclick=joinRoom;}
function clearPeer(){try{network.conn?.close();network.peer?.destroy();}catch{}network={peer:null,conn:null,role:null,room:null};}
async function hostRoom(){try{await loadPeerScript();clearPeer();const code=Array.from({length:6},()=>('ABCDEFGHJKLMNPQRSTUVWXYZ23456789')[Math.floor(Math.random()*32)]).join('');const peer=new window.Peer('pokemon-arena-'+code.toLowerCase());network={peer,conn:null,role:'host',room:code};peer.on('open',()=>{if($('roomCode'))$('roomCode').textContent=code;setOnlineStatus('Sala criada. Compartilhe o código '+code+' com seu amigo.');});peer.on('connection',conn=>{if(network.conn?.open){conn.close();return;}network.conn=conn;conn.on('data',msg=>{if(msg?.type==='hello'&&Array.isArray(msg.team)&&msg.team.length===6&&msg.team.every(id=>LOOKUP.has(id))){newGame('online-host',msg.team);closeModal();conn.send({type:'sync',game});addFeed('Seu amigo entrou na sala.');}else if(msg?.type==='action'&&game&&!game.finished&&!processing&&!queue[1]){const c=msg.choice;if(!['move','switch'].includes(c?.kind)||!Number.isInteger(c.idx))return;const mon=active(game.side[1]);if(c.kind==='move'&&(c.idx<0||c.idx>3||mon.pps[c.idx]<=0))return;if(c.kind==='switch'&&(!game.side[1].team[c.idx]||game.side[1].team[c.idx].hp<=0||c.idx===game.side[1].active))return;queue[1]=c;if(queue[0])void runTurn();else showMessage('Adversário pronto. Escolha seu movimento.');}});conn.on('close',()=>showMessage('O adversário desconectou.'));});peer.on('error',err=>setOnlineStatus('Não foi possível criar a sala: '+err.message));}catch(err){setOnlineStatus('Erro: '+err.message);}}
async function joinRoom(){const code=$('joinCode')?.value?.trim().toUpperCase().replace(/[^A-Z0-9]/g,'');if(!code||code.length!==6)return setOnlineStatus('Digite um código de sala válido (6 caracteres).');try{await loadPeerScript();clearPeer();const peer=new window.Peer();network={peer,conn:null,role:'guest',room:code};peer.on('open',()=>{const conn=peer.connect('pokemon-arena-'+code.toLowerCase(),{reliable:true});network.conn=conn;conn.on('open',()=>{setOnlineStatus('Conectado! Aguardando início da batalha...');conn.send({type:'hello',team:[...selectedTeam]});});conn.on('data',msg=>{if(msg?.type==='sync'&&msg.game){if(mode!=='online-guest')feed=[];game=msg.game;mode='online-guest';viewSide=1;queue=[null,null];processing=false;closeModal();render();}else if(msg?.type==='event'&&msg.event){game=msg.event.game;mode='online-guest';viewSide=1;game.message=msg.event.message;addFeed(msg.event.message);render();if(msg.event.meta?.attack)void animateHit(msg.event.meta);else if(msg.event.meta?.switch)void animateSwitch(msg.event.meta);}});conn.on('error',err=>setOnlineStatus('Falha: '+err.message));conn.on('close',()=>showMessage('A sala foi desconectada.'));});peer.on('error',err=>setOnlineStatus('Não foi possível conectar: '+err.message));}catch(err){setOnlineStatus('Erro: '+err.message);}}
function showAbout(){showModal('Sobre este protótipo',`<div class="modal-copy"><strong>Pokémon Arena v0.5</strong> é uma prova de conceito particular feita em HTML/CSS/JavaScript. Ela oferece PvE, PvP local e conexão experimental entre amigos via PeerJS. Os combates usam <strong>regras simplificadas próprias</strong>: não são o simulador oficial Pokémon Showdown. Estão incluídas ${DEX.length} espécies preparadas e catálogo nacional sob demanda, tipos, precisão, PP, trocas, status e estratégias básicas da IA.<br><br>As imagens são carregadas conforme a necessidade, combinando PokéAPI, Pokémon Champions, Showdown e fallbacks visuais por tipo, com variações animadas, HD, costas e shiny quando disponíveis. Sem internet, parte das imagens pode não aparecer. O código foi organizado para permitir futura integração com <code>@pkmn/sim</code>, que implementa as mecânicas completas.<br><br>Projeto não comercial e não afiliado à Nintendo, Game Freak, Creatures ou The Pokémon Company. Pokémon e seus gráficos pertencem aos titulares respectivos. A interface e o código original deste protótipo podem ser alterados para seu uso pessoal.</div><button class="primary-btn" id="closeAbout">Entendi</button>`);$('closeAbout').onclick=closeModal;}
function start(kind){if(network.peer)clearPeer();newGame(kind);document.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('active'));$(kind==='pve'?'startPve':'startLocal').classList.add('active');}
// Optional Supabase sync. Completely disabled until a project URL and *publishable* key are configured.
let cloudClient=null,cloudUser=null;
const getCloudConfig=()=>{
 try{return window.POKEMON_ARENA_SUPABASE||JSON.parse(localStorage.getItem('arena-cloud-config')||'null');}catch{return null;}
};
function cloudStatus(){
 const b=$('openCloud');if(!b)return;
 b.textContent=cloudUser?'☁ Nuvem conectada':'☁ Nuvem';
 b.title=cloudUser?'Equipes sincronizadas entre seus dispositivos':'Conectar nuvem (opcional)';
}
async function cloudClientReady(){
 if(cloudClient)return cloudClient;
 const config=getCloudConfig();
 if(!config||!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(config.url)||!/^sb_publishable_[a-zA-Z0-9_-]+$/.test(config.publishableKey))
  throw new Error('Configure o URL do projeto e uma chave publishable (nunca use service_role).');
 if(!window.supabase?.createClient){
  await new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.95.0';
   script.onload=resolve;script.onerror=()=>reject(new Error('Falha ao carregar a biblioteca Supabase.'));
   document.head.append(script);
  });
 }
 if(!window.supabase?.createClient)throw new Error('Biblioteca Supabase não disponível.');
 cloudClient=window.supabase.createClient(config.url.replace(/\/$/,''),config.publishableKey);
 const {data,error}=await cloudClient.auth.getUser();
 if(!error&&data?.user)cloudUser=data.user;
 cloudStatus();return cloudClient;
}
function cloudMessage(s){const elem=$('cloudFeedback');if(elem)elem.textContent=s;}
function openCloudModal(){
 const config=getCloudConfig()||{};
 showModal('Nuvem particular',`<div class="modal-copy">Sincronize a equipe entre seus dispositivos pelo Supabase, após configurar um projeto separado e habilitar a autenticação por e-mail. <strong>Para login por link, acesse o jogo por HTTPS.</strong> Cada pessoa só pode acessar seus próprios dados.</div>
 <div class="room-panel" style="margin-bottom:12px"><h3>Configuração</h3><p>Somente URL do projeto e chave pública do Supabase (nunca secret/service_role).</p>
 <input id="cloudUrl" class="room-input" placeholder="https://projeto.supabase.co" value="${escapeHTML(config.url||'')}">
 <input id="cloudKey" class="room-input" placeholder="sb_publishable_..." value="${escapeHTML(config.publishableKey||'')}">
 <button class="secondary-btn" id="cloudSetConfig">Configurar projeto</button></div>
 <div class="room-panel"><h3>Minha conta</h3><p>${cloudUser?'Conectado: '+escapeHTML(cloudUser.email||'jogador'):'Entre com um link enviado para seu e-mail.'}</p>
 <input id="cloudEmail" class="room-input" placeholder="seu-email@exemplo.com" type="email">
 <button class="primary-btn" id="cloudSignIn">Enviar link de acesso</button>
 <button class="secondary-btn" id="cloudFetch">Carregar equipe da nuvem</button>
 <button class="secondary-btn" id="cloudPush">Salvar equipe na nuvem</button>
 <button class="secondary-btn" id="cloudSignOut">Sair da nuvem</button></div>
 <p class="online-status" id="cloudFeedback" aria-live="polite"></p>`);
 $('cloudSetConfig').onclick=()=>{
  const url=$('cloudUrl').value.trim(),publishableKey=$('cloudKey').value.trim();
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url)||!/^sb_publishable_[a-zA-Z0-9_-]+$/.test(publishableKey))return cloudMessage('Confira o endereço e a chave pública.');
  localStorage.setItem('arena-cloud-config',JSON.stringify({url,publishableKey}));cloudClient=null;cloudUser=null;cloudStatus();cloudMessage('Configuração salva neste dispositivo.');
 };
 $('cloudSignIn').onclick=async()=>{
  const email=$('cloudEmail').value.trim();if(!/^[^@ ]+@[^@ ]+\.[^@ ]+$/.test(email))return cloudMessage('Informe um e-mail válido.');
  if(location.protocol!=='https:')return cloudMessage('Faça login pela URL HTTPS do site. O HTML local continua funcionando offline.');
  try{const sb=await cloudClientReady();const {error}=await sb.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}});if(error)throw error;cloudMessage('Link de acesso enviado, caso seu e-mail esteja habilitado.');}catch(e){cloudMessage('Não foi possível autenticar: '+e.message);}
 };
 $('cloudFetch').onclick=()=>void cloudLoadTeam();
 $('cloudPush').onclick=()=>void cloudSaveTeam(true);
 $('cloudSignOut').onclick=async()=>{if(cloudClient)await cloudClient.auth.signOut();cloudUser=null;cloudStatus();cloudMessage('Sessão encerrada.');};
}
async function cloudSaveTeam(interactive=false){
 try{
  if(!cloudClient&&!getCloudConfig())return;
  const sb=await cloudClientReady();if(!cloudUser){if(interactive)cloudMessage('Entre na sua conta primeiro.');return;}
  const members=selectedTeam.map(id=>LOOKUP.get(id)).filter(Boolean).map(({id,name,slug,types,hp,atk,def,spa,spd,spe,moves})=>({id,name,slug,types,hp,atk,def,spa,spd,spe,moves}));
  if(members.length!==6)throw new Error('Equipe incompleta.');
  const {error}=await sb.from('arena_teams').upsert({owner_id:cloudUser.id,slot:'principal',members,updated_at:new Date().toISOString()},{onConflict:'owner_id,slot'});
  if(error)throw error;if(interactive)cloudMessage('Equipe salva na nuvem.');
 }catch(e){if(interactive)cloudMessage('Falha ao salvar: '+e.message);else console.warn('Cloud sync:',e.message);}
}
async function cloudLoadTeam(){
 try{
  const sb=await cloudClientReady();if(!cloudUser)return cloudMessage('Entre na sua conta primeiro.');
  const {data,error}=await sb.from('arena_teams').select('members').eq('owner_id',cloudUser.id).eq('slot','principal').maybeSingle();
  if(error)throw error;if(!data)return cloudMessage('Ainda não há equipe salva na nuvem.');
  const members=data.members;
  if(!Array.isArray(members)||members.length!==6||members.some(p=>!Number.isInteger(p.id)||p.id<1||p.id>20000||!/^[-a-zA-Z0-9 .:]{1,55}$/.test(p.name)||!Array.isArray(p.types)||p.types.some(t=>!TYPE_COLORS[t])||!Array.isArray(p.moves)||p.moves.length!==4||p.moves.some(m=>!MOVES[m])||['hp','atk','def','spa','spd','spe'].some(k=>!Number.isInteger(p[k])||p[k]<1||p[k]>255)))throw new Error('Equipe da nuvem incompatível com este protótipo.');
  for(const p of members){if(!LOOKUP.has(p.id)){DEX.push(p);LOOKUP.set(p.id,p);}}
  saveExtraDex();selectedTeam=members.map(x=>x.id);
  if(new Set(selectedTeam).size!==6)throw new Error('Equipe duplicada.');
  localStorage.setItem('arena-team',JSON.stringify(selectedTeam));lastTeamRender='';renderTeam();
  cloudMessage('Equipe restaurada. Inicie uma nova partida para utilizá-la.');
 }catch(e){cloudMessage('Falha ao carregar: '+e.message);}
}
async function cloudSaveBattle(){
 try{
  if(!getCloudConfig()&&!cloudClient)return;const sb=await cloudClientReady();
  if(!cloudUser||!game?.finished)return;
  const modeName=mode==='pve'?'pve':mode==='local'?'local':'online';
  const outcome=game.winner<0?'draw':game.winner===0?'win':'loss';
  const {error}=await sb.from('arena_battle_history').insert({owner_id:cloudUser.id,opponent:game.side[1].name,mode:modeName,outcome,total_turns:game.turn});
  if(error)throw error;
 }catch(e){console.warn('Cloud history:',e.message);}
}
$('openCloud').onclick=openCloudModal;cloudStatus();$('startPve').onclick=()=>start('pve');$('startLocal').onclick=()=>start('local');$('openOnline').onclick=openOnlineModal;$('openTeam').onclick=openTeamModal;$('editSquad').onclick=openTeamModal;$('railTeam').onclick=openTeamModal;$('railHelp').onclick=showAbout;$('modalClose').onclick=closeModal;$('modalBackdrop').onclick=e=>{if(e.target===$('modalBackdrop'))closeModal();};$('switchButton').onclick=openSwitchModal;$('resetBattle').onclick=()=>{if(mode==='pve'||mode==='local')start(mode);};document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
$('sceneStyle').onclick=cycleBattlefield;$('spriteStyle').onclick=cycleSpriteStyle;$('shinyToggle').onclick=toggleShinySprites;
const testFx=$('testEffects');
if(testFx)testFx.onclick=async()=>{
  if(processing)return;
  testFx.disabled=true;testFx.textContent='Carregando FX…';
  const native=window.PSArenaNativeMoveAnims?.moves;
  if(!native||!window.PSArenaVisuals?.playNativeMove){
    testFx.textContent='Animações indisponíveis';testFx.disabled=false;return;
  }
  try{
    const success=await window.PSArenaVisuals.playNativeMove({who:viewSide,target:1-viewSide,move:'Flamethrower',category:'special'});
    const info=window.PSArenaFXDebug;
    testFx.textContent=info?.failedTextures?'Falha no carregamento de FX':success&&info?.effects?'✓ '+info.effects+' efeitos exibidos':'Nenhum efeito encontrado';
    testFx.title=JSON.stringify(info||{});
  }catch(error){
    console.error('[Arena] Falha ao executar teste visual:',error);
    testFx.textContent='Erro na animação';testFx.title=String(error?.message||error);
  }
  setTimeout(()=>{testFx.textContent='▶ Testar animação';testFx.disabled=false;},4500);
};
updateSpriteControls();renderTeam();newGame('pve');
