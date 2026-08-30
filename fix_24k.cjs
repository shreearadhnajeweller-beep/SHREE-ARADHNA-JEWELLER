const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.jsx', 'utf8');

// Remove all {goldRates.gold24k > 0 && ( ... )} conditional blocks in ticker
// Replace with always-visible 24K rate
code = code.replace(
  /\{goldRates\.gold24k > 0 && \(\s*<>\s*<span className="ticker-item">24K GOLD:.*?<\/span>\s*<span className="ticker-item-separator">.*?<\/span>\s*<\/>\s*\)}/gs,
  '<span className="ticker-item">24K GOLD: <strong>\u20b9{goldRates.gold24k}/g</strong></span>\n            <span className="ticker-item-separator"> | </span>'
);

// Remove the {goldRates.gold24k > 0 && ( conditional in the rates card section
code = code.replace(
  /\{goldRates\.gold24k > 0 && \(\s*<div style=\{/gs,
  '<div style={{'
);

// Also fix the success message conditional
code = code.replace(
  /\{goldRates\.gold24k > 0 && <>/g,
  '<>'
);
code = code.replace(
  /24K: <strong>.*?<\/strong> \| <\/>/g,
  '24K: <strong>\u20b9{goldRates.gold24k}/g</strong> | </>'
);

fs.writeFileSync('src/pages/Home.jsx', code);
console.log('Done fixing 24K hide logic');
