import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  let transporter;
  
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    // Use real SMTP server (e.g. Gmail)
    transporter = nodemailer.createTransport({
      service: 'gmail', // or your email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Fallback to Ethereal Email for development/testing
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  const message = {
    from: `${process.env.FROM_NAME || 'Admin'} <${process.env.FROM_EMAIL || 'noreply@footballleague.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  const info = await transporter.sendMail(message);

  console.log("Message sent: %s", info.messageId);
  
  if (!process.env.EMAIL_USER) {
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  }
};

export default sendEmail;
