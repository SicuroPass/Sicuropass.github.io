// ============================================================
// TAB SWITCHING
// ============================================================
const navBtns = document.querySelectorAll('.nav-btn');
const sections = {
    strength: document.getElementById('strength'),
    breach: document.getElementById('breach'),
    fingerprint: document.getElementById('fingerprint')
};

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tab = btn.dataset.tab;
        Object.keys(sections).forEach(key => {
            sections[key].classList.toggle('active', key === tab);
        });

        // Load fingerprint when tab is opened
        if (tab === 'fingerprint') {
            loadFingerprint();
        }
    });
});

// ============================================================
// PASSWORD STRENGTH TESTER
// ============================================================
const passwordInput = document.getElementById('passwordInput');
const meterBar = document.getElementById('meterBar');
const strengthResult = document.getElementById('strengthResult');
const generateBtn = document.getElementById('generateBtn');
const suggestionsContainer = document.getElementById('suggestionsContainer');
const suggestionList = document.getElementById('suggestionList');
const copySelectedBtn = document.getElementById('copySelectedBtn');

let selectedPassword = '';

passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    if (!password) {
        meterBar.style.width = '0%';
        strengthResult.innerHTML = `<span class="placeholder">Your password strength will appear here.</span>`;
        suggestionsContainer.classList.add('suggestions-hidden');
        return;
    }

    const result = checkStrength(password);
    meterBar.style.width = result.score + '%';
    meterBar.style.background = result.color;
    strengthResult.innerHTML = `<strong style="color:${result.color}">${result.label}</strong> – ${result.details}`;
    
    if (result.score >= 50) {
        checkBreachAuto(password);
    }
});

function checkStrength(password) {
    let score = 0;
    let details = [];

    if (password.length >= 8) { score += 20; details.push('Good length (8+)'); } 
    else { details.push('Too short (< 8)'); }

    if (password.length >= 12) { score += 10; details.push('Great length (12+)'); }

    if (/[A-Z]/.test(password)) { score += 15; details.push('Uppercase'); } 
    else { details.push('No uppercase'); }

    if (/[a-z]/.test(password)) { score += 15; details.push('Lowercase'); } 
    else { details.push('No lowercase'); }

    if (/[0-9]/.test(password)) { score += 20; details.push('Numbers'); } 
    else { details.push('No numbers'); }

    if (/[^A-Za-z0-9]/.test(password)) { score += 20; details.push('Symbols'); } 
    else { details.push('No symbols'); }

    const common = ['password', '123456', 'qwerty', 'admin', 'letmein', 'welcome', 'monkey', 'dragon'];
    if (common.some(word => password.toLowerCase().includes(word))) {
        score = Math.max(0, score - 30);
        details.push('⚠️ Contains common pattern');
    }

    score = Math.min(100, score);

    let label, color;
    if (score >= 80) { label = 'Strong 🔒'; color = '#4ade80'; } 
    else if (score >= 50) { label = 'Medium 🔓'; color = '#fbbf24'; } 
    else { label = 'Weak ⚠️'; color = '#f87171'; }

    return { score, label, color, details: details.join(', ') };
}

// ============================================================
// GENERATE 3 STRONG PASSWORDS
// ============================================================
generateBtn.addEventListener('click', () => {
    const passwords = [];
    for (let i = 0; i < 3; i++) {
        passwords.push(generatePassword(16));
    }
    
    suggestionList.innerHTML = '';
    passwords.forEach((pwd, index) => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.innerHTML = `
            <span>${pwd}</span>
            <span class="copy-hint">Click to select</span>
        `;
        div.dataset.password = pwd;
        div.addEventListener('click', () => {
            document.querySelectorAll('.suggestion-item').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
            selectedPassword = pwd;
            copySelectedBtn.disabled = false;
            copySelectedBtn.textContent = '📋 Copy Selected';
        });
        suggestionList.appendChild(div);
    });
    
    suggestionsContainer.classList.remove('suggestions-hidden');
    copySelectedBtn.disabled = true;
    copySelectedBtn.textContent = '📋 Select a password first';
    selectedPassword = '';
});

function generatePassword(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_-+=';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// ============================================================
// COPY SELECTED PASSWORD
// ============================================================
copySelectedBtn.addEventListener('click', async () => {
    if (!selectedPassword) return;
    try {
        await navigator.clipboard.writeText(selectedPassword);
        copySelectedBtn.textContent = '✅ Copied!';
        setTimeout(() => {
            copySelectedBtn.textContent = '📋 Copy Selected';
        }, 2000);
    } catch (err) {
        copySelectedBtn.textContent = '❌ Failed to copy';
        setTimeout(() => {
            copySelectedBtn.textContent = '📋 Copy Selected';
        }, 2000);
    }
});

// ============================================================
// BREACH CHECKER
// ============================================================
const breachInput = document.getElementById('breachInput');
const breachBtn = document.getElementById('breachBtn');
const breachResult = document.getElementById('breachResult');
const breachBadge = document.getElementById('breachBadge');

breachBtn.addEventListener('click', async () => {
    const password = breachInput.value.trim();
    if (!password) {
        breachResult.innerHTML = `<span style="color:#f87171">⚠️ Please enter a password to check.</span>`;
        return;
    }

    await checkBreach(password, breachResult, breachBadge);
});

async function checkBreachAuto(password) {
    const result = await performBreachCheck(password);
    if (result.found) {
        strengthResult.innerHTML += `<br><span style="color:#f87171; font-size:13px;">⚠️ This password has appeared in ${result.count.toLocaleString()} breaches!</span>`;
        showBadge(true);
    } else {
        strengthResult.innerHTML += `<br><span style="color:#4ade80; font-size:13px;">✅ No breaches found for this password.</span>`;
    }
}

async function performBreachCheck(password) {
    try {
        const hash = await sha1(password);
        const prefix = hash.substring(0, 5);
        const suffix = hash.substring(5).toUpperCase();

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

        return { found, count };
    } catch (error) {
        console.error('Breach check error:', error);
        return { found: false, count: 0, error: true };
    }
}

async function checkBreach(password, resultElement, badgeElement) {
    resultElement.innerHTML = `<span style="color:rgba(255,255,255,0.5)">🔍 Searching breach database...</span>`;
    breachBtn.disabled = true;
    breachBtn.textContent = '⏳ Checking...';

    const result = await performBreachCheck(password);

    if (result.error) {
        resultElement.innerHTML = `<span style="color:#f87171">⚠️ Error checking breach. Please try again.</span>`;
    } else if (result.found && result.count > 0) {
        resultElement.innerHTML = `
            <div style="color:#f87171; font-weight:600;">⚠️ BREACH FOUND!</div>
            <div>This password has appeared <strong>${result.count.toLocaleString()}</strong> times in known data breaches.</div>
            <div style="margin-top:8px; font-size:13px; color:rgba(255,255,255,0.6);">🔐 You should <strong>never</strong> use this password anywhere.</div>
        `;
        showBadge(true, badgeElement);
    } else {
        resultElement.innerHTML = `
            <div style="color:#4ade80; font-weight:600;">✅ No breaches found!</div>
            <div>This password has not been exposed in any known data breaches.</div>
            <div style="margin-top:8px; font-size:13px; color:rgba(255,255,255,0.6);">👍 Still make sure it's strong and unique!</div>
        `;
        showBadge(false, badgeElement);
    }

    breachBtn.disabled = false;
    breachBtn.textContent = '🔍 Check for Breaches';
}

function showBadge(show, badgeElement = breachBadge) {
    if (show) {
        badgeElement.className = 'badge-visible';
    } else {
        badgeElement.className = 'badge-hidden';
    }
}

async function sha1(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

breachInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') breachBtn.click();
});

passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') generateBtn.click();
});

// ============================================================
// DIGITAL FINGERPRINT
// ============================================================
const fingerprintResult = document.getElementById('fingerprintResult');
const refreshFingerprint = document.getElementById('refreshFingerprint');

async function loadFingerprint() {
    fingerprintResult.innerHTML = `<span class="placeholder">🔄 Loading your fingerprint...</span>`;
    
    // Get browser data (always works)
    const browserData = getBrowserFingerprint();
    
    // Try to get IP geolocation (may be blocked)
    const geoData = await getGeoLocation();
    
    // Combine and display
    displayFingerprint(browserData, geoData);
}

function getBrowserFingerprint() {
    const ua = navigator.userAgent;
    let os = 'Unknown';
    let browser = 'Unknown';
    
    // Detect OS
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    
    // Detect Browser
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edg')) browser = 'Edge';
    
    return {
        os: os,
        browser: browser,
        screen: `${screen.width} × ${screen.height}`,
        colorDepth: `${screen.colorDepth}-bit`,
        language: navigator.language,
        device: /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? 'Mobile' : 'Desktop'
    };
}

async function getGeoLocation() {
    try {
        // Using free ip-api.com (no key required)
        const response = await fetch('http://ip-api.com/json/');
        if (!response.ok) throw new Error('API failed');
        const data = await response.json();
        
        if (data.status === 'success') {
            return {
                ip: data.query,
                country: data.country,
                city: data.city,
                region: data.regionName,
                isp: data.isp,
                timezone: data.timezone,
                lat: data.lat,
                lon: data.lon
            };
        } else {
            return null;
        }
    } catch (error) {
        console.log('Geolocation API failed:', error);
        return null;
    }
}

function displayFingerprint(browserData, geoData) {
    let html = '';
    
    // Browser Data (always works)
    html += `
        <div class="fingerprint-item"><span class="label">Operating System</span><span class="value">${browserData.os}</span></div>
        <div class="fingerprint-item"><span class="label">Browser</span><span class="value">${browserData.browser}</span></div>
        <div class="fingerprint-item"><span class="label">Screen Resolution</span><span class="value">${browserData.screen}</span></div>
        <div class="fingerprint-item"><span class="label">Color Depth</span><span class="value">${browserData.colorDepth}</span></div>
        <div class="fingerprint-item"><span class="label">Language</span><span class="value">${browserData.language}</span></div>
        <div class="fingerprint-item"><span class="label">Device Type</span><span class="value">${browserData.device}</span></div>
    `;
    
    // Geolocation Data (if available)
    if (geoData) {
        html += `
            <div class="fingerprint-item"><span class="label">IP Address</span><span class="value">${geoData.ip}</span></div>
            <div class="fingerprint-item"><span class="label">Country</span><span class="value">${geoData.country}</span></div>
            <div class="fingerprint-item"><span class="label">City</span><span class="value">${geoData.city}</span></div>
            <div class="fingerprint-item"><span class="label">ISP</span><span class="value">${geoData.isp}</span></div>
            <div class="fingerprint-item"><span class="label">Time Zone</span><span class="value">${geoData.timezone}</span></div>
        `;
    } else {
        html += `
            <div class="fingerprint-item"><span class="label">IP Geolocation</span><span class="value na">Not available in your region</span></div>
        `;
    }
    
    // Note about privacy
    html += `
        <div class="fingerprint-note">
            ⚠️ This is what every website can see about you. Use a VPN or privacy tools to protect your data.
        </div>
    `;
    
    fingerprintResult.innerHTML = html;
}

refreshFingerprint.addEventListener('click', loadFingerprint);

console.log('🔒 SicuroPass loaded successfully!');
