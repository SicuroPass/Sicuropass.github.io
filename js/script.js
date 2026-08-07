// ============================================================
// TAB SWITCHING
// ============================================================
const navBtns = document.querySelectorAll('.nav-btn');
const sections = {
    strength: document.getElementById('strength'),
    breach: document.getElementById('breach')
};

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active button
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Show corresponding section
        const tab = btn.dataset.tab;
        Object.keys(sections).forEach(key => {
            sections[key].classList.toggle('active', key === tab);
        });
    });
});

// ============================================================
// PASSWORD STRENGTH TESTER
// ============================================================
const passwordInput = document.getElementById('passwordInput');
const meterBar = document.getElementById('meterBar');
const strengthResult = document.getElementById('strengthResult');

passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    if (!password) {
        meterBar.style.width = '0%';
        strengthResult.innerHTML = `<span class="placeholder">Your password strength will appear here.</span>`;
        return;
    }

    const result = checkStrength(password);
    meterBar.style.width = result.score + '%';
    meterBar.style.background = result.color;
    strengthResult.innerHTML = `<strong style="color:${result.color}">${result.label}</strong> – ${result.details}`;
});

function checkStrength(password) {
    let score = 0;
    let details = [];

    // Length
    if (password.length >= 8) { score += 20; details.push('Good length (8+)'); } 
    else { details.push('Too short (< 8)'); }

    if (password.length >= 12) { score += 10; details.push('Great length (12+)'); }

    // Uppercase
    if (/[A-Z]/.test(password)) { score += 15; details.push('Uppercase'); } 
    else { details.push('No uppercase'); }

    // Lowercase
    if (/[a-z]/.test(password)) { score += 15; details.push('Lowercase'); } 
    else { details.push('No lowercase'); }

    // Numbers
    if (/[0-9]/.test(password)) { score += 20; details.push('Numbers'); } 
    else { details.push('No numbers'); }

    // Symbols
    if (/[^A-Za-z0-9]/.test(password)) { score += 20; details.push('Symbols'); } 
    else { details.push('No symbols'); }

    // Common patterns (penalty)
    const common = ['password', '123456', 'qwerty', 'admin', 'letmein', 'welcome', 'monkey', 'dragon'];
    if (common.some(word => password.toLowerCase().includes(word))) {
        score = Math.max(0, score - 30);
        details.push('⚠️ Contains common pattern');
    }

    // Cap at 100
    score = Math.min(100, score);

    let label, color;
    if (score >= 80) { label = 'Strong 🔒'; color = '#4ade80'; } 
    else if (score >= 50) { label = 'Medium 🔓'; color = '#fbbf24'; } 
    else { label = 'Weak ⚠️'; color = '#f87171'; }

    return {
        score: score,
        label: label,
        color: color,
        details: details.join(', ')
    };
}

// ============================================================
// GENERATE STRONG PASSWORD
// ============================================================
document.getElementById('generateBtn').addEventListener('click', () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_-+=';
    let password = '';
    for (let i = 0; i < 16; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    passwordInput.value = password;
    // Trigger strength check
    passwordInput.dispatchEvent(new Event('input'));
});

// ============================================================
// BREACH CHECKER (Pwned Passwords API)
// ============================================================
const breachInput = document.getElementById('breachInput');
const breachBtn = document.getElementById('breachBtn');
const breachResult = document.getElementById('breachResult');

breachBtn.addEventListener('click', async () => {
    const password = breachInput.value.trim();
    if (!password) {
        breachResult.innerHTML = `<span style="color:#f87171">⚠️ Please enter a password to check.</span>`;
        return;
    }

    breachBtn.disabled = true;
    breachBtn.textContent = '⏳ Checking...';
    breachResult.innerHTML = `<span style="color:rgba(255,255,255,0.5)">🔍 Searching breach database...</span>`;

    try {
        // Hash the password using SHA-1
        const hash = await sha1(password);
        const prefix = hash.substring(0, 5);
        const suffix = hash.substring(5).toUpperCase();

        // Call the free Pwned Passwords API
        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        if (!response.ok) throw new Error('API request failed');

        const data = await response.text();
        const lines = data.split('\n');
        let found = false;
        let count = 0;

        for (const line of lines) {
            if (line.includes(suffix)) {
                const parts = line.split(':');
                count = parseInt(parts[1]) || 0;
                found = true;
                break;
            }
        }

        if (found && count > 0) {
            breachResult.innerHTML = `
                <div style="color:#f87171; font-weight:600;">⚠️ BREACH FOUND!</div>
                <div>This password has appeared <strong>${count.toLocaleString()}</strong> times in known data breaches.</div>
                <div style="margin-top:8px; font-size:13px; color:rgba(255,255,255,0.6);">🔐 You should <strong>never</strong> use this password anywhere.</div>
            `;
        } else {
            breachResult.innerHTML = `
                <div style="color:#4ade80; font-weight:600;">✅ No breaches found!</div>
                <div>This password has not been exposed in any known data breaches.</div>
                <div style="margin-top:8px; font-size:13px; color:rgba(255,255,255,0.6);">👍 Still make sure it's strong and unique!</div>
            `;
        }

    } catch (error) {
        breachResult.innerHTML = `<span style="color:#f87171">⚠️ Error checking breach. Please try again.</span>`;
        console.error('Breach check error:', error);
    } finally {
        breachBtn.disabled = false;
        breachBtn.textContent = '🔍 Check for Breaches';
    }
});

// ============================================================
// SHA-1 HASH FUNCTION (for breach checking)
// ============================================================
async function sha1(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================
// ENTER KEY SUPPORT
// ============================================================
breachInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') breachBtn.click();
});

passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('generateBtn').click();
});

console.log('🔒 SicuroPass loaded successfully!');
