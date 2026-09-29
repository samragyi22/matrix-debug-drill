const crypto = require('crypto');

function getKeyAndIv(key) {
  const keyBuffer = crypto.createHash('sha256').update(key).digest();
  const ivBuffer = Buffer.alloc(16, 0);
  return { keyBuffer, ivBuffer };
}

function hashValue(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function encryptValue(text, key) {
  const { keyBuffer, ivBuffer } = getKeyAndIv(key);
  const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, ivBuffer);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decryptValue(encrypted, key) {
  const { keyBuffer, ivBuffer } = getKeyAndIv(key);
  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { hashValue, encryptValue, decryptValue };
