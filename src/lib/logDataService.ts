import { LogEntry } from '../state/logStore';
import { FirestoreLogEntry } from '../lib/firebase';

/**
 * Service for converting between local LogEntry and Firebase FirestoreLogEntry formats
 */
export class LogDataService {
  /**
   * Convert a local LogEntry to Firebase format for saving
   */
  static toFirebaseFormat(localEntry: Omit<LogEntry, 'id' | 'synced'>): Omit<FirestoreLogEntry, 'id' | 'userId' | 'createdAtISO' | 'updatedAtISO'> {
    return {
      dateISO: localEntry.dateISO,
      calories: localEntry.calories,
      weightKg: localEntry.weightKg,
      notes: localEntry.notes,
    };
  }

  /**
   * Convert a Firebase FirestoreLogEntry to local format
   */
  static toLocalFormat(firebaseEntry: FirestoreLogEntry): LogEntry {
    return {
      id: firebaseEntry.id,
      dateISO: firebaseEntry.dateISO,
      calories: firebaseEntry.calories,
      weightKg: firebaseEntry.weightKg,
      notes: firebaseEntry.notes,
      createdAtISO: firebaseEntry.createdAtISO,
      updatedAtISO: firebaseEntry.updatedAtISO,
      synced: true, // Firebase entries are by definition synced
    };
  }

  /**
   * Convert multiple Firebase entries to local format
   */
  static arrayToLocalFormat(firebaseEntries: FirestoreLogEntry[]): LogEntry[] {
    return firebaseEntries.map(entry => this.toLocalFormat(entry));
  }

  /**
   * Check if a log entry needs to be synced
   */
  static needsSync(entry: LogEntry): boolean {
    return !entry.synced;
  }

  /**
   * Get all unsynced entries from a logs array
   */
  static getUnsyncedEntries(logs: LogEntry[]): LogEntry[] {
    return logs.filter(log => this.needsSync(log));
  }

  /**
   * Mark entries as synced
   */
  static markAsSynced(logs: LogEntry[], syncedIds: string[]): LogEntry[] {
    return logs.map(log => 
      syncedIds.includes(log.id) 
        ? { ...log, synced: true }
        : log
    );
  }
}