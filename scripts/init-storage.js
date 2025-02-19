const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
        execSync('openssl genrsa -out ./storage/keys/jwt.private.key 2048', {
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

// Main execution
try {
    createDirectories();
    generateJWTKeys();
    console.log('Storage initialization completed successfully!');
} catch (error) {
    console.error('Error during storage initialization:', error.message);
    process.exit(1);
}