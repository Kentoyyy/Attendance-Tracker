import { Student, AttendanceRecord } from '../types';

// Offline storage keys
const STORAGE_KEYS = {
  STUDENTS: 'attendance_students',
  ATTENDANCE: 'attendance_records',
  PENDING_SYNC: 'attendance_pending_sync',
  LAST_SYNC: 'attendance_last_sync'
};

// Interface for pending sync operations
interface PendingSync {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  data: any;
  timestamp: number;
}

export class OfflineStorage {
  // Check if browser supports IndexedDB
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }

  // Initialize IndexedDB
  static async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AttendanceTracker', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('students')) {
          const studentStore = db.createObjectStore('students', { keyPath: '_id' });
          studentStore.createIndex('grade', 'grade', { unique: false });
        }

        if (!db.objectStoreNames.contains('attendance')) {
          const attendanceStore = db.createObjectStore('attendance', { keyPath: '_id' });
          attendanceStore.createIndex('studentId', 'studentId', { unique: false });
          attendanceStore.createIndex('date', 'date', { unique: false });
        }

        if (!db.objectStoreNames.contains('pendingSync')) {
          const syncStore = db.createObjectStore('pendingSync', { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Save students to offline storage
  static async saveStudents(students: Student[]): Promise<void> {
    if (!this.isSupported()) {
      // Fallback to localStorage
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
      return;
    }

    const db = await this.initDB();
    const transaction = db.transaction(['students'], 'readwrite');
    const store = transaction.objectStore('students');

    // Clear existing data
    await new Promise((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve(undefined);
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // Add new data
    for (const student of students) {
      await new Promise((resolve, reject) => {
        const addRequest = store.add(student);
        addRequest.onsuccess = () => resolve(undefined);
        addRequest.onerror = () => reject(addRequest.error);
      });
    }
  }

  // Get students from offline storage
  static async getStudents(grade?: number): Promise<Student[]> {
    if (!this.isSupported()) {
      // Fallback to localStorage
      const students = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
      return grade ? students.filter((s: Student) => s.grade === grade) : students;
    }

    const db = await this.initDB();
    const transaction = db.transaction(['students'], 'readonly');
    const store = transaction.objectStore('students');

    return new Promise((resolve, reject) => {
      const request = grade 
        ? store.index('grade').getAll(grade)
        : store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Save attendance records to offline storage
  static async saveAttendanceRecords(records: AttendanceRecord[]): Promise<void> {
    if (!this.isSupported()) {
      // Fallback to localStorage
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
      return;
    }

    const db = await this.initDB();
    const transaction = db.transaction(['attendance'], 'readwrite');
    const store = transaction.objectStore('attendance');

    for (const record of records) {
      await new Promise((resolve, reject) => {
        const request = store.put(record);
        request.onsuccess = () => resolve(undefined);
        request.onerror = () => reject(request.error);
      });
    }
  }

  // Get attendance records from offline storage
  static async getAttendanceRecords(studentId?: string, month?: string): Promise<AttendanceRecord[]> {
    if (!this.isSupported()) {
      // Fallback to localStorage
      const records = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || '[]');
      let filtered = records;

      if (studentId) {
        filtered = filtered.filter((r: AttendanceRecord) => r.studentId === studentId);
      }

      if (month) {
        filtered = filtered.filter((r: AttendanceRecord) => {
          const recordMonth = new Date(r.date).toISOString().slice(0, 7);
          return recordMonth === month;
        });
      }

      return filtered;
    }

    const db = await this.initDB();
    const transaction = db.transaction(['attendance'], 'readonly');
    const store = transaction.objectStore('attendance');

    return new Promise((resolve, reject) => {
      const request = studentId 
        ? store.index('studentId').getAll(studentId)
        : store.getAll();

      request.onsuccess = () => {
        let records = request.result;
        
        if (month) {
          records = records.filter((r: AttendanceRecord) => {
            const recordMonth = new Date(r.date).toISOString().slice(0, 7);
            return recordMonth === month;
          });
        }

        resolve(records);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Add pending sync operation
  static async addPendingSync(operation: Omit<PendingSync, 'id' | 'timestamp'>): Promise<void> {
    const pendingSync: PendingSync = {
      ...operation,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now()
    };

    if (!this.isSupported()) {
      // Fallback to localStorage
      const pending = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_SYNC) || '[]');
      pending.push(pendingSync);
      localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(pending));
      return;
    }

    const db = await this.initDB();
    const transaction = db.transaction(['pendingSync'], 'readwrite');
    const store = transaction.objectStore('pendingSync');

    await new Promise((resolve, reject) => {
      const request = store.add(pendingSync);
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
  }

  // Get pending sync operations
  static async getPendingSync(): Promise<PendingSync[]> {
    if (!this.isSupported()) {
      // Fallback to localStorage
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_SYNC) || '[]');
    }

    const db = await this.initDB();
    const transaction = db.transaction(['pendingSync'], 'readonly');
    const store = transaction.objectStore('pendingSync');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Remove pending sync operation
  static async removePendingSync(id: string): Promise<void> {
    if (!this.isSupported()) {
      // Fallback to localStorage
      const pending = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_SYNC) || '[]');
      const filtered = pending.filter((p: PendingSync) => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(filtered));
      return;
    }

    const db = await this.initDB();
    const transaction = db.transaction(['pendingSync'], 'readwrite');
    const store = transaction.objectStore('pendingSync');

    await new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
  }

  // Check if online
  static isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine;
  }

  // Sync pending operations when online
  static async syncPendingOperations(): Promise<void> {
    if (!this.isOnline()) return;

    const pending = await this.getPendingSync();
    
    for (const operation of pending) {
      try {
        const response = await fetch(operation.endpoint, {
          method: operation.type === 'DELETE' ? 'DELETE' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: operation.type !== 'DELETE' ? JSON.stringify(operation.data) : undefined,
        });

        if (response.ok) {
          await this.removePendingSync(operation.id);
        }
      } catch (error) {
        console.error('Failed to sync operation:', operation, error);
      }
    }
  }

  // Export data for backup
  static async exportData(): Promise<string> {
    const students = await this.getStudents();
    const attendance = await this.getAttendanceRecords();
    
    const exportData = {
      students,
      attendance,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Import data from backup
  static async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.students) {
        await this.saveStudents(data.students);
      }
      
      if (data.attendance) {
        await this.saveAttendanceRecords(data.attendance);
      }
    } catch (error) {
      throw new Error('Invalid backup data format');
    }
  }
} 