const pool = require('../Config/db');

exports.getAllTransactions = async (req, res) => {
  try {
    const [transactions] = await pool.query(`
      SELECT ir.*, s.name as student_name, b.title as book_title
      FROM issue_records ir
      JOIN students s ON ir.student_id = s.id
      JOIN books b ON ir.book_id = b.id
      ORDER BY ir.issue_date DESC
    `);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

exports.issueBook = async (req, res) => {
  const { student_id, book_id, due_date } = req.body;
  try {
    // Check if book is available
    const [books] = await pool.query('SELECT * FROM books WHERE id = ?', [book_id]);
    if (books.length === 0) return res.status(404).json({ message: 'Book not found' });
    const book = books[0];

    if (book.available_copies <= 0) {
      return res.status(400).json({ message: 'This book is not available right now.' });
    }

    // Prevent issuing same book multiple times to same student concurrently
    const [existingIssues] = await pool.query(
      'SELECT * FROM issue_records WHERE student_id = ? AND book_id = ? AND status = "ISSUED"',
      [student_id, book_id]
    );
    if (existingIssues.length > 0) {
      return res.status(400).json({ message: 'Student already has this book issued.' });
    }

    // Issue Book Due Date Logic
    const reqDueDate = due_date ? new Date(due_date) : new Date(new Date().setDate(new Date().getDate() + 7));
    const maxDueDate = new Date();
    maxDueDate.setDate(maxDueDate.getDate() + 7);
    
    reqDueDate.setHours(0,0,0,0);
    maxDueDate.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);

    if (reqDueDate > maxDueDate) {
      return res.status(400).json({ message: 'Due date cannot exceed 1 week from today.' });
    }
    if (reqDueDate < today) {
      return res.status(400).json({ message: 'Due date cannot be in the past.' });
    }

    const issueDateStr = new Date().toISOString().split('T')[0];
    const dueDateStr = reqDueDate.toISOString().split('T')[0];

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.query(
        'INSERT INTO issue_records (student_id, book_id, issue_date, due_date, status) VALUES (?, ?, ?, ?, "ISSUED")',
        [student_id, book_id, issueDateStr, dueDateStr]
      );
      await connection.query('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?', [book_id]);
      
      await connection.commit();
      res.status(201).json({ message: 'Book issued successfully' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

exports.returnBook = async (req, res) => {
  const { issue_id } = req.body;
  try {
    const [records] = await pool.query('SELECT * FROM issue_records WHERE id = ?', [issue_id]);
    if (records.length === 0) return res.status(404).json({ message: 'Issue record not found' });
    
    const record = records[0];
    if (record.status === 'RETURNED') {
      return res.status(400).json({ message: 'Book already returned' });
    }

    const returnDate = new Date();
    const dueDate = new Date(record.due_date);
    
    // Calculate Fine
    let fineAmount = 0;
    const timeDiff = returnDate.getTime() - dueDate.getTime();
    if (timeDiff > 0) {
      const daysExtra = Math.ceil(timeDiff / (1000 * 3600 * 24));
      fineAmount = daysExtra * 5; // Rs. 5 per day
    }

    const returnDateStr = returnDate.toISOString().split('T')[0];

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.query(
        'UPDATE issue_records SET return_date = ?, fine_amount = ?, status = "RETURNED" WHERE id = ?',
        [returnDateStr, fineAmount, issue_id]
      );
      await connection.query('UPDATE books SET available_copies = available_copies + 1 WHERE id = ?', [record.book_id]);

      await connection.commit();
      res.json({ message: 'Book returned successfully', fineAmount });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};
