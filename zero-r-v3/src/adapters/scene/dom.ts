import type { ScenePort } from "../../ports/index.js";
import type { AppState, FutureObject, Route } from "../../domain/model.js";
export class DomSceneAdapter implements ScenePort {
 private scenes=new Map<Route,HTMLElement>(); private active:Route="home";
 constructor(){for(const el of document.querySelectorAll<HTMLElement>("[data-scene]")){this.scenes.set(el.dataset.scene as Route,el);}}
 activate(route:Route,_state:AppState){const prev=this.scenes.get(this.active);const next=this.scenes.get(route);if(!next)return; if(prev&&prev!==next){prev.dataset.active="false";prev.setAttribute("aria-hidden","true");prev.style.pointerEvents="none";} next.dataset.active="true";next.removeAttribute("aria-hidden");next.style.pointerEvents="auto";this.active=route;}
 prepare(_future:FutureObject){}
 setDrag(route:Route,value:number){const el=this.scenes.get(route);el?.style.setProperty("--drag",String(value));}
}
