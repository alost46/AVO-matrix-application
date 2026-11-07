/* AVO Camera v0.1a: frame-accurate mathematical timeline -> MP4.
 * Application-independent capture/encoding. Mathematical stepping is supplied
 * through adapter.captureFrames({onFrame, cancelled, mode, to, step}).
 * Never captures individual panels: captures the visible browser tab viewport.
 * No changes to AVO Core v2.
 * MP4 muxing/encoding uses Mediabunny (MPL-2.0), pinned version.
 */
const MEDIA_URL='https://cdn.jsdelivr.net/npm/mediabunny@1.65.2/+esm';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const raf=()=>new Promise(r=>requestAnimationFrame(r));
const even=n=>Math.max(2,Math.round(n/2)*2);
const I={
 ru:{title:'🎥 Кинокамера · v0.1a',mode:'Изменяемый параметр',time:'Скалярный t (существующая анимация)',sx:'Вектор T: X',sy:'Вектор T: Y',sz:'Вектор T: Z',to:'Конечное значение',step:'Шаг',fps:'Кадров/с',start:'● Записать MP4',stop:'■ Прервать',tip:'Выберите «Эта вкладка» при запросе браузера. Записывается весь видимый экран приложения. Для одной картинки сначала разверните её.',idle:'Готово к записи',initial:'Выберите вкладку приложения',working:'Запись кадров',encoding:'Формирование MP4',done:'MP4 готов',download:'Скачать MP4',preview:'Просмотр',unsupported:'Запись вкладки или кодирование AVC недоступны в этом браузере. Для первого испытания используйте Chrome или Edge на ПК.',cancelled:'Запись прервана',error:'Ошибка записи',presets:'При t используются начало, конец и шаг из «Поверхность и построение». При T меняется одна координата вектора от текущего значения до указанной границы.'},
 en:{title:'🎥 Movie camera · v0.1a',mode:'Varying parameter',time:'Scalar t (existing animation)',sx:'Vector T: X',sy:'Vector T: Y',sz:'Vector T: Z',to:'End value',step:'Step',fps:'Frames/s',start:'● Record MP4',stop:'■ Cancel',tip:'Choose “This tab” in the browser prompt. The entire visible app screen is recorded. Enlarge a single picture before recording if desired.',idle:'Ready',initial:'Select the app tab',working:'Capturing frames',encoding:'Encoding MP4',done:'MP4 ready',download:'Download MP4',preview:'Preview',unsupported:'Tab capture or AVC encoding is unavailable in this browser. Test Chrome or Edge on a desktop first.',cancelled:'Cancelled',error:'Recording error',presets:'For t, the range and step are taken from Surface controls. For T, one vector component moves from its current value to your endpoint.'},
 he:{title:'🎥 מצלמה · v0.1a',mode:'פרמטר משתנה',time:'פרמטר סקלרי t',sx:'וקטור T: X',sy:'וקטור T: Y',sz:'וקטור T: Z',to:'ערך סופי',step:'צעד',fps:'פריימים לשנייה',start:'● הקלט MP4',stop:'■ בטל',tip:'בחרו בכרטיסייה הנוכחית בחלון השיתוף. המסך הגלוי של היישום יוקלט כולו.',idle:'מוכן',initial:'בחרו כרטיסייה',working:'מצלם פריימים',encoding:'יוצר MP4',done:'MP4 מוכן',download:'הורד MP4',preview:'תצוגה מקדימה',unsupported:'צילום מסך או מקודד AVC אינם זמינים בדפדפן זה. יש לנסות Chrome/Edge במחשב.',cancelled:'ההקלטה בוטלה',error:'שגיאת הקלטה',presets:'עבור t משתמשים בגבולות ובצעד הקיימים. עבור T משתנה רכיב אחד של הווקטור.'}
};
export class AVOCamera {
 constructor({app,adapter,mount=document.body}){
  this.app=app;this.adapter=adapter;this.lang=app.lang||'ru';this.running=false;this.cancelRequested=false;this.stream=null;this.movieUrl=null;
  this.build(mount);this.localize();this.bindFullscreen();
 }
 build(mount){
  const root=document.createElement('section');root.className='avo-camera';root.id='avo-camera';root.setAttribute('aria-label','AVO Camera');
  root.innerHTML=`<div class="cam-heading"><strong data-cam="title"></strong><button type="button" data-cam="fold" aria-label="Развернуть/свернуть">▾</button></div>
   <div class="cam-body"><div class="cam-row"><label><span data-cam="modeLabel"></span><select data-cam="mode"><option value="t"></option><option value="tx"></option><option value="ty"></option><option value="tz"></option></select></label>
   <label><span data-cam="endLabel"></span><input data-cam="end" type="number" step="any" value="3"></label><label><span data-cam="stepLabel"></span><input data-cam="step" type="number" step="any" value="0.2"></label>
   <label><span data-cam="fpsLabel"></span><select data-cam="fps"><option>10</option><option>15</option><option selected>25</option><option>30</option></select></label></div>
   <div class="cam-buttons"><button type="button" data-cam="start"></button><button type="button" data-cam="stop" disabled></button><span class="cam-status" data-cam="status"></span></div>
   <p class="cam-help" data-cam="hint"></p><p class="cam-help" data-cam="description"></p><div class="cam-result" data-cam="result" hidden><a data-cam="download" download="AVO_Camera.mp4"></a><video data-cam="preview" controls playsinline preload="metadata"></video></div></div>`;
  mount.append(root);this.root=root;
  this.$=key=>root.querySelector(`[data-cam="${key}"]`);
  this.$('fold').onclick=()=>{root.classList.toggle('collapsed');this.$('fold').textContent=root.classList.contains('collapsed')?'▸':'▾';};
  this.$('mode').addEventListener('change',()=>this.syncMode());
  this.$('start').addEventListener('click',()=>this.start());
  this.$('stop').addEventListener('click',()=>{this.cancelRequested=true;this.message((I[this.lang]||I.ru).cancelled);});
 }
 bindFullscreen(){document.addEventListener('fullscreenchange',()=>{
  const parent=document.fullscreenElement||document.body;
  if(this.root.parentElement!==parent)parent.append(this.root);
 });}
 localize(){this.lang=this.app.lang||'ru';const d=I[this.lang]||I.ru;
  for(const [key,value] of [['title',d.title],['modeLabel',d.mode],['endLabel',d.to],['stepLabel',d.step],['fpsLabel',d.fps],['start',d.start],['stop',d.stop],['hint',d.tip],['description',d.presets],['download',d.download]])this.$(key).textContent=value;
  for(const [i,key] of ['time','sx','sy','sz'].entries())this.$('mode').options[i].textContent=d[key];
  this.$('preview').title=d.preview;
  if(!this.running)this.message(d.idle);this.syncMode();
 }
 syncMode(){const mode=this.$('mode').value,isTime=mode==='t';this.$('end').parentElement.hidden=isTime;this.$('step').parentElement.hidden=isTime;
  if(!isTime){const idx='xyz'.indexOf(mode[1]);const value=this.app.currentInputs().t[idx];if(!this.running&&Number.isFinite(value))this.$('end').value=String(Number(value)+3);}
 }
 message(t){this.$('status').textContent=t;}
 setBusy(b){this.running=b;this.root.classList.toggle('recording',b);for(const id of ['start','mode','end','step','fps'])this.$(id).disabled=b;this.$('stop').disabled=!b;}
 async start(){if(this.running)return;
  const d=I[this.app.lang]||I.ru,mode=this.$('mode').value,to=Number(this.$('end').value.replace(',','.')),step=Number(this.$('step').value.replace(',','.')),fps=Number(this.$('fps').value);
  // Validate before obtaining the capture grant (which requires a user gesture).
  if(mode!=='t'&&(!Number.isFinite(to)||!Number.isFinite(step)||step<=0)){this.message(d.error+': invalid range / неверный диапазон');return;}
  if(typeof navigator.mediaDevices?.getDisplayMedia!=='function'||typeof window.VideoEncoder!=='function'){this.message(d.unsupported);return;}
  this.cancelRequested=false;this.setBusy(true);this.$('result').hidden=true;
  if(this.movieUrl){URL.revokeObjectURL(this.movieUrl);this.movieUrl=null;}
  let output=null,source=null,video=null;
  try{
   this.message(d.initial);
   // Must be invoked synchronously in the click handler, before any awaits.
   const displayPromise=navigator.mediaDevices.getDisplayMedia({video:{frameRate:30},audio:false,preferCurrentTab:true,selfBrowserSurface:'include',surfaceSwitching:'exclude'});
   this.stream=await displayPromise;
   const track=this.stream.getVideoTracks()[0];if(!track)throw Error('Missing screen video track');
   track.addEventListener('ended',()=>{this.cancelRequested=true;});
   video=document.createElement('video');video.srcObject=this.stream;video.muted=true;video.playsInline=true;await video.play();
   if(!video.videoWidth)await new Promise((resolve,reject)=>{video.onloadedmetadata=resolve;video.onerror=reject;});
   if(!video.videoWidth||!video.videoHeight)throw Error('No screen video frames');
   const scale=Math.min(1,1280/video.videoWidth,900/video.videoHeight);
   const width=even(Math.max(2,video.videoWidth*scale)),height=even(Math.max(2,video.videoHeight*scale));
   const supported=await VideoEncoder.isConfigSupported({codec:'avc1.42001f',width,height,bitrate:1800000,framerate:fps});
   if(!supported.supported)throw Error(d.unsupported);
   const {Output,Mp4OutputFormat,BufferTarget,CanvasSource,Quality}=await import(MEDIA_URL);
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
   const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Canvas2D unavailable');
   source=new CanvasSource(canvas,{codec:'avc',quality:new Quality('high')});
   output=new Output({format:new Mp4OutputFormat(),target:new BufferTarget()});
   output.addVideoTrack(source,{frameRate:fps});
   await output.start();
   // Allow the browser's screen-share picker to close before taking frame 1.
   await wait(350);
   let count=0;
   await this.adapter.captureFrames({mode,to,step,cancelled:()=>this.cancelRequested,onFrame:async(info)=>{
    if(this.cancelRequested)throw Error('AVO_CAMERA_CANCELLED');
    // Let the compositor and tab-capture pipeline present the complete math state.
    await raf();await raf();await wait(110);
    if(this.cancelRequested)throw Error('AVO_CAMERA_CANCELLED');
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,height);
    ctx.drawImage(video,0,0,width,height);
    await source.add(count/fps,1/fps);
    count++;
    this.message(`${d.working}: ${count}/${info.total||'?'} · t=${Number(info.time??count).toFixed(2)}`);
   }});
   if(this.cancelRequested)throw Error('AVO_CAMERA_CANCELLED');
   if(!count)throw Error('No frames');
   this.message(d.encoding);
   source.close();await output.finalize();
   const bytes=output.target.buffer;if(!bytes||bytes.byteLength<100)throw Error('Empty video output');
   this.movieUrl=URL.createObjectURL(new Blob([bytes],{type:'video/mp4'}));
   this.$('download').href=this.movieUrl;this.$('download').download=`AVO_Camera_${new Date().toISOString().replace(/[:.]/g,'-')}.mp4`;
   this.$('preview').src=this.movieUrl;this.$('result').hidden=false;
   this.message(`${d.done}: ${count} ${this.app.lang==='en'?'frames':'кадров'} · ${(count/fps).toFixed(2)} s`);
  }catch(error){
   if(error?.name==='NotAllowedError'){this.message(d.cancelled+' (доступ к вкладке не разрешён)');}
   else if(this.cancelRequested||error?.message==='AVO_CAMERA_CANCELLED'){this.message(d.cancelled);}
   else{console.error('AVO Camera:',error);this.message(`${d.error}: ${error?.message||error}`);}
  }finally{
   this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;
   if(video){video.pause();video.srcObject=null;}
   this.setBusy(false);
  }
 }
}
export function installCamera(options){return new AVOCamera(options);}
