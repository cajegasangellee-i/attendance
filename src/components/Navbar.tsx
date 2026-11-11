import React from 'react';
import {
  GraduationCap,
  Users,
  UserCheck,
  QrCode,
  ShieldCheck,
  Database,
  RefreshCw,
} from 'lucide-react';

export type ActiveTab = 'teacher' | 'student' | 'projector' | 'sandbox' | 'schema';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenCheckIn: () => void;
  onResetData: () => void;
  isResetting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenCheckIn,
  onResetData,
  isResetting,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark with academic icon */}
          <div
            onClick={() => onSelectTab('teacher')}
            className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 group"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:bg-indigo-700 transition-colors">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                CampusAttend
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-400">
                Student Portal
              </span>
            </div>
          </div>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2 text-sm font-medium text-slate-600">
            <button
              onClick={() => onSelectTab('teacher')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'teacher'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Teacher Roster</span>
            </button>

            <button
              onClick={() => onSelectTab('student')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'student'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Student Portal</span>
            </button>

            <button
              onClick={() => onSelectTab('projector')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'projector'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Projector QR</span>
            </button>

            <button
              onClick={() => onSelectTab('sandbox')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'sandbox'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verification Sandbox</span>
            </button>

            <button
              onClick={() => onSelectTab('schema')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'schema'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Schema & API</span>
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onResetData}
              disabled={isResetting}
              title="Reset sample data to initial state"
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>Reset Data</span>
            </button>

            <button
              onClick={onOpenCheckIn}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-all whitespace-nowrap shrink-0 active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              <span>Self Check-in</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav subbar */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 bg-slate-50 border-t border-slate-200 gap-1 text-xs">
        <button
          onClick={() => onSelectTab('teacher')}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap ${
            activeTab === 'teacher' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-700'
          }`}
        >
          Teacher Roster
        </button>
        <button
          onClick={() => onSelectTab('student')}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap ${
            activeTab === 'student' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-700'
          }`}
        >
          Student Portal
        </button>
        <button
          onClick={() => onSelectTab('projector')}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap ${
            activeTab === 'projector' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-700'
          }`}
        >
          Projector QR
        </button>
        <button
          onClick={() => onSelectTab('sandbox')}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap ${
            activeTab === 'sandbox' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-700'
          }`}
        >
          Verification
        </button>
        <button
          onClick={() => onSelectTab('schema')}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap ${
            activeTab === 'schema' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-700'
          }`}
        >
          API Schema
        </button>
      </div>
    </header>
  );
};
