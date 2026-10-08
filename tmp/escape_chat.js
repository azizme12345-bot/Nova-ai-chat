const fs = require('fs');
let c = fs.readFileSync('api/chat.js', 'utf8');

// Escape the backticks
c = c.replace('` ```html ` block:', '` \\`\\`\\`html ` block:');
c = c.replace('\n       ```html\n', '\n       \\`\\`\\`html\n');
c = c.replace('\n       ```\n      * Keep', '\n       \\`\\`\\`\n      * Keep');

fs.writeFileSync('api/chat.js', c, 'utf8');
console.log('Successfully escaped backticks in api/chat.js!');
