# =============================================================================
# Azure Communication Services
# =============================================================================

resource "azurerm_communication_service" "main" {
  name                = var.acs_name
  resource_group_name = azurerm_resource_group.main.name
  data_location       = var.acs_data_location

  tags = local.tags
}
