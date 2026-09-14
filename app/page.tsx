'use client';
import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

type Effect = 'zoom'|'bounce'|'shake'|'pulse'|'slide';
type EditorMode = 'image'|'video'|'works';
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
const colors=['#ffffff','#000000','#ff3b48','#ffd83d','#ff83ca','#cdeaff','#22d9f4','#9b5cff'];
function ease(t:number){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2}
function posToCanvas(pos:TextPos,w:number,h:number){
 const padX=w*.07,padY=h*.09;
 const col=pos[1],row=pos[0];
 const x=col==='l'?padX:col==='r'?w-padX:w/2;
 const y=row==='t'?padY:row==='b'?h-padY:h/2;
 const align:CanvasTextAlign=col==='l'?'left':col==='r'?'right':'center';
 return {x,y,align};
}

export default function Home(){
 const [mode,setMode]=useState<EditorMode>('video');
 const [src,setSrc]=useState(''); const [effect,setEffect]=useState<Effect>('bounce'); const [ratio,setRatio]=useState('1:1');
 const [text,setText]=useState('오늘도 레전드!'); const [seconds,setSeconds]=useState(2); const [busy,setBusy]=useState(false); const [result,setResult]=useState('');
 const [imagePos,setImagePos]=useState<TextPos>('bc'); const [imageFontSize,setImageFontSize]=useState(34); const [imageFontColor,setImageFontColor]=useState('#ffffff'); const [imageBorder,setImageBorder]=useState<BorderStyle>('black'); const [imageBox,setImageBox]=useState<BoxStyle>('none');
 const [videoSrc,setVideoSrc]=useState(''); const [videoText,setVideoText]=useState('오늘도 레전드!'); const [videoPos,setVideoPos]=useState<TextPos>('bc');
 const [fontSize,setFontSize]=useState(34); const [fontColor,setFontColor]=useState('#ffffff'); const [border,setBorder]=useState<BorderStyle>('black'); const [box,setBox]=useState<BoxStyle>('none');
 const fileRef=useRef<HTMLInputElement>(null); const videoRef=useRef<HTMLInputElement>(null); const r=useMemo(()=>ratios.find(x=>x.id===ratio)!,[ratio]);
 const onFile=(f?:File)=>{if(!f)return;if(!f.type.startsWith('image/'))return alert('이미지 파일을 선택해주세요.');setSrc(URL.createObjectURL(f));setResult('');}
 const onVideo=(f?:File)=>{if(!f)return;if(!f.type.startsWith('video/'))return alert('영상 파일을 선택해주세요.');setVideoSrc(URL.createObjectURL(f));}
 const generate=async()=>{
  if(!src)return alert('먼저 사진을 넣어주세요.');setBusy(true);setResult('');
  try{
   const img=new Image();img.src=src;await img.decode();
   const outW=ratio==='9:16'?360:ratio==='16:9'?480:420;const outH=Math.round(outW*r.h/r.w);
   const canvas=document.createElement('canvas');canvas.width=outW;canvas.height=outH;const ctx=canvas.getContext('2d',{willReadFrequently:true})!;
   const gif=GIFEncoder();const fps=15,frames=Math.max(15,Math.round(seconds*fps));
   for(let i=0;i<frames;i++){
    const t=i/(frames-1),loop=Math.sin(t*Math.PI*2),ping=Math.sin(t*Math.PI);
    ctx.clearRect(0,0,outW,outH);ctx.fillStyle='#0b0c10';ctx.fillRect(0,0,outW,outH);
    const base=Math.max(outW/img.width,outH/img.height);let scale=base,dx=0,dy=0,rot=0;
    if(effect==='zoom')scale*=1+.12*ease(t);if(effect==='bounce'){scale*=1+.07*Math.abs(loop);dy=-14*Math.abs(loop)}if(effect==='shake'){dx=8*loop;rot=.02*loop}if(effect==='pulse')scale*=1+.09*ping;if(effect==='slide')dx=(1-ease(Math.min(1,t*3)))*-55;
    const dw=img.width*scale,dh=img.height*scale;ctx.save();ctx.translate(outW/2+dx,outH/2+dy);ctx.rotate(rot);ctx.drawImage(img,-dw/2,-dh/2,dw,dh);ctx.restore();
    const {x,y,align}=posToCanvas(imagePos,outW,outH);const fs=Math.max(18,Math.round(imageFontSize*outW/540));ctx.font=`900 ${fs}px system-ui, sans-serif`;ctx.textBaseline='middle';ctx.textAlign=align;
    const label=text||' ';const metrics=ctx.measureText(label);const boxW=metrics.width+24,boxH=fs*1.45;let boxX=x;if(align==='center')boxX=x-boxW/2;if(align==='right')boxX=x-boxW;
    if(imageBox!=='none'){ctx.fillStyle=imageBox==='dark'?'rgba(0,0,0,.52)':'rgba(255,255,255,.72)';ctx.fillRect(boxX,y-boxH/2,boxW,boxH)}
    if(imageBorder!=='none'){ctx.lineWidth=Math.max(3,fs*.11);ctx.strokeStyle=imageBorder==='white'?'#fff':'#000';ctx.strokeText(label,x,y)}
    ctx.fillStyle=imageFontColor;ctx.fillText(label,x,y);
    const data=ctx.getImageData(0,0,outW,outH);const palette=quantize(data.data,256);const index=applyPalette(data.data,palette);gif.writeFrame(index,outW,outH,{palette,delay:1000/fps});await new Promise(res=>setTimeout(res,0));
   }
   gif.finish();setResult(URL.createObjectURL(new Blob([gif.bytesView()],{type:'image/gif'})));
  }catch(e){console.error(e);alert('GIF 생성 중 오류가 발생했습니다.');}finally{setBusy(false)}
 }
 const imageCaptionStyle={fontSize:`${imageFontSize}px`,color:imageFontColor} as CSSProperties;
 const videoCaptionStyle={fontSize:`${fontSize}px`,color:fontColor} as CSSProperties;
 const PositionGrid=({value,setValue}:{value:TextPos;setValue:(v:TextPos)=>void})=><div className="positionGrid">{positions.map(p=><button key={p.id} className={value===p.id?'active':''} onClick={()=>setValue(p.id)}><span>⌗</span>{p.label}</button>)}</div>;
 const StyleControls=({size,setSize,color,setColor,borderValue,setBorderValue,boxValue,setBoxValue}:{size:number;setSize:(n:number)=>void;color:string;setColor:(s:string)=>void;borderValue:BorderStyle;setBorderValue:(b:BorderStyle)=>void;boxValue:BoxStyle;setBoxValue:(b:BoxStyle)=>void})=><>
  <div className="styleRow"><label>글씨 크기</label><input type="range" min="18" max="72" value={size} onChange={e=>setSize(Number(e.target.value))}/><strong>{size}</strong></div>
  <div className="styleRow"><label>글씨 색상</label><div className="colors">{colors.map(c=><button key={c} className={color===c?'active':''} style={{background:c}} onClick={()=>setColor(c)} aria-label={c}/>)}</div></div>
  <div className="styleRow vertical"><label>테두리</label><div className="miniSeg"><button className={borderValue==='none'?'active':''} onClick={()=>setBorderValue('none')}>없음</button><button className={borderValue==='white'?'active':''} onClick={()=>setBorderValue('white')}>흰색</button><button className={borderValue==='black'?'active':''} onClick={()=>setBorderValue('black')}>검정</button></div></div>
  <div className="styleRow vertical"><label>배경 박스</label><div className="miniSeg"><button className={boxValue==='none'?'active':''} onClick={()=>setBoxValue('none')}>없음</button><button className={boxValue==='dark'?'active':''} onClick={()=>setBoxValue('dark')}>반투명</button><button className={boxValue==='light'?'active':''} onClick={()=>setBoxValue('light')}>밝은 박스</button></div></div>
 </>;
 return <main>
  <nav className="topnav"><div className="brand"><span className="logo">M</span><b>MOTIONPOP</b><em>BETA</em></div><div className="navlinks"><button className={mode==='image'?'active':''} onClick={()=>setMode('image')}>이미지 GIF</button><button className={mode==='video'?'active':''} onClick={()=>setMode('video')}>비디오 편집</button><button>템플릿</button><button className={mode==='works'?'active':''} onClick={()=>setMode('works')}>내 작업</button></div><div className="accountActions"><button className="loginBtn">로그인</button><button className="pro">♛ 프로 업그레이드</button></div></nav>

  {mode==='image'&&<section className="editorShell">
   <aside className="editorPanel">
    <div className="editorTabs"><button className="active">▧ 이미지로 만들기</button><button onClick={()=>setMode('video')}>▶ 영상으로 만들기</button></div>
    <div className="step"><div className="stepTitle"><span>1</span><b>이미지 업로드</b></div><div className={'bigUpload '+(src?'has':'')} onClick={()=>fileRef.current?.click()}>{src?<><img src={src} alt="업로드 이미지"/><div className="changeFile">이미지 변경</div></>:<><div className="cloud">⇧</div><b>이미지 파일을 업로드하세요</b><small>JPG · PNG · WEBP</small><button>파일 선택</button></>}</div><input ref={fileRef} type="file" accept="image/*" hidden onChange={e=>onFile(e.target.files?.[0])}/></div>
    <div className="step"><div className="stepTitle"><span>2</span><b>문구 입력</b></div><textarea maxLength={100} value={text} onChange={e=>setText(e.target.value)} placeholder="넣고 싶은 문구를 입력하세요"/><div className="counter">{text.length}/100</div></div>
    <div className="step"><div className="stepTitle"><span>3</span><b>문구 위치</b></div><PositionGrid value={imagePos} setValue={setImagePos}/></div>
    <div className="step"><div className="stepTitle"><span>4</span><b>문구 스타일</b></div><StyleControls size={imageFontSize} setSize={setImageFontSize} color={imageFontColor} setColor={setImageFontColor} borderValue={imageBorder} setBorderValue={setImageBorder} boxValue={imageBox} setBoxValue={setImageBox}/></div>
    <div className="step"><div className="stepTitle"><span>5</span><b>GIF 움직임</b></div><div className="effects compactEffects">{effects.map(x=><button key={x.id} className={effect===x.id?'active':''} onClick={()=>setEffect(x.id)}><i>{x.emoji}</i><b>{x.name}</b><small>{x.desc}</small></button>)}</div><h3>화면 비율</h3><div className="seg">{ratios.map(x=><button className={ratio===x.id?'active':''} onClick={()=>setRatio(x.id)} key={x.id}>{x.id}</button>)}</div><h3>길이</h3><div className="seg">{[1,2,3].map(x=><button className={seconds===x?'active':''} onClick={()=>setSeconds(x)} key={x}>{x}초</button>)}</div></div>
    <button className="previewBtn" disabled={busy} onClick={generate}>{busy?'GIF 만드는 중…':'✨ 이 설정으로 GIF 만들기'}</button>
   </aside>
   <section className="previewPanel"><div className="previewHead"><h2>이미지 미리보기</h2><span>문구 위치와 스타일을 실시간으로 확인하세요.</span></div><div className="stage imageStage">{src?<><img src={src} alt="미리보기"/><div className={`caption pos-${imagePos} border-${imageBorder} box-${imageBox}`} style={imageCaptionStyle}>{text}</div></>:<div className="emptyStage"><span>▧</span><b>이미지를 업로드하면 여기에 미리보기가 표시됩니다</b><small>문구 위치와 스타일을 바로 확인할 수 있어요</small></div>}</div><div className="positionExamples"><h3>위치 빠른 선택</h3><div>{positions.map(p=><button key={p.id} className={imagePos===p.id?'active':''} onClick={()=>setImagePos(p.id)}><span className={`miniCaption mini-${p.id}`}>Aa</span><small>{p.label}</small></button>)}</div></div>{result&&<div className="resultArea"><h3>완성된 GIF</h3><img src={result} alt="generated gif"/><a className="exportBtn linkBtn" href={result} download="motionpop.gif">⇩ GIF 다운로드</a></div>}</section>
  </section>}

  {mode==='video'&&<section className="editorShell"><aside className="editorPanel"><div className="editorTabs"><button onClick={()=>setMode('image')}>▧ 이미지로 만들기</button><button className="active">▶ 영상으로 만들기</button></div><div className="step"><div className="stepTitle"><span>1</span><b>영상 업로드</b></div><div className={'bigUpload '+(videoSrc?'has':'')} onClick={()=>videoRef.current?.click()}>{videoSrc?<><video src={videoSrc} muted playsInline/><div className="changeFile">영상 변경</div></>:<><div className="cloud">⇧</div><b>영상 파일을 업로드하세요</b><small>MP4 · MOV · WEBM</small><button>파일 선택</button></>}</div><input ref={videoRef} type="file" accept="video/*" hidden onChange={e=>onVideo(e.target.files?.[0])}/></div><div className="step"><div className="stepTitle"><span>2</span><b>문구 입력</b></div><textarea maxLength={100} value={videoText} onChange={e=>setVideoText(e.target.value)} placeholder="넣고 싶은 문구를 입력하세요"/><div className="counter">{videoText.length}/100</div></div><div className="step"><div className="stepTitle"><span>3</span><b>문구 위치</b></div><PositionGrid value={videoPos} setValue={setVideoPos}/></div><div className="step"><div className="stepTitle"><span>4</span><b>스타일 설정</b></div><StyleControls size={fontSize} setSize={setFontSize} color={fontColor} setColor={setFontColor} borderValue={border} setBorderValue={setBorder} boxValue={box} setBoxValue={setBox}/></div><button className="previewBtn">▶ 영상 미리보기</button></aside><section className="previewPanel"><div className="previewHead"><h2>미리보기</h2><span>실제 결과물과 약간의 차이가 있을 수 있습니다.</span></div><div className="stage">{videoSrc?<><video src={videoSrc} controls playsInline/><div className={`caption pos-${videoPos} border-${border} box-${box}`} style={videoCaptionStyle}>{videoText}</div></>:<div className="emptyStage"><span>▶</span><b>영상을 업로드하면 여기에 미리보기가 표시됩니다</b><small>문구 위치와 스타일도 바로 확인할 수 있어요</small></div>}</div><div className="positionExamples"><h3>위치별 예시</h3><div>{positions.map(p=><button key={p.id} className={videoPos===p.id?'active':''} onClick={()=>setVideoPos(p.id)}><span className={`miniCaption mini-${p.id}`}>Aa</span><small>{p.label}</small></button>)}</div></div><button className="exportBtn">⇩ 이 설정으로 영상 다운로드</button><p className="exportNote">현재는 미리보기 단계입니다. 실제 문구 합성 MP4 다운로드 기능은 다음 단계에서 연결합니다.</p></section></section>}

  {mode==='works'&&<section className="worksPage"><div className="worksHero"><div><span className="eyebrow">MY MOTIONPOP</span><h1>내 작업</h1><p>로그인한 회원이 만든 GIF와 영상을 저장하고 다시 다운로드하는 공간입니다.</p></div><button className="primaryAccount">로그인하고 시작하기</button></div><div className="membershipGrid"><article><span>FREE</span><h3>무료 회원</h3><p>최근 작업 일부 저장 · 워터마크 · 기본 기능</p></article><article className="featured"><span>PRO</span><h3>프로 구독</h3><p>작업물 장기 보관 · HD 출력 · AI 모션 · 워터마크 제거</p></article><article><span>CREDITS</span><h3>건별 결제</h3><p>AI 생성이나 고급 출력이 필요할 때 크레딧으로 사용</p></article></div><div className="worksEmpty"><div className="lockIcon">🔒</div><h2>로그인 후 내 작업물을 확인할 수 있어요</h2><p>다음 단계에서 Supabase 로그인과 결제를 연결하면 생성한 작업물이 계정별로 자동 저장됩니다.</p><div className="futureFlow"><span>로그인</span><b>→</b><span>구독/결제</span><b>→</b><span>작업 자동 저장</span><b>→</b><span>내 작업에서 재다운로드</span></div></div></section>}
  <footer>© 2026 MOTIONPOP — Built for creators</footer>
 </main>
}
