import { User } from '../models/User';
import { IUserCreate, IUser } from '../types/user.types';
import mongoose from 'mongoose';

export class UserService {
    async createUser(userData: IUserCreate): Promise<IUser> {
        try {
          const user = new User(userData);
          await user.save();
          return user;
        } catch (error) {
          // Type check for MongoDB duplicate key error
          if (error instanceof mongoose.Error.ValidationError) {
            throw new Error('Invalid user data');
          }
          if (error instanceof Error && (error as any).code === 11000) {
            throw new Error('Email already exists');
          }
          throw new Error('Error creating user');
        }
      }

  async getAllUsers(): Promise<IUser[]> {
    try {
      return await User.find();
    } catch (error) {
      throw error;
    }
  }

  async getUserById(id: string): Promise<IUser | null> {
    try {
      return await User.findById(id);
    } catch (error) {
      throw error;
    }
  }

  async updateUser(id: string, userData: Partial<IUserCreate>): Promise<IUser | null> {
    try {
      return await User.findByIdAndUpdate(id, userData, { new: true });
    } catch (error) {
      throw error;
    }
  }

  async deleteUser(id: string): Promise<IUser | null> {
    try {
      return await User.findByIdAndDelete(id);
    } catch (error) {
      throw error;
    }
  }
}