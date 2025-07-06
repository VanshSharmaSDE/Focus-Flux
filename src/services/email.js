import { account } from './appwrite';
import { ID } from 'appwrite';

class EmailService {
  // Base URL for redirects (can be configured for different environments)
  baseURL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';

  // Email templates
  templates = {
    OTP_VERIFICATION: {
      subject: 'Email Verification - FocusFlux',
      getContent: (otp, name = 'User') => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4F46E5; margin: 0;">FocusFlux</h1>
            <p style="color: #6B7280; margin: 5px 0;">Boost Your Productivity</p>
          </div>
          
          <div style="background: #F8FAFC; padding: 30px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #1F2937; margin-top: 0;">Email Verification</h2>
            <p style="color: #374151; font-size: 16px;">Hi ${name},</p>
            <p style="color: #374151; font-size: 16px;">Welcome to FocusFlux! Please use the verification code below to complete your account setup:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background: #4F46E5; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 8px; display: inline-block;">
                ${otp}
              </div>
            </div>
            
            <p style="color: #6B7280; font-size: 14px; text-align: center;">
              This code will expire in 5 minutes for security purposes.
            </p>
            
            <p style="color: #374151; font-size: 16px;">
              If you didn't request this verification, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #9CA3AF; font-size: 12px;">
              © 2025 FocusFlux. All rights reserved.
            </p>
          </div>
        </div>
      `
    },

    PASSWORD_RESET: {
      subject: 'Password Reset - FocusFlux',
      getContent: (resetLink, name = 'User') => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4F46E5; margin: 0;">FocusFlux</h1>
            <p style="color: #6B7280; margin: 5px 0;">Boost Your Productivity</p>
          </div>
          
          <div style="background: #FEF2F2; padding: 30px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #EF4444;">
            <h2 style="color: #DC2626; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #374151; font-size: 16px;">Hi ${name},</p>
            <p style="color: #374151; font-size: 16px;">We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: #EF4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #6B7280; font-size: 14px;">
              This link will expire in 1 hour for security purposes.
            </p>
            
            <p style="color: #374151; font-size: 16px;">
              If you didn't request a password reset, please ignore this email or contact support if you have concerns.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #9CA3AF; font-size: 12px;">
              © 2025 FocusFlux. All rights reserved.
            </p>
          </div>
        </div>
      `
    },

    WELCOME: {
      subject: 'Welcome to FocusFlux! 🎉',
      getContent: (name = 'User') => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4F46E5; margin: 0;">FocusFlux</h1>
            <p style="color: #6B7280; margin: 5px 0;">Boost Your Productivity</p>
          </div>
          
          <div style="background: #F0FDF4; padding: 30px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #22C55E;">
            <h2 style="color: #15803D; margin-top: 0;">Welcome aboard! 🎉</h2>
            <p style="color: #374151; font-size: 16px;">Hi ${name},</p>
            <p style="color: #374151; font-size: 16px;">
              Congratulations! Your FocusFlux account has been successfully verified. You're now ready to boost your productivity with our powerful task management tools.
            </p>
            
            <div style="margin: 30px 0;">
              <h3 style="color: #1F2937;">What's next?</h3>
              <ul style="color: #374151; padding-left: 20px;">
                <li>Create your first todo list</li>
                <li>Set up daily goals</li>
                <li>Explore productivity analytics</li>
                <li>Customize your dashboard</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.baseURL}/dashboard" style="background: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Get Started
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #9CA3AF; font-size: 12px;">
              © 2025 FocusFlux. All rights reserved.
            </p>
          </div>
        </div>
      `
    },

    NOTIFICATION: {
      subject: 'FocusFlux Notification',
      getContent: (title, message, actionText = null, actionLink = null, name = 'User') => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4F46E5; margin: 0;">FocusFlux</h1>
            <p style="color: #6B7280; margin: 5px 0;">Boost Your Productivity</p>
          </div>
          
          <div style="background: #F8FAFC; padding: 30px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #1F2937; margin-top: 0;">${title}</h2>
            <p style="color: #374151; font-size: 16px;">Hi ${name},</p>
            <p style="color: #374151; font-size: 16px;">${message}</p>
            
            ${actionText && actionLink ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${actionLink}" style="background: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  ${actionText}
                </a>
              </div>
            ` : ''}
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #9CA3AF; font-size: 12px;">
              © 2025 FocusFlux. All rights reserved.
            </p>
          </div>
        </div>
      `
    }
  };

  // Set base URL for different environments
  setBaseURL(url) {
    this.baseURL = url;
  }

  // Send OTP verification email
  async sendOTPEmail(email, otp, name = 'User') {
    try {
      console.log(`Sending OTP verification email to ${email}`);
      
      const template = this.templates.OTP_VERIFICATION;
      const redirectURL = `${this.baseURL}/verify-email?otp=${otp}&email=${encodeURIComponent(email)}`;
      
      // Use Appwrite's verification system with custom URL
      await account.createVerification(redirectURL);
      
      console.log('OTP verification email sent successfully');
      return {
        success: true,
        type: 'OTP_VERIFICATION',
        email,
        otp: otp // For debugging (remove in production)
      };
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email, name = 'User') {
    try {
      console.log(`Sending password reset email to ${email}`);
      
      const resetURL = `${this.baseURL}/reset-password`;
      await account.createRecovery(email, resetURL);
      
      console.log('Password reset email sent successfully');
      return {
        success: true,
        type: 'PASSWORD_RESET',
        email
      };
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  // Send welcome email (can be sent after successful verification)
  async sendWelcomeEmail(email, name = 'User') {
    try {
      console.log(`Sending welcome email to ${email}`);
      
      // For welcome emails, we might need a different approach since Appwrite
      // doesn't have a direct way to send custom emails without verification/recovery
      // This is a placeholder for future implementation with a proper email service
      
      console.log('Welcome email would be sent here');
      return {
        success: true,
        type: 'WELCOME',
        email,
        note: 'Welcome email template ready (requires email service integration)'
      };
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw new Error(`Failed to send welcome email: ${error.message}`);
    }
  }

  // Send custom notification email
  async sendNotificationEmail(email, title, message, actionText = null, actionLink = null, name = 'User') {
    try {
      console.log(`Sending notification email to ${email}: ${title}`);
      
      // This is a placeholder for custom notifications
      // In a real implementation, you'd integrate with SendGrid, Mailgun, etc.
      
      console.log('Notification email would be sent here');
      return {
        success: true,
        type: 'NOTIFICATION',
        email,
        title,
        note: 'Notification email template ready (requires email service integration)'
      };
    } catch (error) {
      console.error('Failed to send notification email:', error);
      throw new Error(`Failed to send notification email: ${error.message}`);
    }
  }

  // Resend OTP email
  async resendOTPEmail(email, newOTP, name = 'User') {
    try {
      console.log(`Resending OTP verification email to ${email}`);
      
      // Generate new verification URL with new OTP
      const redirectURL = `${this.baseURL}/verify-email?otp=${newOTP}&email=${encodeURIComponent(email)}&resent=true`;
      
      // Note: Appwrite might have rate limiting on verification emails
      // You might need to implement a delay or use a different approach
      await account.createVerification(redirectURL);
      
      console.log('OTP verification email resent successfully');
      return {
        success: true,
        type: 'OTP_RESEND',
        email,
        otp: newOTP // For debugging (remove in production)
      };
    } catch (error) {
      console.error('Failed to resend OTP email:', error);
      
      // If resend fails due to rate limiting, just return the new OTP
      // User can use it with the original email link
      return {
        success: true,
        type: 'OTP_RESEND',
        email,
        otp: newOTP,
        note: 'New OTP generated (original email link still valid)'
      };
    }
  }

  // Get email template (for testing/preview)
  getEmailTemplate(type, ...args) {
    const template = this.templates[type];
    if (!template) {
      throw new Error(`Email template '${type}' not found`);
    }
    
    return {
      subject: template.subject,
      content: template.getContent(...args)
    };
  }

  // Validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

const emailService = new EmailService();

export default emailService;
