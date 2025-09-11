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
                <p>Hi ${username}, your user id : ${email}</p>
                <p>${descrip}</p>
                <a href="${link}">${link}</a>
                <p>This link will expire in 24 hours.</p>
                <p>If you did not expect this email, please ignore it.</p>
                <p>Regards,<br/>Salapa Bikas Bank IT Team</p>
            `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending token email:", error);
    return false;
  }
};
