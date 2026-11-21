/** Start the slow lane only while visible, overflowing and allowed to animate. */
export function startSlowCarousel(element,{runtime=window,speed=16,pauseAtEnd=1800}={}) {
  if(typeof runtime.matchMedia!=='function'||typeof runtime.IntersectionObserver!=='function'||typeof runtime.ResizeObserver!=='function')return ()=>{};
  const motion=runtime.matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,previous,position=element.scrollLeft,atEnd=0,visible=false,disposed=false;
  let maximum=Math.max(0,element.scrollWidth-element.clientWidth);
  const allowed=()=>!disposed&&visible&&!runtime.document.hidden&&!motion.matches&&maximum>1;
  function stop(){if(frame)runtime.cancelAnimationFrame(frame);frame=0;previous=undefined;}
  function sync(){if(allowed()){if(!frame)frame=runtime.requestAnimationFrame(tick);}else stop();}
  function tick(time){
    frame=0;
    if(!allowed()){stop();return;}
    if(previous===undefined)position=element.scrollLeft;
    const delta=previous===undefined?0:Math.min(time-previous,50);
    previous=time;
    position=Math.min(maximum,position+delta*speed/1000);
    if(position>=maximum){atEnd+=delta;if(atEnd>=pauseAtEnd){position=0;atEnd=0;}}
    element.scrollLeft=position;
    sync();
  }
  const intersection=new runtime.IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();});
  const resize=new runtime.ResizeObserver(()=>{maximum=Math.max(0,element.scrollWidth-element.clientWidth);sync();});
  intersection.observe(element);resize.observe(element);
  runtime.document.addEventListener('visibilitychange',sync);
  if(motion.addEventListener)motion.addEventListener('change',sync);else motion.addListener(sync);
  return ()=>{disposed=true;stop();intersection.disconnect();resize.disconnect();runtime.document.removeEventListener('visibilitychange',sync);if(motion.removeEventListener)motion.removeEventListener('change',sync);else motion.removeListener(sync);};
}
