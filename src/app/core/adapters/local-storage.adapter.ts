import { StoragePort, AssessmentData, SynastryConnectionData, SynastrySavedReportData } from '../ports/storage.port';
import { Injectable } from '@angular/core';
import { SynastryReport } from '../data/synastry';

const RESPONSES_KEY = 'ARCHETYPE_ASSESSMENT_RESPONSES';
const BACKUP_KEY = 'ARCHETYPE_COMPLETED_BACKUP';

// Local-only fallbacks for synastry (graceful degradation when cloud is unavailable)
const SYNASTRY_CONNECTIONS_KEY = 'ARCHETYPE_SYNASTRY_CONNECTIONS';
const SYNASTRY_REPORTS_KEY = 'ARCHETYPE_SYNASTRY_REPORTS';

@Injectable({ providedIn: 'root' })
export class LocalStorageAdapter implements StoragePort {

  async saveAssessment(userId: string, data: AssessmentData): Promise<void> {
    try {
      const backup = {
        app: 'ArchetypeAI',
        version: 1,
        timestamp: data.updatedAt,
        dimensionalExpressions: data.dimensionalExpressions,
        assessmentResponses: data.responses,
        results: data.results,
      };
      localStorage.setItem(RESPONSES_KEY, JSON.stringify(data.responses));
      localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
    } catch { /* storage unavailable */ }
  }

  async loadAssessment(userId: string): Promise<AssessmentData | null> {
    try {
      const backupStr = localStorage.getItem(BACKUP_KEY);
      if (!backupStr) {
        const responsesStr = localStorage.getItem(RESPONSES_KEY);
        if (responsesStr) {
          const responses = JSON.parse(responsesStr);
          return { responses, dimensionalExpressions: {} as any, results: null, scoringMethod: 'deterministic', updatedAt: new Date().toISOString() };
        }
        return null;
      }
      const backup = JSON.parse(backupStr);
      return {
        responses: backup.assessmentResponses || [],
        dimensionalExpressions: backup.dimensionalExpressions || {},
        results: backup.results || null,
        scoringMethod: 'deterministic',
        updatedAt: backup.timestamp || new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }

  async saveToHistory(userId: string, data: AssessmentData): Promise<string> {
    // localStorage doesn't support history — just update the main backup
    await this.saveAssessment(userId, data);
    return Date.now().toString(36);
  }

  async loadHistory(userId: string): Promise<AssessmentData[]> {
    // localStorage doesn't support history
    const current = await this.loadAssessment(userId);
    return current ? [current] : [];
  }

  async createShareCode(userId: string): Promise<string> {
    // Not supported in localStorage
    throw new Error('Share codes require cloud storage');
  }

  async loadShared(shareCode: string): Promise<AssessmentData | null> {
    // Not supported in localStorage
    return null;
  }

  async loadSharedWithUid(shareCode: string): Promise<{ uid: string; data: AssessmentData } | null> {
    // Not supported in localStorage
    return null;
  }

  async saveSynastryConnection(userId: string, partnerUid: string, shareCodeUsed: string | null = null): Promise<string> {
    try {
      const raw = localStorage.getItem(SYNASTRY_CONNECTIONS_KEY);
      const parsed = (raw ? JSON.parse(raw) : {}) as Record<string, SynastryConnectionData>;

      parsed[partnerUid] = {
        partnerUid,
        shareCodeUsed: shareCodeUsed || null,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(SYNASTRY_CONNECTIONS_KEY, JSON.stringify(parsed));
    } catch { /* storage unavailable */ }

    // Keep stable “connectionId === partnerUid” behavior consistent with Firebase adapter.
    return partnerUid;
  }

  async saveSynastryReport(
    userId: string,
    connectionId: string,
    partnerUid: string,
    report: SynastryReport,
    narrative: string | null = null,
  ): Promise<void> {
    try {
      const raw = localStorage.getItem(SYNASTRY_REPORTS_KEY);
      const parsed = (raw ? JSON.parse(raw) : {}) as Record<string, SynastrySavedReportData>;

      parsed[connectionId] = {
        partnerUid,
        report,
        narrative: narrative || null,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(SYNASTRY_REPORTS_KEY, JSON.stringify(parsed));
    } catch { /* storage unavailable */ }
  }

  async listSynastryReports(userId: string): Promise<SynastrySavedReportData[]> {
    try {
      const raw = localStorage.getItem(SYNASTRY_REPORTS_KEY);
      const parsed = (raw ? JSON.parse(raw) : {}) as Record<string, SynastrySavedReportData>;
      return Object.values(parsed).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    } catch {
      return [];
    }
  }
}