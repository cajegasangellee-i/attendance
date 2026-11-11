import { CourseClass, Student, AttendanceRecord } from '../types/attendance';

export const INITIAL_CLASSES: CourseClass[] = [
  {
    class_id: 'cls_cs101',
    course_code: 'CS 101',
    class_name: 'Introduction to Computer Science',
    teacher_id: 'tch_01',
    teacher_name: 'Dr. Sarah Turing',
    room: 'Ada Lovelace Hall 302',
    schedule_time: 'Mon, Wed 10:00 AM - 11:30 AM',
    total_students: 12,
    latitude: 37.774929,
    longitude: -122.419416,
    geofence_radius_meters: 100, // 100m radius around classroom
  },
  {
    class_id: 'cls_math201',
    course_code: 'MATH 201',
    class_name: 'Linear Algebra & Multivariable Calculus',
    teacher_id: 'tch_02',
    teacher_name: 'Prof. David Gauss',
    room: 'Euler Science Wing 105',
    schedule_time: 'Tue, Thu 09:00 AM - 10:30 AM',
    total_students: 10,
    latitude: 37.775210,
    longitude: -122.418850,
    geofence_radius_meters: 80,
  },
  {
    class_id: 'cls_phy105',
    course_code: 'PHY 105',
    class_name: 'Experimental Physics Laboratory',
    teacher_id: 'tch_03',
    teacher_name: 'Dr. Elena Curie',
    room: 'Fermi Physics Lab B-12',
    schedule_time: 'Fri 01:00 PM - 04:00 PM',
    total_students: 8,
    latitude: 37.774550,
    longitude: -122.420100,
    geofence_radius_meters: 120,
  },
  {
    class_id: 'cls_eng102',
    course_code: 'ENG 102',
    class_name: 'Academic Writing & Critical Research',
    teacher_id: 'tch_04',
    teacher_name: 'Prof. Julian Vance',
    room: 'Humanities Tower 410',
    schedule_time: 'Mon, Wed 02:00 PM - 03:30 PM',
    total_students: 10,
    latitude: 37.776010,
    longitude: -122.417900,
    geofence_radius_meters: 90,
  },
];

export const INITIAL_STUDENTS: Student[] = [
  {
    student_id: 'std_01',
    name: 'Alex Rivera',
    email: 'alex.rivera@campus.edu',
    enrollment_number: 'ENR-2026-0101',
    class_ids: ['cls_cs101', 'cls_math201', 'cls_phy105'],
    department: 'Computer Science',
  },
  {
    student_id: 'std_02',
    name: 'Maya Patel',
    email: 'maya.patel@campus.edu',
    enrollment_number: 'ENR-2026-0102',
    class_ids: ['cls_cs101', 'cls_math201', 'cls_eng102'],
    department: 'Software Engineering',
  },
  {
    student_id: 'std_03',
    name: 'Marcus Chen',
    email: 'marcus.chen@campus.edu',
    enrollment_number: 'ENR-2026-0103',
    class_ids: ['cls_cs101', 'cls_phy105'],
    department: 'Electrical Engineering',
  },
  {
    student_id: 'std_04',
    name: 'Sophia Alvarez',
    email: 'sophia.alvarez@campus.edu',
    enrollment_number: 'ENR-2026-0104',
    class_ids: ['cls_cs101', 'cls_math201', 'cls_phy105', 'cls_eng102'],
    department: 'Computer Science',
  },
  {
    student_id: 'std_05',
    name: 'Liam Washington',
    email: 'liam.w@campus.edu',
    enrollment_number: 'ENR-2026-0105',
    class_ids: ['cls_cs101', 'cls_eng102'],
    department: 'Data Science',
  },
  {
    student_id: 'std_06',
    name: 'Aisha Al-Mansoor',
    email: 'aisha.m@campus.edu',
    enrollment_number: 'ENR-2026-0106',
    class_ids: ['cls_cs101', 'cls_math201', 'cls_phy105'],
    department: 'Applied Mathematics',
  },
  {
    student_id: 'std_07',
    name: 'Noah Tanaka',
    email: 'noah.t@campus.edu',
    enrollment_number: 'ENR-2026-0107',
    class_ids: ['cls_cs101', 'cls_math201'],
    department: 'Computer Science',
  },
  {
    student_id: 'std_08',
    name: 'Emma Dubois',
    email: 'emma.dubois@campus.edu',
    enrollment_number: 'ENR-2026-0108',
    class_ids: ['cls_cs101', 'cls_phy105', 'cls_eng102'],
    department: 'Cognitive Science',
  },
  {
    student_id: 'std_09',
    name: 'Daniel Kim',
    email: 'daniel.kim@campus.edu',
    enrollment_number: 'ENR-2026-0109',
    class_ids: ['cls_cs101', 'cls_math201', 'cls_eng102'],
    department: 'Information Systems',
  },
  {
    student_id: 'std_10',
    name: 'Chloe Bennett',
    email: 'chloe.b@campus.edu',
    enrollment_number: 'ENR-2026-0110',
    class_ids: ['cls_cs101', 'cls_phy105'],
    department: 'Physics',
  },
  {
    student_id: 'std_11',
    name: 'Ethan Ross',
    email: 'ethan.ross@campus.edu',
    enrollment_number: 'ENR-2026-0111',
    class_ids: ['cls_cs101', 'cls_math201', 'cls_eng102'],
    department: 'Computer Science',
  },
  {
    student_id: 'std_12',
    name: 'Zara Johansson',
    email: 'zara.j@campus.edu',
    enrollment_number: 'ENR-2026-0112',
    class_ids: ['cls_cs101', 'cls_phy105', 'cls_eng102'],
    department: 'Bioinformatics',
  },
];

// Generate past 20 class session dates leading up to today (2026-11-10)
export function generateInitialAttendanceRecords(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const dates = [
    '2026-10-14',
    '2026-10-16',
    '2026-10-19',
    '2026-10-21',
    '2026-10-23',
    '2026-10-26',
    '2026-10-28',
    '2026-10-30',
    '2026-11-02',
    '2026-11-04',
    '2026-11-06',
    '2026-11-09',
    '2026-11-10', // today
  ];

  let idCounter = 1;

  for (const date of dates) {
    for (const course of INITIAL_CLASSES) {
      // Find students enrolled in this course
      const enrolled = INITIAL_STUDENTS.filter((s) => s.class_ids.includes(course.class_id));

      for (const student of enrolled) {
        // Pseudo-deterministic pattern based on student and date to keep records realistic
        const hash = (student.student_id.charCodeAt(5) || 1) * 31 + date.charCodeAt(9);
        let status: AttendanceRecord['status'] = 'Present';
        let method: AttendanceRecord['verification_method'] = 'QR Code';
        let distance = Math.floor((hash % 45) + 12); // mostly inside 12-57m

        // Marcus Chen (std_03) has low attendance pattern (<70%) to demonstrate At-Risk flag
        if (student.student_id === 'std_03') {
          if (hash % 5 === 0) status = 'Present';
          else if (hash % 5 === 1) status = 'Late';
          else status = 'Absent';
          method = status === 'Present' ? 'QR Code' : 'Manual';
        }
        // Chloe Bennett has occasional late
        else if (student.student_id === 'std_10' && hash % 4 === 0) {
          status = 'Late';
          method = 'Manual';
        }
        // General distribution: 86% present, 7% late, 5% absent, 2% excused
        else {
          const mod = hash % 20;
          if (mod === 0) {
            status = 'Absent';
            method = 'Manual';
          } else if (mod === 1) {
            status = 'Late';
            method = 'QR Code';
          } else if (mod === 2 && hash % 2 === 0) {
            status = 'Excused';
            method = 'Manual';
          } else {
            status = 'Present';
            method = (hash % 3 === 0) ? 'Self-Checkin' : 'QR Code';
          }
        }

        records.push({
          record_id: `rec_${idCounter++}`,
          student_id: student.student_id,
          class_id: course.class_id,
          date,
          time: status === 'Present' ? '10:04:12' : status === 'Late' ? '10:19:44' : undefined,
          status,
          verification_method: method,
          remarks: status === 'Excused' ? 'Medical leave submitted' : status === 'Late' ? 'Transit delay' : undefined,
          location_verified: status === 'Present' || status === 'Late',
          distance_meters: distance,
        });
      }
    }
  }

  return records;
}
