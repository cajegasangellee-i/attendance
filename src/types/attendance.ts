export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export type VerificationMethod = 'Manual' | 'QR Code' | 'Self-Checkin' | 'Geofence';

export interface Student {
  student_id: string;
  name: string;
  email: string;
  enrollment_number: string;
  class_ids: string[];
  avatar_url?: string;
  department: string;
}

export interface CourseClass {
  class_id: string;
  course_code: string;
  class_name: string;
  teacher_id: string;
  teacher_name: string;
  room: string;
  schedule_time: string; // e.g., "Mon, Wed 10:00 AM - 11:30 AM"
  total_students: number;
  latitude: number;
  longitude: number;
  geofence_radius_meters: number;
}

export interface AttendanceRecord {
  record_id: string;
  student_id: string;
  class_id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm:ss
  status: AttendanceStatus;
  verification_method: VerificationMethod;
  remarks?: string;
  location_verified?: boolean;
  distance_meters?: number;
}

export interface ActiveSession {
  session_id: string;
  class_id: string;
  token: string; // current dynamic rotating token
  token_issued_at: number; // timestamp ms
  token_rotation_interval_seconds: number; // e.g. 15 seconds
  started_at: number; // timestamp ms
  expires_at: number; // timestamp ms
  duration_minutes: number;
  is_active: boolean;
  allowed_lat: number;
  allowed_lng: number;
  geofence_radius_meters: number;
}

export interface CheckInPayload {
  student_id: string;
  class_id: string;
  token: string;
  user_lat: number;
  user_lng: number;
  device_info?: string;
}

export interface CheckInResult {
  success: boolean;
  message: string;
  record?: AttendanceRecord;
  distance_meters?: number;
  error_type?: 'SESSION_EXPIRED' | 'INVALID_TOKEN' | 'OUT_OF_BOUNDS' | 'ALREADY_RECORDED' | 'STUDENT_NOT_FOUND';
}

export interface ClassSummaryReport {
  class_id: string;
  class_name: string;
  course_code: string;
  date: string;
  total_enrolled: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  present_percentage: number;
  records: Array<{
    student: Student;
    record: AttendanceRecord | null;
  }>;
}

export interface StudentAttendanceSummary {
  student: Student;
  total_sessions: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  overall_percentage: number;
  is_at_risk: boolean; // < 75%
  course_breakdown: Array<{
    class_id: string;
    class_name: string;
    course_code: string;
    total: number;
    present: number;
    late: number;
    absent: number;
    excused: number;
    percentage: number;
  }>;
  recent_records: AttendanceRecord[];
}
