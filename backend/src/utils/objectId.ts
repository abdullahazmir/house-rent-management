import { ObjectId } from 'mongodb';
import { NotFoundError } from './errors';

export function parseObjectId(id: string | string[] | undefined, notFoundMessage = 'Resource not found'): ObjectId {
  if (typeof id !== 'string' || !ObjectId.isValid(id)) {
    throw new NotFoundError(notFoundMessage);
  }
  return new ObjectId(id);
}
