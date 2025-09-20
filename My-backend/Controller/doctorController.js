const pool = require("../Config/db");

exports.getAllDoctors = async (req, res) => {
  try {
    const query = `
      SELECT id, name, department, building_name, room_number, created_at
      FROM doctors
      ORDER BY name;
    `;
    const { rows } = await pool.query(query);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
