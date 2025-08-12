declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        // add more if your token has other fields
      };
    }
  }
}
