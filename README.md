# ACS WhatsApp Demos

WhatsApp use case demos powered by [Azure Communication Services Advanced Messaging](https://learn.microsoft.com/en-us/azure/communication-services/concepts/advanced-messaging/whatsapp/whatsapp-overview). Parents and guardians interact with the school system via WhatsApp. The company/organization name displayed in the UI is configured via the `COMPANY_NAME` environment variable.

## Use Cases

| # | Use Case | Status |
|---|----------|--------|
| 1 | **Simple Messaging** — Send and receive text messages between the business and WhatsApp users | ✅ Available |
| 2 | **Template Messages** — Browse and send pre-approved WhatsApp template messages with dynamic parameters and Quick Reply buttons | ✅ Available |
| 3 | **AI Agent (Triage + Connected Agents)** — Inbound WhatsApp messages are routed to an Azure AI Foundry triage agent that delegates to specialized agents | ✅ Available |
| 4 | **Payment Flow** — Parents pay tuition/fees via WhatsApp Flows | 🚧 In Progress |

## Tech Stack

- **Runtime**: Node.js 20+ / TypeScript
- **Backend**: Express
- **Messaging**: Azure Communication Services (`@azure-rest/communication-messages`)
- **AI Agents**: Azure AI Foundry (`@azure/ai-projects`) — Connected Agents pattern
- **State Store**: Azure Cosmos DB (`@azure/cosmos`) — phone→thread mapping
- **Auth**: `@azure/identity` (DefaultAzureCredential for Entra ID / RBAC)
- **WhatsApp Flows**: Meta Flow JSON v7.3
- **Events**: Azure Event Grid webhooks
- **Validation**: Zod schemas

---

## Getting Started

Follow the steps below **in order** to set up and run the demos.

### 1. Prerequisites

Before you begin, make sure you have the following:

| Requirement | Details |
|-------------|---------|
| **Node.js** | v20 or later — [download](https://nodejs.org/) |
| **npm** | Comes with Node.js (v10+) |
| **VS Code** | Recommended editor — [download](https://code.visualstudio.com/) |
| **Azure Subscription** | [Create a free account](https://azure.microsoft.com/free/) |
| **Azure Communication Services resource** | See step 2 below |
| **Meta Business Account + WhatsApp Business phone number** | See step 2 below |
| **A personal WhatsApp phone number** | To send/receive test messages (your personal phone works) |
| **Azure AI Foundry project** *(optional — for AI agents)* | See [Set Up AI Foundry Agent](#set-up-azure-ai-foundry-agent) below |
| **Azure Cosmos DB account** *(optional — for AI agents)* | See [Set Up Cosmos DB](#set-up-azure-cosmos-db) below |

### 2. Set Up Meta Business Account, WhatsApp Number & ACS

This step connects a WhatsApp Business phone number to your Azure Communication Services resource so you can send and receive WhatsApp messages via the ACS SDK.

#### 2a. Create an Azure Communication Services Resource

1. Go to the [Azure Portal](https://portal.azure.com/).
2. Click **Create a resource** → search for **Communication Services** → **Create**.
3. Select your subscription and resource group, give it a name (e.g., `acs-whatsapp-demo`), and choose a region.
4. Click **Review + create** → **Create**.
5. Once deployed, open the resource and go to **Keys** in the left menu. Copy the **Connection string** — you will need it later.

#### 2b. Create a Meta Business Account (if you don't have one)

1. Go to [Meta Business Suite](https://business.facebook.com/) and sign in with your Facebook account.
2. Click **Create a Business Account** (or use an existing one).
3. Fill in the business name and details, then click **Submit**.
4. Your Meta Business Account is now ready.

#### 2c. Connect WhatsApp to ACS and Register a Phone Number

1. In the **Azure Portal**, open your ACS resource.
2. Go to **Channels** → **WhatsApp** in the left menu.
3. Click **Connect** to start the WhatsApp Business Account connection wizard.
4. You will be redirected to Meta's **Embedded Signup** flow:
   - Sign in to your Meta Business Account.
   - Create a new **WhatsApp Business Account** (or select an existing one).
   - **Register a phone number** — you can use a new number or Meta's free test number. This is the number that will appear as the sender when the business sends messages.
   - Accept the WhatsApp Business Terms of Service.
5. After completing the Meta flow, you are redirected back to the Azure Portal.
6. The WhatsApp channel now appears under **Channels** with a **Channel Registration ID** (a GUID).
7. Copy the **Channel Registration ID** — you will need it for the `.env` file.

> **Tip:** For a detailed walkthrough with screenshots, see the official guide: [Connect a WhatsApp Business Account to Azure Communication Services](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/advanced-messaging/whatsapp/connect-whatsapp-business-account).

### 3. Clone the Repository

```bash
git clone https://github.com/<your-org>/acs-whatsapp-demos.git
cd acs-whatsapp-demos
```

### 4. Install Dependencies

The project uses npm workspaces. Run install from the **root** folder:

```bash
npm install
```

This installs dependencies for both the root and the `backend/` workspace.

### 5. Configure Environment Variables

Create a `.env` file inside the `backend/` folder using the provided template:

```bash
cp backend/.env.example backend/.env
```

Then open `backend/.env` and fill in the values:

```dotenv
# Azure Communication Services
ACS_CONNECTION_STRING=endpoint=https://<your-acs-resource>.communication.azure.com/;accesskey=<your-access-key>
ACS_CHANNEL_REGISTRATION_ID=<your-whatsapp-channel-registration-id>

# Company name shown in the demo UI and outbound messages
COMPANY_NAME=Contoso School

# Server
PORT=3000
NODE_ENV=development

# ==================== AI Foundry (optional) ====================
# Azure AI Foundry project endpoint (e.g. https://<project>.services.ai.azure.com/api/projects/<project>)
AZURE_AI_PROJECT_ENDPOINT=https://<your-ai-foundry-project>.services.ai.azure.com/api/projects/<project-name>

# The ID of the triage agent in AI Foundry
AZURE_AI_AGENT_ID=<your-triage-agent-id>

# ==================== Cosmos DB (optional — required for AI agents) ====================
# Use EITHER connection string (local dev) OR endpoint (production with DefaultAzureCredential).
# If both are set, connection string takes priority.
COSMOS_DB_CONNECTION_STRING=AccountEndpoint=https://<your-cosmos-account>.documents.azure.com:443/;AccountKey=<your-key>
# COSMOS_DB_ENDPOINT=https://<your-cosmos-account>.documents.azure.com:443/

# Database and container names for phone→thread mapping
COSMOS_DB_DATABASE_NAME=whatsapp-agents
COSMOS_DB_CONTAINER_NAME=conversations
```

| Variable | Required | Description |
|----------|----------|-------------|
| `ACS_CONNECTION_STRING` | Yes | Connection string from your ACS resource (Azure Portal → ACS resource → Keys) |
| `ACS_CHANNEL_REGISTRATION_ID` | Yes | GUID of your WhatsApp channel registration (Azure Portal → ACS resource → Channels → WhatsApp) |
| `COMPANY_NAME` | Yes | Display name used in the UI and messages |
| `PORT` | No | Server port (default: `3000`) |
| `NODE_ENV` | No | `development` or `production` (default: `development`) |
| `AZURE_AI_PROJECT_ENDPOINT` | No* | Azure AI Foundry project endpoint URL |
| `AZURE_AI_AGENT_ID` | No* | ID of the triage agent created in AI Foundry |
| `COSMOS_DB_CONNECTION_STRING` | No* | Cosmos DB connection string (key-based auth for local dev) |
| `COSMOS_DB_ENDPOINT` | No* | Cosmos DB endpoint (used with `DefaultAzureCredential` when no connection string) |
| `COSMOS_DB_DATABASE_NAME` | No | Database name (default: `whatsapp-agents`) |
| `COSMOS_DB_CONTAINER_NAME` | No | Container name (default: `conversations`) |

> \* Required only when using the AI Agent feature. If these variables are not set, inbound messages are stored but not routed to the AI agent.

### 6. Start the Backend Server

From the **root** folder:

```bash
npm run backend
```

This starts the Express server in watch mode (auto-reloads on file changes). You should see:

```
🚀 Contoso School API running on port 3000 (development)
   Health: http://localhost:3000/api/health
   Demos:  http://localhost:3000/
```

### 7. Expose the Local Server with VS Code Port Forwarding

WhatsApp messages arrive via Azure Event Grid webhooks, which need a **publicly reachable URL**. VS Code's built-in port forwarding creates a tunnel without extra tooling.

1. Open VS Code and make sure the backend is running on port `3000`.
2. Open the **Ports** panel: `View → Terminal`, then click the **Ports** tab (or press `Ctrl+Shift+P` / `Cmd+Shift+P` → **Ports: Focus on Ports View**).
3. Click **Forward a Port** and enter `3000`.
4. VS Code creates a forwarded URL like `https://<random-id>-3000.uks1.devtunnels.ms/`.
5. Set the **port visibility** to **Public** (right-click the port → Change Port Visibility → Public). This is required so Azure Event Grid can reach the endpoint without authentication.
6. Copy the forwarded URL — you will use it in the next step.

### 8. Configure the Event Grid Webhook

Point Azure Event Grid at your forwarded URL so inbound WhatsApp messages reach your local server.

1. Go to the **Azure Portal** → your **ACS resource** → **Events**.
2. Click **+ Event Subscription**.
3. Configure:
   - **Name**: `whatsapp-local-dev` (or any name)
   - **Event Schema**: Event Grid Schema
   - **Filter to Event Types**:
     - `Microsoft.Communication.AdvancedMessageReceived`
     - `Microsoft.Communication.AdvancedMessageDeliveryStatusUpdated`
   - **Endpoint Type**: Web Hook
   - **Endpoint URL**: `https://<your-forwarded-url>/api/webhooks/acs`
4. Click **Create**. Event Grid sends a validation request — the backend handles it automatically.

### 9. Run the Demo Scenarios

Open your browser and navigate to the demo UI:

```
http://localhost:3000/
```

You will see a home page with cards for each available demo.

#### Demo 1 — Simple Messaging

1. Click the **Simple Messaging** card.
2. Enter the recipient's WhatsApp phone number in **E.164 format** (e.g., `+15551234567`).
3. Type a message and click **Send**.
4. The message is sent via ACS to the recipient's WhatsApp.
5. When the recipient replies, the response appears in the conversation panel in real-time (delivered via the Event Grid webhook).

#### Demo 2 — Template Messages

1. Click the **Template Messages** card.
2. Browse the available pre-approved WhatsApp templates.
3. Fill in the required template parameters and the recipient phone number.
4. Click **Send**. The template message is delivered to the recipient's WhatsApp.
5. If the template includes Quick Reply buttons, button clicks are captured and displayed in the delivery status panel.

#### Demo 3 — AI Agent (Triage + Connected Agents)

This demo requires the AI Foundry and Cosmos DB setup described below. Once configured, every inbound WhatsApp message is automatically routed to the triage agent, which delegates to specialized agents and sends the response back via WhatsApp.

1. Send a message from your personal WhatsApp to the registered business phone number.
2. The message arrives via Event Grid → the webhook stores it and forwards it to the AI Foundry triage agent.
3. The triage agent determines the intent and may hand off to a Connected Agent (e.g., a payment specialist, an enrollment specialist).
4. The agent's text response is sent back to the user's WhatsApp via ACS.
5. The full conversation thread is visible in the **Simple Messaging** demo panel.

> If `AZURE_AI_PROJECT_ENDPOINT`, `AZURE_AI_AGENT_ID`, and a Cosmos DB connection are not set, inbound messages are stored but not processed by the AI agent.

---

## AI Layer Setup

The AI layer adds intelligent agent-based routing to inbound WhatsApp messages. It uses **Azure AI Foundry** for the agent runtime and **Azure Cosmos DB** for persisting conversation state (phone → thread mapping).

### Architecture Overview

```
WhatsApp User
     │
     ▼
Azure Event Grid ──▶ Express Webhook (/api/webhooks/acs)
                          │
                          ├── Store message (in-memory)
                          │
                          └── (if agent configured) ──▶ Agent Service
                                                           │
                                    ┌──────────────────────┤
                                    ▼                      ▼
                              Cosmos DB              AI Foundry
                          (phone→thread map)      (Triage Agent)
                                                       │
                                                       ├── Connected Agent A
                                                       ├── Connected Agent B
                                                       └── ...
                                                           │
                                                           ▼
                                                   Agent Response
                                                           │
                                                           ▼
                                                  ACS Send Message
                                                  (back to WhatsApp)
```

### Set Up Azure Cosmos DB

Cosmos DB stores the mapping between each WhatsApp phone number and its AI Foundry thread ID. This ensures continuity — the same thread is reused across all interactions with a given user.

#### 1. Create the Cosmos DB Account

```bash
# Create a resource group (or use an existing one)
az group create --name rg-whatsapp-demo --location eastus2

# Create a Cosmos DB account (NoSQL API)
az cosmosdb create \
  --name <your-cosmos-account> \
  --resource-group rg-whatsapp-demo \
  --kind GlobalDocumentDB \
  --default-consistency-level Session
```

#### 2. Create the Database and Container

The application references the database and container directly (it does **not** auto-create them) to avoid requiring control-plane RBAC permissions.

```bash
# Create the database
az cosmosdb sql database create \
  --account-name <your-cosmos-account> \
  --resource-group rg-whatsapp-demo \
  --name whatsapp-agents

# Create the container with partition key /phoneNumber
az cosmosdb sql container create \
  --account-name <your-cosmos-account> \
  --resource-group rg-whatsapp-demo \
  --database-name whatsapp-agents \
  --name conversations \
  --partition-key-path "/phoneNumber"
```

#### 3. Configure Authentication

You can use **either** approach:

| Method | Env Variable | Best For |
|--------|--------------|----------|
| Connection string (key-based) | `COSMOS_DB_CONNECTION_STRING` | Local development |
| Entra ID / RBAC | `COSMOS_DB_ENDPOINT` | Production / passwordless |

**Key-based auth:**

```bash
# Get the connection string
az cosmosdb keys list \
  --name <your-cosmos-account> \
  --resource-group rg-whatsapp-demo \
  --type connection-strings \
  --query "connectionStrings[0].connectionString" -o tsv
```

Set the result as `COSMOS_DB_CONNECTION_STRING` in `backend/.env`.

**Entra ID auth (recommended for production):**

1. Set `COSMOS_DB_ENDPOINT` in `backend/.env` (e.g., `https://<account>.documents.azure.com:443/`).
2. Assign the **Cosmos DB Built-in Data Contributor** role to your identity:

```bash
az cosmosdb sql role assignment create \
  --account-name <your-cosmos-account> \
  --resource-group rg-whatsapp-demo \
  --role-definition-name "Cosmos DB Built-in Data Contributor" \
  --scope "/" \
  --principal-id <your-principal-id>
```

3. The application uses `DefaultAzureCredential` to authenticate automatically (works with Azure CLI, Managed Identity, VS Code, etc.).

#### Cosmos DB Data Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Same as `phoneNumber` (document ID) |
| `phoneNumber` | `string` | Phone number in E.164 format (partition key) |
| `threadId` | `string` | AI Foundry thread ID |
| `createdAt` | `string` | ISO 8601 timestamp of creation |
| `updatedAt` | `string` | ISO 8601 timestamp of last interaction |

### Set Up Azure AI Foundry Agent

Azure AI Foundry provides the agent runtime. The project uses the **Connected Agents** pattern: a single **triage agent** receives every inbound message and delegates to specialized agents based on user intent.

#### 1. Create an AI Foundry Project

1. Go to [Azure AI Foundry](https://ai.azure.com/).
2. Create a new **project** (or use an existing one).
3. Note the **project endpoint URL** — it looks like `https://<project>.services.ai.azure.com/api/projects/<project-name>`.
4. Set this as `AZURE_AI_PROJECT_ENDPOINT` in `backend/.env`.

#### 2. Create the Triage Agent

1. In the AI Foundry portal, navigate to your project → **Agents**.
2. Create a new agent:
   - **Name**: `triage-agent` (or any descriptive name)
   - **Model**: Choose an appropriate model (e.g., `gpt-4o`)
   - **Instructions**: Describe the agent's role — e.g., "You are a school assistant. Route payment questions to the payment agent, enrollment questions to the enrollment agent, etc."
3. After creation, copy the **Agent ID** (e.g., `asst_OeqZCNjTzJqG3cxTcuRBN23u`).
4. Set this as `AZURE_AI_AGENT_ID` in `backend/.env`.

#### 3. Create Specialized (Connected) Agents

1. Create additional agents for each domain (e.g., payment agent, enrollment agent, attendance agent).
2. Give each agent specific instructions and tools relevant to its domain.
3. In the **triage agent**, add each specialized agent as a **Connected Agent** tool — the triage agent will hand off conversations to them automatically based on intent.

#### 4. Configure RBAC

The identity running the application needs the **Azure AI Developer** role on the AI Foundry project:

```bash
az role assignment create \
  --assignee <your-principal-id> \
  --role "Azure AI Developer" \
  --scope /subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.MachineLearningServices/workspaces/<project-name>
```

For local development, `DefaultAzureCredential` will use your Azure CLI or VS Code credentials.

### How the AI Flow Works

1. **Inbound message arrives** via Event Grid → `POST /api/webhooks/acs`.
2. The webhook handler checks `isAgentConfigured()` — if AI Foundry + Cosmos DB are configured, it proceeds.
3. **`agent.service.ts`** looks up the phone number in Cosmos DB:
   - If a thread exists, it reuses it (conversation continuity).
   - If not, it creates a new AI Foundry thread and saves the mapping.
4. The user's message is appended to the thread.
5. A **run** is created against the triage agent and polled until completion.
   - If the triage agent invokes a Connected Agent tool, the platform handles the handoff transparently within the same run.
6. The latest assistant message is extracted from the thread.
7. The response is sent back to the user's WhatsApp via ACS.
8. The conversation timestamp is updated in Cosmos DB.

---

## Project Structure

```
backend/              # Express API server
  .env.example        # Environment variable template
  src/
    index.ts          # App setup and server start
    config.ts         # Typed env var configuration
    routes/           # API route handlers
      messages.ts     #   Send/receive text messages
      templates.ts    #   WhatsApp template operations
      webhooks.ts     #   Event Grid webhook handler + AI agent routing
      flows.ts        #   WhatsApp Flows data endpoint
      students.ts     #   Student lookup
      fees.ts         #   Fee queries
      payments.ts     #   Payment processing
    services/         # Business logic layer
      agent.service.ts      # AI Foundry triage agent integration
      cosmos.service.ts     # Cosmos DB conversation state persistence
      conversation.service.ts # In-memory conversation store + SSE events
      messaging.service.ts  # ACS message sending
      payment.service.ts    # Payment processing (mock)
      student.service.ts    # Student data (mock)
    flows/            # WhatsApp Flow JSON definitions
    types/            # Shared TypeScript interfaces
    data/             # Mock/in-memory data
    public/           # Demo UI (static HTML/CSS/JS)
      demos/          #   Individual demo pages
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/health` | Health check |
| `GET`  | `/api/config` | Public config (company name) |
| `POST` | `/api/messages/send` | Send a text message |
| `POST` | `/api/templates/send` | Send a template message |
| `GET`  | `/api/templates` | List available templates |
| `POST` | `/api/webhooks/acs` | Event Grid webhook receiver |
| `POST` | `/api/flows/endpoint` | WhatsApp Flows data endpoint |
| `GET`  | `/api/students/:phone` | Get students by parent phone |
| `GET`  | `/api/students/:studentId/fees` | Get fees for a student |
| `POST` | `/api/payments` | Process a payment |

## Copilot Agents

This repo includes specialized Copilot agents under `.github/agents/`:

| Agent | Purpose |
|-------|---------|
| `@backend-api` | Express routes, services, REST patterns |
| `@whatsapp-flows` | WhatsApp Flow JSON authoring |
| `@acs-messaging` | ACS Advanced Messaging SDK integration |
| `@event-handler` | Event Grid webhook handling |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Missing env vars warning on startup | Ensure `backend/.env` exists and all required variables are set |
| Webhook validation fails | Verify the forwarded URL is **public** and ends with `/api/webhooks/acs` |
| Messages not arriving in the demo UI | Confirm the Event Grid subscription is active and the port forwarding tunnel is running |
| `ERR_MODULE_NOT_FOUND` on start | Run `npm install` from the root folder to install workspace dependencies |
| Port already in use | Change `PORT` in `backend/.env` or stop the process using port 3000 |
| "AI Foundry agent variables not set" warning | Set `AZURE_AI_PROJECT_ENDPOINT` and `AZURE_AI_AGENT_ID` in `.env` (or leave unset to disable AI) |
| "No Cosmos DB connection configured" warning | Set `COSMOS_DB_CONNECTION_STRING` or `COSMOS_DB_ENDPOINT` in `.env` |
| Agent run fails with `authorization` error | Ensure your identity has the **Azure AI Developer** role on the AI Foundry project |
| Cosmos DB 403 Forbidden | Assign the **Cosmos DB Built-in Data Contributor** role, or use a connection string |
| Cosmos DB 404 on read/write | Pre-create the database (`whatsapp-agents`) and container (`conversations`) — the app does not auto-create them |
| "Agent run failed with status: failed" | Check the AI Foundry portal for agent run logs; ensure the model deployment is active and the agent instructions are valid |
