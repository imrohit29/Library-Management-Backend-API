const pool = require('../Config/db');

exports.getAllBooks = async (req, res) => {
  const { search } = req.query;
  try {
    let query = 'SELECT * FROM books';
    let params = [];
    if (search) {
      query += ' WHERE title LIKE ? OR author LIKE ? OR isbn LIKE ?';
      const searchParam = `%${search}%`;
      params = [searchParam, searchParam, searchParam];
    }
    const [books] = await pool.query(query + ' ORDER BY created_at DESC', params);
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

exports.createBook = async (req, res) => {
  const { title, author, isbn, total_copies } = req.body;
  try {
    // Check ISBN
    const [existing] = await pool.query('SELECT * FROM books WHERE isbn = ?', [isbn]);
    if (existing.length > 0) return res.status(400).json({ message: 'Book with this ISBN already exists' });

    await pool.query(
      'INSERT INTO books (title, author, isbn, total_copies, available_copies) VALUES (?, ?, ?, ?, ?)',
      [title, author, isbn, total_copies, total_copies]
    );
    res.status(201).json({ message: 'Book created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

exports.updateBook = async (req, res) => {
  const { id } = req.params;
  const { title, author, isbn, total_copies } = req.body;
  try {
    const [bookRes] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);
    if (bookRes.length === 0) return res.status(404).json({ message: 'Book not found' });
    const book = bookRes[0];

    const copyDiff = total_copies - book.total_copies;
    const newAvailable = Math.max(0, book.available_copies + copyDiff);

    await pool.query(
      'UPDATE books SET title = ?, author = ?, isbn = ?, total_copies = ?, available_copies = ? WHERE id = ?',
      [title, author, isbn, total_copies, newAvailable, id]
    );
    res.json({ message: 'Book updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

exports.deleteBook = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM books WHERE id = ?', [id]);
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};
