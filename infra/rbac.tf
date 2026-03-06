# =============================================================================
# RBAC — Role Assignments for AI Services
# =============================================================================

# ── Deploying user → AI Services roles ───────────────────────────────────────

resource "azurerm_role_assignment" "deployer_cognitive_user" {
  scope                = azurerm_ai_services.main.id
  role_definition_name = "Cognitive Services OpenAI User"
  principal_id         = data.azurerm_client_config.current.object_id
}

resource "azurerm_role_assignment" "deployer_ai_developer" {
  scope                = azurerm_ai_foundry_project.project.id
  role_definition_name = "Azure AI Developer"
  principal_id         = data.azurerm_client_config.current.object_id
}

# ── App Service Managed Identity → AI Services roles (if deployed) ───────────

resource "azurerm_role_assignment" "app_cognitive_user" {
  count = var.deploy_app_service ? 1 : 0

  scope                = azurerm_ai_services.main.id
  role_definition_name = "Cognitive Services OpenAI User"
  principal_id         = azurerm_linux_web_app.main[0].identity[0].principal_id
}

resource "azurerm_role_assignment" "app_ai_developer" {
  count = var.deploy_app_service ? 1 : 0

  scope                = azurerm_ai_foundry_project.project.id
  role_definition_name = "Azure AI Developer"
  principal_id         = azurerm_linux_web_app.main[0].identity[0].principal_id
}

# ── AI Hub Managed Identity → AI Services connection ─────────────────────────

resource "azurerm_role_assignment" "hub_cognitive_user" {
  scope                = azurerm_ai_services.main.id
  role_definition_name = "Cognitive Services OpenAI Contributor"
  principal_id         = azurerm_ai_foundry.hub.identity[0].principal_id
}

# ── AI Project Managed Identity → AI Search ──────────────────────────────────

resource "azurerm_role_assignment" "project_search_contributor" {
  scope                = azurerm_search_service.main.id
  role_definition_name = "Search Index Data Contributor"
  principal_id         = azurerm_ai_foundry_project.project.identity[0].principal_id
}

resource "azurerm_role_assignment" "project_search_reader" {
  scope                = azurerm_search_service.main.id
  role_definition_name = "Search Service Contributor"
  principal_id         = azurerm_ai_foundry_project.project.identity[0].principal_id
}
