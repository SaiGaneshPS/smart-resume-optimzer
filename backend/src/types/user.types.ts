import { Types } from 'mongoose';

export interface IUser {
    _id: Types.ObjectId;
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
    googleId?: string;
    isEmailVerified: boolean;
    verificationToken?: string;
    resetPasswordToken?: string;
    resetPasswordExpire?: Date;
    profilePicture?: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface IUserCreate {
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
    googleId?: string;
  }
  
  export interface IUserLogin {
    email: string;
    password: string;
  }
  
  export interface IAuthTokens {
    accessToken: string;
    refreshToken?: string;
  }