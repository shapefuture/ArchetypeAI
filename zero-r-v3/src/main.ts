import { INITIAL_STATE, type AppEvent } from "./domain/model.js";
import { PARTS, CHECK_IN_PROMPTS, CATEGORY_LABEL, CATEGORY_ANGLE, PARTS_BY_CATEGORY, averageSelfAccess, type PartCategory } from "./domain/content.js";
import { MemoryState, ExperienceCoordinator } from "./application/expression.js";
import { IndexedDbStorage } from "./adapters/storage/indexeddb.js";
import { StaticPrediction } from "./adapters/prediction/static.js";
import { MemoryFutureStore, EconomicScheduler } from "./adapters/runtime/static.js";
import { WasmCompute } from "./adapters/compute/wasm.js";
import { DomSceneAdapter } from "./adapters/scene/dom.js";
import { AmbientCanvasRenderer } from "./adapters/render/canvas.js";
import { FeltCharacters } from "./adapters/render/felt.js";
import { PerformanceTelemetry } from "./adapters/telemetry/performance.js";
import { QueuedHttpSync } from "./adapters/sync/http.js";
import { attachVerticalSwipe } from "./runtime/gesture.js";

const qs=<T extends Element>(s:string)=>document.querySelector<T>(s);
const state=new MemoryState(INITIAL_STATE); const storage=new IndexedDbStorage(); const predictor=new StaticPrediction(); const futures=new MemoryFutureStore(); const scheduler=new EconomicScheduler(); const scenes=new DomSceneAdapter(); const compute=new WasmCompute(); const telemetry=new PerformanceTelemetry(); const sync=new QueuedHttpSync(); const renderer=new AmbientCanvasRenderer(qs<HTMLCanvasElement>("#ambient")!); const characters=new FeltCharacters();
const coordinator=new ExperienceCoordinator(state,storage,predictor,futures,scheduler,scenes,compute,telemetry,sync);
const reflection=qs<HTMLTextAreaElement>(".reflection"); reflection?.addEventListener("input",()=>void storage.write("reflection",reflection.value)); void storage.read<string>("reflection","").then(v=>{if(reflection)reflection.value=v;});
telemetry.start();
renderer.characters=characters;
let quality:"ultra"|"high"|"standard"=telemetry.getTier();
function applyQuality(){quality=telemetry.getTier();renderer.setQuality(quality);document.documentElement.dataset.quality=quality;}
setInterval(applyQuality,750); applyQuality();
const byId=(id:string|null)=>id?PARTS.find(p=>p.id===id)??null:null;
/** The parts are built from the domain list, so the map can never drift out of sync with the data. */
function renderPartNodes(){const layer=qs<HTMLElement>('[data-bind="part-layer"]');if(!layer||layer.childElementCount)return;PARTS.forEach((part,i)=>{const el=document.createElement("button");el.type="button";el.className="part-node";el.dataset.part=part.id;el.dataset.category=part.category;el.style.setProperty("--delay",`${i*65}ms`);const glow=document.createElement("span");glow.className="part-node-glow";const core=document.createElement("span");core.className="part-node-core";const label=document.createElement("span");label.className="part-node-label";label.textContent=part.name;el.append(glow,core,label);layer.append(el);});}
function positionParts(){for(const part of PARTS){const group=PARTS_BY_CATEGORY[part.category];const i=group.findIndex(p=>p.id===part.id);const angle=CATEGORY_ANGLE[part.category]+(group.length<=1?0:(i/(group.length-1)-.5)*46);const radius=34+(1-part.activation)*22;const rad=angle*Math.PI/180;const el=qs<HTMLElement>(`[data-part="${part.id}"]`);el?.style.setProperty("left",`${50+radius*Math.cos(rad)}%`);el?.style.setProperty("top",`${50+radius*Math.sin(rad)}%`);el?.style.setProperty("--part-color",({manager:"#7C93C9",firefighter:"#D97D6B",exile:"#9B8AC4"} as Record<string,string>)[part.category]);el?.style.setProperty("--activation",String(part.activation));}}
function renderState(){const s=state.get();scenes.activate(s.route,s);qs<HTMLElement>('.self-access')!.textContent=`${Math.round(averageSelfAccess()*100)}% Self-access`; qs<HTMLElement>('#page-label')!.textContent=s.route==="home"?"Parts Map":s.route==="part"?"Part":s.route[0].toUpperCase()+s.route.slice(1); const selected=byId(s.selectedPartId); if(selected){const panel=qs<HTMLElement>('[data-scene="part"] .swipe-surface'); const accent=selected.category==="manager"?"#7C93C9":selected.category==="firefighter"?"#D97D6B":"#9B8AC4"; panel?.style.setProperty("--part-color",accent); panel?.querySelectorAll<HTMLElement>(".kicker").forEach(e=>e.style.color=accent);}qsAll('[data-bind="part-name"]').forEach(e=>e.textContent=selected?.name??"");qsAll('[data-bind="part-role"]').forEach(e=>e.textContent=selected?.role??"");qsAll('[data-bind="part-protects"]').forEach(e=>e.textContent=selected?.protects??"");qsAll('[data-bind="part-last"]').forEach(e=>e.textContent=selected?.lastCheckedIn??"");qsAll('[data-bind="part-notes"]').forEach(e=>e.replaceChildren(...(selected?.notes??[]).map(n=>{const li=document.createElement("li");li.textContent=n;return li;})));qsAll('[data-bind="part-category"]').forEach(e=>e.textContent=selected?CATEGORY_LABEL[selected.category]:"");if(selected)qsAll('[data-bind="checkin-prompt"]').forEach(e=>e.textContent=CHECK_IN_PROMPTS[selected.category][0]);qsAll('.nav-button').forEach(e=>e.classList.toggle('is-active',e.getAttribute('data-route')===s.route));const systemList=qs<HTMLElement>('[data-bind="system-list"]');if(systemList&&!systemList.childElementCount)systemList.replaceChildren(...(Object.keys(PARTS_BY_CATEGORY) as PartCategory[]).map(c=>{const li=document.createElement("li");const name=document.createElement("span");name.textContent=`${CATEGORY_LABEL[c]}s`;const count=document.createElement("span");count.className="quiet";count.textContent=String(PARTS_BY_CATEGORY[c].length);li.append(name,count);return li;}));syncFigures(s.route,selected);}
/** Characters: the map is sewn once, the shelf is rebuilt per visit, the hero is mounted per part. */
let familyMounted=false; let heroFor:string|null=null;
function syncFigures(route:string,selected:ReturnType<typeof byId>){const shelf=qs<HTMLElement>('[data-bind="felt-family"]');const figure=qs<HTMLElement>('[data-bind="part-figure"]');if(route==="system"){if(shelf&&!familyMounted){familyMounted=true;characters.mountFamily(shelf,PARTS);}}else familyMounted=false;if(route==="part"&&selected&&figure){if(heroFor!==selected.id){heroFor=selected.id;characters.mountDetail(figure,selected);}}else if(route!=="part"){heroFor=null;characters.unmountDetail();}}
function qsAll(s:string):HTMLElement[]{return Array.from(document.querySelectorAll<HTMLElement>(s));}
function dispatch(e:AppEvent){coordinator.dispatch(e).then(renderState);}
renderPartNodes();
for(const el of qsAll('[data-event]')){el.addEventListener('click',()=>{const type=el.dataset.event as AppEvent["type"];const id=el.dataset.id;dispatch(id?{type,id}:{type});});}
for(const el of qsAll('[data-part]')){el.addEventListener('click',()=>dispatch({type:"OPEN_PART",id:el.dataset.part!}));}
for(const el of qsAll('.nav-button')){el.addEventListener('click',()=>dispatch({type:el.dataset.route==="home"?"OPEN_HOME":el.dataset.route==="system"?"OPEN_SYSTEM":"OPEN_PROFILE"}));}
const backToPart=qs<HTMLElement>("#back-to-part"); backToPart?.addEventListener("click",()=>{const id=state.get().selectedPartId;if(id)dispatch({type:"OPEN_PART",id});});
const detail=qs<HTMLElement>('[data-scene="part"] .swipe-surface'); if(detail) attachVerticalSwipe({element:detail,onCommit:()=>dispatch({type:"CLOSE_PART"}),setProgress:v=>detail.style.setProperty("--drag-opacity",String(1-Math.abs(v)*.42))});
characters.onSelectPart=(id)=>dispatch({type:"OPEN_PART",id});
state.subscribe(renderState); positionParts(); renderState(); void coordinator.restore(INITIAL_STATE).then(renderState);
for(const part of PARTS){const el=qs<HTMLElement>(`[data-part="${part.id}"]`);if(el)characters.attachNode(el,part);}
const selfNode=qs<HTMLElement>(".self-node"); if(selfNode)characters.attachSelf(selfNode);
if("serviceWorker" in navigator) addEventListener("load",()=>void navigator.serviceWorker.register("/sw.js"),{once:true});
