import { Comment } from '../models/comments.model';
// Helper: recursively get all comment IDs (including replies) starting from rootCommentId


export async function getAllNestedCommentIds(rootCommentId: string): Promise<string[]> {
  const idsToDelete: string[] = [rootCommentId];
  const queue = [rootCommentId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const replies = await Comment.find({ parentComment: currentId }, { _id: 1 }).lean() as Array<{ _id: any }>;
    const replyIds = replies.map((r) => r._id.toString());
    idsToDelete.push(...replyIds);
    queue.push(...replyIds);
  }

  return idsToDelete;
}