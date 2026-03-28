const pool = require('../Config/db');

exports.getStats = async (req, res) => {
  try {
    const [[{ totalBooks }]] = await pool.query('SELECT IFNULL(SUM(total_copies), 0) as totalBooks FROM books');
    const [[{ totalStudents }]] = await pool.query('SELECT COUNT(*) as totalStudents FROM students');
    const [[{ totalIssued }]] = await pool.query('SELECT COUNT(*) as totalIssued FROM issue_records WHERE status = "ISSUED"');

    res.json({
      totalBooks: parseInt(totalBooks),
      totalStudents,
      totalIssued
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
