import type { PredictionPort } from "../../ports/index.js";
import type { AppState, FutureCandidate } from "../../domain/model.js";
import { ROUTE_GRAPH } from "../../domain/content.js";
const PERSONAL:Record<string,Record<string,number>>={home:{"part:planner":.38,system:.28,"part:urgent":.18,profile:.16},part:{checkin:.56,home:.28,system:.16},checkin:{home:.65,part:.35},system:{"part:planner":.4,"part:young":.25,home:.35},profile:{home:.7,system:.3}};
export class StaticPrediction implements PredictionPort { async predict(state:AppState){ const route=state.route; const graph=ROUTE_GRAPH[route]??ROUTE_GRAPH.home; const p=PERSONAL[route]??{}; return graph.map((key,i)=>({key,probability:p[key]??1/graph.length,cost:1+((i%3)*.5),latencySavedMs:18+(i===0?14:0),depth:1,reason:p[key]?"local prior":"fallback graph"})).sort((a,b)=>b.probability-a.probability); } }
