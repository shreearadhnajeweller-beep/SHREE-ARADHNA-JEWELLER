const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.jsx', 'utf8');

// Replace Showroom Info
code = code.replace(
  '<h3 className="showroom-title">LAXMI JEWELLERS</h3>',
  '<h3 className="showroom-title">HARDIK JEWELLERS</h3>'
);
code = code.replace(
  'Our flagship showroom in ADAWAD showcases',
  'Our flagship showroom in ULHASNAGAR showcases'
);
code = code.replace(
  'Maharana Pratap Road,Near Old Police Station Adawad Tal:Chopda ,Dist:Jalgaon, Adavad, Maharashtra 425303',
  'Shop no 416, Triveni building, Opposite Harmam Mohta Gate Shiv Road, Ulhasnagar 1, Birla Gate, Kalyan, Maharashtra 421103'
);
code = code.replace(
  'https://maps.app.goo.gl/9yB7wWc93TbbhVEx7',
  'https://maps.app.goo.gl/vxGPeZx9RukdR3dq8?g_st=ic'
);
code = code.replace(
  '<a href="tel:07776977700" className="info-card-phone-link">\n                        07776977700\n                      </a>',
  '<a href="tel:+919892911531" className="info-card-phone-link">\n                        +91 98929 11531\n                      </a>'
);
code = code.replace(
  'https://wa.me/917776977700?text=Hello%20Laxmi%20Jewellers',
  'https://wa.me/919892911531?text=Hello%20HARDIK%20Jewellers'
);

// Remove GitHub/Vercel Note
code = code.replace(
  '<strong>Note:</strong> Submitting this form will automatically write and push the updated rates directly to your GitHub repository! Vercel will automatically re-deploy the new rates publicly for all visitors within 20 seconds.',
  ''
);

// Change global phone references
code = code.replace(/tel:07776977700/g, 'tel:+919892911531');
code = code.replace(/9107776977700/g, '919892911531');
code = code.replace(/www\.laxmijewellers\.in/g, 'www.hardikjewellers.in');

fs.writeFileSync('src/pages/Home.jsx', code);
