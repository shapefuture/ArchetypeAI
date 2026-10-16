import { InjectionToken } from '@angular/core';
import type { DimensionalExpressions } from '../../../services/universe-state.service';
import { SynastryReport } from '../../../shared/core/data/synastry';

export interface AssessmentData {
  responses: number[];
  dimensionalExpressions: DimensionalExpressions;
  results: { analysis: string; pantheon: any[]; dynamics?: any[] } | null;
  scoringMethod: 'deterministic' | 'fallback';
  updatedAt: string;
}

export interface SynastryConnectionData {
  partnerUid: string;
  shareCodeUsed: string | null;
  updatedAt: string;
}

export interface SynastrySavedReportData {
  partnerUid: string;
  report: SynastryReport;
  narrative: string | null;
  updatedAt: string;
}

export interface StoragePort {
  saveAssessment(userId: string, data: AssessmentData): Promise<void>;
  loadAssessment(userId: string): Promise<AssessmentData | null>;
  saveToHistory(userId: string, data: AssessmentData): Promise<string>;
  loadHistory(userId: string): Promise<AssessmentData[]>;
  createShareCode(userId: string): Promise<string>;

  loadShared(shareCode: string): Promise<AssessmentData | null>;
  loadSharedWithUid(shareCode: string): Promise<{ uid: string; data: AssessmentData } | null>;

  saveSynastryConnection(userId: string, partnerUid: string, shareCodeUsed?: string | null): Promise<string>;
  saveSynastryReport(userId: string, connectionId: string, partnerUid: string, report: SynastryReport, narrative?: string | null): Promise<void>;
  listSynastryReports(userId: string): Promise<SynastrySavedReportData[]>;
}

export const STORAGE_PORT = new InjectionToken<StoragePort>('STORAGE_PORT');
