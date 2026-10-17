// Powertech ERP - Notification Service Interface
// Pluggable architecture ready for Email (SMTP/SES) and WhatsApp (Twilio/Gupshup)

export interface NotificationPayload {
  recipient: string; // Email address or WhatsApp phone number
  recipientName: string;
  type: 'OVERDUE_PAYMENT' | 'ENQUIRY_FOLLOW_UP' | 'ORDER_STATUS_UPDATE' | 'DISPATCH_DELAYED';
  title: string;
  body: string;
  metadata?: Record<string, any>;
}

export interface INotificationProvider {
  channelName: string;
  send(payload: NotificationPayload): Promise<boolean>;
}

class ConsoleEmailProvider implements INotificationProvider {
  channelName = 'Email (Development Mock)';

  async send(payload: NotificationPayload): Promise<boolean> {
    console.log(`[Notification:Email] Sending "${payload.title}" to ${payload.recipient} (${payload.recipientName})`);
    console.log(`[Notification:Email] Body: ${payload.body}`);
    return true;
  }
}

class ConsoleWhatsAppProvider implements INotificationProvider {
  channelName = 'WhatsApp (Development Mock)';

  async send(payload: NotificationPayload): Promise<boolean> {
    console.log(`[Notification:WhatsApp] Sending message to ${payload.recipient} (${payload.recipientName})`);
    console.log(`[Notification:WhatsApp] Body: ${payload.body}`);
    return true;
  }
}

class NotificationService {
  private emailProvider: INotificationProvider = new ConsoleEmailProvider();
  private whatsAppProvider: INotificationProvider = new ConsoleWhatsAppProvider();

  public setEmailProvider(provider: INotificationProvider) {
    this.emailProvider = provider;
  }

  public setWhatsAppProvider(provider: INotificationProvider) {
    this.whatsAppProvider = provider;
  }

  async sendOverduePaymentReminder(invoiceNumber: string, customerName: string, phone: string, email: string, balance: number, daysOverdue: number): Promise<void> {
    const title = `Payment Reminder: Invoice ${invoiceNumber} Overdue by ${daysOverdue} Days`;
    const body = `Dear ${customerName}, please be reminded that Invoice ${invoiceNumber} has an outstanding balance of INR ${balance.toLocaleString('en-IN')}. Kindly remit the balance at your earliest convenience.`;

    if (email) {
      await this.emailProvider.send({
        recipient: email,
        recipientName: customerName,
        type: 'OVERDUE_PAYMENT',
        title,
        body,
        metadata: { invoiceNumber, balance, daysOverdue },
      });
    }

    if (phone) {
      await this.whatsAppProvider.send({
        recipient: phone,
        recipientName: customerName,
        type: 'OVERDUE_PAYMENT',
        title,
        body,
        metadata: { invoiceNumber, balance, daysOverdue },
      });
    }
  }

  async sendDispatchNotification(dispatchNumber: string, orderNumber: string, customerName: string, phone: string, trackingNumber: string, courier: string): Promise<void> {
    const title = `Shipment Dispatched: Order ${orderNumber}`;
    const body = `Dear ${customerName}, your goods under Order ${orderNumber} have been dispatched via ${courier} with tracking number ${trackingNumber} (Dispatch Ref: ${dispatchNumber}).`;

    if (phone) {
      await this.whatsAppProvider.send({
        recipient: phone,
        recipientName: customerName,
        type: 'ORDER_STATUS_UPDATE',
        title,
        body,
        metadata: { dispatchNumber, orderNumber, trackingNumber },
      });
    }
  }
}

export const notificationService = new NotificationService();
