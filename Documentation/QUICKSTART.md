# 🚀 QueryShield - Quick Start Guide

## Get Started NOW - First 2 Hours

This guide will help you build your first working feature in the next 2 hours.

---

## ⚡ Immediate Setup (15 minutes)

### 1. Install Missing Dependencies

```bash
# In server directory
cd server
npm install bcryptjs jsonwebtoken dotenv express-validator
npm install @types/bcryptjs @types/jsonwebtoken --save-dev

# In client directory
cd ../client
npm install axios zustand
npm install @tanstack/react-query
```

### 2. Create Environment File

```bash
# In server directory
touch .env
```

Add this to `server/.env`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/queryshield?schema=public"

# JWT Secrets (CHANGE THESE!)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars-long-change-me"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars-long-change-me"
JWT_EXPIRE="7d"
JWT_REFRESH_EXPIRE="30d"

# Server
PORT=5000
NODE_ENV="development"
CLIENT_URL="http://localhost:3000"

# AI Providers (add later)
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
```

### 3. Update Prisma Schema

Replace your `server/prisma/schema.prisma` with the enhanced version from PHASE_1_CHECKLIST.md

### 4. Run Migration

```bash
cd server
npx prisma migrate dev --name enhanced_schema
npx prisma generate
```

---

## 🎯 Task 1: Build Authentication (60 minutes)

### Step 1: Create Types (5 min)

Create `server/src/types/index.ts`:

```typescript
import { Request } from "express";

export interface UserPayload {
  id: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

export interface RegisterDTO {
  email: string;
  password: string;
  name?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}
```

### Step 2: JWT Utilities (10 min)

Create `server/src/utils/jwt.util.ts`:

```typescript
import jwt from "jsonwebtoken";
import { UserPayload } from "../types";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || "30d";

export const generateAccessToken = (payload: UserPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

export const generateRefreshToken = (payload: UserPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRE,
  });
};

export const verifyAccessToken = (token: string): UserPayload => {
  return jwt.verify(token, JWT_SECRET) as UserPayload;
};

export const verifyRefreshToken = (token: string): UserPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as UserPayload;
};
```

### Step 3: Auth Middleware (10 min)

Create `server/src/middleware/auth.middleware.ts`:

```typescript
import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { verifyAccessToken } from "../utils/jwt.util";
import { ApiError } from "../utils/apiError";

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "No token provided");
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    req.user = decoded;
    next();
  } catch (error) {
    next(new ApiError(401, "Invalid or expired token"));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "Forbidden - Insufficient permissions"));
    }

    next();
  };
};
```

### Step 4: Auth Controller (20 min)

Create `server/src/controllers/auth.controller.ts`:

```typescript
import { Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db";
import { AuthRequest, RegisterDTO, LoginDTO } from "../types";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.util";

export const register = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { email, password, name }: RegisterDTO = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ApiError(400, "Email already registered");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json(
      new ApiResponse(
        201,
        {
          user,
          accessToken,
          refreshToken,
        },
        "User registered successfully"
      )
    );
  }
);

export const login = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { email, password }: LoginDTO = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json(
      new ApiResponse(
        200,
        {
          user: userWithoutPassword,
          accessToken,
          refreshToken,
        },
        "Login successful"
      )
    );
  }
);

export const getCurrentUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    res
      .status(200)
      .json(new ApiResponse(200, user, "User retrieved successfully"));
  }
);
```

### Step 5: Auth Routes (5 min)

Create `server/src/routes/auth.routes.ts`:

```typescript
import { Router } from "express";
import {
  register,
  login,
  getCurrentUser,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getCurrentUser);

export default router;
```

### Step 6: Update app.ts (5 min)

Update `server/src/app.ts`:

```typescript
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
  });
});

export { app };
```

### Step 7: Test! (5 min)

```bash
# Start server
cd server
npm run dev

# Test with curl or Postman
# Register:
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login:
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get Current User (use token from login response):
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🎯 Task 2: Build Simple Detection (45 minutes)

### Step 1: Pattern Library (10 min)

Create `server/src/services/detection/patterns.ts`:

```typescript
export interface Pattern {
  type: string;
  regex: RegExp;
  description: string;
  confidence: number;
}

export const PATTERNS: Pattern[] = [
  {
    type: "EMAIL",
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    description: "Email address",
    confidence: 95,
  },
  {
    type: "PHONE",
    regex: /\b(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b/g,
    description: "Phone number",
    confidence: 85,
  },
  {
    type: "CREDIT_CARD",
    regex: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
    description: "Credit card number",
    confidence: 90,
  },
  {
    type: "SSN",
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    description: "Social Security Number",
    confidence: 98,
  },
  {
    type: "IP_ADDRESS",
    regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    description: "IP Address",
    confidence: 85,
  },
];

export const getPatternByType = (type: string): Pattern | undefined => {
  return PATTERNS.find((p) => p.type === type);
};
```

### Step 2: Detector Service (15 min)

Create `server/src/services/detection/detector.service.ts`:

```typescript
import { PATTERNS, Pattern } from "./patterns";

export interface DetectedItem {
  type: string;
  value: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
}

export class DetectorService {
  detect(text: string, patternTypes?: string[]): DetectedItem[] {
    const results: DetectedItem[] = [];
    const patterns = patternTypes
      ? PATTERNS.filter((p) => patternTypes.includes(p.type))
      : PATTERNS;

    patterns.forEach((pattern) => {
      const matches = text.matchAll(pattern.regex);
      for (const match of matches) {
        if (match.index !== undefined) {
          results.push({
            type: pattern.type,
            value: match[0],
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            confidence: pattern.confidence,
          });
        }
      }
    });

    return results.sort((a, b) => a.startIndex - b.startIndex);
  }

  hasIssues(text: string): boolean {
    return this.detect(text).length > 0;
  }
}

export const detectorService = new DetectorService();
```

### Step 3: Sanitizer Service (10 min)

Create `server/src/services/detection/sanitizer.service.ts`:

```typescript
import { DetectedItem } from "./detector.service";

export class SanitizerService {
  redact(text: string, items: DetectedItem[]): string {
    let sanitized = text;
    let offset = 0;

    items.forEach((item) => {
      const replacement = `[${item.type}_REDACTED]`;
      const start = item.startIndex + offset;
      const end = item.endIndex + offset;

      sanitized =
        sanitized.substring(0, start) + replacement + sanitized.substring(end);
      offset += replacement.length - (item.endIndex - item.startIndex);
    });

    return sanitized;
  }

  mask(text: string, items: DetectedItem[]): string {
    let sanitized = text;
    let offset = 0;

    items.forEach((item) => {
      const length = item.value.length;
      const visibleChars = Math.min(4, Math.floor(length / 3));
      const replacement =
        "*".repeat(length - visibleChars) + item.value.slice(-visibleChars);

      const start = item.startIndex + offset;
      const end = item.endIndex + offset;

      sanitized =
        sanitized.substring(0, start) + replacement + sanitized.substring(end);
      offset += replacement.length - (item.endIndex - item.startIndex);
    });

    return sanitized;
  }

  sanitize(
    text: string,
    items: DetectedItem[],
    action: "REDACT" | "MASK" | "BLOCK"
  ): string {
    if (action === "BLOCK") {
      throw new Error("Sensitive data detected. Request blocked.");
    }

    return action === "REDACT"
      ? this.redact(text, items)
      : this.mask(text, items);
  }
}

export const sanitizerService = new SanitizerService();
```

### Step 4: Test Detection (10 min)

Create `server/src/routes/test.routes.ts`:

```typescript
import { Router } from "express";
import { detectorService } from "../services/detection/detector.service";
import { sanitizerService } from "../services/detection/sanitizer.service";
import { ApiResponse } from "../utils/apiResponse";

const router = Router();

router.post("/detect", (req, res) => {
  const { text } = req.body;

  const detectedItems = detectorService.detect(text);
  const sanitized = sanitizerService.redact(text, detectedItems);

  res.json(
    new ApiResponse(
      200,
      {
        original: text,
        sanitized,
        detected: detectedItems,
        count: detectedItems.length,
      },
      "Detection completed"
    )
  );
});

export default router;
```

Add to `app.ts`:

```typescript
import testRoutes from "./routes/test.routes";
app.use("/api/test", testRoutes);
```

Test it:

```bash
curl -X POST http://localhost:5000/api/test/detect \
  -H "Content-Type: application/json" \
  -d '{"text":"Contact me at john@email.com or call 555-123-4567"}'
```

---

## 🎨 Bonus: Simple Frontend Login (Optional)

Update `client/src/app/page.tsx`:

```typescript
"use client";

import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult("Error: " + error);
    }
  };

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">QueryShield Login</h1>

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Login
        </button>
      </form>

      {result && (
        <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
          {result}
        </pre>
      )}
    </main>
  );
}
```

---

## ✅ What You've Built

After these 2 hours, you have:

✅ **Complete authentication system** with JWT
✅ **Working detection engine** that finds sensitive data
✅ **Sanitization system** that redacts/masks data
✅ **Test endpoint** to try everything out
✅ **Solid foundation** for the rest of the project

---

## 📋 Next Steps

1. ✅ Complete Phase 1 (see PHASE_1_CHECKLIST.md)
2. 🔄 Build API Proxy Layer
3. 📊 Create Dashboard UI
4. 🚀 Deploy to production

---

## 🆘 Troubleshooting

**Database connection error?**

```bash
# Make sure PostgreSQL is running
# Update DATABASE_URL in .env with correct credentials
```

**Module not found errors?**

```bash
cd server && npm install
cd client && npm install
```

**Prisma errors?**

```bash
npx prisma generate
npx prisma migrate dev
```

**Port already in use?**

```bash
# Change PORT in .env to something else (e.g., 5001)
```

---

## 🎉 You're Ready!

You now have a working foundation. Follow the ROADMAP.md to continue building!

**Questions?** Check the other documentation files:

- `ROADMAP.md` - Complete development plan
- `PHASE_1_CHECKLIST.md` - Detailed Phase 1 tasks
- `ARCHITECTURE.md` - System design overview

**Keep coding! 🚀**
