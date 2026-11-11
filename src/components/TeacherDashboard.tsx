import React, { useState, useEffect, useMemo } from 'react';
import {
  CourseClass,
  ClassSummaryReport,
  AttendanceStatus,
} from '../types/attendance';
import { api } from '../services/api';
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  QrCode,
  Save,
  Download,
  Search,
  AlertTriangle,
  Calendar,
  MapPin,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface TeacherDashboardProps {
  classes: CourseClass[];
  selectedClassId: string;
  onSelectClass: (id: string) => void;
  onLaunchProjector: (classId: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  classes,
  selectedClassId,
  onSelectClass,
  onLaunchProjector,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-10');
  const [summaryReport, setSummaryReport] = useState<ClassSummaryReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | AttendanceStatus>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Local state of roster status modifications before submitting
  const [localStatuses, setLocalStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [localRemarks, setLocalRemarks] = useState<Record<string, string>>({});

  const currentClass = classes.find((c) => c.class_id === selectedClassId) || classes[0];

  const loadClassSummary = async () => {
    if (!selectedClassId) return;
    setIsLoading(true);
    try {
      const data = await api.getClassSummary(selectedClassId, selectedDate);
      setSummaryReport(data);

      // Populate local status map
      const initialStatusMap: Record<string, AttendanceStatus> = {};
      const initialRemarksMap: Record<string, string> = {};
      data.records.forEach(({ student, record }) => {
        initialStatusMap[student.student_id] = record ? record.status : 'Absent';
        initialRemarksMap[student.student_id] = record?.remarks || '';
      });
      setLocalStatuses(initialStatusMap);
      setLocalRemarks(initialRemarksMap);
    } catch (err) {
      console.error('Failed to load class summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClassSummary();
  }, [selectedClassId, selectedDate]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setLocalStatuses((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleRemarkChange = (studentId: string, remark: string) => {
    setLocalRemarks((prev) => ({ ...prev, [studentId]: remark }));
  };

  const handleBatchMark = (status: AttendanceStatus) => {
    if (!summaryReport) return;
    const updated: Record<string, AttendanceStatus> = {};
    summaryReport.records.forEach(({ student }) => {
      updated[student.student_id] = status;
    });
    setLocalStatuses(updated);
    showToast(`Marked all ${summaryReport.records.length} students as ${status}`);
  };

  const handleSaveAttendance = async () => {
    if (!summaryReport) return;
    setIsSaving(true);
    try {
      const batchRecords = summaryReport.records.map(({ student }) => ({
        student_id: student.student_id,
        status: localStatuses[student.student_id] || 'Absent',
        remarks: localRemarks[student.student_id] || undefined,
      }));

      await api.submitBulkAttendance({
        class_id: selectedClassId,
        date: selectedDate,
        records: batchRecords,
      });

      showToast(`Attendance saved successfully for ${selectedDate}!`);
      await loadClassSummary();
    } catch (err) {
      console.error('Error saving attendance:', err);
      showToast('Error saving attendance records');
    } finally {
      setIsSaving(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!summaryReport) return;
    const headers = ['Student ID', 'Name', 'Enrollment Number', 'Email', 'Date', 'Status', 'Remarks'];
    const rows = summaryReport.records.map(({ student, record }) => [
      student.student_id,
      student.name,
      student.enrollment_number,
      student.email,
      selectedDate,
      localStatuses[student.student_id] || record?.status || 'Absent',
      localRemarks[student.student_id] || record?.remarks || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_${currentClass?.course_code}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered rows
  const filteredRecords = useMemo(() => {
    if (!summaryReport) return [];
    return summaryReport.records.filter(({ student }) => {
      const currentStatus = localStatuses[student.student_id] || 'Absent';
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.enrollment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'All' || currentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [summaryReport, searchQuery, statusFilter, localStatuses]);

  // Dynamic statistics based on current local edits
  const currentStats = useMemo(() => {
    if (!summaryReport) return { total: 0, present: 0, late: 0, absent: 0, excused: 0, rate: 0 };
    const total = summaryReport.records.length;
    let present = 0;
    let late = 0;
    let absent = 0;
    let excused = 0;

    summaryReport.records.forEach(({ student }) => {
      const st = localStatuses[student.student_id] || 'Absent';
      if (st === 'Present') present++;
      else if (st === 'Late') late++;
      else if (st === 'Absent') absent++;
      else if (st === 'Excused') excused++;
    });

    const rate = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 0;
    return { total, present, late, absent, excused, rate };
  }, [summaryReport, localStatuses]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Class Selector Header & Classroom Geo-Boundary Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Academic Session 2026</span>
              <span aria-hidden="true">·</span>
              <span>Semester Attendance Ledger</span>
              <span aria-hidden="true">·</span>
              <span>{currentClass?.schedule_time}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {currentClass?.course_code}: {currentClass?.class_name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-2">
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                Instructor: {currentClass?.teacher_name}
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="flex items-center gap-1 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {currentClass?.room}
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="flex items-center gap-1 text-emerald-700 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Geofence: {currentClass?.geofence_radius_meters}m boundary
              </span>
            </div>
          </div>

          {/* Controls: Class Switcher & Projector CTA */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <label htmlFor="class-select" className="text-xs font-semibold text-slate-500 pl-2">
                Course:
              </label>
              <select
                id="class-select"
                value={selectedClassId}
                onChange={(e) => onSelectClass(e.target.value)}
                className="bg-white text-xs font-medium text-slate-800 rounded px-2.5 py-1.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {classes.map((cls) => (
                  <option key={cls.class_id} value={cls.class_id}>
                    {cls.course_code} - {cls.class_name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => onLaunchProjector(selectedClassId)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors whitespace-nowrap shrink-0"
            >
              <QrCode className="w-4 h-4 text-indigo-600" />
              <span>Projector Dynamic QR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date Bar & Session Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {/* Date Selector Box */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Attendance Date
              </span>
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs">
            <button
              onClick={() => setSelectedDate('2026-11-10')}
              className={`px-2.5 py-1 rounded transition-colors ${
                selectedDate === '2026-11-10' ? 'bg-indigo-600 text-white font-medium' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate('2026-11-09')}
              className={`px-2.5 py-1 rounded transition-colors ${
                selectedDate === '2026-11-09' ? 'bg-indigo-600 text-white font-medium' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Previous Session
            </button>
          </div>
        </div>

        {/* Present KPI */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Present</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {currentStats.present}
            <span className="text-xs font-normal text-slate-400 ml-1">/ {currentStats.total}</span>
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1">
            {currentStats.rate}% Session Rate
          </div>
        </div>

        {/* Late KPI */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Late Check-in</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {currentStats.late}
          </div>
          <div className="text-xs text-amber-600 font-medium mt-1">After 7m threshold</div>
        </div>

        {/* Absent KPI */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Absent</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {currentStats.absent}
          </div>
          <div className="text-xs text-rose-600 font-medium mt-1">Unexcused absence</div>
        </div>

        {/* Excused KPI */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Excused</span>
            <HelpCircle className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {currentStats.excused}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">Medical/Leave logged</div>
        </div>
      </div>

      {/* Roster Controls: Search, Filter Tabs, Batch Actions, and Save */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search and Status Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Segmented Filter Control */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
              {(['All', 'Present', 'Late', 'Absent', 'Excused'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    statusFilter === filter
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Batch Actions & Save */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBatchMark('Present')}
              className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap"
            >
              Mark All Present
            </button>
            <button
              onClick={() => handleBatchMark('Absent')}
              className="px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors whitespace-nowrap"
            >
              Mark All Absent
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleSaveAttendance}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs whitespace-nowrap"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Submit Attendance'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Enrollment & Major</th>
                <th className="py-3 px-4">Attendance Status (Click to Toggle)</th>
                <th className="py-3 px-4">Verification Source</th>
                <th className="py-3 px-4">Notes / Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Loading student roster for {selectedDate}...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No students match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(({ student, record }) => {
                  const currentStatus = localStatuses[student.student_id] || 'Absent';
                  const isMarcus = student.student_id === 'std_03'; // example student with attendance alert

                  return (
                    <tr
                      key={student.student_id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Student Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-semibold text-xs shrink-0">
                            {student.name.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{student.name}</span>
                              {isMarcus && (
                                <span
                                  title="Attendance below 75% threshold"
                                  className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded"
                                >
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  At Risk
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">{student.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Enrollment & Dept */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-700">{student.enrollment_number}</div>
                        <div className="text-[11px] text-slate-500">{student.department}</div>
                      </td>

                      {/* Status Toggle Segmented Control */}
                      <td className="py-3 px-4">
                        <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.student_id, 'Present')}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                              currentStatus === 'Present'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-200/60'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.student_id, 'Late')}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                              currentStatus === 'Late'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-slate-600 hover:text-amber-700 hover:bg-slate-200/60'
                            }`}
                          >
                            Late
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.student_id, 'Absent')}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                              currentStatus === 'Absent'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-rose-700 hover:bg-slate-200/60'
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.student_id, 'Excused')}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                              currentStatus === 'Excused'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-indigo-700 hover:bg-slate-200/60'
                            }`}
                          >
                            Excused
                          </button>
                        </div>
                      </td>

                      {/* Verification Method & Timestamp */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-slate-800">
                            {record?.verification_method || 'Manual Entry'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {record?.time ? `Logged at ${record.time}` : 'Pending sync'}
                            {record?.distance_meters ? ` · ${record.distance_meters}m` : ''}
                          </span>
                        </div>
                      </td>

                      {/* Remarks */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          placeholder="Add remark..."
                          value={localRemarks[student.student_id] || ''}
                          onChange={(e) => handleRemarkChange(student.student_id, e.target.value)}
                          className="w-full text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
