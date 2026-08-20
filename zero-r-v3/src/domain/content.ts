import type { PartCategory, Route } from "./model.js";
export type { PartCategory } from "./model.js";
export interface Part { id:string; name:string; category:PartCategory; activation:number; role:string; protects:string; lastCheckedIn:string; notes:string[]; }
export const CATEGORY_LABEL: Record<PartCategory,string> = {manager:"Manager",firefighter:"Firefighter",exile:"Exile"};
export const CATEGORY_ANGLE: Record<PartCategory,number> = {manager:-110,firefighter:10,exile:130};
export const PARTS: Part[] = [
{id:"planner",name:"The Planner",category:"manager",activation:.78,role:"Keeps life moving by anticipating what could go wrong and preparing for it.",protects:"uncertainty and exposure",lastCheckedIn:"Today",notes:["Likes clear plans.","Often arrives before anyone asks."]},
{id:"achiever",name:"The Achiever",category:"manager",activation:.64,role:"Turns possibility into action, momentum, and measurable progress.",protects:"stagnation and disappointment",lastCheckedIn:"Yesterday",notes:["Responds well to meaningful goals.","Can confuse progress with safety."]},
{id:"critic",name:"The Critic",category:"manager",activation:.47,role:"Scans for errors and tries to keep you ahead of judgment.",protects:"shame and social exposure",lastCheckedIn:"3 days ago",notes:["Often speaks in absolutes.","Usually wants to prevent a repeat of something painful."]},
{id:"numb",name:"The Numb One",category:"firefighter",activation:.36,role:"Turns the volume down when feeling everything would be too much.",protects:"overwhelm",lastCheckedIn:"5 days ago",notes:["Needs gentleness rather than pressure."]},
{id:"urgent",name:"The Urgent One",category:"firefighter",activation:.58,role:"Moves quickly toward immediate relief when pressure spikes.",protects:"emotional overload",lastCheckedIn:"Today",notes:["Prefers action to uncertainty.","Can settle once it feels heard."]},
{id:"young",name:"The Young One",category:"exile",activation:.24,role:"Carries tender needs for belonging, reassurance, and being chosen.",protects:"old loneliness",lastCheckedIn:"8 days ago",notes:["Shows up quietly.","Responds to curiosity and warmth."]},
{id:"unseen",name:"The Unseen One",category:"exile",activation:.18,role:"Holds experiences that once felt too difficult to make sense of.",protects:"the fear of being too much",lastCheckedIn:"12 days ago",notes:["Does not need fixing before it can be witnessed."]}
];
export const CHECK_IN_PROMPTS: Record<PartCategory,string[]>={manager:["What is this part trying to make sure never happens?"],firefighter:["What would help this part feel 5% safer right now?"],exile:["What does this part wish someone had understood then?"]};
export const ROUTE_GRAPH: Record<Route,string[]>={home:["system","part:planner","part:urgent","profile"],system:["part:planner","part:young","home"],profile:["home","system"],part:["checkin","home","system"],checkin:["home","part"]};
export const PARTS_BY_CATEGORY = Object.fromEntries((Object.keys(CATEGORY_LABEL) as PartCategory[]).map(c=>[c,PARTS.filter(p=>p.category===c)])) as Record<PartCategory,Part[]>;
export function averageSelfAccess(){ return PARTS.reduce((s,p)=>s+(1-p.activation*.6),0)/PARTS.length; }
