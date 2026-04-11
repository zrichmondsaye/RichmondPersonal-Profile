const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

// Fix paths
content = content.replace(/\.\.\/public\//g, './public/');

// Replace scripts
const mainIndex = content.lastIndexOf('</main>');
const footerIndex = content.indexOf('<footer class="ft">');

if (mainIndex !== -1 && footerIndex !== -1 && footerIndex > mainIndex) {
    const beforeScripts = content.substring(0, mainIndex + '</main>'.length);
    const afterScripts = content.substring(footerIndex);
    
    content = beforeScripts + '\n\n    <!-- Included external scripts -->\n    <script src="./index.js" defer type="module"></script>\n\n    ' + afterScripts;
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed index.html successfully!');
