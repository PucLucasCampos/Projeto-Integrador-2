import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

/**
 * Envia um e-mail para o destinatário especificado.
 *
 * @async
 * @function sendEmail
 * @param {string} destination - O endereço de e-mail do destinatário.
 * @param {string} subject - O assunto do e-mail.
 * @param {string} message - O conteúdo da mensagem a ser enviada.
 * @returns {Promise<boolean>} Retorna uma `Promise` que resolve para `true` se o e-mail for enviado com sucesso, ou `false` em caso de falha.
 * 
 * @example
 * // Exemplo de uso da função sendEmail
 * const email: boolean = sendEmail('usuario@exemplo.com', 'Bem-vindo!', 'Olá, obrigado por se registrar!')
 * 
 * if(email) {
 *  console.log('E-mail enviado com sucesso!');
 * } else {
 *  console.log('Falha ao enviar e-mail');
 * }
 */
export async function sendEmail(
  destination: string,
  subject: string,
  message: string
): Promise<boolean> {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_GOOGLE,
      pass: process.env.PASSWORD_APP_GOOGLE,
    },
  });

  const mailOptions = {
    from: "Projeto Integrador 02 <es.integrador@gmail.com>",
    to: destination,
    subject,
    text: message,
  };


    try {
      await transporter.sendMail(mailOptions);
      return true; 
    } catch (error) {
      return false; 
    }

}
