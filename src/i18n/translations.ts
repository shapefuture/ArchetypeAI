/**
 * Translation keys adapter — all copy now lives in src/i18n/strings.ts (TRANSLATIONS).
 * This module re-exports the centralized dict for backward compatibility.
 */
import { TRANSLATIONS } from '../shared/i18n/strings';

export const translations = TRANSLATIONS;
