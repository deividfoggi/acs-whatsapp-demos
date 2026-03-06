# =============================================================================
# Azure AI Search (knowledge retrieval for RAG agents)
# =============================================================================

resource "azurerm_search_service" "main" {
  name                = var.search_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = var.search_sku

  tags = local.tags
}
