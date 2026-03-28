const pool = require('../Config/db');

exports.getAllStudents = async (req, res) => {
  try {
    const [students] = await pool.query('SELECT * FROM students ORDER BY created_at DESC');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

exports.createStudent = async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    const [existing] = await pool.query('SELECT * FROM students WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ message: 'Student with this email already exists' });

    const [result] = await pool.query(
      'INSERT INTO students (name, email, phone) VALUES (?, ?, ?)',
      [name, email, phone]
    );

    // Auto-assign the unique student_id based on the new ID
    const newId = result.insertId;
    const student_id = `STU-${newId.toString().padStart(4, '0')}`;
    await pool.query('UPDATE students SET student_id = ? WHERE id = ?', [student_id, newId]);

    res.status(201).json({ message: 'Student created successfully', student_id });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

exports.updateStudent = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;
  try {
    await pool.query(
      'UPDATE students SET name = ?, email = ?, phone = ? WHERE id = ?',
      [name, email, phone, id]
    );
    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

exports.deleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM students WHERE id = ?', [id]);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};
