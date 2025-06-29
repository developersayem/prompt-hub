
export interface IComment {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar: string;
  };
  text: string;
  createdAt: string;
  likes: string[]; // user IDs who liked the comment
  replies: IComment[];
}