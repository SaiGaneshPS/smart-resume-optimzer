import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { IUserCreate } from '../types/user.types';

const userService = new UserService();

export class UserController {
    async createUser(req: Request, res: Response): Promise<void> {
      try {
        const userData: IUserCreate = req.body;
        const user = await userService.createUser(userData);
        res.status(201).json(user);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Email already exists') {
            res.status(409).json({ error: error.message });
          } else {
            res.status(500).json({ error: error.message });
          }
        } else {
          res.status(500).json({ error: 'An unknown error occurred' });
        }
      }
    }

  async getAllUsers(_req: Request, res: Response): Promise<void> {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching users' });
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const user = await userService.getUserById(req.params.id);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching user' });
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: 'Error updating user' });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await userService.deleteUser(req.params.id);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Error deleting user' });
    }
  }
}