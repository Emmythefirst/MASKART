/**
 * Email Service
 * This is a placeholder for email functionality
 * Can be integrated with SendGrid, AWS SES, or other email services
 */

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

interface OrderEmailParams {
  orderId: string;
  productName: string;
  downloadToken: string;
  expiresAt: Date;
}

class EmailService {
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.EMAIL_ENABLED === 'true';
  }

  /**
   * Send generic email
   */
  async sendEmail(params: EmailParams): Promise<boolean> {
    if (!this.enabled) {
      console.log('Email disabled. Would send:', params);
      return false;
    }

    try {
      // TODO: Implement actual email sending
      console.log('Sending email:', params.subject);
      
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (error) {
      console.error('Send email error:', error);
      return false;
    }
  }

  /**
   * Send order confirmation email (if user provided email)
   */
  async sendOrderConfirmation(
    email: string,
    params: OrderEmailParams
  ): Promise<boolean> {
    const downloadUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/download/${params.downloadToken}`;
    
    const emailParams: EmailParams = {
      to: email,
      subject: `Your order is ready! - ${params.productName}`,
      html: `
        <h1>Thank you for your purchase!</h1>
        <p>Your order <strong>${params.orderId}</strong> is ready for download.</p>
        <p>Product: <strong>${params.productName}</strong></p>
        <p>
          <a href="${downloadUrl}" style="background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Download Now
          </a>
        </p>
        <p>This download link will expire on ${params.expiresAt.toLocaleString()}.</p>
        <p>
          <small>
            This is an automated message. Your purchase was completely anonymous - 
            we don't store any personal information.
          </small>
        </p>
      `,
      text: `
Thank you for your purchase!

Your order ${params.orderId} is ready for download.

Product: ${params.productName}
Download URL: ${downloadUrl}

This download link will expire on ${params.expiresAt.toLocaleString()}.

This is an automated message. Your purchase was completely anonymous.
      `
    };

    return await this.sendEmail(emailParams);
  }

/**
 * Send card issued notification
 */
async sendCardIssuedNotification(
  email: string,
  params: {
    orderId: string;
    cardValue: number;
    cardType: 'visa' | 'mastercard';
  }
): Promise<boolean> {
  const emailParams: EmailParams = {
    to: email,
    subject: `Your ${params.cardType.toUpperCase()} Card is Ready!`,
    html: `
      <h1>Your Virtual Card Has Been Issued! 🎉</h1>
      <p>Great news! Your virtual ${params.cardType.toUpperCase()} card has been successfully issued.</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Card Value:</strong> $${params.cardValue.toFixed(2)}</p>
        <p><strong>Card Type:</strong> ${params.cardType.toUpperCase()}</p>
        <p><strong>Order ID:</strong> ${params.orderId}</p>
      </div>

      <p>Your card details should arrive in a separate email from Starpay within the next few minutes.</p>
      
      <p>
        <strong>Need help?</strong><br>
        Contact support with your Order ID if you don't receive your card details.
      </p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      
      <p style="font-size: 12px; color: #666;">
        This is an automated message from Ghost Commerce. Your purchase was completely anonymous.
      </p>
    `,
    text: `
Your Virtual Card Has Been Issued!

Your virtual ${params.cardType.toUpperCase()} card has been successfully issued.

Card Value: $${params.cardValue.toFixed(2)}
Card Type: ${params.cardType.toUpperCase()}
Order ID: ${params.orderId}

Your card details should arrive in a separate email from Starpay within the next few minutes.

Need help? Contact support with your Order ID if you don't receive your card details.
    `
  };

  return await this.sendEmail(emailParams);
}

  /**
   * Send test email
   */
  async sendTestEmail(to: string): Promise<boolean> {
    return await this.sendEmail({
      to,
      subject: 'Test Email from Ghost Commerce',
      text: 'This is a test email from Ghost Commerce.',
      html: '<h1>Test Email</h1><p>This is a test email from Ghost Commerce.</p>'
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();

export default emailService;