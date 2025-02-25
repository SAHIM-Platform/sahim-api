const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// Parse command line arguments
const shouldClean = process.argv.includes('--clean');

// Define the base paths
const storageDir = path.join(__dirname, '..', 'storage');
const filesDir = path.join(storageDir, 'files');
const keysDir = path.join(storageDir, 'keys');

// Create directories if they don't exist
function createDirectories() {
    console.log('Creating storage directories...');
    [storageDir, filesDir, keysDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Created directory: ${dir}`);
        } else {
            console.log(`Directory already exists: ${dir}`);
        }
    });
}

// Generate JWT keys
function generateJWTKeys() {
    console.log('Generating JWT keys...');
    
    try {
        // Generate private key
        execSync('openssl genpkey -algorithm RSA -out ./storage/keys/jwt.private.key -pkeyopt rsa_keygen_bits:4096', {
            stdio: 'inherit'
        });
        console.log('Generated private key');

        // Generate public key
        execSync('openssl rsa -in ./storage/keys/jwt.private.key -pubout -out ./storage/keys/jwt.public.key', {
            stdio: 'inherit'
        });
        console.log('Generated public key');
    } catch (error) {
        console.error('Error generating JWT keys:', error.message);
        process.exit(1);
    }
}

// Generate a random secret key
function generateSecretKey() {
    console.log('Generating a secure random secret key...');

    try {
        const secretKey = crypto.randomBytes(64).toString('hex');
        fs.writeFileSync('./storage/keys/jwt.secret.key', secretKey);
        console.log('Generated secret key');
    } catch (error) {
        console.error('Error generating secret key:', error.message);
        process.exit(1);
    }
}

// Clean a directory
function cleanKeysDirectory() {
    fs.readdirSync(keysDir).forEach(file => {
        const filePath = path.join(keysDir, file);
        fs.unlinkSync(filePath);
        console.log(`Removed file: ${filePath}`);
    });
}

// Main execution
try {
    if (shouldClean) {
        console.log('Cleaning existing keys...');
        cleanKeysDirectory();
        console.log('Keys cleanup completed.');
    }

    createDirectories();
    generateJWTKeys();
    generateSecretKey();
    console.log('Storage initialization completed successfully!');
} catch (error) {
    console.error('Error during storage initialization:', error.message);
    process.exit(1);
}