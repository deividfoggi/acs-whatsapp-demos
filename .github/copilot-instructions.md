# TheFoggi Consultancy — WhatsApp Demos: Copilot Instructions

## Project Context

This is a WhatsApp-first communication platform for **TheFoggi Consultancy**, a group of schools. Parents and guardians interact with the school system via WhatsApp, powered by **Azure Communication Services (ACS) Advanced Messaging**. The project implements multiple use cases as independent features, all sharing a common backend.

### Business Domain

- **Organization**: TheFoggi Consultancy (school group)
- **Users**: Parents/guardians of enrolled students
- **Channel**: WhatsApp (via ACS Advanced Messaging)
- **Use cases**: Payment flows, notifications, enrollment, attendance — all through WhatsApp

## Technical Stack

| Layer               | Technology                                          |
|---------------------|-----------------------------------------------------|
| Runtime             | Node.js 20+ with TypeScript (strict mode)           |
| Backend Framework   | Express                                             |
| Messaging SDK       | `@azure-rest/communication-messages`                |
| WhatsApp Flows      | Meta Flow JSON v7.3                                 |
| Event Handling      | Azure Event Grid webhooks                           |
| Validation          | Zod schemas                                         |
| Data Layer          | In-memory dummy data (interfaces ready for DB swap) |
| Package Manager     | npm workspaces                                      |

## TypeScript Conventions

- Always use `strict: true` in TypeScript configuration
- Prefer `interface` over `type` for object shapes
- Use `async/await` — never raw Promises with `.then()`
- Use early returns for error/guard conditions
- Add JSDoc comments on all exported functions, interfaces, and classes
- Use descriptive variable names; avoid abbreviations
- All function parameters and return types must be explicitly typed
- Use `readonly` for properties that should not be mutated
- Prefer `const` over `let`; never use `var`

### Naming Conventions

- Files: `kebab-case.ts` (e.g., `payment.service.ts`, `mock-data.ts`)
- Interfaces: `PascalCase` prefixed with `I` only when needed to distinguish from a class
- Types: `PascalCase`
- Functions/methods: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Enums: `PascalCase` with `PascalCase` members

## Architecture Patterns

### Service Layer (Dummy Data)

The data layer uses in-memory mock data behind service interfaces. This makes it easy to swap in a real database later without changing route handlers.

```typescript
// GOOD: Service returns data through an interface
export async function getStudentsByParentPhone(phone: string): Promise<Student[]> {
  return MOCK_STUDENTS.filter(s => s.parentPhone === phone);
}

// BAD: Route handler directly accesses data
router.get('/students', (req, res) => {
  const students = MOCK_STUDENTS.filter(...); // Don't do this
});
```

### Route Handlers

- Use Express Router for route grouping
- Validate request input with Zod schemas at the route level
- Delegate business logic to service functions
- Return consistent JSON response shapes:

```typescript
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "STUDENT_NOT_FOUND", "message": "..." } }
```

### Error Handling

- Wrap async route handlers to catch unhandled promise rejections
- Use typed error codes (string enums) — not numeric codes
- Log errors with context (request ID, route, timestamp)
- Never expose internal error details to the client

## Azure Communication Services (ACS)

### SDK Usage

- Use `@azure-rest/communication-messages` (REST client, not the older class-based SDK)
- Authenticate with connection string for dev; use `DefaultAzureCredential` for production
- Store `ACS_CONNECTION_STRING` and `ACS_CHANNEL_REGISTRATION_ID` in environment variables
- Always check response status (`202` for sent messages)

### Message Sending Pattern

```typescript
const result = await client.path("/messages/notifications:send").post({
  contentType: "application/json",
  body: {
    channelRegistrationId: CHANNEL_ID,
    to: [recipientPhone],
    kind: "text",  // or "template", "image", etc.
    content: "message text"
  }
});
```

### Event Grid Webhooks

- Validate `EventGridEvent` subscription validation requests
- Handle `Microsoft.Communication.AdvancedMessageReceived` events for incoming messages
- Handle `Microsoft.Communication.AdvancedMessageDeliveryStatusUpdated` for delivery receipts

## WhatsApp Flows (Meta Flow JSON)

- Use Flow JSON version `7.3`
- Use `data_api_version: "3.0"` when connecting to a Data Endpoint
- Always define `routing_model` when using a Data Endpoint
- Screen IDs use `UPPER_SNAKE_CASE`
- All interactive components must be inside a `Form` (or use v4.0+ form-optional pattern)
- Terminal screens must have a `Footer` with a `complete` action
- Use `data_exchange` action to communicate with the backend between screens
- Keep Flow JSON payload size minimal — avoid sending base64 or large objects

### Flows Data Endpoint

The backend exposes a `/api/flows/endpoint` that handles WhatsApp Flows requests. It must handle these actions:
- `INIT` — initial screen data
- `data_exchange` — screen-to-screen data exchange
- `BACK` — user navigated back (if `refresh_on_back: true`)

Response format:
```json
{
  "screen": "NEXT_SCREEN_ID",
  "data": { ... }
}
```

## File Organization

```
packages/backend/src/
  index.ts              — Express app setup and server start
  routes/               — Express route handlers, one file per domain
  services/             — Business logic with dummy implementations
  flows/                — WhatsApp Flow JSON files
  types/                — Shared TypeScript interfaces and types
  data/                 — In-memory mock data
```

## Environment Variables

Always read from `process.env` via a typed config module. Required variables:
- `ACS_CONNECTION_STRING` — ACS resource connection string
- `ACS_CHANNEL_REGISTRATION_ID` — WhatsApp channel registration GUID
- `PORT` — Server port (default: 3000)
- `NODE_ENV` — `development` | `production`
