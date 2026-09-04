const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// MySQL Connection Pool for XAMPP
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',      // Default XAMPP username
  password: '',      // Default XAMPP password
  database: 'student_management_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test Route
app.get('/', (req, res) => {
  res.send('Student Management System MySQL Backend is Running!');
});

// GET: Fetch all students
app.get('/api/students', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM students ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// POST: Add a new student
app.post('/api/students', async (req, res) => {
  try {
    const { name, email, phone, dob, address, gender, course } = req.body;
    
    if (!name || !email || !dob || !gender || !course) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const [result] = await db.query(
      'INSERT INTO students (name, email, phone, dob, address, gender, course) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, phone || '', dob, address || '', gender, course]
    );

    res.status(201).json({ message: 'Student added successfully', id: result.insertId });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// PUT: Update student details (Supports both /api/students and /api/students/:id)
app.put(['/api/students', '/api/students/:id'], async (req, res) => {
  try {
    const id = req.params.id || req.body.id;
    const { name, email, phone, dob, address, gender, course } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const [result] = await db.query(
      'UPDATE students SET name = ?, email = ?, phone = ?, dob = ?, address = ?, gender = ?, course = ? WHERE id = ?',
      [name, email, phone || '', dob, address || '', gender, course, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student record not found' });
    }

    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// DELETE: Remove a student (Supports both /api/students?id=1 and /api/students/1)
app.delete(['/api/students', '/api/students/:id'], async (req, res) => {
  try {
    const id = req.params.id || req.query.id || req.body.id;
    if (!id) return res.status(400).json({ error: 'ID is required' });

    const [result] = await db.query('DELETE FROM students WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student record not found' });
    }

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});