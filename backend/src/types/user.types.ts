export interface IUser {
    email: string;
    firstName: string;
    lastName: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface IUserCreate {
    email: string;
    firstName: string;
    lastName: string;
  }