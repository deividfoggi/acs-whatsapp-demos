# =============================================================================
# Event Grid — ACS webhook subscription (optional, with App Service)
# =============================================================================

resource "azurerm_eventgrid_system_topic" "acs" {
  count = var.deploy_app_service ? 1 : 0

  name                   = "evgt-${var.acs_name}"
  resource_group_name    = azurerm_resource_group.main.name
  location               = "global"
  source_arm_resource_id = azurerm_communication_service.main.id
  topic_type             = "Microsoft.Communication.CommunicationServices"

  tags = local.tags
}

resource "azurerm_eventgrid_system_topic_event_subscription" "acs_webhooks" {
  count = var.deploy_app_service ? 1 : 0

  name                = "evgs-acs-webhooks"
  system_topic        = azurerm_eventgrid_system_topic.acs[0].name
  resource_group_name = azurerm_resource_group.main.name

  included_event_types = [
    "Microsoft.Communication.AdvancedMessageReceived",
    "Microsoft.Communication.AdvancedMessageDeliveryStatusUpdated"
  ]

  webhook_endpoint {
    url = "https://${azurerm_linux_web_app.main[0].default_hostname}/api/webhooks/acs"
  }
}
