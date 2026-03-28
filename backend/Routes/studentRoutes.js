const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middleware/authMiddleware');
const { getAllStudents, createStudent, updateStudent, deleteStudent } = require('../Controllers/studentController');

router.use(authMiddleware);

router.get('/', getAllStudents);
router.post('/', createStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

module.exports = router;
