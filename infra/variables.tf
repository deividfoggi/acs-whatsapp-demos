# =============================================================================
# Input Variables
# =============================================================================

variable "resource_group_name" {
  description = "Name of the Azure Resource Group"
  type        = string
  default     = "acs-whatsapp-demo-rg"
}

variable "location" {
  description = "Azure region for all resources"
  type        = string
  default     = "eastus2"
}

# ── ACS ──────────────────────────────────────────────────────────────────────

variable "acs_name" {
  description = "Name of the Azure Communication Services resource"
  type        = string
  default     = "acs-whatsapp-demo"
}

variable "acs_data_location" {
  description = "Data location for the ACS resource"
  type        = string
  default     = "Brazil"
}

# ── Cosmos DB ────────────────────────────────────────────────────────────────

variable "cosmos_account_name" {
  description = "Name of the Cosmos DB account"
  type        = string
  default     = "cosmos-whatsapp-demo"
}

variable "cosmos_database_name" {
  description = "Name of the Cosmos DB database"
  type        = string
  default     = "whatsapp-agents"
}

variable "cosmos_container_name" {
  description = "Name of the Cosmos DB container"
  type        = string
  default     = "conversations"
}

variable "cosmos_throughput" {
  description = "RU/s throughput for the Cosmos DB database (shared)"
  type        = number
  default     = 400
}

# ── AI Search ────────────────────────────────────────────────────────────────

variable "search_name" {
  description = "Name of the Azure AI Search service"
  type        = string
  default     = "search-whatsapp-demo"
}

variable "search_sku" {
  description = "SKU for the AI Search service"
  type        = string
  default     = "basic"
}

# ── AI Foundry ───────────────────────────────────────────────────────────────

variable "ai_hub_name" {
  description = "Name of the Azure AI Foundry Hub"
  type        = string
  default     = "hub-whatsapp-demo"
}

variable "ai_project_name" {
  description = "Name of the Azure AI Foundry Project"
  type        = string
  default     = "proj-whatsapp-demo"
}

variable "model_deployment_name" {
  description = "Name of the GPT-4o model deployment"
  type        = string
  default     = "gpt-4o"
}

variable "model_version" {
  description = "Version of the GPT-4o model"
  type        = string
  default     = "2024-08-06"
}

variable "model_sku_capacity" {
  description = "TPM (tokens per minute) capacity for the model deployment (in thousands)"
  type        = number
  default     = 30
}

# ── App Service ──────────────────────────────────────────────────────────────

variable "deploy_app_service" {
  description = "Whether to deploy an Azure App Service for hosting the backend"
  type        = bool
  default     = true
}

variable "app_service_plan_sku" {
  description = "SKU for the App Service Plan"
  type        = string
  default     = "B1"
}

variable "app_name" {
  description = "Name of the App Service (must be globally unique)"
  type        = string
  default     = "app-whatsapp-demo"
}

variable "node_version" {
  description = "Node.js version for the App Service"
  type        = string
  default     = "20-lts"
}

# ── Application ──────────────────────────────────────────────────────────────

variable "company_name" {
  description = "Company/organization name displayed in WhatsApp messages"
  type        = string
  default     = "Contoso Education"
}

variable "app_port" {
  description = "Port the Express server listens on"
  type        = number
  default     = 3000
}
