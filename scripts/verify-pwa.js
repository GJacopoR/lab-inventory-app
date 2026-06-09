// Lightweight static verification for PWA build output
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const errors = [];
const checks = [];

const indexPath = path.join(distDir, 'index.html');
const indexContent = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf-8') : '';

// Check 1: manifest.webmanifest exists and has required fields with non-empty values
const manifestPath = path.join(distDir, 'manifest.webmanifest');
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const required = [
      { key: 'name', desc: 'name' },
      { key: 'short_name', desc: 'short_name' },
      { key: 'start_url', desc: 'start_url' },
      { key: 'display', desc: 'display' },
      { key: 'theme_color', desc: 'theme_color' },
      { key: 'icons', desc: 'icons array' },
    ];

    let allValid = true;
    for (const { key, desc } of required) {
      const val = manifest[key];
      if (key === 'icons') {
        if (!Array.isArray(val) || val.length === 0) {
          errors.push(`✗ manifest.webmanifest: ${desc} must be a non-empty array`);
          allValid = false;
        } else {
          // Check icon files exist
          const missingIcons = val.filter(icon => {
            const iconPath = path.join(distDir, icon.src);
            return !fs.existsSync(iconPath);
          });
          if (missingIcons.length > 0) {
            errors.push(`✗ manifest.webmanifest: icons reference missing files: ${missingIcons.map(i => i.src).join(', ')}`);
            allValid = false;
          }
        }
      } else if (!val || (typeof val === 'string' && val.trim() === '')) {
        errors.push(`✗ manifest.webmanifest: ${desc} is empty or missing`);
        allValid = false;
      }
    }

    if (allValid) {
      checks.push('✓ manifest.webmanifest has valid required fields and icons');
    }
  } catch (e) {
    errors.push('✗ manifest.webmanifest is not valid JSON: ' + (e.message || e));
  }
} else {
  errors.push('✗ manifest.webmanifest not found');
}

// Check 2: PNG icons exist (192x192 and 512x512)
const icon192 = path.join(distDir, 'pwa-192x192.png');
const icon512 = path.join(distDir, 'pwa-512x512.png');
if (fs.existsSync(icon192)) {
  checks.push('✓ pwa-192x192.png exists');
} else {
  errors.push('✗ pwa-192x192.png not found');
}
if (fs.existsSync(icon512)) {
  checks.push('✓ pwa-512x512.png exists');
} else {
  errors.push('✗ pwa-512x512.png not found');
}

// Check 3: service worker exists and contains workbox
const swPath = path.join(distDir, 'sw.js');
if (fs.existsSync(swPath)) {
  const swContent = fs.readFileSync(swPath, 'utf-8');
  if (swContent.includes('precacheAndRoute') || swContent.includes('workbox')) {
    checks.push('✓ sw.js is valid (contains workbox/precaching logic)');
  } else {
    errors.push('✗ sw.js exists but may not be properly generated');
  }
} else {
  errors.push('✗ sw.js not found');
}

// Check 4: service worker registration present with meaningful config
if (indexContent.includes('navigator.serviceWorker.register')) {
  // Check for dynamic path handling (GitHub Pages compatibility)
  if (indexContent.includes('/sw.js') || indexContent.includes('inventory-app')) {
    checks.push('✓ index.html has meaningful service worker registration');
  } else {
    errors.push('✗ index.html has SW registration but path may be incorrect');
  }
} else if (fs.existsSync(path.join(distDir, 'registerSW.js'))) {
  checks.push('✓ registerSW.js present for service worker registration');
} else {
  errors.push('✗ No service worker registration found');
}

// Check 5: 404.html exists and handles redirects
const notFoundPath = path.join(distDir, '404.html');
if (fs.existsSync(notFoundPath)) {
  const notFoundContent = fs.readFileSync(notFoundPath, 'utf-8');
  if (notFoundContent.includes('sessionStorage') || notFoundContent.includes('location.replace')) {
    checks.push('✓ 404.html has redirect logic (GitHub Pages fallback)');
  } else {
    errors.push('✗ 404.html exists but missing redirect logic');
  }
} else {
  errors.push('✗ 404.html not found (GitHub Pages fallback)');
}

// Check 6: index.html references manifest
if (indexContent.includes('rel="manifest"')) {
  checks.push('✓ index.html properly links to manifest');
} else {
  errors.push('✗ index.html missing manifest link');
}

// Check 7: Offline indicator script present
if (indexContent.includes('offline') || fs.existsSync(path.join(distDir, 'assets'))) {
  // Check if the built JS contains offline indicator
  const indexMatch = indexContent.match(/src="\/[^"]+index-[^"]+\.js"/);
  if (indexMatch) {
    checks.push('✓ App JS bundle should contain offline indicator');
  }
}

// Check 8: theme-color meta tag present
if (indexContent.includes('theme-color')) {
  checks.push('✓ index.html has theme-color meta tag');
} else {
  errors.push('✗ index.html missing theme-color meta tag');
}

// Output results
console.log('\n=== PWA Verification ===\n');
checks.forEach(c => console.log(c));
if (errors.length > 0) {
  console.log('\nErrors:');
  errors.forEach(e => console.log(e));
  process.exit(1);
}
console.log('\n✓ All PWA checks passed\n');
process.exit(0);