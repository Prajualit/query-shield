import type { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string; // Prisma uses string IDs by default
        [key: string]: any;
      };
    }
  }
}

type AsyncHandlerFn = (req: Request, res: Response, next: NextFunction) => Promise<any>;

/**
 * Generic async handler for Express routes with Prisma/Postgres
 */
const asyncHandler = (fn: AsyncHandlerFn) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      return await fn(req, res, next);
    } catch (error: any) {
      // Prisma-specific error handling
      let statusCode = 500;
      let message = "Internal Server Error";

      // Unique constraint violation (Postgres)
      if (error?.code === "P2002") { // Prisma unique constraint code
        statusCode = 409;
        message = "Duplicate record exists";
      }

      // Custom error object with statusCode
      if (typeof error?.statusCode === "number") {
        statusCode = error.statusCode;
        message = error.message || message;
      }

      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  };

export { asyncHandler };
