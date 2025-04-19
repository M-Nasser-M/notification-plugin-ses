import { AbstractNotificationProviderService } from "@medusajs/framework/utils";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import type { NotificationTypes } from "@medusajs/framework/types";

interface Options {
  SES_ACCESS_KEY_ID: string;
  SES_SECRET_ACCESS_KEY: string;
  SES_REGION: string;
  SES_MAIL_FROM: string;
  SES_DEFAULT_SUBJECT?: string;
}

class SESNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "notification-ses";
  protected options_: Options;
  protected container_: Record<string, unknown>;
  protected client: SESClient;

  constructor(container: Record<string, unknown>, options: Options) {
    super();
    this.options_ = options;
    this.container_ = container;

    // Initialize SES client
    this.client = new SESClient({
      region: this.options_.SES_REGION,
      credentials: {
        accessKeyId: this.options_.SES_ACCESS_KEY_ID,
        secretAccessKey: this.options_.SES_SECRET_ACCESS_KEY,
      },
    });
  }

  static validateOptions(options: Record<string, unknown>) {
    if (!options.SES_ACCESS_KEY_ID) {
      throw new Error(
        "SES_ACCESS_KEY_ID is required in the provider's options."
      );
    }

    if (!options.SES_SECRET_ACCESS_KEY) {
      throw new Error(
        "SES_SECRET_ACCESS_KEY is required in the provider's options."
      );
    }

    if (!options.SES_REGION) {
      throw new Error("SES_REGION is required in the provider's options.");
    }

    if (!options.SES_MAIL_FROM) {
      throw new Error("SES_MAIL_FROM is required in the provider's options.");
    }

    return options;
  }

  async send(
    notification: NotificationTypes.ProviderSendNotificationDTO
  ): Promise<NotificationTypes.ProviderSendNotificationResultsDTO> {
    try {
      const command = new SendEmailCommand({
        Source: this.options_.SES_MAIL_FROM,
        Destination: {
          ToAddresses: [notification.to],
        },
        Message: {
          Subject: {
            Data:
              notification.content?.subject ||
              this.options_.SES_DEFAULT_SUBJECT,
            Charset: "UTF-8",
          },
          Body: {
            ...(notification.content?.html && {
              Html: {
                Data: notification.content.html,
                Charset: "UTF-8",
              },
            }),
            ...(notification.content?.text && {
              Text: {
                Data: notification.content.text,
                Charset: "UTF-8",
              },
            }),
          },
        },
      });

      const response = await this.client.send(command);
      return {
        id: response.MessageId,
      };
    } catch (error) {
      console.error("Failed to send email via SES:", error);
      throw new Error(`Failed to send notification: ${error.message}`);
    }
  }
}

export default SESNotificationProviderService;
