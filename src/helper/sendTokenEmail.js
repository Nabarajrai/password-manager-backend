import nodemailer from "nodemailer";

/**
 * Send temporary password link to user email
 * @param {string} email - Recipient email
 * @param {string} username - Recipient name
 * @param {string} link - Token link for setting password and PIN
 */
export const sendTokenEmail = async ({
  email,
  username,
  link,
  subject,
  descrip,
  hour,
}) => {
  const HOST = process.env.HOST || "smtp.gmail.com";
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: HOST,
      port: 587,
      secure: false, // TLS
      auth: {
        user: process.env.USER_MAIL,
        pass: process.env.KEY,
      },
    });

    // Email options
    const mailOptions = {
      from: `"Salapa Bikas Bank" <${process.env.USER_MAIL}>`,
      to: `${email}`,
      subject: `${subject}`,
      html: `
                <!-- Preheader (hidden in most clients but shows in inbox preview) -->
                <span style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;">
                  Password/PIN reset link — valid for 24 hours.
                </span>

                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f4f6f8;padding:24px 0;font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                  <tr>
                    <td align="center">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 18px rgba(20,30,40,0.08);">
                        <!-- Header -->
                        <tr>
                          <td style="background:linear-gradient(90deg,#0f6ef2,#4f46e5);padding:20px 28px;color:#ffffff;">
                            <h1 style="margin:0;font-size:20px;letter-spacing:0.2px;">Salapa Password Manager  — IT Team</h1>
                          </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                          <td style="padding:28px;">
                            <p style="margin:0 0 12px;font-size:16px;color:#0f1724;">
                              Hi <strong style="color:#0b1220;">${username}</strong>,
                            </p>

                            <p style="margin:0 0 18px;font-size:15px;color:#374151;line-height:1.5;">
                              Your register account: <strong style="color:#111827">${email}</strong>.
                            </p>

                            <p style="margin:0 0 18px;font-size:15px;color:#374151;line-height:1.5;">
                              ${descrip}
                            </p>

                            <!-- Button -->
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0;">
                              <tr>
                                <td align="center">
                                  <a href="${link}" target="_blank" style="background:#0f6ef2;border-radius:8px;padding:12px 22px;color:#ffffff;text-decoration:none;display:inline-block;font-weight:600;font-size:15px;">
                                    Reset Now
                                  </a>
                                </td>
                              </tr>
                            </table>

                            <p style="margin:18px 0 0;font-size:13px;color:#6b7280;">
                              This link will expire in <strong>${hour} hours</strong>. If you did not request this, you can safely ignore this email.
                            </p>

                            <p style="margin:22px 0 0;font-size:14px;color:#374151;">
                              Regards,<br/>
                              <strong>Salapa Bikas Bank — IT Team</strong>
                            </p>
                          </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                          <td style="background:#f9fafb;padding:16px 28px;font-size:12px;color:#9ca3af;text-align:center;">
                            © ${new Date().getFullYear()} Salapa Bikas Bank. All rights reserved.
                          </td>
                        </tr>
                      </table>

                      <!-- Small note -->
                      <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="margin-top:12px;">
                        <tr>
                          <td style="font-size:12px;color:#9aa3ad;text-align:center;padding:6px 0;">
                            If you're having trouble clicking the "Reset Now" button, please try again later.
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending token email:", error);
    return false;
  }
};
