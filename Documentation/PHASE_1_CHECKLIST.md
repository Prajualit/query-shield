# ✅ Phase 1 Implementation Checklist

## Week 1-2: Core Backend Infrastructure

---

## 🔐 Task 1.1: Authentication System (3-4 days)

### Setup Dependencies
```bash
cd server
npm install bcryptjs jsonwebtoken dotenv express-validator
npm install @types/bcryptjs @types/jsonwebtoken --save-dev
```

### Step-by-Step Tasks:

#### Day 1: Environment & Types
- [ ] Create `.env` file with:
  ```env
  DATABASE_URL="postgresql://..."
  JWT_SECRET="your-super-secret-key-change-in-production"
  JWT_REFRESH_SECRET="your-refresh-secret"
  JWT_EXPIRE="7d"
  JWT_REFRESH_EXPIRE="30d"
  PORT=5000
  NODE_ENV="development"
  CLIENT_URL="http://localhost:3000"
  ```
- [ ] Create `server/src/types/index.ts`
- [ ] Define User, AuthRequest, JWTPayload types
- [ ] Add express.d.ts for custom Request type

#### Day 2: Auth Middleware & Utils
- [ ] Create `server/src/middleware/auth.middleware.ts`
  - [ ] `verifyToken` function
  - [ ] `authenticate` middleware
  - [ ] `authorize` middleware for roles
- [ ] Create `server/src/middleware/validation.middleware.ts`
  - [ ] Email validation
  - [ ] Password strength validation
  - [ ] Generic request validation
- [ ] Create `server/src/utils/jwt.util.ts`
  - [ ] generateToken
  - [ ] verifyToken
  - [ ] generateRefreshToken

#### Day 3: Auth Controller
- [ ] Create `server/src/controllers/auth.controller.ts`
  - [ ] `register` - Create new user with hashed password
  - [ ] `login` - Verify credentials, return JWT
  - [ ] `logout` - Clear refresh tokens
  - [ ] `refreshToken` - Generate new access token
  - [ ] `getCurrentUser` - Get authenticated user details
- [ ] Add proper error handling with try-catch
- [ ] Use ApiResponse and ApiError utilities

#### Day 4: Auth Routes & Testing
- [ ] Create `server/src/routes/auth.routes.ts`
- [ ] Mount routes in `app.ts`
- [ ] Test with Postman/Thunder Client:
  - [ ] POST /api/auth/register
  - [ ] POST /api/auth/login
  - [ ] POST /api/auth/refresh
  - [ ] GET /api/auth/me (protected)

---

## 🗄️ Task 1.2: Enhanced Database Schema (2 days)

### Step-by-Step Tasks:

#### Day 1: Update Schema
- [ ] Back up existing schema
- [ ] Update `server/prisma/schema.prisma` with complete models:
  - [ ] User (with role, team relation)
  - [ ] Team (with plan enum)
  - [ ] Firewall (with rules relation)
  - [ ] Rule (with RuleType, Action enums)
  - [ ] AuditLog (with detectedIssues JSON)
  - [ ] ApiKey
- [ ] Add all enums: Role, Plan, RuleType, Action
- [ ] Define relationships and cascades

#### Day 2: Migration & Seeds
- [ ] Run: `npx prisma migrate dev --name enhanced_schema`
- [ ] Create `server/prisma/seed.ts`
- [ ] Add sample users, firewalls, rules
- [ ] Run: `npx prisma db seed`
- [ ] Verify data in Prisma Studio: `npx prisma studio`

---

## 🔍 Task 1.3: Core Detection Engine (4-5 days)

### Setup Dependencies
```bash
npm install validator
npm install @types/validator --save-dev
```

### Step-by-Step Tasks:

#### Day 1: Pattern Library
- [ ] Create `server/src/services/detection/patterns.ts`
- [ ] Define regex patterns for:
  - [ ] Email: `/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g`
  - [ ] Phone: Various formats (US, international)
  - [ ] Credit Card: Visa, MasterCard, Amex
  - [ ] SSN: `/\b\d{3}-\d{2}-\d{4}\b/g`
  - [ ] API Keys: Common formats (AWS, GitHub, etc.)
  - [ ] IP Address: IPv4 and IPv6
- [ ] Export pattern map with metadata (type, confidence, description)

#### Day 2: Detector Service
- [ ] Create `server/src/services/detection/detector.service.ts`
- [ ] Implement `DetectorService` class:
  - [ ] `detect(text: string, ruleTypes?: RuleType[])` - Main detection method
  - [ ] `detectEmail(text: string)`
  - [ ] `detectPhone(text: string)`
  - [ ] `detectCreditCard(text: string)`
  - [ ] `detectSSN(text: string)`
  - [ ] `detectApiKey(text: string)`
  - [ ] `detectCustomPattern(text: string, pattern: string)`
- [ ] Return detected items with:
  - [ ] type
  - [ ] value
  - [ ] startIndex
  - [ ] endIndex
  - [ ] confidence (0-100)

#### Day 3: Sanitizer Service
- [ ] Create `server/src/services/detection/sanitizer.service.ts`
- [ ] Implement `SanitizerService` class:
  - [ ] `sanitize(text: string, detectedItems: DetectedItem[], action: Action)`
  - [ ] `redact(text: string, item: DetectedItem)` - Replace with [REDACTED]
  - [ ] `mask(text: string, item: DetectedItem)` - Partially mask (e.g., *****@email.com)
  - [ ] `block(text: string, items: DetectedItem[])` - Throw error if sensitive data found
  - [ ] `warn(text: string, items: DetectedItem[])` - Log warning, allow through
- [ ] Preserve text structure and readability

#### Day 4: Rules Engine
- [ ] Create `server/src/services/detection/rules.engine.ts`
- [ ] Implement `RulesEngine` class:
  - [ ] `evaluateRules(text: string, firewallId: string)`
  - [ ] Fetch firewall rules from database
  - [ ] Apply rules in priority order
  - [ ] Combine detection results
  - [ ] Apply appropriate actions per rule
- [ ] Cache frequently used rules in memory

#### Day 5: Testing & Integration
- [ ] Create test file: `server/src/services/detection/__tests__/detector.test.ts`
- [ ] Write unit tests for each detector
- [ ] Test edge cases (nested patterns, special characters)
- [ ] Create sample test data
- [ ] Verify accuracy and false positive rate

---

## 🌐 Task 1.4: API Proxy Layer (3-4 days)

### Setup Dependencies
```bash
npm install openai anthropic axios
npm install @types/axios --save-dev
```

### Step-by-Step Tasks:

#### Day 1: Base Proxy Service
- [ ] Create `server/src/services/ai-proxy/base.proxy.ts`
- [ ] Define `BaseProxyService` abstract class:
  - [ ] `abstract forwardRequest()`
  - [ ] `preProcess(text: string, firewallId: string)` - Detect & sanitize
  - [ ] `postProcess(response: any, auditLogId: string)` - Log response
  - [ ] `createAuditLog(data)` - Save to database
- [ ] Add error handling for API failures

#### Day 2: OpenAI Proxy
- [ ] Create `server/src/services/ai-proxy/openai.proxy.ts`
- [ ] Implement `OpenAIProxyService` extends `BaseProxyService`:
  - [ ] `forwardRequest(sanitizedText, model, config)`
  - [ ] Handle streaming responses
  - [ ] Map OpenAI errors to friendly messages
- [ ] Add support for different models (gpt-3.5, gpt-4)

#### Day 3: Additional Proxies & Controller
- [ ] Create `server/src/services/ai-proxy/anthropic.proxy.ts`
- [ ] Implement Claude API integration
- [ ] Create `server/src/controllers/proxy.controller.ts`:
  - [ ] `proxyOpenAI` - Handle OpenAI requests
  - [ ] `proxyAnthropic` - Handle Anthropic requests
  - [ ] `proxyCustom` - Generic AI provider proxy
- [ ] Validate firewall exists and is active

#### Day 4: Routes & Testing
- [ ] Create `server/src/routes/proxy.routes.ts`
- [ ] Add endpoints:
  - [ ] POST /api/proxy/openai
  - [ ] POST /api/proxy/anthropic
  - [ ] POST /api/proxy/custom
- [ ] Test full flow:
  1. Send text with sensitive data
  2. Verify detection works
  3. Check sanitization
  4. Confirm audit log created
  5. Verify AI response received

---

## 🔧 Integration Tasks

### Update app.ts
- [ ] Import and mount all routes:
  ```typescript
  import authRoutes from './routes/auth.routes';
  import proxyRoutes from './routes/proxy.routes';
  
  app.use('/api/auth', authRoutes);
  app.use('/api/proxy', proxyRoutes);
  ```
- [ ] Add global error handler middleware
- [ ] Add request logging middleware
- [ ] Add rate limiting (express-rate-limit)

### Environment Variables
- [ ] Create `.env.example` file
- [ ] Document all required environment variables
- [ ] Add OpenAI API key
- [ ] Add Anthropic API key

---

## ✅ Phase 1 Completion Criteria

Before moving to Phase 2, ensure:

- [ ] ✅ Users can register and login
- [ ] ✅ JWT authentication works correctly
- [ ] ✅ Database has all required models
- [ ] ✅ Detection engine identifies 6+ pattern types
- [ ] ✅ Sanitization works for all actions (redact, mask, block)
- [ ] ✅ API proxy successfully forwards requests to OpenAI
- [ ] ✅ Audit logs are created for every request
- [ ] ✅ All endpoints tested with Postman
- [ ] ✅ No critical bugs or security issues
- [ ] ✅ Code is properly commented and organized

---

## 📊 Testing Checklist

### Manual Testing
- [ ] Create user account
- [ ] Login with correct credentials
- [ ] Login with wrong password (should fail)
- [ ] Access protected route without token (should fail)
- [ ] Access protected route with valid token (should work)
- [ ] Send text with email to proxy (should be redacted)
- [ ] Send text with credit card to proxy (should be redacted)
- [ ] Check audit log contains correct data
- [ ] Verify OpenAI response is returned

### Postman Collection
Create a collection with:
- [ ] Register user
- [ ] Login
- [ ] Get current user
- [ ] Proxy OpenAI request
- [ ] Test all detection patterns

---

## 🚀 Quick Commands Reference

```bash
# Start development server
cd server && npm run dev

# Run Prisma Studio
npx prisma studio

# Create migration
npx prisma migrate dev --name your_migration_name

# Reset database
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate

# Run tests (once implemented)
npm test
```

---

## 📝 Notes & Tips

1. **Security Best Practices:**
   - Never commit `.env` file
   - Use strong JWT secrets (min 32 characters)
   - Hash passwords with bcrypt (salt rounds: 10)
   - Validate all user inputs

2. **Code Organization:**
   - Keep controllers thin, business logic in services
   - Use async/await consistently
   - Handle errors gracefully
   - Add TypeScript types everywhere

3. **Database Tips:**
   - Use indexes for frequently queried fields
   - Use transactions for multi-step operations
   - Keep migrations small and focused
   - Test migrations on dev before production

4. **Testing Strategy:**
   - Test happy paths first
   - Then test error cases
   - Use realistic test data
   - Test with different user roles

---

**Start with Task 1.1 and work through sequentially. Good luck! 🚀**
