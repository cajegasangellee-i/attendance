import React, { useState } from 'react';
import { CourseClass } from '../types/attendance';
import { calculateHaversineDistanceMeters } from '../server/db';
import {
  ShieldCheck,
  QrCode,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react';

interface VerificationSandboxProps {
  classes: CourseClass[];
}

export const VerificationSandbox: React.FC<VerificationSandboxProps> = ({ classes }) => {
  const currentClass = classes[0];

  // Simulation controls
  const [qrTokenState, setQrTokenState] = useState<'VALID_CURRENT' | 'EXPIRED_ROTATION' | 'MALFORMED'>('VALID_CURRENT');
  const [simulatedDistanceMeters, setSimulatedDistanceMeters] = useState<number>(35);
  const [elapsedWindowMinutes, setElapsedWindowMinutes] = useState<number>(4);
  const [testResult, setTestResult] = useState<{
    status: 'SUCCESS' | 'LATE' | 'FAILED_GEOFENCE' | 'FAILED_TOKEN' | 'FAILED_WINDOW';
    message: string;
    metrics: {
      distance: number;
      allowedRadius: number;
      tokenValid: boolean;
      windowActive: boolean;
    };
  } | null>(null);

  const runVerificationSimulation = () => {
    const allowedRadius = currentClass.geofence_radius_meters;
    const windowActive = elapsedWindowMinutes <= 15;
    const tokenValid = qrTokenState === 'VALID_CURRENT';
    const isWithinGeofence = simulatedDistanceMeters <= allowedRadius;

    if (!windowActive) {
      setTestResult({
        status: 'FAILED_WINDOW',
        message: `Window Expired: ${elapsedWindowMinutes} minutes have elapsed since session start. Check-in cutoff is 15 minutes. Access is closed.`,
        metrics: { distance: simulatedDistanceMeters, allowedRadius, tokenValid, windowActive },
      });
      return;
    }

    if (!tokenValid) {
      setTestResult({
        status: 'FAILED_TOKEN',
        message:
          qrTokenState === 'EXPIRED_ROTATION'
            ? 'Token Stale: The photographed QR code is older than 15 seconds. Proxy attendance attempt blocked.'
            : 'Invalid Token Signature: Unrecognized payload format.',
        metrics: { distance: simulatedDistanceMeters, allowedRadius, tokenValid, windowActive },
      });
      return;
    }

    if (!isWithinGeofence) {
      setTestResult({
        status: 'FAILED_GEOFENCE',
        message: `Geofence Violation: Student device is ${simulatedDistanceMeters}m away from ${currentClass.room}. Maximum permitted radius is ${allowedRadius}m. Proxy check-in blocked.`,
        metrics: { distance: simulatedDistanceMeters, allowedRadius, tokenValid, windowActive },
      });
      return;
    }

    if (elapsedWindowMinutes > 7) {
      setTestResult({
        status: 'LATE',
        message: `Verification Passed: Student physically present within geofence (${simulatedDistanceMeters}m) with valid dynamic QR. Marked as LATE (check-in after initial 7 minutes).`,
        metrics: { distance: simulatedDistanceMeters, allowedRadius, tokenValid, windowActive },
      });
      return;
    }

    setTestResult({
      status: 'SUCCESS',
      message: `Verification Succeeded: Student physically present in room (${simulatedDistanceMeters}m / limit ${allowedRadius}m) within initial window (${elapsedWindowMinutes}m). Marked PRESENT.`,
      metrics: { distance: simulatedDistanceMeters, allowedRadius, tokenValid, windowActive },
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Attendance Verification & Anti-Proxy Architecture
            </h1>
            <p className="text-xs text-slate-500">
              Interactive sandbox demonstrating the 3 automated defense layers preventing proxy attendance.
            </p>
          </div>
        </div>

        {/* 3 Pillars Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs mb-1">
              <QrCode className="w-4 h-4" />
              <span>1. Dynamic 15s QR Codes</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Codes rotate cryptographically every 15 seconds on the projector screen. Students cannot photograph the code and share it via WhatsApp or iMessage.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs mb-1">
              <MapPin className="w-4 h-4" />
              <span>2. Campus Geofence Boundary</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Haversine formula validates the student device’s high-precision GPS against classroom coordinates (100m radius). Off-campus attempts fail immediately.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs mb-1">
              <Clock className="w-4 h-4" />
              <span>3. Timed Access Windows</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Check-in is permitted only during the first 10-15 minutes of class. Sessions automatically close, preventing retroactive or accidental check-ins.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Simulation Playground */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center justify-between pb-3 border-b border-slate-100">
            <span>Simulation Parameters</span>
            <span className="text-xs font-normal text-slate-400">
              Simulating for {currentClass.course_code}
            </span>
          </h2>

          {/* 1. Dynamic QR Token Control */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                QR Token Freshness
              </span>
              <span className="font-mono text-xs text-slate-500">{qrTokenState}</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setQrTokenState('VALID_CURRENT')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                  qrTokenState === 'VALID_CURRENT'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Fresh Token (&lt;15s)
              </button>
              <button
                type="button"
                onClick={() => setQrTokenState('EXPIRED_ROTATION')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                  qrTokenState === 'EXPIRED_ROTATION'
                    ? 'border-amber-600 bg-amber-50 text-amber-800 font-semibold ring-1 ring-amber-500'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Expired Photo (&gt;15s)
              </button>
              <button
                type="button"
                onClick={() => setQrTokenState('MALFORMED')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                  qrTokenState === 'MALFORMED'
                    ? 'border-rose-600 bg-rose-50 text-rose-800 font-semibold ring-1 ring-rose-500'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Fake / Spoofed Code
              </button>
            </div>
          </div>

          {/* 2. Geofence Distance Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                Student GPS Distance from Classroom
              </span>
              <span
                className={`font-mono text-xs px-2 py-0.5 rounded ${
                  simulatedDistanceMeters <= currentClass.geofence_radius_meters
                    ? 'bg-emerald-100 text-emerald-800 font-bold'
                    : 'bg-rose-100 text-rose-800 font-bold'
                }`}
              >
                {simulatedDistanceMeters}m{' '}
                {simulatedDistanceMeters <= currentClass.geofence_radius_meters
                  ? '(Within 100m)'
                  : '(Breaches 100m limit!)'}
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="600"
              step="5"
              value={simulatedDistanceMeters}
              onChange={(e) => setSimulatedDistanceMeters(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>5m (Front Row)</span>
              <span>100m (Campus Geofence Edge)</span>
              <span>600m (Dormitory/Off-Campus)</span>
            </div>
          </div>

          {/* 3. Timed Access Window Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Elapsed Session Time
              </span>
              <span
                className={`font-mono text-xs px-2 py-0.5 rounded ${
                  elapsedWindowMinutes <= 7
                    ? 'bg-emerald-100 text-emerald-800 font-bold'
                    : elapsedWindowMinutes <= 15
                    ? 'bg-amber-100 text-amber-800 font-bold'
                    : 'bg-rose-100 text-rose-800 font-bold'
                }`}
              >
                {elapsedWindowMinutes} mins elapsed{' '}
                {elapsedWindowMinutes <= 7
                  ? '(On-time)'
                  : elapsedWindowMinutes <= 15
                  ? '(Late Window)'
                  : '(Window Closed)'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={elapsedWindowMinutes}
              onChange={(e) => setElapsedWindowMinutes(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>0m (Start)</span>
              <span>7m (Late Threshold)</span>
              <span>15m (Cutoff)</span>
              <span>25m</span>
            </div>
          </div>

          {/* Run Verification Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={runVerificationSimulation}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Evaluate Verification Pipeline</span>
            </button>
          </div>
        </div>

        {/* Verification Verdict Display (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Security Engine Verdict
              </span>
              <span className="text-xs font-mono text-slate-400">RFC 6238 + WGS-84</span>
            </div>

            {testResult ? (
              <div className="mt-4 space-y-4">
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    testResult.status === 'SUCCESS'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : testResult.status === 'LATE'
                      ? 'bg-amber-50 border-amber-200 text-amber-950'
                      : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}
                >
                  {testResult.status === 'SUCCESS' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  ) : testResult.status === 'LATE' ? (
                    <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold text-sm">
                      {testResult.status === 'SUCCESS'
                        ? 'VERIFICATION PASSED — PRESENT'
                        : testResult.status === 'LATE'
                        ? 'VERIFICATION PASSED — LATE'
                        : 'ACCESS DENIED / PROXY BLOCKED'}
                    </div>
                    <p className="text-xs mt-1 leading-relaxed">{testResult.message}</p>
                  </div>
                </div>

                {/* Subsystem checklist */}
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Subsystem Invariant Checks
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-xs space-y-1.5 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Dynamic QR Hash:</span>
                      <span
                        className={
                          testResult.metrics.tokenValid ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'
                        }
                      >
                        {testResult.metrics.tokenValid ? 'VALID' : 'INVALID/STALE'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Geofence Distance:</span>
                      <span
                        className={
                          testResult.metrics.distance <= testResult.metrics.allowedRadius
                            ? 'text-emerald-700 font-bold'
                            : 'text-rose-700 font-bold'
                        }
                      >
                        {testResult.metrics.distance}m / max {testResult.metrics.allowedRadius}m
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Timed Window:</span>
                      <span
                        className={
                          testResult.metrics.windowActive ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'
                        }
                      >
                        {testResult.metrics.windowActive ? 'ACTIVE' : 'EXPIRED'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p>Adjust the simulation parameters on the left and click "Evaluate Verification Pipeline".</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Enforced by server endpoint: <code className="text-indigo-600">POST /api/sessions/check-in</code>
          </div>
        </div>
      </div>
    </div>
  );
};
