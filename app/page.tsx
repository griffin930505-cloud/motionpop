'use client';
import { useMemo, useRef, useState } from 'react';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

type Effect = 'zoom'|'bounce'|'shake'|'pulse'|'slide';
type EditorMode = 'image'|'video';
type TextPos = 'tl'|'tc'|'tr'|'ml'|'mc'|'mr'|'bl'|'bc'|'br';
type BorderStyle = 'none'|'white'|'black';
type BoxStyle = 'none'|'dark'|'light';

const effects:{id:Effect;name:string;desc:string;emoji:string}[]=[
 {id:'zoom',name:'줌인',desc:'시그니처·등장',emoji:'🔍'},
 {id:'bounce',name:'바운스',desc:'후원·축하',emoji:'🎉'},
 {id:'shake',name:'쉐이크',desc:'리액션·밈',emoji:'⚡'},
 {id:'pulse',name:'펄스',desc:'숫자·강조',emoji:'💗'},
 {id:'slide',name:'슬라이드',desc:'닉네임·공지',emoji:'✨'},
];
const ratios = [{id:'1:1',w:720,h:720},{id:'9:16',w:540,h:960},{id:'16:9',w:960,h:540}];
const positions:{id:TextPos;label:string}[]=[
 {id:'tl',label:'왼쪽 상단'},{id:'tc',label:'가운데 상단'},{id:'tr',label:'오른쪽 상단'},
 {id:'ml',label:'왼쪽 가운데'},{id:'mc',label:'가운데'},{id:'mr',label:'오른쪽 가운데'},
 {id:'bl',label:'왼쪽 하단'},{id:'bc',label:'가운데 하단'},{id:'br',label:'오른쪽 하단'},
];
function ease(t:number){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2}

export default function Home(){
 const [mode,setMode]=useState<EditorMode>('video');
 const [src,setSrc]=useState<string>(''); const [effect,setEffect]=useState<Effect>('bounce'); const [ratio,setRatio]=useState('1:1');
 const [text,setText]=useState('오늘도 레전드!'); const [seconds,setSeconds]=useState(2); const [busy,setBusy]=useState(false); const [result,setResult]=useState('');
 const [videoSrc,setVideoSrc]=useState(''); const [videoText,setVideoText]=useState('오늘도 레전드!'); const [videoPos,setVideoPos]=useState<TextPos>('bc');
 const [fontSize,setFontSize]=useState(34); const [fontColor,setFontColor]=useState('#ffffff'); const [border,setBorder]=useState<BorderStyle>('black'); const [box,setBox]=useState<BoxStyle>('none');
 const fileRef=useRef<HTMLInputElement>(null); const videoRef=useRef<HTMLInputElement>(null); const r=useMemo(()=>ratios.find(x=>x.id===ratio)!,[ratio]);
 const onFile=(f?:File)=>{if(!f)return; if(!f.type.startsWith('image/'))return alert('이미지 파일을 선택해주세요.'); const u=URL.createObjectURL(f); setSrc(u); setResult('');}
 const onVideo=(f?:File)=>{if(!f)return; if(!f.type.startsWith('video/'))return alert('영상 파일을 선택해주세요.'); const u=URL.createObjectURL(f); setVideoSrc(u);}
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
 const captionStyle={fontSize:`${fontSize}px`,color:fontColor} as React.CSSProperties;
 return <main>
   <nav className="topnav"><div className="brand"><span className="logo">M</span><b>MOTIONPOP</b><em>BETA</em></div><div className="navlinks"><button className={mode==='image'?'active':''} onClick={()=>setMode('image')}>이미지 GIF</button><button className={mode==='video'?'active':''} onClick={()=>setMode('video')}>비디오 편집</button><button>템플릿</button><button>내 작업</button></div><div className="pro">♛ 프로 업그레이드</div></nav>

   {mode==='image'?<>
   <section className="hero compact"><div className="eyebrow">이미지 GIF 메이커</div><h1>사진 한 장으로 <span>움직이는 GIF</span></h1><p>방송·틱톡·릴스에 바로 쓰는 짧은 모션 콘텐츠</p></section>
   <section className="maker">
    <div className="panel upload"><h2>1. 사진 넣기</h2><div className={'drop '+(src?'has':'')} onClick={()=>fileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();onFile(e.dataTransfer.files[0])}}>{src?<img src={src} alt="preview"/>:<><div className="uploadIcon">＋</div><b>클릭하거나 사진을 드래그하세요</b><small>JPG · PNG · WEBP</small></>}</div><input ref={fileRef} type="file" accept="image/*" hidden onChange={e=>onFile(e.target.files?.[0])}/><label>넣을 문구<input value={text} maxLength={24} onChange={e=>setText(e.target.value)} placeholder="예: 10,000개 감사합니다!"/></label></div>
    <div className="panel"><h2>2. 움직임 고르기</h2><div className="effects">{effects.map(x=><button key={x.id} className={effect===x.id?'active':''} onClick={()=>setEffect(x.id)}><i>{x.emoji}</i><b>{x.name}</b><small>{x.desc}</small></button>)}</div><h3>화면 비율</h3><div className="seg">{ratios.map(x=><button className={ratio===x.id?'active':''} onClick={()=>setRatio(x.id)} key={x.id}>{x.id}</button>)}</div><h3>길이</h3><div className="seg">{[1,2,3].map(x=><button className={seconds===x?'active':''} onClick={()=>setSeconds(x)} key={x}>{x}초</button>)}</div><button className="generate" disabled={busy} onClick={generate}>{busy?'GIF 만드는 중…':'✨ GIF 자동 만들기'}</button></div>
    <div className="panel result"><h2>3. 완성</h2><div className="resultbox" style={{aspectRatio:`${r.w}/${r.h}`}}>{result?<img src={result} alt="generated gif"/>:<div><span>▶</span><b>완성된 GIF가 여기에 표시됩니다</b><small>사진과 효과를 선택해 만들어보세요</small></div>}</div>{result&&<a className="download" href={result} download="motionpop.gif">GIF 다운로드</a>}</div>
   </section></>:

   <section className="editorShell">
    <aside className="editorPanel">
      <div className="editorTabs"><button onClick={()=>setMode('image')}>▧ 이미지로 만들기</button><button className="active">▶ 영상으로 만들기</button></div>
      <div className="step"><div className="stepTitle"><span>1</span><b>영상 업로드</b></div><div className={'bigUpload '+(videoSrc?'has':'')} onClick={()=>videoRef.current?.click()}>{videoSrc?<><video src={videoSrc} muted playsInline/><div className="changeFile">영상 변경</div></>:<><div className="cloud">⇧</div><b>영상 파일을 업로드하세요</b><small>MP4 · MOV · WEBM</small><button>파일 선택</button></>}</div><input ref={videoRef} type="file" accept="video/*" hidden onChange={e=>onVideo(e.target.files?.[0])}/></div>
      <div className="step"><div className="stepTitle"><span>2</span><b>문구 입력</b></div><textarea maxLength={100} value={videoText} onChange={e=>setVideoText(e.target.value)} placeholder="넣고 싶은 문구를 입력하세요"/><div className="counter">{videoText.length}/100</div></div>
      <div className="step"><div className="stepTitle"><span>3</span><b>문구 위치</b></div><div className="positionGrid">{positions.map(p=><button key={p.id} className={videoPos===p.id?'active':''} onClick={()=>setVideoPos(p.id)}><span>⌗</span>{p.label}</button>)}</div></div>
      <div className="step"><div className="stepTitle"><span>4</span><b>스타일 설정</b></div>
        <div className="styleRow"><label>글씨 크기</label><input type="range" min="18" max="72" value={fontSize} onChange={e=>setFontSize(Number(e.target.value))}/><strong>{fontSize}</strong></div>
        <div className="styleRow"><label>글씨 색상</label><div className="colors">{['#ffffff','#000000','#ff3b48','#ffd83d','#ff83ca','#cdeaff','#22d9f4','#9b5cff'].map(c=><button key={c} className={fontColor===c?'active':''} style={{background:c}} onClick={()=>setFontColor(c)} aria-label={c}/>)}</div></div>
        <div className="styleRow vertical"><label>테두리</label><div className="miniSeg"><button className={border==='none'?'active':''} onClick={()=>setBorder('none')}>없음</button><button className={border==='white'?'active':''} onClick={()=>setBorder('white')}>흰색 테두리</button><button className={border==='black'?'active':''} onClick={()=>setBorder('black')}>검정 테두리</button></div></div>
        <div className="styleRow vertical"><label>배경 박스</label><div className="miniSeg"><button className={box==='none'?'active':''} onClick={()=>setBox('none')}>없음</button><button className={box==='dark'?'active':''} onClick={()=>setBox('dark')}>반투명 박스</button><button className={box==='light'?'active':''} onClick={()=>setBox('light')}>밝은 박스</button></div></div>
      </div>
      <button className="previewBtn">▶ 영상 미리보기</button>
    </aside>

    <section className="previewPanel">
      <div className="previewHead"><h2>미리보기</h2><span>실제 결과물과 약간의 차이가 있을 수 있습니다.</span></div>
      <div className="stage">{videoSrc?<><video src={videoSrc} controls playsInline/><div className={`caption pos-${videoPos} border-${border} box-${box}`} style={captionStyle}>{videoText}</div></>:<div className="emptyStage"><span>▶</span><b>영상을 업로드하면 여기에 미리보기가 표시됩니다</b><small>문구 위치와 스타일도 바로 확인할 수 있어요</small></div>}</div>
      <div className="positionExamples"><h3>위치별 예시</h3><div>{positions.map(p=><button key={p.id} className={videoPos===p.id?'active':''} onClick={()=>setVideoPos(p.id)}><span className={`miniCaption mini-${p.id}`}>Aa</span><small>{p.label}</small></button>)}</div></div>
      <button className="exportBtn">⇩ 이 설정으로 영상 다운로드</button>
      <p className="exportNote">현재 단계에서는 편집 내용을 실시간 미리보기할 수 있습니다. 실제 문구 합성 영상 다운로드 기능은 다음 단계에서 연결합니다.</p>
    </section>
   </section>}
   <footer>© 2026 MOTIONPOP — Built for creators</footer>
 </main>
}
