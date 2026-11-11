import React, { useState, useEffect } from 'react';
import { CourseClass, Student } from './types/attendance';
import { api } from './services/api';
import { Navbar, ActiveTab } from './components/Navbar';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentPortal } from './components/StudentPortal';
import { LiveQrProjector } from './components/LiveQrProjector';
import { VerificationSandbox } from './components/VerificationSandbox';
import { DatabaseSchemaView } from './components/DatabaseSchemaView';
import { SelfCheckInModal } from './components/SelfCheckInModal';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('teacher');
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('cls_cs101');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('std_01');
  const [isCheckInOpen, setIsCheckInOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [classList, studentList] = await Promise.all([
        api.getClasses(),
        api.getStudents(),
      ]);
      setClasses(classList);
      setStudents(studentList);
      if (classList.length > 0 && !selectedClassId) {
        setSelectedClassId(classList[0].class_id);
      }
      if (studentList.length > 0 && !selectedStudentId) {
        setSelectedStudentId(studentList[0].student_id);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      await api.resetDatabase();
      await loadInitialData();
    } catch (err) {
      console.error('Reset failed:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleLaunchProjector = (classId: string) => {
    setSelectedClassId(classId);
    setActiveTab('projector');
  };

  if (isLoading && classes.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-600">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="text-sm font-medium">Initializing CampusAttend Portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenCheckIn={() => setIsCheckInOpen(true)}
        onResetData={handleResetData}
        isResetting={isResetting}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'teacher' && (
          <TeacherDashboard
            classes={classes}
            selectedClassId={selectedClassId}
            onSelectClass={setSelectedClassId}
            onLaunchProjector={handleLaunchProjector}
          />
        )}

        {activeTab === 'student' && (
          <StudentPortal
            students={students}
            currentStudentId={selectedStudentId}
            onSelectStudent={setSelectedStudentId}
            onOpenCheckIn={() => setIsCheckInOpen(true)}
          />
        )}

        {activeTab === 'projector' && (
          <LiveQrProjector
            classes={classes}
            selectedClassId={selectedClassId}
            onSelectClass={setSelectedClassId}
            onClose={() => setActiveTab('teacher')}
          />
        )}

        {activeTab === 'sandbox' && <VerificationSandbox classes={classes} />}

        {activeTab === 'schema' && <DatabaseSchemaView />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CampusAttend Student Attendance System &middot; Academic Year 2026</span>
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span>Dynamic QR (15s)</span>
            <span>&middot;</span>
            <span>Haversine GPS Geofence</span>
            <span>&middot;</span>
            <span>Automated Verification</span>
          </div>
        </div>
      </footer>

      {/* Student Self-Check-in Modal */}
      <SelfCheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        classes={classes}
        students={students}
        currentStudentId={selectedStudentId}
        onCheckInSuccess={() => {
          // Keep modal open so user can inspect success badge, but refetch if needed
        }}
      />
    </div>
  );
}
