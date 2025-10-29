# ⚡ QueryShield - Developer Cheat Sheet

Quick reference for common commands, code snippets, and troubleshooting.

---

## 🚀 Quick Commands

### Development
```bash
# Start both servers
cd server && npm run dev           # Backend: http://localhost:5000
cd client && npm run dev            # Frontend: http://localhost:3000

# Database
npx prisma studio                   # View/edit database
npx prisma migrate dev              # Run migration
npx prisma migrate dev --name <name> # Create named migration
npx prisma migrate reset            # Reset database (DEV ONLY!)
npx prisma generate                 # Regenerate Prisma Client
npx prisma db seed                  # Run seed file

# Install dependencies
npm install <package>               # Add package
npm install -D <package>            # Add dev dependency
npm update                          # Update all packages

# Git
git status                          # Check status
git add .                           # Stage all changes
git commit -m "feat: description"   # Commit with message
git push origin main                # Push to remote
git checkout -b feature/name        # Create feature branch
```

---

## 📁 Important File Paths

### Backend
```
server/
├── src/
│   ├── server.ts                  # Entry point
│   ├── app.ts                     # Express app config
│   ├── controllers/               # Request handlers
│   ├── routes/                    # API routes
│   ├── services/                  # Business logic
│   ├── middleware/                # Request middleware
│   ├── utils/                     # Helper functions
│   └── types/                     # TypeScript types
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── migrations/                # Migration history
└── .env                           # Environment variables
```

### Frontend
```
client/
├── src/
│   ├── app/                       # Next.js pages
│   │   ├── (auth)/               # Auth pages
│   │   └── (dashboard)/          # Dashboard pages
│   ├── components/                # React components
│   ├── lib/                       # Utilities
│   └── hooks/                     # Custom hooks
└── public/                        # Static assets
```

---

## 🔑 Environment Variables

### server/.env
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/queryshield"

# JWT
JWT_SECRET="your-super-secret-key-min-32-characters"
JWT_REFRESH_SECRET="your-refresh-secret-key-min-32-characters"
JWT_EXPIRE="7d"
JWT_REFRESH_EXPIRE="30d"

# Server
PORT=5000
NODE_ENV="development"
CLIENT_URL="http://localhost:3000"

# AI Providers (add when ready)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Email (Phase 3)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# Stripe (Phase 4)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

---

## 🔐 Authentication Flow

### Register User
```typescript
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}

// Response:
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "name": "..." },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```

### Login
```typescript
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Protected Request
```typescript
GET /api/auth/me
Authorization: Bearer eyJhbGciOi...
```

---

## 🔍 Detection Patterns

### Email
```regex
/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
```
**Examples:** john@example.com, test.user+tag@domain.co.uk

### Phone Number
```regex
/\b(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b/g
```
**Examples:** 555-123-4567, (555) 123-4567, +1-555-123-4567

### Credit Card
```regex
/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g
```
**Examples:** 4111-1111-1111-1111, 4111111111111111

### SSN
```regex
/\b\d{3}-\d{2}-\d{4}\b/g
```
**Examples:** 123-45-6789

### IP Address
```regex
/\b(?:\d{1,3}\.){3}\d{1,3}\b/g
```
**Examples:** 192.168.1.1, 10.0.0.1

### API Key (Generic)
```regex
/\b[A-Za-z0-9_-]{32,}\b/g
```
**Examples:** sk_test_4eC39HqLyjWDarjtT1zdp7dc

---

## 💻 Common Code Snippets

### Create Prisma Model Instance
```typescript
import { prisma } from '../db';

// Create
const user = await prisma.user.create({
  data: {
    email: 'test@example.com',
    password: hashedPassword,
    name: 'Test User',
  },
});

// Find
const user = await prisma.user.findUnique({
  where: { email: 'test@example.com' },
});

// Update
const updated = await prisma.user.update({
  where: { id: userId },
  data: { name: 'New Name' },
});

// Delete
await prisma.user.delete({
  where: { id: userId },
});

// Find Many with filters
const firewalls = await prisma.firewall.findMany({
  where: { userId: req.user!.id },
  include: { rules: true },
  orderBy: { createdAt: 'desc' },
});
```

### Error Handling with asyncHandler
```typescript
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';

export const myController = asyncHandler(async (req, res) => {
  // Validation
  if (!req.body.email) {
    throw new ApiError(400, 'Email is required');
  }

  // Business logic
  const result = await someService.doSomething();

  // Success response
  res.status(200).json(
    new ApiResponse(200, result, 'Success message')
  );
});
```

### Protected Route
```typescript
import { authenticate } from '../middleware/auth.middleware';

router.get('/protected', authenticate, myController);
router.get('/admin-only', authenticate, authorize('ADMIN'), adminController);
```

### Detection & Sanitization
```typescript
import { detectorService } from '../services/detection/detector.service';
import { sanitizerService } from '../services/detection/sanitizer.service';

const text = "Contact me at john@email.com or 555-1234";

// Detect
const detected = detectorService.detect(text);
// [{ type: 'EMAIL', value: 'john@email.com', ... }]

// Sanitize
const sanitized = sanitizerService.redact(text, detected);
// "Contact me at [EMAIL_REDACTED] or [PHONE_REDACTED]"

// Or mask
const masked = sanitizerService.mask(text, detected);
// "Contact me at ****@email.com or ***-1234"
```

### Fetch API (Frontend)
```typescript
// With authentication
const response = await fetch('http://localhost:5000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

const data = await response.json();

// POST request
const response = await fetch('http://localhost:5000/api/firewalls', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'My Firewall',
    description: 'Protects customer data',
  }),
});
```

---

## 🐛 Troubleshooting

### "Cannot find module '@prisma/client'"
```bash
cd server
npx prisma generate
```

### "Port 5000 already in use"
```bash
# Find and kill process
lsof -i :5000
kill -9 <PID>

# Or change port in server/.env
PORT=5001
```

### "Database connection error"
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Check DATABASE_URL in .env
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

### "Migration failed"
```bash
# Reset database (DEV ONLY!)
npx prisma migrate reset

# Or fix migration manually
npx prisma migrate resolve --rolled-back <migration_name>
```

### "CORS error" in frontend
```typescript
// server/src/app.ts
import cors from 'cors';

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
```

### "JWT verification failed"
```typescript
// Check token is being sent correctly
// Frontend: Include in Authorization header
// Backend: Verify JWT_SECRET matches

// Regenerate token if needed
```

### TypeScript errors
```bash
# Regenerate types
cd server && npx prisma generate

# Check tsconfig.json
# Restart TS server in VS Code: Cmd+Shift+P > "TypeScript: Restart TS Server"
```

---

## 📊 Useful SQL Queries

```sql
-- View all users
SELECT id, email, name, role, "createdAt" FROM "User";

-- View firewalls with user info
SELECT f.id, f.name, u.email as owner
FROM "Firewall" f
JOIN "User" u ON f."userId" = u.id;

-- Count audit logs by firewall
SELECT f.name, COUNT(a.id) as log_count
FROM "Firewall" f
LEFT JOIN "AuditLog" a ON f.id = a."firewallId"
GROUP BY f.id, f.name;

-- Find users with no firewalls
SELECT u.id, u.email
FROM "User" u
LEFT JOIN "Firewall" f ON u.id = f."userId"
WHERE f.id IS NULL;

-- Recent audit logs
SELECT * FROM "AuditLog"
ORDER BY "createdAt" DESC
LIMIT 10;
```

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Can register new user
- [ ] Can login with correct credentials
- [ ] Cannot login with wrong password
- [ ] Protected routes reject unauthenticated requests
- [ ] Protected routes accept valid token
- [ ] Detection finds emails
- [ ] Detection finds phone numbers
- [ ] Sanitization redacts correctly
- [ ] Audit log is created
- [ ] Dashboard displays data

### Postman/cURL Testing
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","name":"Test"}'

# Login (save token from response)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'

# Get current user
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Test detection
curl -X POST http://localhost:5000/api/test/detect \
  -H "Content-Type: application/json" \
  -d '{"text":"Email me at john@example.com or call 555-1234"}'
```

---

## 🎨 UI Component Examples (Future)

### Button Component
```tsx
import { Button } from '@/components/ui/button';

<Button variant="primary">Click Me</Button>
<Button variant="secondary" size="sm">Small Button</Button>
<Button disabled>Disabled</Button>
```

### Form with Validation
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const { register, handleSubmit, errors } = useForm({
  resolver: zodResolver(schema),
});
```

---

## 📦 Package Installation Guide

### Backend Packages
```bash
# Core
npm install express cors prisma @prisma/client

# Auth
npm install bcryptjs jsonwebtoken
npm install @types/bcryptjs @types/jsonwebtoken -D

# Validation
npm install express-validator zod

# AI Providers
npm install openai anthropic axios

# Utilities
npm install dotenv

# Dev
npm install -D typescript ts-node nodemon
npm install -D @types/node @types/express @types/cors
```

### Frontend Packages
```bash
# State & Data
npm install zustand axios @tanstack/react-query

# Forms
npm install react-hook-form zod @hookform/resolvers

# UI (shadcn)
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card table dialog

# Charts
npm install recharts

# Utilities
npm install date-fns clsx
```

---

## 🔗 Helpful Resources

### Documentation
- **Prisma:** https://www.prisma.io/docs
- **Next.js:** https://nextjs.org/docs
- **Express:** https://expressjs.com/en/guide
- **TypeScript:** https://www.typescriptlang.org/docs

### Learning
- **Regex Testing:** https://regex101.com
- **API Testing:** https://www.postman.com
- **SQL Practice:** https://sqlbolt.com

### Community
- **Discord:** Join QueryShield community (create one!)
- **Stack Overflow:** Tag your questions properly
- **GitHub Discussions:** Ask in relevant repos

---

## 📝 Git Commit Messages

Follow conventional commits:

```bash
feat: add email detection pattern
fix: correct regex for phone numbers
docs: update README with examples
style: format code with prettier
refactor: extract detection logic to service
test: add unit tests for sanitizer
chore: update dependencies
```

---

## 🎯 Daily Workflow

```bash
# Morning
git pull origin main              # Get latest changes
npm install                       # Update dependencies
npx prisma migrate dev            # Run new migrations
npm run dev                       # Start server

# During Development
# ... code code code ...
git add .                         # Stage changes
git commit -m "feat: ..."         # Commit frequently

# End of Day
git push origin main              # Push changes
# Update PROGRESS.md                Update progress tracker
```

---

## 💡 Pro Tips

1. **Use Prisma Studio** for quick database inspection
2. **Commit often** - small commits are easier to revert
3. **Test endpoints** immediately after creating them
4. **Read error messages** - they usually tell you exactly what's wrong
5. **Use TypeScript** - catches bugs before runtime
6. **Keep .env secure** - never commit it to git
7. **Document as you go** - future you will thank you
8. **Take breaks** - fresh eyes catch bugs faster

---

## 🚨 Emergency Commands

```bash
# Database is corrupted
npx prisma migrate reset          # CAUTION: Deletes all data!

# Node modules issues
rm -rf node_modules package-lock.json
npm install

# Port conflict
lsof -i :5000 | grep LISTEN        # Find process
kill -9 <PID>                      # Kill it

# Git merge conflict
git merge --abort                  # Cancel merge
git reset --hard HEAD              # Reset to last commit (CAREFUL!)

# Prisma client out of sync
npx prisma generate                # Regenerate client
```

---

**🔖 Bookmark this file! Refer to it whenever you're stuck.**

**⚡ Keep building! You've got this! 🚀**
