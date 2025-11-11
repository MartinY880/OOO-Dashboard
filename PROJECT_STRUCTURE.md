# Office 365 Management Dashboard - Project Structure

## Complete File Tree

```
/root/
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules
├── package.json                    # Root workspace config
├── README.md                       # Main documentation
│
├── app/                            # Next.js 14 application
│   ├── package.json               # App dependencies
│   ├── tsconfig.json              # TypeScript configuration
│   ├── next.config.js             # Next.js configuration
│   ├── tailwind.config.js         # Tailwind CSS config
│   ├── postcss.config.js          # PostCSS config
│   ├── .eslintrc.json             # ESLint config
│   │
│   ├── app/                       # App Router (Next.js 14)
│   │   ├── globals.css           # Global styles
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Home (redirects)
│   │   │
│   │   ├── api/                  # API routes
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts  # NextAuth handler
│   │   │   ├── oof/
│   │   │   │   └── route.ts      # OOF API (GET/POST)
│   │   │   └── forwarding/
│   │   │       └── route.ts      # Forwarding API (GET/POST/DELETE)
│   │   │
│   │   ├── auth/
│   │   │   ├── signin/
│   │   │   │   └── page.tsx      # Sign in page
│   │   │   └── error/
│   │   │       └── page.tsx      # Auth error page
│   │   │
│   │   └── dashboard/             # Protected dashboard
│   │       ├── layout.tsx        # Dashboard layout
│   │       ├── page.tsx          # Dashboard home
│   │       ├── oof/
│   │       │   └── page.tsx      # OOF management
│   │       └── forwarding/
│   │           └── page.tsx      # Forwarding management
│   │
│   ├── components/                # React components
│   │   ├── ui/
│   │   │   ├── button.tsx        # Button component
│   │   │   └── ...               # Other shadcn/ui components
│   │   └── dashboard/
│   │       ├── header.tsx        # Dashboard header
│   │       └── nav.tsx           # Dashboard navigation
│   │
│   └── lib/                       # Shared libraries
│       ├── appwrite.ts           # Appwrite SDK helpers
│       ├── auth.ts               # NextAuth config & helpers
│       ├── graph.ts              # Microsoft Graph client
│       ├── n8n.ts                # n8n webhook client
│       ├── validators.ts         # Zod schemas
│       ├── crypto.ts             # Encryption utilities
│       ├── logger.ts             # Structured logging
│       └── utils.ts              # General utilities
│
├── infra/                         # Infrastructure config
│   ├── .devcontainer/
│   │   ├── devcontainer.json     # VS Code devcontainer config
│   │   └── Dockerfile            # Container image
│   │
│   └── appwrite/
│       ├── collections.json      # Appwrite schema
│       └── seed.js               # Database seed script
│
├── tests/                         # Testing
│   ├── package.json              # Test dependencies
│   ├── playwright.config.ts      # Playwright config
│   ├── rest.http                 # REST client samples
│   │
│   └── e2e/
│       └── dashboard.spec.ts     # E2E tests
│
└── docs/                          # Documentation
    ├── SETUP_GUIDE.md            # Complete setup guide
    └── N8N_SETUP.md              # n8n workflow guide
```

## Key Technologies

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Authentication**: NextAuth.js with Azure AD (MSAL)
- **Backend**: Next.js API Routes (serverless)
- **Database**: Appwrite (profiles, audit logs, secrets)
- **Microsoft Graph**: MSAL Node, Graph Client SDK
- **Validation**: Zod
- **Testing**: Playwright (E2E), Vitest (unit)
- **Dev Environment**: Dev Container (VS Code)

## Implementation Highlights

### Security Features
✅ Refresh tokens encrypted with AES-256-GCM  
✅ Server-only API keys (never exposed to client)  
✅ Delegated permissions (user consent)  
✅ HMAC SHA-256 signed webhooks  
✅ Structured logging with PII redaction  
✅ Same-domain forwarding enforcement  
✅ Immutable audit logs  

### Dual Execution Modes
- **graph**: Direct Microsoft Graph API calls
- **n8n**: Webhook integration for workflow automation

### Authentication Strategies
- **msal** (recommended): Direct MSAL with NextAuth
- **appwrite-oauth**: Appwrite Microsoft OAuth provider

### Data Models
- **profiles**: User metadata (timezone, role, email)
- **auditLogs**: Action history (action, mode, status, payload)
- **secrets**: Encrypted refresh tokens (server-only access)

## Development Workflow

1. **Setup**: Follow `docs/SETUP_GUIDE.md`
2. **Develop**: Use devcontainer or local Node.js 20+
3. **Test**: Run `pnpm test` and `pnpm test:e2e`
4. **Deploy**: Build with `pnpm build`, deploy to Vercel/Docker

## Production Checklist

- [ ] Azure AD app registered with correct scopes
- [ ] Appwrite collections seeded
- [ ] Environment variables configured (all required vars)
- [ ] Encryption key generated and secured
- [ ] n8n workflow configured (if using n8n mode)
- [ ] Redirect URIs updated for production domain
- [ ] HTTPS enabled
- [ ] Audit logging monitored
- [ ] RBAC roles configured
- [ ] Same-domain restriction enabled (if desired)
- [ ] Secrets rotation schedule established

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth authentication |
| `/api/oof` | GET | Get current OOF settings |
| `/api/oof` | POST | Set OOF settings |
| `/api/forwarding` | GET | Get forwarding status |
| `/api/forwarding` | POST | Create forwarding rule |
| `/api/forwarding` | DELETE | Delete forwarding rule |

## Environment Variables Required

See `.env.example` for complete list. Key variables:

- `APPWRITE_*`: Appwrite connection details
- `AZURE_*`: Azure AD app credentials
- `ENCRYPTION_KEY_32B_BASE64`: Refresh token encryption key
- `NEXTAUTH_SECRET`: NextAuth session secret
- `EXECUTION_MODE`: `graph` or `n8n`
- `N8N_*`: n8n webhook config (if mode=n8n)

## Quick Commands

```bash
# Install dependencies
pnpm install

# Seed Appwrite
pnpm seed

# Development
pnpm dev

# Build
pnpm build

# Test
pnpm test
pnpm test:e2e

# Lint
pnpm lint
pnpm typecheck
```

---

**Status**: Production-ready ✅  
**Last Updated**: November 2025  
**Maintainer**: Senior Full-Stack Engineer
