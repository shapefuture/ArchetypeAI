import { COMPLEXES, EXILES, NEED, PROTECTORS, RESOURCES, SELF_QUALITIES, SHADOW_PARTS } from '../../shared/core/data/parts';
import type { ScoredProfile } from '../../shared/core/data/scoring-v2';

export const record = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const bounded = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const tier = (v: unknown) => ['dominant', 'prominent', 'present', 'dormant'].includes(String(v));
const complex = (v: any) => record(v) && Object.hasOwn(COMPLEXES, v.id) && bounded(v.activation, 0, 100) && ['latent', 'active', 'gripping'].includes(v.tier);

/** Complete rendering contract, stronger than the smaller synastry aggregate contract. */
export function validClinicalScore(v: unknown): v is ScoredProfile {
  if (!record(v) || !record(v.parts) || !record(v.resources) || !record(v.subtypes) || !record(v.complexes)) return false;
  return SHADOW_PARTS.every((id) => record(v.parts[id]) && v.parts[id].id === id && bounded(v.parts[id].T, 20, 80) && tier(v.parts[id].tier)
      && record(v.subtypes[id]) && typeof v.subtypes[id].name === 'string' && typeof v.subtypes[id].slug === 'string')
    && RESOURCES.every((id) => record(v.resources[id]) && v.resources[id].id === id && bounded(v.resources[id].T, 20, 80) && tier(v.resources[id].tier) && ['hypo', 'healthy', 'hyper'].includes(v.resources[id].band))
    && record(v.strongestResource) && RESOURCES.includes(v.strongestResource.id) && bounded(v.strongestResource.T, 20, 80)
    && bounded(v.selfEnergy, 0, 100) && bounded(v.burden, 0, 100) && record(v.selfRadar) && SELF_QUALITIES.every((id) => bounded(v.selfRadar[id], 20, 80))
    && record(v.headline) && PROTECTORS.includes(v.headline.protector) && EXILES.includes(v.headline.exile)
    && typeof v.headline.name === 'string' && typeof v.headline.essay === 'string'
    && Array.isArray(v.resourceLeaks) && v.resourceLeaks.every((item: any) => record(item) && RESOURCES.includes(item.resource) && PROTECTORS.includes(item.spillPart))
    && Array.isArray(v.polarizations) && v.polarizations.every((item: any) => record(item) && typeof item.name === 'string' && Array.isArray(item.pair) && item.pair.length === 2 && item.pair.every((id: any) => PROTECTORS.includes(id)))
    && record(v.attachment) && ['anxious', 'avoidant', 'secure'].every((id) => bounded(v.attachment[id], 0, 100)) && typeof v.attachment.disorganized === 'boolean'
    && Object.keys(COMPLEXES).every((id) => complex(v.complexes[id])) && Array.isArray(v.activeComplexes) && v.activeComplexes.every(complex)
    && record(v.needHunger) && [...new Set(Object.values(NEED))].every((id) => bounded(v.needHunger[id], -100, 100))
    && (!v.topHunger || record(v.topHunger) && Object.values(NEED).includes(v.topHunger.need) && bounded(v.topHunger.hunger, -100, 100))
    && record(v.copingStack) && PROTECTORS.includes(v.copingStack.l1) && [v.copingStack.l2, v.copingStack.l3].every((id) => !id || PROTECTORS.includes(id)) && EXILES.includes(v.copingStack.floor)
    && record(v.validity) && typeof v.validity.ok === 'boolean' && Array.isArray(v.validity.flags) && v.validity.flags.every((s: unknown) => typeof s === 'string') && typeof v.crisis === 'boolean';
}

const FAMILIES = ['manager', 'firefighter', 'exile', 'resource'];

export function validProfile(v: unknown): boolean {
  return record(v) && Array.isArray(v.parts) && v.parts.every((part: unknown) => record(part) && FAMILIES.includes(part.family as string))
    && typeof v.headlineConstellation === 'string' && record(v.selfEnergyRadar)
    && record(v.needHunger) && Array.isArray(v.polarizations) && Array.isArray(v.copingStack) && Array.isArray(v.complexes)
    && (v.testModel !== 'angular-v2' || validClinicalScore(v.clinical));
}
