import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { IUserDocument } from '../models/User';

interface JwtPayload {
  id: string;
  email: string;
}

export const generateToken = (user: IUserDocument): string => {
  // Ensure _id exists and is of correct type
  if (!user._id || !(user._id instanceof Types.ObjectId)) {
    throw new Error('Invalid user ID');
  }

  const payload: JwtPayload = {
    id: user._id.toString(),
    email: user.email
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};