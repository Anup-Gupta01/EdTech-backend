const nodemailer = require("nodemailer");
// require("dotenv").config();
const mailSender = async (email, title, body) => {
  console.log("📩 MAIL_HOST:", process.env.MAIL_HOST);
console.log("📧 MAIL_USER:", process.env.MAIL_USER);
console.log("🔐 MAIL_PASS:", process.env.MAIL_PASS);

  try {

    let transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
     
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    let info = await transporter.sendMail({
      from: 'StudyNotion || CodeAid- by Anup',
      to: `${email}`,
      subject: `${title}`,
      html: `${body}`,
    });
    console.log(info);
    return info;

  } catch (error) {
    console.log("mail sender error..", error.message);
    throw error;
  }

};

module.exports = mailSender;