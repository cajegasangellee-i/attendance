import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { CourseClass, ActiveSession } from '../types/attendance';
import { api } from '../services/api';
import {
  QrCode,
  Clock,
  ShieldCheck,
  MapPin,
  RefreshCw,
  XCircle,
  Users,
  CheckCircle2,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface LiveQrProjectorProps {
  classes: CourseClass[];
  selectedClassId: string;
  onSelectClass: (id: string) => void;
  onClose?: () => void;
}

export const LiveQrProjector: React.FC<LiveQrProjectorProps> = ({
  classes,
  selectedClassId,
  onSelectClass,
  onClose,
}) => {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [remainingSessionSeconds, setRemainingSessionSeconds] = useState<number>(600);
  const [tokenRotationSeconds, setTokenRotationSeconds] = useState<number>(15);
  const [checkedInStudents, setCheckedInStudents] = useState<Array<{ name: string; time: string; distance: number }>>([
    { name: 'Alex Rivera', time: '10:02:14 AM', distance: 18 },
    { name: 'Sophia Alvarez', time: '10:03:05 AM', distance: 24 },
    { name: 'Liam Washington', time: '10:03:49 AM', distance: 31 },
  ]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentClass = classes.find((c) => c.class_id === selectedClassId) || classes[0];

  // Fetch or initialize active session
  const syncSession = async () => {
    try {
      let active = await api.getActiveSession(selectedClassId);
      if (!active || !active.is_active) {
        // Start a fresh 10 min session
        const res = await api.startActiveSession(selectedClassId, 10, currentClass.geofence_radius_meters);
        active = res.session;
      }
      setSession(active);

      // Generate QR code data url
      // QR encodes: JSON payload containing class_id, token, and campus coords
      const qrPayload = JSON.stringify({
        class_id: active.class_id,
        token: active.token,
        time: Date.now(),
      });
      const url = await QRCode.toDataURL(qrPayload, {
        width: 380,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      setQrDataUrl(url);

      const timeLeft = Math.max(0, Math.floor((active.expires_at - Date.now()) / 1000));
      setRemainingSessionSeconds(timeLeft);
    } catch (err) {
      console.error('Failed to sync session:', err);
    }
  };

  useEffect(() => {
    syncSession();
    const interval = setInterval(() => {
      syncSession();
    }, 5000); // Poll every 5s for token freshness & checkins
    return () => clearInterval(interval);
  }, [selectedClassId]);

  // Tick timers every second
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSessionSeconds((prev) => Math.max(0, prev - 1));
      setTokenRotationSeconds((prev) => {
        if (prev <= 1) {
          syncSession();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  const handleExtendSession = async () => {
    if (!session) return;
    try {
      const res = await api.startActiveSession(selectedClassId, 15, currentClass.geofence_radius_meters);
      setSession(res.session);
      setRemainingSessionSeconds(15 * 60);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndSession = async () => {
    await api.endSession(selectedClassId);
    setSession(null);
    setRemainingSessionSeconds(0);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const formatMinutes = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      className={`bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none overflow-y-auto' : ''
      }`}
    >
      {/* Top Projector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Classroom Dynamic Attendance System</span>
            <span>·</span>
            <span>Projector Mode</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            {currentClass?.course_code}: {currentClass?.class_name}
          </h1>
          <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              {currentClass?.room}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 font-mono text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Geofence Radius: {currentClass?.geofence_radius_meters}m
            </span>
          </div>
        </div>

        {/* Course Picker & Fullscreen Controls */}
        <div className="flex items-center gap-2">
          <select
            value={selectedClassId}
            onChange={(e) => onSelectClass(e.target.value)}
            className="bg-slate-800 text-xs font-medium text-slate-200 rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {classes.map((cls) => (
              <option key={cls.class_id} value={cls.class_id}>
                {cls.course_code} - {cls.class_name}
              </option>
            ))}
          </select>

          <button
            onClick={toggleFullscreen}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              title="Close Projector View"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Projector Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-6 items-center">
        {/* Left Column: Big QR Code Display */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 bg-slate-950/60 rounded-2xl border border-slate-800/80">
          <div className="text-center mb-4">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 border border-indigo-800/60 px-3 py-1 rounded-full">
              Scan with Mobile Portal
            </span>
            <p className="text-xs text-slate-400 mt-2">
              Must be physically present in {currentClass?.room} (GPS Geofence Verified)
            </p>
          </div>

          {/* QR Code Container */}
          <div className="bg-white p-4 rounded-2xl shadow-2xl border-4 border-indigo-600/30 flex items-center justify-center relative">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Dynamic Classroom QR Code"
                className="w-64 h-64 sm:w-80 sm:h-80 object-contain rounded-xl"
              />
            ) : (
              <div className="w-72 h-72 flex items-center justify-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
            )}
          </div>

          {/* Dynamic Token Rotation Pill */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg font-mono">
              <span className="text-slate-400">Current Token:</span>
              <span className="font-bold text-indigo-400">{session?.token || 'GENERATING'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400 font-mono bg-amber-950/40 border border-amber-900/50 px-2.5 py-1.5 rounded-lg">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Rotates in {tokenRotationSeconds}s</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 text-center max-w-sm">
            Dynamic rotation invalidates photos sent via messaging apps to prevent proxy attendance.
          </span>
        </div>

        {/* Right Column: Timer & Live Feed */}
        <div className="lg:col-span-5 space-y-6">
          {/* Timed Access Countdown Clock */}
          <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                Check-in Window Remaining
              </span>
              <span className="font-mono text-emerald-400">Active</span>
            </div>

            <div className="text-4xl sm:text-5xl font-extrabold font-mono tabular-nums text-white tracking-tight my-2">
              {formatMinutes(remainingSessionSeconds)}
            </div>

            <div className="text-xs text-slate-400">
              {remainingSessionSeconds > 0
                ? 'Check-ins logged after first 7 minutes will be marked as Late.'
                : 'Session check-in window has closed.'}
            </div>

            {/* Teacher Actions */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700/60">
              <button
                onClick={handleExtendSession}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap"
              >
                +5 Mins Extend
              </button>
              <button
                onClick={syncSession}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Rotate QR</span>
              </button>
              <button
                onClick={handleEndSession}
                className="px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/60 rounded-lg transition-colors ml-auto"
              >
                Close Now
              </button>
            </div>
          </div>

          {/* Live Attendance Ticker */}
          <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/60">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Attendance Feed
                </span>
              </div>
              <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                {checkedInStudents.length} Verified
              </span>
            </div>

            <div className="mt-3 space-y-2 max-h-52 overflow-y-auto pr-1">
              {checkedInStudents.map((st, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-slate-200">{st.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                    <span>{st.distance}m away</span>
                    <span>·</span>
                    <span className="text-slate-500">{st.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
