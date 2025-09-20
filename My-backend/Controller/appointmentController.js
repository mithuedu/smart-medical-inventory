const pool = require("../Config/db");
const multer = require("multer");
const MAX_FILE_BYTES = 6 * 1024 * 1024; // 6 MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PNG/JPEG images or PDF allowed."));
  },
});

exports.uploadReport = [
  upload.single("report"),
  async (req, res) => {
    try {
      const apptId = req.params.id;
      if (!apptId) return res.status(400).json({ success: false, message: "Missing appointment id." });
      if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded (field name 'report')." });
      const { originalname, mimetype, buffer } = req.file;
      const q = `UPDATE public.appointments
                 SET xray_report = $1, xray_report_mimetype = $2
                 WHERE id = $3
                 RETURNING id, patient_name, appointment_date, appointment_time, status`;
      const values = [buffer, mimetype, apptId];

      const result = await pool.query(q, values);
      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: "Appointment not found." });
      }

      const updated = result.rows[0];
      return res.json({ success: true, message: "Report uploaded", data: { id: updated.id }});
    } catch (err) {
      console.error("uploadReport error:", err);

      // Multer file size errors are MulterError with code 'LIMIT_FILE_SIZE'
      if (err && err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ success: false, message: "File too large. Max 6 MB allowed." });
      }
      // Validation error from fileFilter
      if (err && err.message && err.message.includes("Only PNG/JPEG")) {
        return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(500).json({ success: false, message: "Failed to upload report." });
    }
  },
];

exports.getReport = async (req, res) => {
  try {
    console.log(req.params.id)
    const apptId = req.params.id;
    const q = `SELECT id, patient_name, xray_report FROM public.appointments WHERE id = $1`;
    const { rows } = await pool.query(q, [apptId]);
    if (!rows || rows.length === 0) return res.status(404).json({ success: false, message: "Appointment not found." });

    const row = rows[0];
    const dataUri = row.xray_report;

    if (!dataUri) return res.json({ success: true, data: { hasReport: false } });
    const match = /^data:(.+);base64,(.+)$/.exec(dataUri);
    if (!match) {
      // stored in an unexpected format; return as-is
      return res.json({ success: true, data: { hasReport: true, raw: dataUri } });
    }
    const mimeType = match[1];
    const b64 = match[2];
    const buffer = Buffer.from(b64, "base64");

    if (req.query.download) {
      // send as file download
      const ext = mimeType === "application/pdf" ? "pdf" : mimeType.split("/")[1] || "bin";
      res.setHeader("Content-Disposition", `attachment; filename="report_${apptId}.${ext}"`);
      res.setHeader("Content-Type", mimeType);
      return res.send(buffer);
    }
    return res.json({
      success: true,
      data: {
        hasReport: true,
        mimeType,
        sizeBytes: buffer.length,
      },
    });
  } catch (err) {
    console.error("getReport error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch report." });
  }
};

exports.bookAppointment = async (req, res) => {
  try {
    const { patientName, doctor, department, date, time, notes,email,doctorid } = req.body;
    const query = `
      INSERT INTO appointments 
      (patient_name, doctor, department, appointment_date, appointment_time, notes,email,doctor_id) 
      VALUES ($1, $2, $3, $4, $5, $6,$7,$8)
      RETURNING *;
    `;

    const values = [patientName, doctor, department, date, time, notes,email,doctorid];

    const { rows } = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: rows[0],
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

exports.getUserAppointments = async (req, res) => {
  const { email } = req.params;
  try {
    const query = `
      SELECT 
        a.id,
        a.patient_name,
        a.doctor,
        a.department,
        a.appointment_date,
        a.appointment_time,
        a.notes,
        a.created_at,
        a.email,
        a.status,
        a.doctor_id,
        d.building_name,
        d.room_number
      FROM public.appointments a
      JOIN public.doctors d 
        ON a.doctor_id = d.id
      WHERE a.email = $1
        AND a.status IN ('pending', 'confirmed','completed')
      ORDER BY a.appointment_date DESC, a.appointment_time DESC;
    `;

    const { rows } = await pool.query(query, [email]);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Error fetching appointments:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

exports.getDoctorAppointmentsByName = async (req, res) => {
  const { doctorName } = req.params;
  console.log(doctorName)
  try {
   const query = `
  SELECT 
    a.id,
    a.patient_name,
    a.doctor,
    a.department,
    a.appointment_date,
    a.appointment_time,
    a.notes,
    a.created_at,
    a.email,
    a.status,
    a.doctor_id,
    d.building_name,
    d.room_number,
    a.xray_report,
    a.xray_report_mimetype
  FROM public.appointments a
  JOIN public.doctors d 
    ON a.doctor_id = d.id
  WHERE a.doctor = $1
    AND a.status IN ('pending', 'confirmed','completed')
  ORDER BY a.appointment_date DESC, a.appointment_time DESC;
`;

const { rows } = await pool.query(query, [doctorName]);

const out = rows.map(r => {
  if (!r.xray_report) return r;
  if (typeof r.xray_report === 'string') {
    if (r.xray_report.startsWith('data:')) {
      return r;
    }
    return r;
  }
  if (Buffer.isBuffer(r.xray_report)) {
    r.xray_report = r.xray_report.toString('base64');
    return r;
  }

  return r;
});
res.json({ success: true, data: out });
  } catch (err) {
    console.error("Error fetching doctor appointments:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

exports.updateAppointmentStatusAndPrescription = async (req, res) => {
  const { id } = req.params; // appointment id
  const { status, prescription } = req.body; // new status & prescription

  try {
    const query = `
      UPDATE public.appointments
      SET status = $1,
          prescription = $2
      WHERE id = $3
      RETURNING *;
    `;

    const { rows } = await pool.query(query, [status, prescription, id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    res.json({ success: true, message: "Updated successfully", data: rows[0] });
  } catch (err) {
    console.error("Error updating appointment:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

exports.getPrescriptionList = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, patient_name, doctor, department, appointment_date, appointment_time,
              notes, created_at, email, status, doctor_id, prescription, prescription_status
       FROM public.appointments where prescription_status = 'Pending'
       ORDER BY created_at DESC`
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching prescriptions" });
  }
};

const ALLOWED_STATUSES = ['Pending', 'In Progress', 'Completed', 'Cancelled'];

exports.updatePrescriptionStatus = async (req, res) => {
  try {
    const { id } = req.params;                 // appointment id
    const { prescription_status } = req.body; // new status

    if (!id) {
      return res.status(400).json({ success: false, message: 'Missing appointment id' });
    }
    if (!prescription_status || typeof prescription_status !== 'string') {
      return res.status(400).json({ success: false, message: 'Missing prescription_status in body' });
    }

    // basic validation against allowed values (optional)
    if (!ALLOWED_STATUSES.includes(prescription_status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid prescription_status. Allowed: ${ALLOWED_STATUSES.join(', ')}`
      });
    }

    const query = `
      UPDATE public.appointments
      SET prescription_status = $1
      WHERE id = $2
      RETURNING id, patient_name, doctor, appointment_date, appointment_time,
                prescription, prescription_status;
    `;
    const params = [prescription_status, id];

    const result = await pool.query(query, params);

    if (!result.rowCount) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('updatePrescriptionStatus error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.deleteAppointment = async (req, res) => {
  const { id } = req.params; 

  try {
    const query = `
      DELETE FROM appointments
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.json({
      success: true,
      message: "Appointment deleted successfully",
      data: rows[0],
    });
  } catch (err) {
    console.error("Error deleting appointment:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
