# 🛡️ QueryShield - AI Data Firewall

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)

**Stop data leaks before they happen.**  
QueryShield is an AI Data Firewall that automatically detects and masks sensitive information before it reaches AI models like ChatGPT, Claude, or Gemini.

---

## 🎯 Problem

Organizations increasingly use AI tools for productivity, but:

- ❌ Employees unknowingly share sensitive data (PII, credentials, IP)
- ❌ No visibility into what data is sent to AI providers
- ❌ Compliance risks (GDPR, HIPAA, SOC2)
- ❌ Existing DLP solutions are expensive and complex

## 💡 Solution

QueryShield is a lightweight SaaS middleware that:

- ✅ Detects sensitive data patterns automatically
- ✅ Masks or redacts information in real-time
- ✅ Logs all AI interactions for compliance
- ✅ Works across multiple AI providers
- ✅ Easy integration (API, SDK, Browser Extension)

---

## 🚀 Quick Start

**Get your first working features in 2 hours:**

```bash
# 1. Clone and install
git clone <your-repo>
cd query-shield

# 2. Install dependencies
cd server && npm install
cd ../client && npm install

# 3. Set up database
cp server/.env.example server/.env
# Update DATABASE_URL in server/.env

# 4. Run migrations
cd server
npx prisma migrate dev
npx prisma generate

# 5. Start development
# Terminal 1:
cd server && npm run dev

# Terminal 2:
cd client && npm run dev
```

**📖 Then follow [QUICKSTART.md](./QUICKSTART.md) for step-by-step tutorial**

---

## 📚 Documentation

| Document                                           | Purpose                                | When to Use         |
| -------------------------------------------------- | -------------------------------------- | ------------------- |
| **[START_HERE.md](./START_HERE.md)**               | Executive summary & overview           | Read first!         |
| **[QUICKSTART.md](./QUICKSTART.md)**               | Build first features in 2 hours        | Start coding now    |
| **[ROADMAP.md](./ROADMAP.md)**                     | Complete development plan (Weeks 1-9+) | Project planning    |
| **[PHASE_1_CHECKLIST.md](./PHASE_1_CHECKLIST.md)** | Detailed Week 1-2 tasks                | Daily development   |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)**           | System design & tech architecture      | Technical decisions |
| **[BUSINESS_STRATEGY.md](./BUSINESS_STRATEGY.md)** | Pricing, marketing, growth plan        | Business planning   |

---

## ✨ Features

### Phase 1 (MVP) - Weeks 1-2

- [x] User authentication (JWT)
- [x] Database schema
- [ ] Pattern detection (Email, Phone, SSN, Credit Card, API Keys)
- [ ] Data sanitization (Redact, Mask, Block)
- [ ] Audit logging
- [ ] API proxy for OpenAI

### Phase 2 - Weeks 3-4

- [ ] Dashboard UI
- [ ] Firewall management
- [ ] Custom rules engine
- [ ] Analytics dashboard
- [ ] Team collaboration

### Phase 3 - Weeks 5-6

- [ ] Real-time testing playground
- [ ] Compliance reports
- [ ] Advanced detection patterns
- [ ] Email notifications

### Phase 4 - Weeks 7-8

- [ ] Stripe payment integration
- [ ] Subscription management
- [ ] Usage-based billing
- [ ] Production deployment

### Phase 5 - Week 9+

- [ ] ML-based detection
- [ ] Multi-provider support (Claude, Gemini)
- [ ] Enterprise features (SSO, on-prem)
- [ ] Browser extension

---

## 🏗️ Tech Stack

### Frontend

- **Framework:** Next.js 15 (React 19)
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Data Fetching:** TanStack Query
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts

### Backend

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Auth:** JWT + bcrypt
- **Validation:** express-validator

### DevOps

- **Frontend Hosting:** Vercel
- **Backend Hosting:** Railway / Render
- **Database:** Supabase / Railway PostgreSQL
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry

---

## 🗄️ Database Schema

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  role      Role     @default(USER)
  firewalls Firewall[]
  auditLogs AuditLog[]
}

model Firewall {
  id          String   @id @default(uuid())
  name        String
  description String?
  rules       Rule[]
  auditLogs   AuditLog[]
}

model Rule {
  id         String    @id @default(uuid())
  name       String
  type       RuleType  // EMAIL, PHONE, CREDIT_CARD, etc.
  pattern    String
  action     Action    // REDACT, MASK, BLOCK
  priority   Int
}

model AuditLog {
  id             String   @id @default(uuid())
  inputText      String
  sanitizedText  String
  detectedIssues Json
  action         String
  createdAt      DateTime @default(now())
}
```

---

## 🔧 API Endpoints

### Authentication

```
POST   /api/auth/register    - Create new user
POST   /api/auth/login       - User login
GET    /api/auth/me          - Get current user
```

### Firewalls

```
GET    /api/firewalls        - List all firewalls
POST   /api/firewalls        - Create firewall
GET    /api/firewalls/:id    - Get firewall details
PUT    /api/firewalls/:id    - Update firewall
DELETE /api/firewalls/:id    - Delete firewall
```

### Rules

```
GET    /api/firewalls/:id/rules  - List rules
POST   /api/firewalls/:id/rules  - Create rule
PUT    /api/rules/:id            - Update rule
DELETE /api/rules/:id            - Delete rule
```

### AI Proxy

```
POST   /api/proxy/openai     - Proxy to OpenAI (with protection)
POST   /api/proxy/anthropic  - Proxy to Anthropic
```

### Audit Logs

```
GET    /api/audit-logs       - List audit logs (with filters)
GET    /api/audit-logs/:id   - Get log details
```

---

## 💰 Pricing

| Plan           | Price     | Features                                           |
| -------------- | --------- | -------------------------------------------------- |
| **Free**       | $0/month  | 1,000 requests, 1 firewall, basic detection        |
| **Pro**        | $49/month | 50K requests, unlimited firewalls, custom rules    |
| **Enterprise** | Custom    | Unlimited requests, SSO, on-prem, priority support |

**Revenue Goal:** $240K ARR in Year 1 (300 paying customers)

---

## 🎯 Roadmap

### Q1 2025: MVP Launch

- ✅ Core detection engine
- ✅ Dashboard UI
- ✅ Product Hunt launch
- 🎯 100 free users
- 🎯 10 paying customers

### Q2 2025: Growth

- 🎯 500 users
- 🎯 50 paying customers ($2,500 MRR)
- Advanced features
- Content marketing

### Q3 2025: Scale

- 🎯 3,000 users
- 🎯 150 paying customers ($7,500 MRR)
- Enterprise features
- Partnership integrations

### Q4 2025: Enterprise Focus

- 🎯 5,000 users
- 🎯 300 paying customers + 10 enterprise
- 🎯 $20K MRR ($240K ARR)

---

## 🧪 Example Usage

### Basic Detection

```typescript
import { DetectorService } from "@queryshield/sdk";

const detector = new DetectorService();
const text = "Contact me at john@example.com or call 555-1234";

const detected = detector.detect(text);
// [
//   { type: 'EMAIL', value: 'john@example.com', confidence: 95 },
//   { type: 'PHONE', value: '555-1234', confidence: 85 }
// ]

const sanitized = detector.sanitize(text, detected, "REDACT");
// "Contact me at [EMAIL_REDACTED] or call [PHONE_REDACTED]"
```

### API Proxy

```typescript
const response = await fetch("https://api.queryshield.com/proxy/openai", {
  method: "POST",
  headers: {
    Authorization: "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    firewallId: "your-firewall-id",
    messages: [{ role: "user", content: "Analyze this: john@email.com" }],
    model: "gpt-4",
  }),
});

// QueryShield automatically:
// 1. Detects john@email.com
// 2. Redacts it to [EMAIL_REDACTED]
// 3. Sends sanitized text to OpenAI
// 4. Logs everything for audit
// 5. Returns AI response
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Write/update tests
5. Commit: `git commit -m 'feat: add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

---

## 📈 Project Status

**Current Phase:** Phase 1 - Core Backend Infrastructure  
**Progress:** 15% complete  
**Next Milestone:** Working authentication + detection engine  
**ETA:** 2 weeks

[![GitHub issues](https://img.shields.io/github/issues/yourusername/query-shield)](https://github.com/yourusername/query-shield/issues)
[![GitHub stars](https://img.shields.io/github/stars/yourusername/query-shield)](https://github.com/yourusername/query-shield/stargazers)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by the need for AI-specific data protection
- Built with modern, production-ready technologies
- Community feedback and contributions

---

## 📞 Contact & Support

- **Email:** support@queryshield.com
- **Twitter:** [@QueryShield](https://twitter.com/queryshield)
- **Discord:** [Join our community](https://discord.gg/queryshield)
- **Docs:** [docs.queryshield.com](https://docs.queryshield.com)

---

## 🎯 Next Steps

1. **Read** [START_HERE.md](./START_HERE.md) for overview
2. **Follow** [QUICKSTART.md](./QUICKSTART.md) to build your first features
3. **Execute** [PHASE_1_CHECKLIST.md](./PHASE_1_CHECKLIST.md) step by step
4. **Ship** your MVP in 2 weeks! 🚀

---

**Built with ❤️ by developers, for developers protecting AI workflows.**
