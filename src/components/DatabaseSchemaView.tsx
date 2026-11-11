import React, { useState } from 'react';
import { Database, Terminal, Code2, Server, CheckCircle2, Play } from 'lucide-react';

export const DatabaseSchemaView: React.FC = () => {
  const [activeApiTest, setActiveApiTest] = useState<string>('get_student');
  const [apiResponse, setApiResponse] = useState<string>('Click "Execute Endpoint" below to send a live request.');
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const executeApi = async () => {
    setIsRunning(true);
    setApiResponse('Sending HTTP request to server...');
    try {
      let res: Response;
      if (activeApiTest === 'get_student') {
        res = await fetch('/api/attendance/std_01');
      } else if (activeApiTest === 'get_class_summary') {
        res = await fetch('/api/attendance/class/cls_cs101?date=2026-11-10');
      } else if (activeApiTest === 'post_attendance') {
        res = await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: 'std_01',
            class_id: 'cls_cs101',
            date: '2026-11-10',
            status: 'Present',
            remarks: 'Live API test from schema view',
          }),
        });
      } else {
        res = await fetch('/api/stats/overview');
      }

      const json = await res.json();
      setApiResponse(JSON.stringify(json, null, 2));
    } catch (err: any) {
      setApiResponse(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Database Schema & Backend REST API Specification
            </h1>
            <p className="text-xs text-slate-500">
              Relational architecture and endpoints implemented as requested in Tech Stack Specification.
            </p>
          </div>
        </div>
      </div>

      {/* Relational Schema Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Table 1: Users / Students */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
              <span className="font-mono text-xs font-bold text-indigo-700">Table: students</span>
              <span className="text-[11px] text-slate-400 font-mono">Entity: Users/Students</span>
            </div>
            <ul className="space-y-2 text-xs font-mono">
              <li className="flex items-center justify-between text-slate-800">
                <span className="font-semibold text-indigo-600">student_id (PK)</span>
                <span className="text-slate-400">VARCHAR(64)</span>
              </li>
              <li className="flex items-center justify-between text-slate-800">
                <span>name</span>
                <span className="text-slate-400">VARCHAR(128)</span>
              </li>
              <li className="flex items-center justify-between text-slate-800">
                <span>email (UNIQUE)</span>
                <span className="text-slate-400">VARCHAR(255)</span>
              </li>
              <li className="flex items-center justify-between text-slate-800">
                <span>enrollment_number</span>
                <span className="text-slate-400">VARCHAR(64)</span>
              </li>
              <li className="flex items-center justify-between text-slate-800">
                <span>class_ids</span>
                <span className="text-slate-400">TEXT[] / FK</span>
              </li>
              <li className="flex items-center justify-between text-slate-800">
                <span>department</span>
                <span className="text-slate-400">VARCHAR(100)</span>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Stores student profiles and course enrollments.
          </div>
        </div>

        {/* Table 2: Courses / Classes */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
              <span className="font-mono text-xs font-bold text-indigo-700">Table: classes</span>
              <span className="text-[11px] text-slate-400 font-mono">Entity: Courses/Classes</span>
            </div>
            <ul className="space-y-2 text-xs font-mono">
              <li className="flex items-center justify-between text-slate-800">
                <span className="font-semibold text-indigo-600">class_id (PK)</span>
                <span className="text-slate-400">VARCHAR(64)</span>
              </li>
              <li className="flex items-center justify-between text-slate-800">
                <span>class_name</span>
                <span className="text-slate-400">VARCHAR(128)</span>
              </li>
              <li className="flex items-center justify-between text-slate-800">
                <span>course_code</span>
                <span className="text-slate-400">VARCHAR(32)</span>
              </li>
              <li className="flex items-center justify-between text-slate-800">
                <span>teacher_id (FK)</span>
                <span className="text-slate-400">VARCHAR(64)</span>
              </li>
              <li className="flex items-center justify-between text-slate-800">
                <span>room</span>
                <span className="text-slate-400">VARCHAR(64)</span>
              </li>
              <li className="flex items-center justify-between text-slate-800">
                <span>latitude, longitude</span>
                <span className="text-slate-400">FLOAT8</span>
              </li>
              <li className="flex items-center justify-between text-slate-800">
                <span>geofence_radius</span>
                <span className="text-slate-400">INTEGER (meters)</span>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Stores classroom GPS coordinates for geofence enforcement.
          </div>
        </div>

        {/* Table 3: Attendance Records */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
              <span className="font-mono text-xs font-bold text-indigo-700">Table: attendance_records</span>
              <span className="text-[11px] text-slate-400 font-mono">Entity: Attendance Records</span>
            </div>
            <ul className="space-y-2 text-xs font-mono">
              <li className="flex items-center justify-between text-slate-800">
                <span className="font-semibold text-indigo-600">record_id (PK)</span>
                <span className="text-slate-400">VARCHAR(64)</span>
              </li>
              <li className="flex items-center justify-between text-slate-800">
                <span>student_id (FK)</span>
                <span className="text-slate-400">VARCHAR(64)</span>
              </li>
              <li className="flex items-center justify-between text-slate-800">
                <span>class_id (FK)</span>
                <span className="text-slate-400">VARCHAR(64)</span>
              </li>
              <li className="flex items-center justify-between text-slate-800">
                <span>date</span>
                <span className="text-slate-400">DATE (YYYY-MM-DD)</span>
              </li>
              <li className="flex items-center justify-between text-slate-800">
                <span>status</span>
                <span className="text-slate-400">ENUM('Present','Absent','Late')</span>
              </li>
              <li className="flex items-center justify-between text-slate-800">
                <span>verification_method</span>
                <span className="text-slate-400">VARCHAR(32)</span>
              </li>
              <li className="flex items-center justify-between text-slate-800">
                <span>distance_meters</span>
                <span className="text-slate-400">FLOAT4</span>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Unique index on (student_id, class_id, date).
          </div>
        </div>
      </div>

      {/* REST API Tester & Live Sandbox */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-600" />
            <span>Interactive REST API Runner</span>
          </div>
          <span className="text-xs font-mono text-slate-400">Express Backend (server.ts)</span>
        </h2>

        {/* API Endpoint Selector Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveApiTest('get_student')}
            className={`p-2.5 text-left rounded-lg border text-xs transition-all ${
              activeApiTest === 'get_student'
                ? 'border-indigo-600 bg-indigo-50 font-semibold text-indigo-900 ring-1 ring-indigo-500'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="font-mono text-[10px] text-indigo-600 font-bold">GET</div>
            <div className="truncate font-mono">/api/attendance/:student_id</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveApiTest('get_class_summary')}
            className={`p-2.5 text-left rounded-lg border text-xs transition-all ${
              activeApiTest === 'get_class_summary'
                ? 'border-indigo-600 bg-indigo-50 font-semibold text-indigo-900 ring-1 ring-indigo-500'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="font-mono text-[10px] text-indigo-600 font-bold">GET</div>
            <div className="truncate font-mono">/api/attendance/class/:id</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveApiTest('post_attendance')}
            className={`p-2.5 text-left rounded-lg border text-xs transition-all ${
              activeApiTest === 'post_attendance'
                ? 'border-indigo-600 bg-indigo-50 font-semibold text-indigo-900 ring-1 ring-indigo-500'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="font-mono text-[10px] text-emerald-600 font-bold">POST</div>
            <div className="truncate font-mono">/api/attendance</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveApiTest('get_stats')}
            className={`p-2.5 text-left rounded-lg border text-xs transition-all ${
              activeApiTest === 'get_stats'
                ? 'border-indigo-600 bg-indigo-50 font-semibold text-indigo-900 ring-1 ring-indigo-500'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="font-mono text-[10px] text-indigo-600 font-bold">GET</div>
            <div className="truncate font-mono">/api/stats/overview</div>
          </button>
        </div>

        {/* Action Button & Terminal Output */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Live HTTP Response
            </span>
            <button
              type="button"
              onClick={executeApi}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{isRunning ? 'Requesting...' : 'Execute Endpoint'}</span>
            </button>
          </div>

          <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-72 border border-slate-800">
            {apiResponse}
          </pre>
        </div>
      </div>
    </div>
  );
};
