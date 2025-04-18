import express from 'express';
import { createUser, loginUser } from '../controllers/UserController';
import generateToken from '../middleware/tokenGeneration';

const router = express.Router();

// Apply the generateToken middleware AFTER the controllers set req.user
router.post('/register', createUser, generateToken, (req, res) => {
  // The final response after token is generated
  res.status(201).send({ user: req.user, token: req.token });
});

router.post('/login', loginUser, generateToken, (req, res) => {
  // The final response after token is generated
  res.send({ user: req.user, token: req.token });
});

export default router;