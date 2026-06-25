import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, recipientEmail, recipientName, senderName, amount, groupName } = body;

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      console.warn("EMAIL_USER or EMAIL_PASS is not set in environment variables. Email mock mode active.");
      console.log(`[MOCK EMAIL] To: ${recipientEmail}, Type: ${type}, From: ${senderName}, Amount: ₹${amount}`);
      return NextResponse.json({ message: 'Email mock sent successfully (Credentials missing)' }, { status: 200 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    let subject = '';
    let htmlContent = '';

    if (type === 'payment_received') {
      subject = `💰 Payment Received: ${senderName} paid you ₹${amount.toLocaleString()}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8e0d5; border-radius: 12px; background-color: #f8f3ed;">
          <h2 style="color: #00668c; text-align: center;">Payment Received! 💸</h2>
          <p style="font-size: 16px; color: #49454f;">Hi <strong>${recipientName}</strong>,</p>
          <p style="font-size: 16px; color: #49454f;">Great news! <strong>${senderName}</strong> has just settled their debt with you for the group <strong>${groupName}</strong>.</p>
          <div style="background-color: #e2eff6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #00668c; text-transform: uppercase; letter-spacing: 1px;">Amount Paid</p>
            <p style="margin: 5px 0 0; font-size: 32px; font-weight: bold; color: #00668c; font-family: monospace;">₹${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <p style="font-size: 14px; color: #79747e; text-align: center; margin-top: 30px;">Sent securely from CruiseSplit.</p>
        </div>
      `;
    } else if (type === 'nudge') {
      subject = `🔔 Gentle Nudge: Settle up with ${senderName}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8e0d5; border-radius: 12px; background-color: #f8f3ed;">
          <h2 style="color: #a33d14; text-align: center;">Time to settle up! ⏰</h2>
          <p style="font-size: 16px; color: #49454f;">Hi <strong>${recipientName}</strong>,</p>
          <p style="font-size: 16px; color: #49454f;">This is a gentle nudge from <strong>${senderName}</strong> to settle your pending balance for the group <strong>${groupName}</strong>.</p>
          <div style="background-color: #f5e6e0; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #a33d14; text-transform: uppercase; letter-spacing: 1px;">Amount Due</p>
            <p style="margin: 5px 0 0; font-size: 32px; font-weight: bold; color: #a33d14; font-family: monospace;">₹${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <p style="font-size: 16px; color: #49454f; text-align: center;">Head over to CruiseSplit to clear your balance!</p>
          <p style="font-size: 14px; color: #79747e; text-align: center; margin-top: 30px;">Sent securely from CruiseSplit.</p>
        </div>
      `;
    } else {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    const mailOptions = {
      from: `"CruiseSplit Notifications" <${emailUser}>`,
      to: recipientEmail,
      subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
