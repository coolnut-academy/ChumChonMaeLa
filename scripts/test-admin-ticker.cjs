const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');
const codegs = fs.readFileSync('Code.gs', 'utf8');

console.log('Testing HTML and Code.gs integrity...');

// 1. Floating admin button at bottom right
assert(html.includes('id="btnFloatingAdmin"'), 'Floating admin button must exist');
assert(html.includes('href="#/admin"'), 'Floating admin button must link to #/admin');
assert(!html.includes('<a href="#/admin" class="utility-button" data-icon="admin">'), 'Old utility admin button must be removed from top bar');

// 2. Removal of password hints & autofill, with single password New1234
assert(!html.includes('value="New1234"'), 'Password must NOT be autofilled with New1234');
assert(!html.includes('value="maela2569"'), 'Password must NOT be autofilled with maela2569');
assert(!html.includes('รหัสผ่านคือ:'), 'UI must NOT tell password to users');
assert(!html.includes('ข้อมูลสำหรับทดสอบระบบทันที:'), 'UI must NOT show testing password box');
assert(html.includes('pw === \'New1234\''), 'Validation logic must accept New1234');
assert(codegs.includes('normPass === \'New1234\''), 'Code.gs verifyAdmin_ must accept New1234');

// 3. Admissions button moved to top navigation bar & togglable (defaults to closed)
assert(!html.includes('class="header-apply"'), 'Old header-apply button beside school name must be removed');
assert(html.includes('<a href="#/admissions" data-nav="admissions" class="nav-link header-nav-button">สมัครเรียน'), 'Admissions button must be on top navigation bar');
assert(html.includes("admissions_open: 'false'"), 'Admissions must default to false (closed initially)');
assert(html.includes('id="cfgAdmissionsOpen"'), 'Admin toggle for admissions_open must exist');
assert(html.includes("data-nav=\"admissions\""), 'Admissions navigation selector must exist');
assert(html.includes("isAdmissionsOpen"), 'Logic checking admissions open must exist');

// 4. Customizable ticker
assert(html.includes('id="topTickerWrapper"'), 'Wrapper for top ticker must exist');
assert(html.includes('id="topTickerBadge"'), 'Top ticker badge element must exist');
assert(html.includes('id="cfgTickerBadge"'), 'Input for ticker badge must exist');
assert(html.includes('id="cfgTickerSpeed"'), 'Select for ticker speed must exist');
assert(html.includes('id="cfgTickerEnabled"'), 'Select for ticker enabled must exist');
assert(html.includes('ticker_badge'), 'Config must store ticker_badge');
assert(codegs.includes('ticker_badge'), 'Code.gs must have ticker_badge');
assert(codegs.includes('admissions_open'), 'Code.gs must have admissions_open');

console.log('✅ All static checks passed successfully!');
