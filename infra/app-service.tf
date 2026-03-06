# =============================================================================
# App Service (optional — controlled by var.deploy_app_service)
# =============================================================================

resource "azurerm_service_plan" "main" {
  count = var.deploy_app_service ? 1 : 0

  name                = "plan-${var.app_name}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = var.app_service_plan_sku

  tags = local.tags
}

resource "azurerm_linux_web_app" "main" {
  count = var.deploy_app_service ? 1 : 0

  name                = var.app_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.main[0].id

  identity {
    type = "SystemAssigned"
  }

  site_config {
    application_stack {
      node_version = var.node_version
    }
    app_command_line = "node index.js"
    always_on        = true
  }

  app_settings = {
    "WEBSITES_PORT"                = tostring(var.app_port)
    "NODE_ENV"                     = "production"
    "PORT"                         = tostring(var.app_port)
    "COMPANY_NAME"                 = var.company_name
    "ACS_CONNECTION_STRING"        = azurerm_communication_service.main.primary_connection_string
    "ACS_CHANNEL_REGISTRATION_ID"  = "REPLACE_AFTER_WHATSAPP_SETUP"
    "COSMOS_DB_ENDPOINT"           = azurerm_cosmosdb_account.main.endpoint
    "COSMOS_DB_DATABASE_NAME"      = var.cosmos_database_name
    "COSMOS_DB_CONTAINER_NAME"     = var.cosmos_container_name
    "AZURE_AI_PROJECT_ENDPOINT"    = "REPLACE_AFTER_AI_FOUNDRY_SETUP"
    "AZURE_AI_AGENT_ID"            = "REPLACE_AFTER_AGENT_CREATION"
    "SCM_DO_BUILD_DURING_DEPLOYMENT" = "true"
  }

  tags = local.tags
}

# ── Cosmos DB RBAC for App Service Managed Identity ────────────────────────

resource "azurerm_cosmosdb_sql_role_assignment" "app_service" {
  count = var.deploy_app_service ? 1 : 0

  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  role_definition_id  = "${azurerm_cosmosdb_account.main.id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000002"
  principal_id        = azurerm_linux_web_app.main[0].identity[0].principal_id
  scope               = azurerm_cosmosdb_account.main.id
}
