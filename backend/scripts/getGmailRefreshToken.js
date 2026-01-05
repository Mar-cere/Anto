/**
 * Script para obtener Refresh Token de Gmail API
 * 
 * Uso:
 * 1. Configura GMAIL_CLIENT_ID y GMAIL_CLIENT_SECRET en .env
 * 2. Ejecuta: node scripts/getGmailRefreshToken.js
 * 3. Sigue las instrucciones
 */

import dotenv from 'dotenv';
import { google } from 'googleapis';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '../.env') });

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Error: GMAIL_CLIENT_ID y GMAIL_CLIENT_SECRET deben estar configurados en .env');
  console.log('\n💡 Agrega estas variables a tu archivo .env:');
  console.log('GMAIL_CLIENT_ID=tu_client_id');
  console.log('GMAIL_CLIENT_SECRET=tu_client_secret');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

console.log('🔐 Configurando Gmail API OAuth2...\n');

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent', // Forzar consent para obtener refresh token
});

console.log('📋 Sigue estos pasos:');
console.log('1. Abre esta URL en tu navegador:');
console.log(`\n   ${authUrl}\n`);
console.log('2. Autoriza la aplicación con tu cuenta de Google Workspace');
console.log('3. Copia el código de autorización que aparece');
console.log('4. Pégalo aquí abajo\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('🔑 Código de autorización: ', async (code) => {
  rl.close();
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.refresh_token) {
      console.error('\n❌ Error: No se obtuvo refresh_token');
      console.log('💡 Posibles causas:');
      console.log('   - Ya autorizaste esta app antes (revoca el acceso y vuelve a intentar)');
      console.log('   - No se solicitó "offline access"');
      console.log('\n💡 Solución:');
      console.log('   1. Ve a https://myaccount.google.com/permissions');
      console.log('   2. Revoca el acceso a tu app');
      console.log('   3. Ejecuta este script nuevamente');
      process.exit(1);
    }
    
    console.log('\n✅ ¡Refresh Token obtenido exitosamente!\n');
    console.log('📝 Agrega esto a tu archivo .env:\n');
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log(`GMAIL_USER_EMAIL=tu_email@tudominio.com\n`);
    console.log('💡 Nota: Guarda el refresh_token de forma segura, es como una contraseña.');
    
  } catch (error) {
    console.error('\n❌ Error obteniendo token:', error.message);
    if (error.message.includes('invalid_grant')) {
      console.log('\n💡 El código puede haber expirado. Intenta nuevamente.');
    }
    process.exit(1);
  }
});

