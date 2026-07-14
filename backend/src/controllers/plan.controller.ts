import type { Request, Response } from 'express';
import { getPlansCollection } from '../db/collections';
import { parseObjectId } from '../utils/objectId';
import { NotFoundError } from '../utils/errors';
import type { CreatePlanInput, UpdatePlanInput } from '../validators/plan.validators';

export async function listPublicPlans(_req: Request, res: Response): Promise<void> {
  const plans = await getPlansCollection().find({ isActive: true }).sort({ sortOrder: 1 }).toArray();
  res.status(200).json(plans);
}

export async function listAllPlans(_req: Request, res: Response): Promise<void> {
  const plans = await getPlansCollection().find({}).sort({ sortOrder: 1 }).toArray();
  res.status(200).json(plans);
}

export async function createPlan(req: Request<unknown, unknown, CreatePlanInput>, res: Response): Promise<void> {
  const now = new Date();
  const doc = { ...req.body, isActive: true, createdAt: now, updatedAt: now };
  const result = await getPlansCollection().insertOne(doc);
  res.status(201).json({ _id: result.insertedId, ...doc });
}

export async function updatePlan(
  req: Request<{ id: string }, unknown, UpdatePlanInput>,
  res: Response,
): Promise<void> {
  const _id = parseObjectId(req.params.id, 'Plan not found');
  const result = await getPlansCollection().findOneAndUpdate(
    { _id },
    { $set: { ...req.body, updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
  if (!result) throw new NotFoundError('Plan not found');
  res.status(200).json(result);
}
