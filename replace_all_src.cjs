const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let code = fs.readFileSync(filePath, 'utf8');

    code = code.replace(/LAXMI JEWELLERS/g, 'HARDIK JEWELLERS');
    code = code.replace(/Laxmi Jewellers/g, 'Hardik Jewellers');
    code = code.replace(/laxmijewellersadawad/g, 'hardikjewellers_');
    code = code.replace(/laxmijewellers/g, 'hardikjewellers');
    code = code.replace(/ADAWAD/g, 'ULHASNAGAR');
    code = code.replace(/Adawad/g, 'Ulhasnagar');
    code = code.replace(/laxmijewellers\.in/g, 'hardikjewellers.in');
    
    fs.writeFileSync(filePath, code);
}

function processDirectory(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.css')) {
            replaceInFile(fullPath);
        }
    });
}

processDirectory('src');
