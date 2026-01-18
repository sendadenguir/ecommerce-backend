const nodemailer = require('nodemailer');

// Créer un transporteur (on va le configurer après)
let transporter;

// Initialiser le transporteur avec Gmail
const initTransporter = async () => {
  console.log('📧 Configuration Gmail...');
  console.log('   Email:', process.env.EMAIL_USER);

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false, // true pour le port 465, false pour les autres ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // Vérifier la connexion
  try {
    await transporter.verify();
    console.log('✅ Service email Gmail initialisé et connecté !');
  } catch (error) {
    console.error('❌ Erreur de connexion Gmail:', error.message);
  }
};

// Envoyer un email de bienvenue
const sendWelcomeEmail = async (to, name) => {
  try {
    const info = await transporter.sendMail({
      from: '"E-Commerce Shop 🛍️" <noreply@ecommerce.com>',
      to: to,
      subject: '🎉 Bienvenue sur notre boutique !',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">🎉 Bienvenue ${name} !</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Bonjour <strong>${name}</strong>,</p>
            
            <p style="font-size: 16px; color: #666; line-height: 1.6;">
              Merci de vous être inscrit sur notre boutique en ligne ! 🛍️
            </p>
            
            <p style="font-size: 16px; color: #666; line-height: 1.6;">
              Nous sommes ravis de vous compter parmi nos membres. Vous pouvez maintenant :
            </p>
            
            <ul style="font-size: 16px; color: #666; line-height: 1.8;">
              <li>✓ Commander nos produits</li>
              <li>✓ Suivre vos commandes</li>
              <li>✓ Profiter d'offres exclusives</li>
              <li>✓ Sauvegarder vos favoris</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                Commencer mes achats
              </a>
            </div>
            
            <p style="font-size: 14px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              Si vous avez des questions, n'hésitez pas à nous contacter !<br>
              L'équipe E-Commerce Shop
            </p>
          </div>
        </div>
      `
    });

    console.log('✅ Email de bienvenue envoyé à:', to);
    console.log('📬 Voir l\'email ici:', nodemailer.getTestMessageUrl(info));
    
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info)
    };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Envoyer un email de confirmation de commande
const sendOrderConfirmationEmail = async (to, name, orderNumber, items, total) => {
  try {
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${item.name} x ${item.quantity}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          $${(parseFloat(item.price) * item.quantity).toFixed(2)}
        </td>
      </tr>
    `).join('');

    const info = await transporter.sendMail({
      from: '"E-Commerce Shop 🛍️" <noreply@ecommerce.com>',
      to: to,
      subject: `✅ Commande ${orderNumber} confirmée !`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">✅ Commande confirmée !</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Bonjour <strong>${name}</strong>,</p>
            
            <p style="font-size: 16px; color: #666; line-height: 1.6;">
              Merci pour votre commande ! Nous avons bien reçu votre paiement. 💳
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #666;">Numéro de commande</p>
              <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #667eea;">
                ${orderNumber}
              </p>
            </div>
            
            <h3 style="color: #333; margin-top: 30px;">📦 Détails de votre commande :</h3>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              ${itemsHtml}
              <tr style="font-weight: bold; font-size: 18px;">
                <td style="padding: 15px 10px; border-top: 2px solid #333;">TOTAL</td>
                <td style="padding: 15px 10px; border-top: 2px solid #333; text-align: right; color: #28a745;">
                  $${parseFloat(total).toFixed(2)}
                </td>
              </tr>
            </table>
            
            <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
              <p style="margin: 0; color: #666;">
                🚚 Votre commande sera expédiée sous 2-3 jours ouvrés. Vous recevrez un email de suivi.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000/orders" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                Suivre ma commande
              </a>
            </div>
            
            <p style="font-size: 14px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              Merci de votre confiance !<br>
              L'équipe E-Commerce Shop 🛍️
            </p>
          </div>
        </div>
      `
    });

    console.log('✅ Email de commande envoyé à:', to);
    console.log('📬 Voir l\'email ici:', nodemailer.getTestMessageUrl(info));
    
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info)
    };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  initTransporter,
  sendWelcomeEmail,
  sendOrderConfirmationEmail
};