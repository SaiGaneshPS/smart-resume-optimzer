import express from 'express';
import { UserController } from '../controllers/userController';

const router = express.Router();
const userController = new UserController();

// POST /api/users
router.post('/', (req, res) => userController.createUser(req, res));

// GET /api/users
router.get('/', (req, res) => userController.getAllUsers(req, res));

// GET /api/users/:id
router.get('/:id', (req, res) => userController.getUserById(req, res));

// PUT /api/users/:id
router.put('/:id', (req, res) => userController.updateUser(req, res));

// DELETE /api/users/:id
router.delete('/:id', (req, res) => userController.deleteUser(req, res));

export default router;