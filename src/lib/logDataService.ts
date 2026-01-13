import { LogEntry } from '../state/logStore';
import { FirestoreLogEntry } from '../lib/firebase';

export class LogDataService {
  static toFirebaseFormat(localEntry: Omit<LogEntry, 'id' | 'synced'>): Omit<FirestoreLogEntry, 'id' | 'userId' | 'createdAtISO' | 'updatedAtISO'> {
    return {
      dateISO: localEntry.dateISO,
      calories: localEntry.calories,
      weightKg: localEntry.weightKg,
      notes: localEntry.notes,
    };
  }

  static toLocalFormat(firebaseEntry: FirestoreLogEntry): LogEntry {
    return {
      id: firebaseEntry.id,
      dateISO: firebaseEntry.dateISO,
      calories: firebaseEntry.calories,
      weightKg: firebaseEntry.weightKg,
      notes: firebaseEntry.notes,
      createdAtISO: firebaseEntry.createdAtISO,
      updatedAtISO: firebaseEntry.updatedAtISO,
      synced: true,
    };
  }

  static arrayToLocalFormat(firebaseEntries: FirestoreLogEntry[]): LogEntry[] {
    return firebaseEntries.map(entry => this.toLocalFormat(entry));
  }

  static needsSync(entry: LogEntry): boolean {
    return !entry.synced;
  }

  static getUnsyncedEntries(logs: LogEntry[]): LogEntry[] {
    return logs.filter(log => this.needsSync(log));
  }

  static markAsSynced(logs: LogEntry[], syncedIds: string[]): LogEntry[] {
    return logs.map(log =>
      syncedIds.includes(log.id)
        ? { ...log, synced: true }
        : log
    );
  }
}
