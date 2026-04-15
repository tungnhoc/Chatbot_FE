const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('https://chatbot-7-jpps.onrender.com')) {
                // Replace string literals with template literals
                content = content.replace(/"https:\/\/chatbot-7-jpps\.onrender\.com([^"]*)"/g, '`${process.env.NEXT_PUBLIC_API_URL}$1`');
                // Just in case it's in single quotes
                content = content.replace(/'https:\/\/chatbot-7-jpps\.onrender\.com([^']*)'/g, '`${process.env.NEXT_PUBLIC_API_URL}$1`');
                
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

// Start from src directory
const srcPath = path.join(__dirname, 'src');
console.log('Starting URL replacement in', srcPath);
processDirectory(srcPath);
console.log('Done replacing URLs.');
