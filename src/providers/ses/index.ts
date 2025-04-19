import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import SESNotificationProviderService from "./service";

export default ModuleProvider(Modules.NOTIFICATION, {
  services: [SESNotificationProviderService],
});
