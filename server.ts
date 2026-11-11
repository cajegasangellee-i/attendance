import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. Classes endpoints
  app.get('/api/classes', (req: Request, res: Response) => {
    res.json(db.getAllClasses());
  });

  app.get('/api/classes/:class_id', (req: Request, res: Response) => {
    const cls = db.getClassById(req.params.class_id);
    if (!cls) {
      res.status(404).json({ error: 'Class not found' });
      return;
    }
    res.json(cls);
  });

  // 2. Students endpoints
  app.get('/api/students', (req: Request, res: Response) => {
    const classId = req.query.class_id as string | undefined;
    res.json(db.getAllStudents(classId));
  });

  app.get('/api/students/:student_id', (req: Request, res: Response) => {
    const student = db.getStudentById(req.params.student_id);
    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }
    res.json(student);
  });

  // 3. User Requirement 2: GET /api/attendance/:student_id — Fetch history for an individual student
  app.get('/api/attendance/:student_id', (req: Request, res: Response) => {
    const summary = db.getStudentAttendanceSummary(req.params.student_id);
    if (!summary) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }
    res.json(summary);
  });

  // User Requirement 2: GET /api/attendance/class/:class_id?date=YYYY-MM-DD — Retrieve class summary report
  app.get('/api/attendance/class/:class_id', (req: Request, res: Response) => {
    const classId = req.params.class_id;
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const report = db.getClassSummaryReport(classId, date);
    if (!report) {
      res.status(404).json({ error: 'Class not found' });
      return;
    }
    res.json(report);
  });

  // User Requirement 2: POST /api/attendance — Log attendance status for a student or class
  app.post('/api/attendance', (req: Request, res: Response) => {
    const body = req.body;

    // Check if bulk update: { class_id, date, records: [{ student_id, status, remarks }] }
    if (body.class_id && body.date && Array.isArray(body.records)) {
      const updated = db.batchUpdateAttendance(body.class_id, body.date, body.records);
      res.json({ success: true, count: updated.length, records: updated });
      return;
    }

    // Single student attendance logging: { student_id, class_id, date, status, remarks, verification_method }
    if (!body.student_id || !body.class_id || !body.status) {
      res.status(400).json({ error: 'Missing required fields: student_id, class_id, status' });
      return;
    }

    const date = body.date || new Date().toISOString().split('T')[0];
    const record = db.logAttendance({
      student_id: body.student_id,
      class_id: body.class_id,
      date,
      status: body.status,
      remarks: body.remarks,
      verification_method: body.verification_method || 'Manual',
    });

    res.json({ success: true, record });
  });

  // 4. Dynamic QR Sessions & Verification
  app.post('/api/sessions/start', (req: Request, res: Response) => {
    const { class_id, duration_minutes, geofence_radius } = req.body;
    if (!class_id) {
      res.status(400).json({ error: 'class_id is required' });
      return;
    }
    try {
      const session = db.startSession(class_id, duration_minutes || 10, geofence_radius);
      res.json({ success: true, session });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/sessions/active/:class_id', (req: Request, res: Response) => {
    const session = db.getActiveSession(req.params.class_id);
    if (!session) {
      res.status(404).json({ error: 'No active session found for this class' });
      return;
    }
    res.json(session);
  });

  app.post('/api/sessions/end/:class_id', (req: Request, res: Response) => {
    const ok = db.endSession(req.params.class_id);
    res.json({ success: ok });
  });

  // Verification & Automation Check-in endpoint
  app.post('/api/sessions/check-in', (req: Request, res: Response) => {
    const { student_id, class_id, token, user_lat, user_lng, device_info } = req.body;
    if (!student_id || !class_id || !token || user_lat === undefined || user_lng === undefined) {
      res.status(400).json({
        success: false,
        message: 'Missing verification parameters: student_id, class_id, token, user_lat, user_lng are required.',
      });
      return;
    }

    const result = db.processCheckIn({
      student_id,
      class_id,
      token,
      user_lat: Number(user_lat),
      user_lng: Number(user_lng),
      device_info,
    });

    if (!result.success) {
      res.status(422).json(result);
      return;
    }

    res.json(result);
  });

  // High-level statistics
  app.get('/api/stats/overview', (req: Request, res: Response) => {
    res.json(db.getSystemStats());
  });

  // Reset database state
  app.post('/api/reset-data', (req: Request, res: Response) => {
    db.resetData();
    res.json({ success: true, message: 'Database reset to default seed data' });
  });

  // Vite middleware in dev, static files in production
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Student Attendance Portal server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
