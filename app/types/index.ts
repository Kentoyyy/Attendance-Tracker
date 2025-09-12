export interface Student {
    id?: string;
    _id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    grade?: number;
    gender?: 'Male' | 'Female';
    photoUrl?: string;
    attendance?: AttendanceRecord[];
  }
  
  export interface AttendanceRecord {
    _id: string;
    studentId: string;
    date: string; // Using ISO string for dates (e.g., "2023-10-27T00:00:00.000Z")
    reason?: string;
    isAbsent: boolean;
  }