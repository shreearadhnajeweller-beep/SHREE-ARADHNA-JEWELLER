const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf8');
code = code.replace(/98765 43210/g, '98929 11531');
fs.writeFileSync('src/pages/AdminDashboard.jsx', code);
