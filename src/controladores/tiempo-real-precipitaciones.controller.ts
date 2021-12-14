import { Request, Response, NextFunction } from 'express';

export const getUsuarios = async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({ ok: true, data: 'Hello from Ornio AS' });
};
