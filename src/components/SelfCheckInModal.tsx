import React, { useState, useEffect } from 'react';
import { CourseClass, Student, CheckInResult, ActiveSession } from '../types/attendance';
import { api } from '../services/api';
import {
  X,
  QrCode,
  MapPin,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Navigation,
  RefreshCw,
  Clock,
} from 'lucide-react';

interface SelfCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: CourseClass[];
  students: Student[];
  currentStudentId: string;
  onCheckInSuccess: () => void;
}

export const SelfCheckInModal: React.FC<SelfCheckInModalProps> = ({
  isOpen,
  onClose,
  classes,
  students,
  currentStudentId,
  onCheckInSuccess,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(currentStudentId);
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.class_id || '');
  const [tokenInput, setTokenInput] = useState<string>('');
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<CheckInResult | null>(null);

  // Geolocation state: default to classroom coordinates or simulated
  const currentClass = classes.find((c) => c.class_id === selectedClassId) || classes[0];
  const [userLat, setUserLat] = useState<number>(currentClass ? currentClass.latitude + 0.00015 : 37.7749);
  const [userLng, setUserLng] = useState<number>(currentClass ? currentClass.longitude + 0.0001 : -122.4194);
  const [geoStatus, setGeoStatus] = useState<string>('Simulated: Inside Classroom (~18m away)');

  // Sync active session whenever selectedClassId changes
  useEffect(() => {
    async function fetchSession() {
      if (!selectedClassId) return;
      setIsLoadingSession(true);
      try {
        const ses = await api.getActiveSession(selectedClassId);
        setActiveSession(ses);
        if (ses && ses.token) {
          // Auto-fill token for easy testing if not set
          setTokenInput(ses.token);
        }
      } catch (err) {
        console.error('Session error:', err);
      } finally {
        setIsLoadingSession(false);
      }
    }
    if (isOpen) {
      fetchSession();
    }
  }, [selectedClassId, isOpen]);

  // Keep student id in sync
  useEffect(() => {
    setSelectedStudentId(currentStudentId);
  }, [currentStudentId]);

  if (!isOpen) return null;

  // Real browser geolocation request
  const handleGetLiveGps = () => {
    if (!navigator.geolocation) {
      setGeoStatus('Browser geolocation not supported. Using simulation.');
      return;
    }
    setGeoStatus('Acquiring high-accuracy GPS coordinates...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setGeoStatus(`Acquired device GPS (Accuracy: ±${Math.round(pos.coords.accuracy)}m)`);
      },
      (err) => {
        setGeoStatus(`GPS permission denied/unavailable (${err.message}). Using preset.`);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  // Location presets for testing verification scenarios
  const applyLocationPreset = (preset: 'inside' | 'nearby' | 'far_off') => {
    if (!currentClass) return;
    if (preset === 'inside') {
      // 18 meters away (well within 100m)
      setUserLat(currentClass.latitude + 0.00012);
      setUserLng(currentClass.longitude + 0.00008);
      setGeoStatus('Preset: Inside Classroom (~18m away) ✅');
    } else if (preset === 'nearby') {
      // 70 meters away (inside 100m)
      setUserLat(currentClass.latitude + 0.00055);
      setUserLng(currentClass.longitude + 0.00035);
      setGeoStatus('Preset: Campus Courtyard (~70m away) ✅');
    } else {
      // 1.8 kilometers away (off-campus violation)
      setUserLat(currentClass.latitude + 0.015);
      setUserLng(currentClass.longitude + 0.012);
      setGeoStatus('Preset: Off-Campus Apartment (~1.8km away) ❌ [Triggers Geofence Rejection]');
    }
  };

  const handleSubmitCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await api.checkIn({
        student_id: selectedStudentId,
        class_id: selectedClassId,
        token: tokenInput.trim(),
        user_lat: userLat,
        user_lng: userLng,
        device_info: navigator.userAgent.substring(0, 50),
      });

      setResult(res);
      if (res.success) {
        onCheckInSuccess();
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Check-in failed due to network or validation error.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Student Self-Check-in</h2>
              <p className="text-xs text-slate-500">Dynamic QR & Geofence Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitCheckIn} className="p-6 space-y-4">
          {/* Result Alert if available */}
          {result && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                result.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold text-sm">
                  {result.success ? 'Attendance Verified!' : 'Check-in Rejected'}
                </div>
                <p className="mt-1 leading-relaxed">{result.message}</p>
                {result.distance_meters !== undefined && (
                  <div className="mt-2 font-mono text-[11px] font-semibold">
                    Calculated distance to classroom: {result.distance_meters} meters
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Student selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Select Student Account
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {students.map((st) => (
                <option key={st.student_id} value={st.student_id}>
                  {st.name} — {st.enrollment_number} ({st.department})
                </option>
              ))}
            </select>
          </div>

          {/* Course Selection & Active Window Status */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Course Session
              </label>
              {activeSession?.is_active ? (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  Window Open (closes in {Math.max(0, Math.floor((activeSession.expires_at - Date.now()) / 60000))}m)
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  Window Closed
                </span>
              )}
            </div>

            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {classes.map((cls) => (
                <option key={cls.class_id} value={cls.class_id}>
                  {cls.course_code}: {cls.class_name} ({cls.room})
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic QR Code Token Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Dynamic QR Token
              </label>
              {activeSession && (
                <button
                  type="button"
                  onClick={() => setTokenInput(activeSession.token)}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Sync Active Code: {activeSession.token}
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. CA-XXXX-XXX"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                required
                className="w-full text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <QrCode className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Read from the projector screen. Tokens rotate every 15 seconds.
            </p>
          </div>

          {/* Geolocation Verification Section */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                Campus Geofence Boundary Check
              </span>
              <button
                type="button"
                onClick={handleGetLiveGps}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Navigation className="w-3 h-3" />
                <span>Use Real GPS</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200 font-mono">
              {geoStatus}
            </div>

            {/* Quick Test Presets */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Quick Test Location Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applyLocationPreset('inside')}
                  className="px-2 py-1 text-[11px] font-medium rounded bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                >
                  Inside Room (18m)
                </button>
                <button
                  type="button"
                  onClick={() => applyLocationPreset('nearby')}
                  className="px-2 py-1 text-[11px] font-medium rounded bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100"
                >
                  Campus Quad (70m)
                </button>
                <button
                  type="button"
                  onClick={() => applyLocationPreset('far_off')}
                  className="px-2 py-1 text-[11px] font-medium rounded bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100"
                >
                  Off-Campus (1.8km) ❌
                </button>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Geofence & QR Token...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Submit Verified Check-in</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
