const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

code = code.replace(/LAXMI JEWELLERS/g, 'HARDIK JEWELLERS');
code = code.replace(/Laxmi Jewellers/g, 'Hardik Jewellers');
code = code.replace(/laxmijewellersadawad/g, 'hardikjewellers_');
code = code.replace(/laxmijewellers/g, 'hardikjewellers');
code = code.replace(/ADAWAD/g, 'ULHASNAGAR');
code = code.replace(/Adawad/g, 'Ulhasnagar');
code = code.replace(/laxmijewellers\.in/g, 'hardikjewellers.in');

fs.writeFileSync('index.html', code);
