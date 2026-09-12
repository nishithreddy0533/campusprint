import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'username and password are required.' });
  }

  const validUser = process.env.STAFF_USERNAME;
  const validPass = process.env.STAFF_PASSWORD;

  if (username !== validUser || password !== validPass) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const token = jwt.sign(
    { username, role: 'staff' },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  return res.status(200).json({ token });
});

export default router;
