import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";

interface EmailOptions {
  to: string | string[];
  subject: string;
  ejsTemplate?: string;
  templateData?: any;
  html?: string;
  text?: string;
}

/**
 * Main email sender function
 * @param options Email configuration
 * @returns Promise with email sending result
 */
export async function sendEmail(options: EmailOptions) {
  try {
    const { to, subject, ejsTemplate, templateData, html, text } = options;
    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    let finalHtml = html;
    let finalText = text;

    // If EJS template is provided, render it
    if (ejsTemplate) {
      const templatePath = path.join(process.cwd(), "templates", ejsTemplate);
      finalHtml = await ejs.renderFile(templatePath, templateData || {});
      
      // Create text version if not provided
      if (!finalText) {
        finalText = createTextFromHtml(finalHtml ?? "");
      }
    }

    // Send email
    const result = await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      text: finalText,
      html: finalHtml,
    });

    return {
      success: true,
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected
    };

  } catch (error: any) {
    console.error("Email sending error:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Convert HTML to text version
 * @param html HTML content
 * @returns Text version
 */
function createTextFromHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&') // Replace &amp; with &
    .replace(/&lt;/g, '<') // Replace &lt; with <
    .replace(/&gt;/g, '>') // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}
