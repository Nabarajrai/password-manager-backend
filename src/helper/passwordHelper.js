import CryptoJS from "crypto-js";

// Secret key
const SECRET_KEY = "my_super_secret_key_12345_mysecret";

// Encrypt password
export function encryptPassword(password) {
  const encrypted = CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
  return encrypted;
}

// Decrypt password
export function decryptPassword(encryptedPassword) {
  const bytes = CryptoJS.AES.decrypt(encryptedPassword, SECRET_KEY);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  return decrypted;
}
