# =============================================================================
# Outputs
# =============================================================================

# ── Resource Group ───────────────────────────────────────────────────────────

output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

# ── ACS ──────────────────────────────────────────────────────────────────────

output "acs_connection_string" {
  description = "ACS primary connection string"
  value       = azurerm_communication_service.main.primary_connection_string
  sensitive   = true
}

# ── Cosmos DB ────────────────────────────────────────────────────────────────

output "cosmos_endpoint" {
  description = "Cosmos DB account endpoint"
  value       = azurerm_cosmosdb_account.main.endpoint
}

output "cosmos_connection_string" {
  description = "Cosmos DB primary connection string (for local development)"
  value       = azurerm_cosmosdb_account.main.primary_sql_connection_string
  sensitive   = true
}

# ── AI Search ────────────────────────────────────────────────────────────────

output "search_endpoint" {
  description = "AI Search service endpoint"
  value       = "https://${azurerm_search_service.main.name}.search.windows.net"
}

output "search_admin_key" {
  description = "AI Search primary admin key"
  value       = azurerm_search_service.main.primary_key
  sensitive   = true
}

# ── AI Foundry ───────────────────────────────────────────────────────────────

output "ai_services_endpoint" {
  description = "AI Services endpoint"
  value       = azurerm_ai_services.main.endpoint
}

output "ai_hub_id" {
  description = "AI Foundry Hub resource ID"
  value       = azurerm_ai_foundry.hub.id
}

output "ai_project_id" {
  description = "AI Foundry Project resource ID"
  value       = azurerm_ai_foundry_project.project.id
}

# ── App Service ──────────────────────────────────────────────────────────────

output "app_service_url" {
  description = "App Service default hostname"
  value       = var.deploy_app_service ? "https://${azurerm_linux_web_app.main[0].default_hostname}" : null
}

output "app_service_principal_id" {
  description = "App Service Managed Identity principal ID"
  value       = var.deploy_app_service ? azurerm_linux_web_app.main[0].identity[0].principal_id : null
}

# ── Convenience: .env file content ───────────────────────────────────────────

output "dotenv_template" {
  description = "Environment variables for backend/.env (fill in manual values)"
  sensitive   = true
  value       = <<-EOT
    # ── ACS ──
    ACS_CONNECTION_STRING=${azurerm_communication_service.main.primary_connection_string}
    ACS_CHANNEL_REGISTRATION_ID=<your-whatsapp-channel-registration-id>

    # ── Cosmos DB ──
    COSMOS_DB_CONNECTION_STRING=${azurerm_cosmosdb_account.main.primary_sql_connection_string}
    COSMOS_DB_ENDPOINT=${azurerm_cosmosdb_account.main.endpoint}
    COSMOS_DB_DATABASE_NAME=${var.cosmos_database_name}
    COSMOS_DB_CONTAINER_NAME=${var.cosmos_container_name}

    # ── AI Foundry ──
    AZURE_AI_PROJECT_ENDPOINT=<set-after-project-creation>
    AZURE_AI_AGENT_ID=<set-after-agent-creation>

    # ── App ──
    COMPANY_NAME=${var.company_name}
    PORT=${var.app_port}
    NODE_ENV=development
  EOT
}
