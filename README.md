# ACS WhatsApp Demos

WhatsApp use case demos powered by [Azure Communication Services Advanced Messaging](https://learn.microsoft.com/en-us/azure/communication-services/concepts/advanced-messaging/whatsapp/whatsapp-overview). Parents and guardians interact with the school system via WhatsApp. The company/organization name displayed in the UI is configured via the `COMPANY_NAME` environment variable.

## Use Cases

| # | Use Case | Status |
|---|----------|--------|
| 1 | **Simple Messaging** — Send and receive text messages between the business and WhatsApp users | ✅ Available |
| 2 | **Template Messages** — Browse and send pre-approved WhatsApp template messages with dynamic parameters and Quick Reply buttons | ✅ Available |
| 3 | **Payment Flow** — Parents pay tuition/fees via WhatsApp Flows | 🚧 In Progress |

## Tech Stack

- **Runtime**: Node.js 20+ / TypeScript
- **Backend**: Express
- **Messaging**: Azure Communication Services (`@azure-rest/communication-messages`)
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
```

| Variable | Required | Description |
|----------|----------|-------------|
| `ACS_CONNECTION_STRING` | Yes | Connection string from your ACS resource (Azure Portal → ACS resource → Keys) |
| `ACS_CHANNEL_REGISTRATION_ID` | Yes | GUID of your WhatsApp channel registration (Azure Portal → ACS resource → Channels → WhatsApp) |
| `COMPANY_NAME` | Yes | Display name used in the UI and messages |
| `PORT` | No | Server port (default: `3000`) |
| `NODE_ENV` | No | `development` or `production` (default: `development`) |

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
      webhooks.ts     #   Event Grid webhook handler
      flows.ts        #   WhatsApp Flows data endpoint
      students.ts     #   Student lookup
      fees.ts         #   Fee queries
      payments.ts     #   Payment processing
    services/         # Business logic layer (in-memory dummy data)
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
