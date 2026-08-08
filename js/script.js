// ============================================================
// TAB SWITCHING
// ============================================================
const navBtns = document.querySelectorAll('.nav-btn');
const sections = {
    strength: document.getElementById('strength'),
    breach: document.getElementById('breach'),
    fingerprint: document.getElementById('fingerprint'),
    username: document.getElementById('username')
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
    
    const browserData = getBrowserFingerprint();
    const geoData = await getGeoLocation();
    
    displayFingerprint(browserData, geoData);
}

function getBrowserFingerprint() {
    const ua = navigator.userAgent;
    let os = 'Unknown';
    let browser = 'Unknown';
    
    // OS DETECTION
    if (ua.includes('Android')) {
        os = 'Android';
    } else if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) {
        os = 'iOS';
    } else if (ua.includes('Windows')) {
        os = 'Windows';
    } else if (ua.includes('Mac OS')) {
        os = 'macOS';
    } else if (ua.includes('Linux')) {
        os = 'Linux (Desktop)';
    } else if (ua.includes('CrOS')) {
        os = 'Chrome OS';
    }
    
    // BROWSER DETECTION
    if (ua.includes('OPR') || ua.includes('Opera')) {
        browser = 'Opera';
    } else if (ua.includes('Edg')) {
        browser = 'Edge';
    } else if (ua.includes('Firefox')) {
        browser = 'Firefox';
    } else if (ua.includes('SamsungBrowser')) {
        browser = 'Samsung Internet';
    } else if (ua.includes('Chrome')) {
        browser = 'Chrome';
    } else if (ua.includes('Safari')) {
        browser = 'Safari';
    }
    
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|Opera Mini|BlackBerry|IEMobile|WPDesktop/i.test(ua);
    const device = isMobile ? 'Mobile' : 'Desktop';
    
    return {
        os: os,
        browser: browser,
        screen: `${screen.width} × ${screen.height}`,
        colorDepth: `${screen.colorDepth}-bit`,
        language: navigator.language || navigator.languages?.[0] || 'Unknown',
        device: device
    };
}

async function getGeoLocation() {
    try {
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
    
    html += `
        <div class="fingerprint-item"><span class="label">Operating System</span><span class="value">${browserData.os}</span></div>
        <div class="fingerprint-item"><span class="label">Browser</span><span class="value">${browserData.browser}</span></div>
        <div class="fingerprint-item"><span class="label">Device Type</span><span class="value">${browserData.device}</span></div>
        <div class="fingerprint-item"><span class="label">Screen Resolution</span><span class="value">${browserData.screen}</span></div>
        <div class="fingerprint-item"><span class="label">Color Depth</span><span class="value">${browserData.colorDepth}</span></div>
        <div class="fingerprint-item"><span class="label">Language</span><span class="value">${browserData.language}</span></div>
    `;
    
    if (geoData) {
        html += `
            <div class="fingerprint-item"><span class="label">IP Address</span><span class="value">${geoData.ip}</span></div>
            <div class="fingerprint-item"><span class="label">Country</span><span class="value">${geoData.country}</span></div>
            <div class="fingerprint-item"><span class="label">City</span><span class="value">${geoData.city}</span></div>
            <div class="fingerprint-item"><span class="label">Region</span><span class="value">${geoData.region}</span></div>
            <div class="fingerprint-item"><span class="label">ISP</span><span class="value">${geoData.isp}</span></div>
            <div class="fingerprint-item"><span class="label">Time Zone</span><span class="value">${geoData.timezone}</span></div>
        `;
    } else {
        html += `
            <div class="fingerprint-item" style="grid-column: 1 / -1; justify-content: center; padding: 16px 0; border-bottom: none;">
                <span style="color: rgba(255,255,255,0.3); font-style: italic; text-align: center;">
                    🌍 IP geolocation is not available in your region.<br>
                    <span style="font-size: 12px;">Your browser data above still works.</span>
                </span>
            </div>
        `;
    }
    
    html += `
        <div class="fingerprint-note">
            ⚠️ This is what every website can see about you. Use a VPN or privacy tools to protect your data.
        </div>
    `;
    
    fingerprintResult.innerHTML = html;
}

refreshFingerprint.addEventListener('click', loadFingerprint);

// ============================================================
// USERNAME SEARCH
// ============================================================
const usernameInput = document.getElementById('usernameInput');
const usernameBtn = document.getElementById('usernameBtn');
const usernameResult = document.getElementById('usernameResult');

usernameBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    if (!username) {
        usernameResult.innerHTML = `<span style="color:#f87171">⚠️ Please enter a username to search.</span>`;
        return;
    }

    usernameBtn.disabled = true;
    usernameBtn.textContent = '⏳ Searching...';
    usernameResult.innerHTML = `<span style="color:rgba(255,255,255,0.5)">🔍 Searching ${username} across platforms...</span>`;

    const results = await searchUsername(username);
    displayUsernameResults(results, username);

    usernameBtn.disabled = false;
    usernameBtn.textContent = '🔍 Search';
});

async function searchUsername(username) {
    const results = [];

    // 1. GITHUB
    try {
        const response = await fetch(`https://api.github.com/users/${username}`);
        if (response.ok) {
            results.push({ platform: 'GitHub', found: true, url: `https://github.com/${username}` });
        } else if (response.status === 404) {
            results.push({ platform: 'GitHub', found: false });
        } else {
            results.push({ platform: 'GitHub', found: false, error: 'API limit' });
        }
    } catch {
        results.push({ platform: 'GitHub', found: false, error: 'Failed to fetch' });
    }

    // 2. REDDIT
    try {
        const response = await fetch(`https://www.reddit.com/user/${username}/about.json`);
        if (response.ok) {
            const data = await response.json();
            if (data.data && data.data.name) {
                results.push({ platform: 'Reddit', found: true, url: `https://reddit.com/user/${username}` });
            } else {
                results.push({ platform: 'Reddit', found: false });
            }
        } else if (response.status === 404) {
            results.push({ platform: 'Reddit', found: false });
        } else {
            results.push({ platform: 'Reddit', found: false, error: 'API limit' });
        }
    } catch {
        results.push({ platform: 'Reddit', found: false, error: 'Failed to fetch' });
    }

    // 3. YOUTUBE
    try {
        const response = await fetch(`https://www.youtube.com/@${username}`);
        if (response.ok) {
            const html = await response.text();
            if (html.includes('This channel doesn\'t exist') || html.includes('This page is not available')) {
                results.push({ platform: 'YouTube', found: false });
            } else {
                results.push({ platform: 'YouTube', found: true, url: `https://youtube.com/@${username}` });
            }
        } else {
            results.push({ platform: 'YouTube', found: false });
        }
    } catch {
        results.push({ platform: 'YouTube', found: false, error: 'Failed to fetch' });
    }

    // 4. INSTAGRAM (Not possible from frontend)
    results.push({
        platform: 'Instagram',
        found: false,
        error: '🔒 Requires backend API'
    });

    // 5. FACEBOOK (Not possible from frontend)
    results.push({
        platform: 'Facebook',
        found: false,
        error: '🔒 Requires backend API'
    });

    return results;
}

function displayUsernameResults(results, username) {
    let html = `
        <div style="margin-bottom: 12px; font-weight: 500;">Results for "<strong>${username}</strong>":</div>
    `;

    let foundCount = 0;

    results.forEach(result => {
        if (result.found) {
            foundCount++;
            html += `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <span style="color: #4ade80;">✅ ${result.platform}</span>
                    <span style="color: rgba(255,255,255,0.5); font-size: 13px;">
                        <a href="${result.url}" target="_blank" style="color: #00f0ff; text-decoration: none;">${result.url}</a>
                    </span>
                </div>
            `;
        } else if (result.error && result.error.includes('Requires backend')) {
            html += `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <span style="color: #fbbf24;">⚠️ ${result.platform}</span>
                    <span style="color: rgba(255,255,255,0.3); font-size: 12px;">${result.error}</span>
                </div>
            `;
        } else if (result.error) {
            html += `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <span style="color: #fbbf24;">⚠️ ${result.platform}</span>
                    <span style="color: rgba(255,255,255,0.3); font-size: 13px;">${result.error}</span>
                </div>
            `;
        } else {
            html += `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <span style="color: #f87171;">❌ ${result.platform}</span>
                    <span style="color: rgba(255,255,255,0.3); font-size: 13px;">Not found</span>
                </div>
            `;
        }
    });

    if (foundCount === 0) {
        html += `
            <div style="margin-top: 16px; padding: 12px 16px; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); text-align: center; color: rgba(255,255,255,0.4); font-size: 13px;">
                😕 No accounts found for "${username}" on supported platforms.
                <br><span style="font-size: 12px;">Instagram and Facebook require a backend server.</span>
            </div>
        `;
    } else {
        html += `
            <div style="margin-top: 16px; padding: 12px 16px; background: rgba(0,240,255,0.05); border-radius: 12px; border: 1px solid rgba(0,240,255,0.1); text-align: center; color: rgba(255,255,255,0.6); font-size: 13px;">
                ✅ Found ${foundCount} account${foundCount > 1 ? 's' : ''} for "${username}".
            </div>
        `;
    }

    usernameResult.innerHTML = html;
}

usernameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') usernameBtn.click();
});

console.log('🔒 SicuroPass loaded successfully!');
