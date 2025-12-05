const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");
const heightEl=document.getElementById("height");
const energyText=document.getElementById("energy-text");
const energyBar=document.getElementById("energy-bar");
const timerEl=document.getElementById("timer");
const quizEl=document.getElementById("quiz");
const quizQ=document.getElementById("quiz-question");
const quizOps=document.getElementById("quiz-options");
const quizClose=document.getElementById("quiz-close");
const leaderboardEl=document.getElementById("leaderboard");
const boardTable=document.getElementById("board-table");
const restartBtn=document.getElementById("restart");

const W=canvas.width,H=canvas.height;
const gravity=0.35;
const jumpV=-8.6;
const moveSpeed=3.6;
const pxPerMeter=80;
const energyDrainPerSec=5;
const energyRecharge=40;
const gameDurationSec=180;

let keys={left:false,right:false};
let player={x:W/2,y:H*0.55,w:26,h:26,vx:0,vy:0};
let platforms=[];
let items=[
  {label:"책",color:"#6dd3ff"},
  {label:"칠판",color:"#78f084"},
  {label:"교과서",color:"#ffc66d"},
  {label:"책상",color:"#ff8e6d"},
  {label:"체육공",color:"#b58cff"},
  {label:"도서관",color:"#6df9c7"}
];
let energy=100;
let heightPx=0;
let startedAt=performance.now();
let gameOver=false;
let quizActive=false;
let lastTime=performance.now();
let highestTopY=H;

const quizBank=[
  {q:"수학에서 삼각형의 내각의 합은?",opts:["90도","180도","270도","360도"],ans:1},
  {q:"과학에서 물이 끓는 온도는?",opts:["50℃","75℃","100℃","150℃"],ans:2},
  {q:"국어에서 문장의 기본 성분에 포함되지 않는 것은?",opts:["주어","서술어","목적어","대각선"],ans:3},
  {q:"영어 알파벳의 개수는?",opts:["24","26","28","30"],ans:1},
  {q:"체육에서 축구 경기 한 팀의 선수 수는?",opts:["9명","10명","11명","12명"],ans:2},
  {q:"사회에서 지도를 볼 때 북쪽을 가리키는 색은?",opts:["빨강","파랑","초록","검정"],ans:1}
];

function formatTime(s){const m=Math.floor(s/60);const r=s%60;const mm=("0"+m).slice(-2);const rr=("0"+r).slice(-2);return mm+":"+rr}

function initPlatforms(){platforms=[];let y=H-40;for(let i=0;i<10;i++){const w=80+Math.random()*60;const x=20+Math.random()*(W-w-40);const item=items[Math.floor(Math.random()*items.length)];platforms.push({x,y,w,h:16,label:item.label,color:item.color});y-=60+Math.random()*40;}}

function spawnTopPlatforms(){let minY=Infinity;for(const p of platforms){if(p.y<minY)minY=p.y}if(minY>60){for(let i=0;i<3;i++){const w=70+Math.random()*70;const x=20+Math.random()*(W-w-40);const item=items[Math.floor(Math.random()*items.length)];const ny=minY-(80+Math.random()*90);platforms.push({x,y:ny,w,h:16,label:item.label,color:item.color});}}}

function draw(){ctx.clearRect(0,0,W,H);ctx.fillStyle="#0e1732";ctx.fillRect(0,0,W,H);
ctx.fillStyle="#2e7df6";ctx.beginPath();ctx.arc(player.x,player.y,player.w/2,0,Math.PI*2);ctx.fill();
for(const p of platforms){ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.w,p.h);ctx.fillStyle="#0c1222";ctx.font="12px system-ui";ctx.textAlign="center";ctx.fillText(p.label,p.x+p.w/2,p.y-4);} }

function update(dt){if(gameOver||quizActive)return;player.vx=0;if(keys.left)player.vx-=moveSpeed;if(keys.right)player.vx+=moveSpeed;player.x+=player.vx;player.x=Math.max(14,Math.min(W-14,player.x));player.vy+=gravity;
if(player.vy>0){for(const p of platforms){const withinX=player.x>p.x-10&&player.x<p.x+p.w+10;const withinY=player.y+player.h/2<=p.y+8&&player.y+player.h/2+player.vy>=p.y;if(withinX&&withinY){player.vy=jumpV;break;}}}
if(player.vy<0){const dy=-player.vy;for(const p of platforms){p.y+=dy;}heightPx+=dy;highestTopY=Math.min(highestTopY,player.y);}
for(let i=platforms.length-1;i>=0;i--){if(platforms[i].y>H+40)platforms.splice(i,1);}spawnTopPlatforms();
energy-=energyDrainPerSec*dt;if(energy<0)energy=0;
if(energy===0&&!quizActive){openQuiz();}
const elapsedSec=Math.floor((performance.now()-startedAt)/1000);const remain=Math.max(0,gameDurationSec-elapsedSec);timerEl.textContent=formatTime(remain);
const meters=(heightPx/pxPerMeter).toFixed(2);heightEl.textContent=meters;
energyText.textContent=Math.round(energy);
energyBar.style.width=Math.max(0,Math.min(100,energy))+"%";
if(remain===0){endGame();}}

function openQuiz(){quizActive=true;quizEl.classList.remove("hidden");const q=quizBank[Math.floor(Math.random()*quizBank.length)];quizQ.textContent=q.q;quizOps.innerHTML="";q.opts.forEach((opt,i)=>{const b=document.createElement("button");b.className="btn primary";b.textContent=opt;b.onclick=()=>{if(i===q.ans){energy=Math.min(100,energy+energyRecharge);closeQuiz();}else{b.className="btn secondary";}};quizOps.appendChild(b);});}

function closeQuiz(){quizActive=false;quizEl.classList.add("hidden");}

quizClose.onclick=()=>{closeQuiz();};

function endGame(){gameOver=true;storeRecord();showLeaderboard();}

function storeRecord(){const meters=parseFloat((heightPx/pxPerMeter).toFixed(2));const rec={height:meters,at:new Date().toISOString()};const key="jump_leaderboard";const arr=JSON.parse(localStorage.getItem(key)||"[]");arr.push(rec);arr.sort((a,b)=>b.height-a.height);localStorage.setItem(key,JSON.stringify(arr));}

function showLeaderboard(){leaderboardEl.classList.remove("hidden");const key="jump_leaderboard";const arr=JSON.parse(localStorage.getItem(key)||"[]");let html="<tr><th>순위</th><th>높이 (m)</th><th>기록 시간</th></tr>";arr.forEach((r,i)=>{const d=new Date(r.at);html+=`<tr><td>${i+1}</td><td>${r.height.toFixed(2)}</td><td>${d.toLocaleString()}</td></tr>`});boardTable.innerHTML=html;}

function restart(){gameOver=false;quizActive=false;energy=100;heightPx=0;highestTopY=H;player.x=W/2;player.vx=0;player.vy=0;startedAt=performance.now();initPlatforms();leaderboardEl.classList.add("hidden");}

restartBtn.onclick=()=>{restart();};

document.addEventListener("keydown",e=>{if(e.key==="ArrowLeft")keys.left=true;else if(e.key==="ArrowRight")keys.right=true;});
document.addEventListener("keyup",e=>{if(e.key==="ArrowLeft")keys.left=false;else if(e.key==="ArrowRight")keys.right=false;});

function loop(){const now=performance.now();const dt=(now-lastTime)/1000;lastTime=now;update(dt);draw();requestAnimationFrame(loop);} 

initPlatforms();
loop();
