/**
 * Copy Security Fixes to Clipboard Helper
 * Run: node scripts/copy-security-fixes.js
 */

const fs = require('fs');
const { exec } = require('child_process');

function copyToClipboard(text) {
  // Try different clipboard commands based on OS
  const commands = [
    'clip', // Windows
    'pbcopy', // macOS
    'xclip -selection clipboard', // Linux
    'xsel --clipboard --input' // Linux alternative
  ];

  for (const cmd of commands) {
    try {
      exec(`echo "${text.replace(/"/g, '\\"')}" | ${cmd}`, (error, stdout, stderr) => {
        if (!error) {
          console.log('✅ Security fixes copied to clipboard!');
          console.log('📋 You can now paste them into Supabase SQL Editor');
          return;
        }
      });
    } catch (err) {
      // Continue to next command
    }
  }
  
  console.log('⚠️  Could not copy to clipboard automatically');
  console.log('📄 Please manually copy the contents of sql/SECURITY_FIXES.sql');
}

async function main() {
  console.log('📋 COPYING SECURITY FIXES TO CLIPBOARD...\n');
  
  try {
    const securityFixes = fs.readFileSync('sql/SECURITY_FIXES.sql', 'utf8');
    
    console.log('📄 Security fixes loaded:');
    console.log(`   • File size: ${securityFixes.length} characters`);
    console.log(`   • Lines: ${securityFixes.split('\n').length}`);
    console.log(`   • Fixes: 4 SECURITY DEFINER views, 6 missing RLS, 14 function warnings, 1 missing policy`);
    
    console.log('\n🔒 CRITICAL SECURITY FIXES TO APPLY:');
    console.log('1. Remove SECURITY DEFINER from all views');
    console.log('2. Enable RLS on missing tables');
    console.log('3. Add search_path to all functions');
    console.log('4. Create missing RLS policies');
    
    console.log('\n📋 COPYING TO CLIPBOARD...');
    copyToClipboard(securityFixes);
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Paste the security fixes (Ctrl+V)');
    console.log('4. Click "Run" to execute');
    console.log('5. Run Security Advisor to verify all issues are resolved');
    
    console.log('\n⚠️  IMPORTANT: These fixes are BLOCKING production deployment');
    console.log('   Apply them immediately to resolve all Security Advisor errors');
    
  } catch (error) {
    console.error('❌ Error reading security fixes file:', error.message);
  }
}

main();
