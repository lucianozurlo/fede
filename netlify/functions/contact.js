// netlify/functions/contact.js
import nodemailer from 'nodemailer';

export const handler = async (event) => {
   if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

   let body = {};
   try {
      body = JSON.parse(event.body || '{}');
   } catch {
      return json(400, { ok: false, error: 'JSON inválido' });
   }
   const { name, email, project_type, project_description } = body;
   if (!name || !email || !project_type)
      return json(400, { ok: false, error: 'Faltan campos obligatorios.' });

   try {
      const transporter = nodemailer.createTransport({
         host: process.env.SMTP_HOST,
         port: Number(process.env.SMTP_PORT || 587),
         secure: String(process.env.SMTP_SECURE || 'false') === 'true',
         auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      const fromAddr = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@example.com';
      const text = `Nombre: ${name}
Email: ${email}
Project type: ${project_type}

${project_description || ''}`;
      const html = `
      <h2>Nuevo mensaje del formulario</h2>
      <p><strong>Nombre:</strong> ${esc(name)}</p>
      <p><strong>Email:</strong> ${esc(email)}</p>
      <p><strong>Project type:</strong> ${esc(project_type)}</p>
      <p><strong>Project description:</strong></p>
      <pre style="white-space:pre-wrap;margin:0;">${esc(project_description || '')}</pre>
    `;
      await transporter.sendMail({
         from: `"Website Form" <${fromAddr}>`,
         to: 'info@mailtest.com',
         replyTo: `${name} <${email}>`,
         subject: `Nuevo proyecto: ${project_type}`,
         text,
         html,
      });
      return json(200, { ok: true });
   } catch (err) {
      console.error('Mailer error:', err);
      return json(500, { ok: false, error: 'Error enviando el correo.' });
   }
};

const json = (code, obj) => ({
   statusCode: code,
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify(obj),
});
const esc = (s = '') =>
   String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
