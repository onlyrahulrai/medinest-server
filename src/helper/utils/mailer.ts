import nodemailer from "nodemailer";

export const sendMail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    port: 465,
    // host: "smtp.ethereal.email",
    // port: 587,
    // secure: false,
    auth: {
      user: process.env.REAL_MAIL,
      pass: process.env.REAL_PASSWORD,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.REAL_MAIL,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};
