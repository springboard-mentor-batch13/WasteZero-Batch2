const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = crypto
    .createHash('sha256')
    .update(process.env.JWT_SECRET)
    .digest();

const IV_LENGTH = 16;

const encrypt = (text) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
};

const decrypt = (encryptedText) => {

    // Old messages are plain text
    if (!encryptedText.includes(':')) {
        return encryptedText;
    }

    const parts = encryptedText.split(':');

    // Invalid encrypted format
    if (parts.length !== 2) {
        return encryptedText;
    }

    try {
        const iv = Buffer.from(parts[0], 'hex');

        if (iv.length !== IV_LENGTH) {
            return encryptedText;
        }

        const encrypted = parts[1];

        const decipher = crypto.createDecipheriv(
            ALGORITHM,
            SECRET_KEY,
            iv
        );

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;

    } catch (err) {
        // If decryption fails, just return the original text
        return encryptedText;
    }

};

module.exports = { encrypt, decrypt };