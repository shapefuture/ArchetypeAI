import type { RenderPort } from "../../ports/index.js";
/** The ambient field also owns the quality signal: it forwards the tier to the character renderer. */
export class AmbientCanvasRenderer implements RenderPort {
 /** Character renderer to notify when the device tier changes (set by main.ts). */
 characters:{setQuality(tier:"ultra"|"high"|"standard"):void}|null=null;
 private canvas:HTMLCanvasElement; private ctx:CanvasRenderingContext2D|null; private raf=0; private started=performance.now(); private tier:"ultra"|"high"|"standard"="ultra"; private visible=true;
 constructor(canvas:HTMLCanvasElement){this.canvas=canvas;this.ctx=canvas.getContext("2d",{alpha:true});const resize=()=>this.resize();addEventListener("resize",resize,{passive:true});document.addEventListener("visibilitychange",()=>{this.visible=!document.hidden;});this.resize();this.raf=requestAnimationFrame(this.draw); this.cleanup=()=>{cancelAnimationFrame(this.raf);removeEventListener("resize",resize);};}
 private cleanup:()=>void=()=>{};
 private resize=()=>{const dpr=Math.min(devicePixelRatio||1,this.tier==="ultra"?2:1.5);this.canvas.width=Math.floor(innerWidth*dpr);this.canvas.height=Math.floor(innerHeight*dpr);this.ctx?.setTransform(dpr,0,0,dpr,0,0);};
 setQuality(t:"ultra"|"high"|"standard"){this.tier=t;this.resize();this.characters?.setQuality(t);}
 private draw=(time:number)=>{if(this.visible&&this.ctx){const ctx=this.ctx,w=innerWidth,h=innerHeight,t=(time-this.started)/1000;ctx.clearRect(0,0,w,h);const driftX=Math.sin(t*.11)*w*.05,driftY=Math.cos(t*.09)*h*.04;const g=ctx.createRadialGradient(w*.5+driftX,h*.34+driftY,0,w*.5,h*.42,Math.max(w,h)*.76);g.addColorStop(0,"rgba(232,199,126,.13)");g.addColorStop(.52,"rgba(124,147,201,.055)");g.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);if(this.tier!=="standard"){ctx.globalAlpha=this.tier==="ultra"?.16:.09;ctx.strokeStyle="rgba(255,255,255,.18)";const cx=w*.5,cy=h*.5,r=Math.min(w,h)*.35;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}}
 this.raf=requestAnimationFrame(this.draw);};
 dispose(){this.cleanup();}
}
