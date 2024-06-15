import { Request, Response, NextFunction } from 'express';
import getAuthToken from '../utils/getAuthToken';

const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = await getAuthToken();
    req.headers['Authorization'] = `Bearer ${token}`;
    next();
  } catch (error) {
    res.status(500).send('Authentication failed');
  }
};

export default authenticate;
