import React, { useState, useEffect } from 'react';
import {
  Student,
  StudentAttendanceSummary,
  AttendanceRecord,
} from '../types/attendance';
import { api } from '../services/api';
import {
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  AlertTriangle,
  QrCode,
  Calendar as CalendarIcon,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User,
} from 'lucide-react';

interface StudentPortalProps {
  students: Student[];
  currentStudentId: string;
  onSelectStudent: (id: string) => void;
  onOpenCheckIn: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  students,
  currentStudentId,
  onSelectStudent,
  onOpenCheckIn,
}) => {
  const [summary, setSummary] = useState<StudentAttendanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedRecordDate, setSelectedRecordDate] = useState<string | null>('2026-11-10');
  const [calendarMonth, setCalendarMonth] = useState<number>(10); // 10 = November (0-indexed)
  const [calendarYear, setCalendarYear] = useState<number>(2026);

  const currentStudent = students.find((s) => s.student_id === currentStudentId) || students[0];

  useEffect(() => {
    async function loadData() {
      if (!currentStudentId) return;
      setIsLoading(true);
      try {
        const data = await api.getStudentAttendance(currentStudentId);
        setSummary(data);
      } catch (err) {
        console.error('Failed to load student attendance:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [currentStudentId]);

  // Build calendar days for selected month
  const calendarDays = React.useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const days: Array<{
      dateStr: string;
      dayNum: number;
      records: AttendanceRecord[];
      status: 'Present' | 'Late' | 'Absent' | 'Excused' | 'None';
    }> = [];

    const monthStr = String(calendarMonth + 1).padStart(2, '0');

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${calendarYear}-${monthStr}-${dayStr}`;

      const recs = summary?.recent_records.filter((r) => r.date === dateStr) || [];

      let primaryStatus: 'Present' | 'Late' | 'Absent' | 'Excused' | 'None' = 'None';
      if (recs.some((r) => r.status === 'Absent')) {
        primaryStatus = 'Absent';
      } else if (recs.some((r) => r.status === 'Late')) {
        primaryStatus = 'Late';
      } else if (recs.some((r) => r.status === 'Present')) {
        primaryStatus = 'Present';
      } else if (recs.some((r) => r.status === 'Excused')) {
        primaryStatus = 'Excused';
      }

      days.push({
        dateStr,
        dayNum: day,
        records: recs,
        status: primaryStatus,
      });
    }

    return { firstDay, daysInMonth, days };
  }, [calendarYear, calendarMonth, summary]);

  // Selected date details
  const selectedRecords = React.useMemo(() => {
    if (!selectedRecordDate || !summary) return [];
    return summary.recent_records.filter((r) => r.date === selectedRecordDate);
  }, [selectedRecordDate, summary]);

  return (
    <div className="space-y-6">
      {/* Student Profile Switcher Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
              {currentStudent?.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  {currentStudent?.name}
                </h1>
                {summary?.is_at_risk && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Attendance At Risk (&lt;75%)
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                <span className="font-mono text-slate-700">{currentStudent?.enrollment_number}</span>
                <span aria-hidden="true">·</span>
                <span>{currentStudent?.department}</span>
                <span aria-hidden="true">·</span>
                <span>{currentStudent?.email}</span>
              </div>
            </div>
          </div>

          {/* Student Switcher dropdown and Check-in action */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
              <label htmlFor="student-select" className="text-xs font-medium text-slate-500 pl-1.5">
                Simulate Student:
              </label>
              <select
                id="student-select"
                value={currentStudentId}
                onChange={(e) => onSelectStudent(e.target.value)}
                className="bg-white text-xs font-medium text-slate-800 rounded px-2.5 py-1 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {students.map((st) => (
                  <option key={st.student_id} value={st.student_id}>
                    {st.name} ({st.department})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onOpenCheckIn}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-all whitespace-nowrap active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              <span>Self Check-in</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Overall Percentage */}
        <div className="col-span-2 lg:col-span-1 bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Attendance Rate
          </span>
          <div className="my-2">
            <div className="text-3xl font-extrabold font-mono tabular-nums text-slate-900">
              {summary ? summary.overall_percentage : 0}%
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (summary?.overall_percentage || 0) >= 85
                    ? 'bg-emerald-500'
                    : (summary?.overall_percentage || 0) >= 75
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${summary ? summary.overall_percentage : 0}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-slate-500">
            {(summary?.overall_percentage || 0) >= 75
              ? 'Meets 75% institutional requirement'
              : 'Requires attendance intervention'}
          </span>
        </div>

        {/* Total Sessions */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Total Sessions</span>
            <BookOpen className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {summary?.total_sessions || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">Logged this semester</div>
        </div>

        {/* Present Days */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Present Days</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600">
            {summary?.present_count || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">Verified on-time</div>
        </div>

        {/* Late Days */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Late Check-ins</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-600">
            {summary?.late_count || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">Within late window</div>
        </div>

        {/* Absent Days */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Absent Days</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-rose-600">
            {summary?.absent_count || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">Unexcused misses</div>
        </div>
      </div>

      {/* Main Section: Calendar UI & Day Inspection Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Card (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          {/* Calendar Header with Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">
                Attendance Calendar — November 2026
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="flex items-center gap-1 text-slate-600 mr-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Present
              </span>
              <span className="flex items-center gap-1 text-slate-600 mr-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Late
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Absent
              </span>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 py-2 border-b border-slate-100">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Day Grid */}
          <div className="grid grid-cols-7 gap-1.5 pt-3">
            {/* Blank leading days */}
            {Array.from({ length: calendarDays.firstDay }).map((_, i) => (
              <div key={`blank-${i}`} className="h-16 rounded-lg bg-slate-50/50" />
            ))}

            {/* Actual Month Days */}
            {calendarDays.days.map((item) => {
              const isSelected = selectedRecordDate === item.dateStr;
              const hasRecords = item.records.length > 0;

              return (
                <button
                  key={item.dateStr}
                  type="button"
                  onClick={() => setSelectedRecordDate(item.dateStr)}
                  className={`h-16 p-1.5 rounded-lg border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                      : 'border-slate-100 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold font-mono tabular-nums ${
                        isSelected ? 'text-indigo-700' : 'text-slate-700'
                      }`}
                    >
                      {item.dayNum}
                    </span>
                    {item.status === 'Present' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                    {item.status === 'Late' && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                    )}
                    {item.status === 'Absent' && (
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                    )}
                    {item.status === 'Excused' && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    )}
                  </div>

                  {hasRecords ? (
                    <div className="text-[10px] truncate font-medium">
                      <span
                        className={`px-1 py-0.5 rounded text-[9px] font-semibold ${
                          item.status === 'Present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'Late'
                            ? 'bg-amber-100 text-amber-800'
                            : item.status === 'Absent'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-300">No session</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Inspector Panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Session Log Detail
              </span>
              <span className="text-xs font-mono font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {selectedRecordDate || 'Select a day'}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {selectedRecords.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>No class attendance recorded on this day.</p>
                  <p className="text-[11px] mt-1 text-slate-400">
                    Click any highlighted calendar date to review session details.
                  </p>
                </div>
              ) : (
                selectedRecords.map((rec) => (
                  <div
                    key={rec.record_id}
                    className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {rec.class_id === 'cls_cs101'
                          ? 'CS 101 - Intro to CS'
                          : rec.class_id === 'cls_math201'
                          ? 'MATH 201 - Linear Algebra'
                          : rec.class_id === 'cls_phy105'
                          ? 'PHY 105 - Physics Lab'
                          : 'ENG 102 - Academic Writing'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          rec.status === 'Present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'Late'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Verification:</span>
                        <span className="font-medium text-slate-800 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                          {rec.verification_method}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Timestamp:</span>
                        <span className="font-mono text-slate-700">{rec.time || '10:00 AM'}</span>
                      </div>
                      {rec.distance_meters !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Distance from room:</span>
                          <span className="font-mono text-emerald-700">
                            {rec.distance_meters}m (verified)
                          </span>
                        </div>
                      )}
                      {rec.remarks && (
                        <div className="pt-1 border-t border-slate-200 text-[11px] text-slate-500 italic">
                          "{rec.remarks}"
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={onOpenCheckIn}
              className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <QrCode className="w-4 h-4" />
              <span>Self Check-in to Live Class</span>
            </button>
          </div>
        </div>
      </div>

      {/* Course Breakdown Cards */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4">
          Course-by-Course Attendance Breakdown
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {summary?.course_breakdown.map((course) => (
            <div
              key={course.class_id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-indigo-700">
                    {course.course_code}
                  </span>
                  <span
                    className={`text-xs font-bold font-mono tabular-nums ${
                      course.percentage >= 75 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {course.percentage}%
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                  {course.class_name}
                </h3>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      course.percentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${course.percentage}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                <span>{course.present} Present</span>
                <span>·</span>
                <span>{course.late} Late</span>
                <span>·</span>
                <span>{course.absent} Absent</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
