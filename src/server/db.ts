import {
  CourseClass,
  Student,
  AttendanceRecord,
  ActiveSession,
  CheckInPayload,
  CheckInResult,
  ClassSummaryReport,
  StudentAttendanceSummary,
  AttendanceStatus,
} from '../types/attendance';
import {
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  generateInitialAttendanceRecords,
} from '../data/mockData';

// Haversine formula to compute great-circle distance between two GPS coordinates in meters
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Generate dynamic rotating token based on timestamp slot (every 15 seconds)
export function generateDynamicToken(classId: string, timestamp: number = Date.now()): string {
  const slot = Math.floor(timestamp / (15 * 1000));
  const raw = `${classId}:${slot}:CAMPUS_ATTEND_SALT_99`;
  // Simple deterministic 8-character alphanumeric hash for QR readability
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  const code = Math.abs(hash).toString(36).toUpperCase().padStart(6, '0');
  return `CA-${code}-${slot % 1000}`;
}

class AttendanceDatabase {
  private classes: CourseClass[] = [];
  private students: Student[] = [];
  private attendanceRecords: AttendanceRecord[] = [];
  private activeSessions: Map<string, ActiveSession> = new Map();

  constructor() {
    this.resetData();
  }

  public resetData() {
    this.classes = JSON.parse(JSON.stringify(INITIAL_CLASSES));
    this.students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
    this.attendanceRecords = generateInitialAttendanceRecords();
    this.activeSessions.clear();

    // Default pre-start one active check-in session for CS 101 to let testers immediately test QR check-in
    this.startSession('cls_cs101', 15, 100);
  }

  // --- Classes ---
  public getAllClasses(): CourseClass[] {
    return this.classes;
  }

  public getClassById(classId: string): CourseClass | undefined {
    return this.classes.find((c) => c.class_id === classId);
  }

  // --- Students ---
  public getAllStudents(classId?: string): Student[] {
    if (!classId) return this.students;
    return this.students.filter((s) => s.class_ids.includes(classId));
  }

  public getStudentById(studentId: string): Student | undefined {
    return this.students.find((s) => s.student_id === studentId);
  }

  // --- Attendance ---
  public getAttendance(filter?: {
    studentId?: string;
    classId?: string;
    date?: string;
  }): AttendanceRecord[] {
    return this.attendanceRecords.filter((rec) => {
      if (filter?.studentId && rec.student_id !== filter.studentId) return false;
      if (filter?.classId && rec.class_id !== filter.classId) return false;
      if (filter?.date && rec.date !== filter.date) return false;
      return true;
    });
  }

  public logAttendance(data: {
    student_id: string;
    class_id: string;
    date: string;
    status: AttendanceStatus;
    verification_method?: AttendanceRecord['verification_method'];
    remarks?: string;
  }): AttendanceRecord {
    const existingIndex = this.attendanceRecords.findIndex(
      (r) => r.student_id === data.student_id && r.class_id === data.class_id && r.date === data.date
    );

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const record: AttendanceRecord = {
      record_id: existingIndex >= 0 ? this.attendanceRecords[existingIndex].record_id : `rec_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      student_id: data.student_id,
      class_id: data.class_id,
      date: data.date,
      time: timeStr,
      status: data.status,
      verification_method: data.verification_method || 'Manual',
      remarks: data.remarks,
      location_verified: data.verification_method === 'QR Code' || data.verification_method === 'Geofence',
    };

    if (existingIndex >= 0) {
      this.attendanceRecords[existingIndex] = record;
    } else {
      this.attendanceRecords.push(record);
    }

    return record;
  }

  public batchUpdateAttendance(
    classId: string,
    date: string,
    records: Array<{ student_id: string; status: AttendanceStatus; remarks?: string }>
  ): AttendanceRecord[] {
    const updated: AttendanceRecord[] = [];
    for (const item of records) {
      const rec = this.logAttendance({
        student_id: item.student_id,
        class_id: classId,
        date,
        status: item.status,
        remarks: item.remarks,
        verification_method: 'Manual',
      });
      updated.push(rec);
    }
    return updated;
  }

  // --- Summary Reports ---
  public getClassSummaryReport(classId: string, date: string): ClassSummaryReport | null {
    const cls = this.getClassById(classId);
    if (!cls) return null;

    const enrolledStudents = this.getAllStudents(classId);
    const dateRecords = this.getAttendance({ classId, date });

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;

    const recordsCombined = enrolledStudents.map((student) => {
      const record = dateRecords.find((r) => r.student_id === student.student_id) || null;
      if (record) {
        if (record.status === 'Present') presentCount++;
        else if (record.status === 'Absent') absentCount++;
        else if (record.status === 'Late') lateCount++;
        else if (record.status === 'Excused') excusedCount++;
      } else {
        // Unmarked defaults to absent in summary or unrecorded
        absentCount++;
      }
      return { student, record };
    });

    const totalEnrolled = enrolledStudents.length;
    const presentPercentage = totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0;

    return {
      class_id: cls.class_id,
      class_name: cls.class_name,
      course_code: cls.course_code,
      date,
      total_enrolled: totalEnrolled,
      present_count: presentCount,
      absent_count: absentCount,
      late_count: lateCount,
      excused_count: excusedCount,
      present_percentage: presentPercentage,
      records: recordsCombined,
    };
  }

  public getStudentAttendanceSummary(studentId: string): StudentAttendanceSummary | null {
    const student = this.getStudentById(studentId);
    if (!student) return null;

    const studentRecords = this.getAttendance({ studentId });
    const enrolledClasses = this.classes.filter((c) => student.class_ids.includes(c.class_id));

    let totalSessions = 0;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;

    const courseBreakdown = enrolledClasses.map((cls) => {
      const classRecs = studentRecords.filter((r) => r.class_id === cls.class_id);
      let cPresent = 0;
      let cLate = 0;
      let cAbsent = 0;
      let cExcused = 0;

      for (const r of classRecs) {
        if (r.status === 'Present') cPresent++;
        else if (r.status === 'Late') cLate++;
        else if (r.status === 'Absent') cAbsent++;
        else if (r.status === 'Excused') cExcused++;
      }

      const total = classRecs.length;
      // Late counts as 0.75 or standard present for partial calculation
      const percentage = total > 0 ? Math.round(((cPresent + cLate * 0.5) / total) * 100) : 100;

      totalSessions += total;
      presentCount += cPresent;
      lateCount += cLate;
      absentCount += cAbsent;
      excusedCount += cExcused;

      return {
        class_id: cls.class_id,
        class_name: cls.class_name,
        course_code: cls.course_code,
        total,
        present: cPresent,
        late: cLate,
        absent: cAbsent,
        excused: cExcused,
        percentage,
      };
    });

    const overallPercentage =
      totalSessions > 0 ? Math.round(((presentCount + lateCount * 0.5) / totalSessions) * 100) : 100;

    return {
      student,
      total_sessions: totalSessions,
      present_count: presentCount,
      absent_count: absentCount,
      late_count: lateCount,
      excused_count: excusedCount,
      overall_percentage: overallPercentage,
      is_at_risk: overallPercentage < 75,
      course_breakdown: courseBreakdown,
      recent_records: studentRecords
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 15),
    };
  }

  // --- Active QR Check-in Sessions & Verification ---
  public startSession(classId: string, durationMinutes: number = 10, geofenceRadius?: number): ActiveSession {
    const cls = this.getClassById(classId);
    if (!cls) throw new Error(`Class ${classId} not found`);

    const now = Date.now();
    const expiresAt = now + durationMinutes * 60 * 1000;
    const token = generateDynamicToken(classId, now);

    const session: ActiveSession = {
      session_id: `ses_${classId}_${now}`,
      class_id: classId,
      token,
      token_issued_at: now,
      token_rotation_interval_seconds: 15,
      started_at: now,
      expires_at: expiresAt,
      duration_minutes: durationMinutes,
      is_active: true,
      allowed_lat: cls.latitude,
      allowed_lng: cls.longitude,
      geofence_radius_meters: geofenceRadius || cls.geofence_radius_meters,
    };

    this.activeSessions.set(classId, session);
    return session;
  }

  public getActiveSession(classId: string): ActiveSession | null {
    const session = this.activeSessions.get(classId);
    if (!session) return null;

    const now = Date.now();
    if (now > session.expires_at) {
      session.is_active = false;
      return session;
    }

    // Update dynamic rotating token if 15s window rolled over
    const currentToken = generateDynamicToken(classId, now);
    session.token = currentToken;
    session.token_issued_at = now;
    return session;
  }

  public endSession(classId: string): boolean {
    const session = this.activeSessions.get(classId);
    if (session) {
      session.is_active = false;
      return true;
    }
    return false;
  }

  // Verification & Automation Pipeline: Dynamic QR + Geofence + Timed Access Window
  public processCheckIn(payload: CheckInPayload): CheckInResult {
    const { student_id, class_id, token, user_lat, user_lng } = payload;

    const student = this.getStudentById(student_id);
    if (!student) {
      return { success: false, message: 'Student ID not recognized in directory.', error_type: 'STUDENT_NOT_FOUND' };
    }

    if (!student.class_ids.includes(class_id)) {
      return { success: false, message: 'Student is not enrolled in this course.' };
    }

    const session = this.activeSessions.get(class_id);
    const now = Date.now();

    // 1. Timed Access Window check
    if (!session || !session.is_active || now > session.expires_at) {
      return {
        success: false,
        message: 'The check-in window for this class is closed or has expired.',
        error_type: 'SESSION_EXPIRED',
      };
    }

    // 2. Dynamic Rotating Token validation (checks current slot or previous 15s slot to allow latency grace)
    const currentToken = generateDynamicToken(class_id, now);
    const previousToken = generateDynamicToken(class_id, now - 15000);

    if (token !== currentToken && token !== previousToken && token !== session.token) {
      return {
        success: false,
        message: 'Invalid or expired QR token. QR codes refresh every 15s to prevent proxy attendance.',
        error_type: 'INVALID_TOKEN',
      };
    }

    // 3. Geofence Boundary check
    const distanceMeters = calculateHaversineDistanceMeters(
      user_lat,
      user_lng,
      session.allowed_lat,
      session.allowed_lng
    );

    if (distanceMeters > session.geofence_radius_meters) {
      return {
        success: false,
        message: `Geofence violation: You are ${distanceMeters}m away from the classroom boundary (maximum allowed radius: ${session.geofence_radius_meters}m). Check-in must occur on campus.`,
        distance_meters: distanceMeters,
        error_type: 'OUT_OF_BOUNDS',
      };
    }

    // Today's date YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    // Determine status (if checked in within first 7 mins -> Present, otherwise Late)
    const elapsedMinutes = (now - session.started_at) / (60 * 1000);
    const status: AttendanceStatus = elapsedMinutes > 7 ? 'Late' : 'Present';

    const record = this.logAttendance({
      student_id,
      class_id,
      date: today,
      status,
      verification_method: 'QR Code',
      remarks: `Self-checkin verified via Dynamic QR + Geofence (${distanceMeters}m from room center)`,
    });

    record.distance_meters = distanceMeters;
    record.location_verified = true;

    return {
      success: true,
      message: `Attendance confirmed! Marked as ${status} at ${record.time}. Verified ${distanceMeters}m from classroom center.`,
      record,
      distance_meters: distanceMeters,
    };
  }

  // --- High Level Analytics ---
  public getSystemStats() {
    const totalRecords = this.attendanceRecords.length;
    const presentRecords = this.attendanceRecords.filter((r) => r.status === 'Present').length;
    const lateRecords = this.attendanceRecords.filter((r) => r.status === 'Late').length;
    const absentRecords = this.attendanceRecords.filter((r) => r.status === 'Absent').length;

    const overallRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

    const atRiskStudents = this.students.filter((student) => {
      const summary = this.getStudentAttendanceSummary(student.student_id);
      return summary?.is_at_risk;
    });

    return {
      total_students: this.students.length,
      total_classes: this.classes.length,
      total_attendance_records: totalRecords,
      overall_attendance_rate: overallRate,
      present_count: presentRecords,
      late_count: lateRecords,
      absent_count: absentRecords,
      at_risk_students_count: atRiskStudents.length,
      active_sessions_count: Array.from(this.activeSessions.values()).filter(
        (s) => s.is_active && Date.now() < s.expires_at
      ).length,
    };
  }
}

export const db = new AttendanceDatabase();
