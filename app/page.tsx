'use client';
import { useMemo, useRef, useState } from 'react';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

type Effect = 'zoom'|'bounce'|'shake'|'pulse'|'slide';
const effects:{id:Effect;name:string;desc:string;emoji:string}[]=[
 {id:'zoom',name:'줌인',desc:'시그니처·등장',emoji:'🔍'},
 {id:'bounce',name:'바운스',desc:'후원·축하',emoji:'🎉'},
 {id:'shake',name:'쉐이크',desc:'리액션·밈',emoji:'⚡'},
 {id:'pulse',name:'펄스',desc:'숫자·강조',emoji:'💗'},
 {id:'slide',name:'슬라이드',desc:'닉네임·공지',emoji:'✨'},
];
const ratios = [{id:'1:1',w:720,h:720},{id:'9:16',w:540,h:960},{id:'16:9',w:960,h:540}];
function ease(t:number){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2}
export default function Home(){
 const [src,setSrc]=useState<string>(''); const [effect,setEffect]=useState<Effect>('bounce'); const [ratio,setRatio]=useState('1:1');
 const [text,setText]=useState('오늘도 레전드!'); const [seconds,setSeconds]=useState(2); const [busy,setBusy]=useState(false); const [result,setResult]=useState('');
 const fileRef=useRef<HTMLInputElement>(null); const r=useMemo(()=>ratios.find(x=>x.id===ratio)!,[ratio]);
 const onFile=(f?:File)=>{if(!f)return; if(!f.type.startsWith('image/'))return alert('이미지 파일을 선택해주세요.'); const u=URL.createObjectURL(f); setSrc(u); setResult('');}
 const generate=async()=>{
   if(!src)return alert('먼저 사진을 넣어주세요.'); setBusy(true); setResult('');
   try{
    const img=new Image(); img.src=src; await img.decode();
    const outW = ratio==='9:16'?360:ratio==='16:9'?480:420; const outH=Math.round(outW*r.h/r.w);
    const canvas=document.createElement('canvas'); canvas.width=outW; canvas.height=outH; const ctx=canvas.getContext('2d',{willReadFrequently:true})!;
    const gif=GIFEncoder(); const fps=15, frames=Math.max(15,Math.round(seconds*fps));
    for(let i=0;i<frames;i++){
      const t=i/(frames-1), loop=Math.sin(t*Math.PI*2), ping=Math.sin(t*Math.PI);
      ctx.clearRect(0,0,outW,outH); ctx.fillStyle='#0b0c10'; ctx.fillRect(0,0,outW,outH);
      const base=Math.max(outW/img.width,outH/img.height); let scale=base, dx=0,dy=0,rot=0;
      if(effect==='zoom')scale*=1+.12*ease(t);
      if(effect==='bounce'){scale*=1+.07*Math.abs(loop);dy=-14*Math.abs(loop)}
      if(effect==='shake'){dx=8*loop; rot=.02*loop}
      if(effect==='pulse')scale*=1+.09*ping;
      if(effect==='slide')dx=(1-ease(Math.min(1,t*3)))*-55;
      const dw=img.width*scale, dh=img.height*scale;
      ctx.save(); ctx.translate(outW/2+dx,outH/2+dy); ctx.rotate(rot); ctx.drawImage(img,-dw/2,-dh/2,dw,dh); ctx.restore();
      const grad=ctx.createLinearGradient(0,outH*.62,0,outH); grad.addColorStop(0,'rgba(0,0,0,0)');grad.addColorStop(1,'rgba(0,0,0,.72)');ctx.fillStyle=grad;ctx.fillRect(0,0,outW,outH);
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`800 ${Math.max(24,Math.round(outW*.072))}px system-ui, sans-serif`;ctx.lineWidth=Math.max(4,outW*.009);ctx.strokeStyle='rgba(0,0,0,.8)';ctx.strokeText(text||' ',outW/2,outH*.86);ctx.fillStyle='white';ctx.fillText(text||' ',outW/2,outH*.86);
      const data=ctx.getImageData(0,0,outW,outH); const palette=quantize(data.data,256); const index=applyPalette(data.data,palette); gif.writeFrame(index,outW,outH,{palette,delay:1000/fps});
      await new Promise(res=>setTimeout(res,0));
    }
    gif.finish(); const blob=new Blob([gif.bytesView()],{type:'image/gif'}); setResult(URL.createObjectURL(blob));
   }catch(e){console.error(e);alert('GIF 생성 중 오류가 발생했습니다.');}finally{setBusy(false)}
 }
 return <main>
   <nav><div className="brand"><span className="logo">M</span><b>MOTIONPOP</b><em>BETA</em></div><div className="navnote">Streamer GIF Studio</div></nav>
   <section className="hero"><div className="eyebrow">사진 한 장이면 충분합니다</div><h1>방송에 바로 쓰는<br/><span>움직이는 GIF</span>를 10초 만에.</h1><p>SOOP · TikTok · 치지직 · 유튜브 스트리머를 위한 초간단 모션 콘텐츠 메이커</p></section>
   <section className="maker">
    <div className="panel upload"><h2>1. 사진 넣기</h2><div className={'drop '+(src?'has':'')} onClick={()=>fileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();onFile(e.dataTransfer.files[0])}}>{src?<img src={src} alt="preview"/>:<><div className="uploadIcon">＋</div><b>클릭하거나 사진을 드래그하세요</b><small>JPG · PNG · WEBP</small></>}</div><input ref={fileRef} type="file" accept="image/*" hidden onChange={e=>onFile(e.target.files?.[0])}/><label>넣을 문구<input value={text} maxLength={24} onChange={e=>setText(e.target.value)} placeholder="예: 10,000개 감사합니다!"/></label></div>
    <div className="panel"><h2>2. 움직임 고르기</h2><div className="effects">{effects.map(x=><button key={x.id} className={effect===x.id?'active':''} onClick={()=>setEffect(x.id)}><i>{x.emoji}</i><b>{x.name}</b><small>{x.desc}</small></button>)}</div><h3>화면 비율</h3><div className="seg">{ratios.map(x=><button className={ratio===x.id?'active':''} onClick={()=>setRatio(x.id)} key={x.id}>{x.id}</button>)}</div><h3>길이</h3><div className="seg">{[1,2,3].map(x=><button className={seconds===x?'active':''} onClick={()=>setSeconds(x)} key={x}>{x}초</button>)}</div><button className="generate" disabled={busy} onClick={generate}>{busy?'GIF 만드는 중…':'✨ GIF 자동 만들기'}</button></div>
    <div className="panel result"><h2>3. 완성</h2><div className="resultbox" style={{aspectRatio:`${r.w}/${r.h}`}}>{result?<img src={result} alt="generated gif"/>:<div><span>▶</span><b>완성된 GIF가 여기에 표시됩니다</b><small>사진과 효과를 선택해 만들어보세요</small></div>}</div>{result&&<a className="download" href={result} download="motionpop.gif">GIF 다운로드</a>}</div>
   </section>
   <section className="usecases"><h2>방송인은 이렇게 씁니다</h2><div><article><span>💸</span><b>후원 리액션</b><p>닉네임·후원 숫자를 넣어 즉석 감사 GIF</p></article><article><span>🎂</span><b>생일·기념일</b><p>사진 한 장으로 축하용 움직이는 시그니처</p></article><article><span>😂</span><b>밈 & 짤</b><p>방송 캡처를 흔들고 튕겨 바로 공유</p></article><article><span>🔥</span><b>틱톡·릴스</b><p>세로 9:16 GIF/짧은 영상 소재 제작</p></article></div></section>
   <footer>© 2026 MOTIONPOP — Built for creators</footer>
 </main>
}
