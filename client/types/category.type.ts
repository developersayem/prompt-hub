export interface ICategory {
  _id:string;
  name: string;
  isUserCreated?: boolean;
  creator?: string;
  createdAt: string;
  updatedAt: string;
}