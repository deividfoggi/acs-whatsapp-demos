# TheFoggi Consultancy — WhatsApp Demos

WhatsApp use case demos for **TheFoggi Consultancy** (a group of schools), powered by [Azure Communication Services Advanced Messaging](https://learn.microsoft.com/en-us/azure/communication-services/concepts/advanced-messaging/whatsapp/whatsapp-overview).

## Use Cases

| # | Use Case | Status |
|---|----------|--------|
| 1 | **Payment Flow** — Parents pay tuition/fees via WhatsApp Flows | 🚧 In Progress |

## Tech Stack

- **Runtime**: Node.js 20+ / TypeScript
- **Backend**: Express
- **Messaging**: Azure Communication Services (`@azure-rest/communication-messages`)
- **WhatsApp Flows**: Meta Flow JSON v7.3
- **Events**: Azure Event Grid webhooks

## Getting Started

### Prerequisites

- Node.js >= 20
- An Azure Communication Services resource with a registered WhatsApp Business Account
- WhatsApp Business channel registration ID

### Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your ACS credentials

# Start backend in dev mode
npm run backend
```

## Project Structure

```
packages/
  backend/          # Express API server
    src/
      routes/       # API route handlers
      services/     # Business logic layer (dummy data for now)
      flows/        # WhatsApp Flow JSON definitions
      types/        # Shared TypeScript types
      data/         # Mock/in-memory data
```

## Copilot Agents

This repo includes specialized Copilot agents under `.github/agents/`:

| Agent | Purpose |
|-------|---------|
| `@backend-api` | Express routes, services, REST patterns |
| `@whatsapp-flows` | WhatsApp Flow JSON authoring |
| `@acs-messaging` | ACS Advanced Messaging SDK integration |
| `@event-handler` | Event Grid webhook handling |
