import crypto from 'crypto';

// AES-256-GCM 방식으로 토큰을 암호화/복호화합니다.
// ENCRYPTION_KEY는 32바이트(64자리 hex) 환경변수로 제공해야 합니다.

const ALGORITHM = 'aes-256-gcm';

function getKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error('ENCRYPTION_KEY는 64자리 hex 문자열이어야 합니다');
  }
  return Buffer.from(key, 'hex');
}

// 평문 → 암호문 (iv:authTag:cipher 형태의 문자열로 저장)
export function encrypt(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':');
}

// 암호문 → 평문
export function decrypt(payload) {
  const [ivHex, authTagHex, encryptedHex] = payload.split(':');
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}
