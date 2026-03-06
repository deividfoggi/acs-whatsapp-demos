# =============================================================================
# Azure AI Foundry — Hub, Project, AI Services, and GPT-4o deployment
# =============================================================================

# ── Storage Account (required by AI Hub) ─────────────────────────────────────

resource "azurerm_storage_account" "ai" {
  name                     = replace("st${var.ai_hub_name}", "-", "")
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = local.tags
}

# ── Key Vault (required by AI Hub) ───────────────────────────────────────────

resource "azurerm_key_vault" "ai" {
  name                     = "kv-${var.ai_hub_name}"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  tenant_id                = data.azurerm_client_config.current.tenant_id
  sku_name                 = "standard"
  purge_protection_enabled = false

  tags = local.tags
}

# ── AI Services (Cognitive Services — hosts GPT-4o) ──────────────────────────

resource "azurerm_ai_services" "main" {
  name                = "ais-${var.ai_hub_name}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku_name            = "S0"

  tags = local.tags
}

# ── GPT-4o Model Deployment ──────────────────────────────────────────────────

resource "azurerm_cognitive_deployment" "gpt4o" {
  name                 = var.model_deployment_name
  cognitive_account_id = azurerm_ai_services.main.id

  model {
    format  = "OpenAI"
    name    = "gpt-4o"
    version = var.model_version
  }

  sku {
    name     = "GlobalStandard"
    capacity = var.model_sku_capacity
  }
}

# ── AI Foundry Hub ───────────────────────────────────────────────────────────

resource "azurerm_ai_foundry" "hub" {
  name                = var.ai_hub_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  storage_account_id  = azurerm_storage_account.ai.id
  key_vault_id        = azurerm_key_vault.ai.id

  identity {
    type = "SystemAssigned"
  }

  tags = local.tags
}

# ── AI Foundry Project ───────────────────────────────────────────────────────

resource "azurerm_ai_foundry_project" "project" {
  name               = var.ai_project_name
  ai_services_hub_id = azurerm_ai_foundry.hub.id
  location           = azurerm_resource_group.main.location

  identity {
    type = "SystemAssigned"
  }

  tags = local.tags
}
