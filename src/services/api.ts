import {
  CourseClass,
  Student,
  AttendanceStatus,
  ClassSummaryReport,
  StudentAttendanceSummary,
  ActiveSession,
  CheckInPayload,
  CheckInResult,
} from '../types/attendance';

export const api = {
  async getClasses(): Promise<CourseClass[]> {
    const res = await fetch('/api/classes');
    if (!res.ok) throw new Error('Failed to fetch classes');
    return res.json();
  },

  async getStudents(classId?: string): Promise<Student[]> {
    const url = classId ? `/api/students?class_id=${encodeURIComponent(classId)}` : '/api/students';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch students');
    return res.json();
  },

  async getClassSummary(classId: string, date: string): Promise<ClassSummaryReport> {
    const res = await fetch(`/api/attendance/class/${encodeURIComponent(classId)}?date=${encodeURIComponent(date)}`);
    if (!res.ok) throw new Error('Failed to fetch class summary');
    return res.json();
  },

  async getStudentAttendance(studentId: string): Promise<StudentAttendanceSummary> {
    const res = await fetch(`/api/attendance/${encodeURIComponent(studentId)}`);
    if (!res.ok) throw new Error('Failed to fetch student attendance');
    return res.json();
  },

  async logSingleAttendance(params: {
    student_id: string;
    class_id: string;
    date: string;
    status: AttendanceStatus;
    remarks?: string;
    verification_method?: 'Manual' | 'QR Code' | 'Self-Checkin';
  }) {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to log attendance');
    return res.json();
  },

  async submitBulkAttendance(params: {
    class_id: string;
    date: string;
    records: Array<{ student_id: string; status: AttendanceStatus; remarks?: string }>;
  }) {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to submit batch attendance');
    return res.json();
  },

  async startActiveSession(classId: string, durationMinutes: number = 10, geofenceRadius?: number): Promise<{ success: boolean; session: ActiveSession }> {
    const res = await fetch('/api/sessions/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_id: classId, duration_minutes: durationMinutes, geofence_radius: geofenceRadius }),
    });
    if (!res.ok) throw new Error('Failed to start session');
    return res.json();
  },

  async getActiveSession(classId: string): Promise<ActiveSession | null> {
    const res = await fetch(`/api/sessions/active/${encodeURIComponent(classId)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch active session');
    return res.json();
  },

  async endSession(classId: string): Promise<boolean> {
    const res = await fetch(`/api/sessions/end/${encodeURIComponent(classId)}`, {
      method: 'POST',
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.success;
  },

  async checkIn(payload: CheckInPayload): Promise<CheckInResult> {
    const res = await fetch('/api/sessions/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data;
  },

  async getOverviewStats() {
    const res = await fetch('/api/stats/overview');
    if (!res.ok) throw new Error('Failed to fetch overview stats');
    return res.json();
  },

  async resetDatabase() {
    const res = await fetch('/api/reset-data', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset database');
    return res.json();
  },
};
