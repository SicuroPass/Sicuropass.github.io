// ============================================================
// TAB SWITCHING
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('SicuroPass loaded');

    var navBtns = document.querySelectorAll('.nav-btn');
    var sections = {
        strength: document.getElementById('strength'),
        breach: document.getElementById('breach'),
        fingerprint: document.getElementById('fingerprint'),
        username: document.getElementById('username'),
        privacy: document.getElementById('privacy'),
        email: document.getElementById('email')
    };

    for (var i = 0; i < navBtns.length; i++) {
        navBtns[i].addEventListener('click', function() {
            for (var j = 0; j < navBtns.length; j++) {
                navBtns[j].classList.remove('active');
            }
            this.classList.add('active');

            var tab = this.getAttribute('data-tab');
            for (var key in sections) {
                if (sections[key]) {
                    if (key === tab) {
                        sections[key].classList.add('active');
                    } else {
                        sections[key].classList.remove('active');
                    }
                }
            }

            if (tab === 'fingerprint') {
                loadFingerprint();
            }
            if (tab === 'privacy') {
                loadPrivacyWarning();
            }
        });
    }

    // ============================================================
    // PASSWORD STRENGTH TESTER
    // ============================================================
    var passwordInput = document.getElementById('passwordInput');
    var meterBar = document.getElementById('meterBar');
    var strengthResult = document.getElementById('strengthResult');
    var generateBtn = document.getElementById('generateBtn');
    var suggestionsContainer = document.getElementById('suggestionsContainer');
    var suggestionList = document.getElementById('suggestionList');
    var copySelectedBtn = document.getElementById('copySelectedBtn');
    var selectedPassword = '';

    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            var password = this.value;
            if (!password) {
                meterBar.style.width = '0%';
                strengthResult.innerHTML = 'Your password strength will appear here.';
                if (suggestionsContainer) {
                    suggestionsContainer.classList.add('suggestions-hidden');
                }
                return;
            }

            var result = checkStrength(password);
            meterBar.style.width = result.score + '%';
            meterBar.style.background = result.color;
            strengthResult.innerHTML = '<strong style="color:' + result.color + '">' + result.label + '</strong> – ' + result.details;
        });
    }

    function checkStrength(password) {
        var score = 0;
        var details = [];

        if (password.length >= 8) { score += 30; details.push('Good length'); } 
        else { details.push('Too short'); }

        if (/[A-Z]/.test(password)) { score += 20; details.push('Uppercase'); } 
        else { details.push('No uppercase'); }

        if (/[a-z]/.test(password)) { score += 20; details.push('Lowercase'); } 
        else { details.push('No lowercase'); }

        if (/[0-9]/.test(password)) { score += 15; details.push('Numbers'); } 
        else { details.push('No numbers'); }

        if (/[^A-Za-z0-9]/.test(password)) { score += 15; details.push('Symbols'); } 
        else { details.push('No symbols'); }

        score = Math.min(100, score);

        var label, color;
        if (score >= 80) { label = 'Strong 🔒'; color = '#4ade80'; } 
        else if (score >= 50) { label = 'Medium 🔓'; color = '#fbbf24'; } 
        else { label = 'Weak ⚠️'; color = '#f87171'; }

        return { score: score, label: label, color: color, details: details.join(', ') };
    }

    // ============================================================
    // GENERATE 3 PASSWORDS
    // ============================================================
    if (generateBtn) {
        generateBtn.addEventListener('click', function() {
            var passwords = [];
            for (var i = 0; i < 3; i++) {
                passwords.push(generatePassword(16));
            }
            
            if (suggestionList) {
                suggestionList.innerHTML = '';
                for (var j = 0; j < passwords.length; j++) {
                    var pwd = passwords[j];
                    var div = document.createElement('div');
                    div.className = 'suggestion-item';
                    div.innerHTML = '<span>' + pwd + '</span><span class="copy-hint">Click to select</span>';
                    div.dataset.password = pwd;
                    div.addEventListener('click', function() {
                        var items = document.querySelectorAll('.suggestion-item');
                        for (var k = 0; k < items.length; k++) {
                            items[k].classList.remove('selected');
                        }
                        this.classList.add('selected');
                        selectedPassword = this.dataset.password;
                        if (copySelectedBtn) {
                            copySelectedBtn.disabled = false;
                            copySelectedBtn.textContent = '📋 Copy Selected';
                        }
                    });
                    suggestionList.appendChild(div);
                }
                
                if (suggestionsContainer) {
                    suggestionsContainer.classList.remove('suggestions-hidden');
                }
                if (copySelectedBtn) {
                    copySelectedBtn.disabled = true;
                    copySelectedBtn.textContent = '📋 Select a password first';
                }
                selectedPassword = '';
            }
        });
    }

    function generatePassword(length) {
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_-+=';
        var password = '';
        for (var i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    // ============================================================
    // COPY TO CLIPBOARD
    // ============================================================
    if (copySelectedBtn) {
        copySelectedBtn.addEventListener('click', function() {
            if (!selectedPassword) return;
            try {
                navigator.clipboard.writeText(selectedPassword).then(function() {
                    copySelectedBtn.textContent = '✅ Copied!';
                    setTimeout(function() {
                        copySelectedBtn.textContent = '📋 Copy Selected';
                    }, 2000);
                }).catch(function() {
                    copySelectedBtn.textContent = '❌ Failed to copy';
                    setTimeout(function() {
                        copySelectedBtn.textContent = '📋 Copy Selected';
                    }, 2000);
                });
            } catch (err) {
                copySelectedBtn.textContent = '❌ Failed to copy';
                setTimeout(function() {
                    copySelectedBtn.textContent = '📋 Copy Selected';
                }, 2000);
            }
        });
    }

    // ============================================================
    // BREACH CHECKER (REAL API)
    // ============================================================
    var breachInput = document.getElementById('breachInput');
    var breachBtn = document.getElementById('breachBtn');
    var breachResult = document.getElementById('breachResult');
    var breachBadge = document.getElementById('breachBadge');

    if (breachBtn) {
        breachBtn.addEventListener('click', function() {
            var password = breachInput.value.trim();
            if (!password) {
                breachResult.innerHTML = '<span style="color:#f87171">⚠️ Please enter a password to check.</span>';
                return;
            }

            breachResult.innerHTML = '<span style="color:rgba(255,255,255,0.5)">🔍 Searching breach database...</span>';
            breachBtn.disabled = true;
            breachBtn.textContent = '⏳ Checking...';

            performBreachCheck(password).then(function(result) {
                if (result.error) {
                    breachResult.innerHTML = '<span style="color:#f87171">⚠️ Error checking breach. Please try again.</span>';
                } else if (result.found && result.count > 0) {
                    breachResult.innerHTML = '<div style="color:#f87171; font-weight:600;">⚠️ BREACH FOUND!</div><div>This password has appeared <strong>' + result.count.toLocaleString() + '</strong> times in known data breaches.</div><div style="margin-top:8px; font-size:13px; color:rgba(255,255,255,0.6);">🔐 You should <strong>never</strong> use this password anywhere.</div>';
                    showBadge(true);
                } else {
                    breachResult.innerHTML = '<div style="color:#4ade80; font-weight:600;">✅ No breaches found!</div><div>This password has not been exposed in any known data breaches.</div><div style="margin-top:8px; font-size:13px; color:rgba(255,255,255,0.6);">👍 Still make sure it\'s strong and unique!</div>';
                    showBadge(false);
                }

                breachBtn.disabled = false;
                breachBtn.textContent = '🔍 Check for Breaches';
            });
        });
    }

    function performBreachCheck(password) {
        return sha1(password).then(function(hash) {
            var prefix = hash.substring(0, 5);
            var suffix = hash.substring(5).toUpperCase();

            return fetch('https://api.pwnedpasswords.com/range/' + prefix).then(function(response) {
                if (!response.ok) throw new Error('API request failed');
                return response.text();
            }).then(function(data) {
                var lines = data.split('\n');
                var found = false;
                var count = 0;

                for (var i = 0; i < lines.length; i++) {
                    if (lines[i].indexOf(suffix) !== -1) {
                        var parts = lines[i].split(':');
                        count = parseInt(parts[1]) || 0;
                        found = true;
                        break;
                    }
                }

                return { found: found, count: count };
            });
        }).catch(function(error) {
            console.error('Breach check error:', error);
            return { found: false, count: 0, error: true };
        });
    }

    function sha1(message) {
        var msgBuffer = new TextEncoder().encode(message);
        return crypto.subtle.digest('SHA-1', msgBuffer).then(function(hashBuffer) {
            var hashArray = Array.from(new Uint8Array(hashBuffer));
            var hashHex = '';
            for (var i = 0; i < hashArray.length; i++) {
                hashHex += hashArray[i].toString(16).padStart(2, '0');
            }
            return hashHex;
        });
    }

    function showBadge(show) {
        if (!breachBadge) return;
        if (show) {
            breachBadge.className = 'badge-visible';
        } else {
            breachBadge.className = 'badge-hidden';
        }
    }

    // ============================================================
    // EMAIL BREACH CHECK (NEW FEATURE)
    // ============================================================
    var emailInput = document.getElementById('emailInput');
    var emailBtn = document.getElementById('emailBtn');
    var emailResult = document.getElementById('emailResult');

    if (emailBtn) {
        emailBtn.addEventListener('click', function() {
            var email = emailInput.value.trim();
            if (!email) {
                emailResult.innerHTML = '<span style="color:#f87171">⚠️ Please enter an email address to check.</span>';
                return;
            }

            // Validate email format
            if (!isValidEmail(email)) {
                emailResult.innerHTML = '<span style="color:#f87171">⚠️ Please enter a valid email address.</span>';
                return;
            }

            emailResult.innerHTML = '<span style="color:rgba(255,255,255,0.5)">🔍 Searching breach database for ' + email + '...</span>';
            emailBtn.disabled = true;
            emailBtn.textContent = '⏳ Checking...';

            checkEmailBreach(email).then(function(result) {
                if (result.error) {
                    emailResult.innerHTML = '<span style="color:#f87171">⚠️ Error checking email. Please try again.</span>';
                } else if (result.found && result.breaches.length > 0) {
                    var breachList = result.breaches.join(', ');
                    var breachCount = result.breaches.length;
                    emailResult.innerHTML = '<div style="color:#f87171; font-weight:600;">⚠️ EMAIL FOUND IN ' + breachCount + ' BREACH' + (breachCount > 1 ? 'ES' : '') + '!</div><div>Your email <strong>' + email + '</strong> was found in the following breach' + (breachCount > 1 ? 'es' : '') + ':</div><div style="margin-top:8px; padding:10px; background:rgba(255,255,255,0.03); border-radius:8px; font-size:13px; color:rgba(255,255,255,0.8);">' + breachList + '</div><div style="margin-top:10px; font-size:13px; color:rgba(255,255,255,0.6);">🔐 Change your password immediately on any site where you used this email. Enable 2FA where available.</div>';
                } else {
                    emailResult.innerHTML = '<div style="color:#4ade80; font-weight:600;">✅ No breaches found!</div><div>Your email <strong>' + email + '</strong> has not been found in any known data breaches.</div><div style="margin-top:8px; font-size:13px; color:rgba(255,255,255,0.6);">👍 Still make sure you use strong, unique passwords everywhere!</div>';
                }

                emailBtn.disabled = false;
                emailBtn.textContent = '🔍 Check Email';
            });
        });
    }

    function isValidEmail(email) {
        var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function checkEmailBreach(email) {
        // First get the breaches for this email using the HIBP API
        // Note: This API may be blocked in some regions
        return fetch('https://haveibeenpwned.com/api/v3/breachedaccount/' + encodeURIComponent(email) + '?truncateResponse=false', {
            headers: {
                'hibp-api-key': '' // No key needed for public API
            }
        }).then(function(response) {
            if (response.status === 404) {
                return { found: false, breaches: [] };
            }
            if (!response.ok) {
                throw new Error('API request failed with status: ' + response.status);
            }
            return response.json();
        }).then(function(data) {
            if (data && data.length > 0) {
                var breachNames = data.map(function(breach) {
                    return breach.Name;
                });
                return { found: true, breaches: breachNames };
            } else {
                return { found: false, breaches: [] };
            }
        }).catch(function(error) {
            console.error('Email breach check error:', error);
            // Check for network errors (CORS, block, etc.)
            if (error.message === 'Failed to fetch') {
                return { error: true, message: 'Network error. The API may be blocked in your region.' };
            }
            return { error: true, message: error.message };
        });
    }

    // Enter key support for email input
    if (emailInput) {
        emailInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && emailBtn) emailBtn.click();
        });
    }

    // ============================================================
    // DIGITAL FINGERPRINT (INSTANT)
    // ============================================================
    var fingerprintResult = document.getElementById('fingerprintResult');
    var refreshFingerprint = document.getElementById('refreshFingerprint');

    function loadFingerprint() {
        if (!fingerprintResult) return;
        
        var ua = navigator.userAgent;
        var os = 'Unknown';
        if (ua.indexOf('Android') !== -1) os = 'Android';
        else if (ua.indexOf('iPhone') !== -1 || ua.indexOf('iPad') !== -1) os = 'iOS';
        else if (ua.indexOf('Windows') !== -1) os = 'Windows';
        else if (ua.indexOf('Mac OS') !== -1) os = 'macOS';
        else if (ua.indexOf('Linux') !== -1) os = 'Linux';

        var browser = 'Unknown';
        if (ua.indexOf('OPR') !== -1 || ua.indexOf('Opera') !== -1) browser = 'Opera';
        else if (ua.indexOf('Edg') !== -1) browser = 'Edge';
        else if (ua.indexOf('Firefox') !== -1) browser = 'Firefox';
        else if (ua.indexOf('Chrome') !== -1) browser = 'Chrome';
        else if (ua.indexOf('Safari') !== -1) browser = 'Safari';

        var isMobile = (ua.indexOf('Mobi') !== -1 || ua.indexOf('Android') !== -1 || ua.indexOf('iPhone') !== -1);
        var device = isMobile ? 'Mobile' : 'Desktop';

        // Platform fix: Show "Android" instead of "Linux" for Android devices
        var platform = navigator.platform || 'Unknown';
        if (os === 'Android' && platform === 'Linux') {
            platform = 'Android';
        }

        // Get battery info (updates in background)
        if (navigator.getBattery) {
            navigator.getBattery().then(function(batt) {
                var level = Math.round(batt.level * 100);
                var status = batt.charging ? '⚡ Charging' : '🔋 Not charging';
                var batteryEl = document.getElementById('batteryValue');
                if (batteryEl) {
                    batteryEl.textContent = level + '% ' + status;
                }
            }).catch(function() {
                var batteryEl = document.getElementById('batteryValue');
                if (batteryEl) {
                    batteryEl.textContent = 'Not available';
                }
            });
        }

        var network = 'Not available';
        var speed = 'Not available';
        if (navigator.connection) {
            var conn = navigator.connection;
            network = conn.effectiveType || 'Unknown';
            speed = conn.downlink ? conn.downlink + ' Mbps' : 'Unknown';
        }

        var fonts = getInstalledFonts();

        var html = '';
        html += '<div class="fingerprint-item"><span class="label">Operating System</span><span class="value">' + os + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Platform</span><span class="value">' + platform + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Browser</span><span class="value">' + browser + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Device Type</span><span class="value">' + device + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Screen Resolution</span><span class="value">' + screen.width + ' × ' + screen.height + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Color Depth</span><span class="value">' + screen.colorDepth + '-bit</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Language</span><span class="value">' + navigator.language + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Time Zone</span><span class="value">' + Intl.DateTimeFormat().resolvedOptions().timeZone + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Cookies</span><span class="value">' + (navigator.cookieEnabled ? 'Enabled' : 'Disabled') + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Do Not Track</span><span class="value">' + (navigator.doNotTrack || 'Not set') + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">CPU Cores</span><span class="value">' + (navigator.hardwareConcurrency || 'Unknown') + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Device Memory</span><span class="value">' + (navigator.deviceMemory || 'Unknown') + ' GB</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Battery</span><span class="value" id="batteryValue">Loading...</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Network</span><span class="value">' + network + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Connection Speed</span><span class="value">' + speed + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Installed Fonts</span><span class="value" style="font-size:11px;">' + fonts + '</span></div>';
        html += '<div class="fingerprint-note">⚠️ This is what websites can see about you. Use a VPN to protect your privacy.</div>';
        
        fingerprintResult.innerHTML = html;
    }

    function getInstalledFonts() {
        var baseFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia'];
        var installed = [];
        var testString = 'mmmmmmmmmmlli';
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        
        for (var i = 0; i < baseFonts.length; i++) {
            var font = baseFonts[i];
            ctx.font = '72px "' + font + '", sans-serif';
            var width = ctx.measureText(testString).width;
            ctx.font = '72px sans-serif';
            var fallbackWidth = ctx.measureText(testString).width;
            if (width !== fallbackWidth) {
                installed.push(font);
            }
        }
        
        return installed.length > 0 ? installed.join(', ') : 'None detected';
    }

    if (refreshFingerprint) {
        refreshFingerprint.addEventListener('click', loadFingerprint);
    }

    // ============================================================
    // PRIVACY WARNING
    // ============================================================
    var privacyResult = document.getElementById('privacyResult');

    function loadPrivacyWarning() {
        if (!privacyResult) return;
        
        var ua = navigator.userAgent;
        var isMobile = (ua.indexOf('Mobi') !== -1 || ua.indexOf('Android') !== -1 || ua.indexOf('iPhone') !== -1);
        var language = navigator.language || 'Unknown';
        var screenRes = screen.width + ' × ' + screen.height;
        
        var os = 'Unknown';
        if (ua.indexOf('Android') !== -1) os = 'Android';
        else if (ua.indexOf('iPhone') !== -1 || ua.indexOf('iPad') !== -1) os = 'iOS';
        else if (ua.indexOf('Windows') !== -1) os = 'Windows';
        else if (ua.indexOf('Mac OS') !== -1) os = 'macOS';
        else if (ua.indexOf('Linux') !== -1) os = 'Linux';

        var browser = 'Unknown';
        if (ua.indexOf('OPR') !== -1 || ua.indexOf('Opera') !== -1) browser = 'Opera';
        else if (ua.indexOf('Edg') !== -1) browser = 'Edge';
        else if (ua.indexOf('Firefox') !== -1) browser = 'Firefox';
        else if (ua.indexOf('Chrome') !== -1) browser = 'Chrome';
        else if (ua.indexOf('Safari') !== -1) browser = 'Safari';
        
        var riskScore = 30;
        var risks = [];
        risks.push('Your browser sends a unique fingerprint to websites');
        
        if (isMobile) {
            riskScore += 10;
            risks.push('Mobile devices share more location data');
        }
        
        if (language && language.indexOf('en') !== 0) {
            riskScore += 10;
            risks.push('Your language reveals your region');
        }
        
        if (navigator.doNotTrack !== '1') {
            riskScore += 20;
            risks.push('Do Not Track is not enabled');
        }
        
        if (navigator.cookieEnabled) {
            riskScore += 10;
            risks.push('Cookies are enabled for tracking');
        }
        
        riskScore = Math.min(100, riskScore);
        
        var level, color;
        if (riskScore >= 80) { level = 'VERY HIGH'; color = '#f87171'; }
        else if (riskScore >= 60) { level = 'HIGH'; color = '#fbbf24'; }
        else if (riskScore >= 40) { level = 'MEDIUM'; color = '#fbbf24'; }
        else { level = 'LOW'; color = '#4ade80'; }
        
        var html = '';
        html += '<div style="margin-bottom:16px;">';
        html += '<div style="display:flex;justify-content:space-between;background:rgba(255,255,255,0.03);padding:16px 20px;border-radius:16px;">';
        html += '<span style="font-weight:700;">Risk Level: <span style="color:' + color + ';">' + level + '</span></span>';
        html += '<span>Score: ' + riskScore + '/100</span>';
        html += '</div></div>';
        
        html += '<div style="margin-bottom:16px;padding:14px 16px;background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid rgba(255,255,255,0.05);">';
        html += '<div style="font-size:13px;color:rgba(255,255,255,0.4);margin-bottom:6px;">YOUR FINGERPRINT SUMMARY</div>';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;font-size:13px;">';
        html += '<span>🖥️ ' + browser + ' on ' + os + '</span>';
        html += '<span>📱 ' + (isMobile ? 'Mobile' : 'Desktop') + '</span>';
        html += '<span>🌐 ' + language + '</span>';
        html += '<span>📐 ' + screenRes + '</span>';
        html += '</div></div>';
        
        html += '<div style="margin-bottom:12px;font-weight:500;font-size:14px;">🔍 What this data reveals about you:</div>';
        html += '<ul style="list-style:none;padding:0;margin:0;">';
        
        for (var i = 0; i < risks.length; i++) {
            html += '<li style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.04);font-size:13px;color:rgba(255,255,255,0.7);">⚠️ ' + risks[i] + '</li>';
        }
        
        html += '</ul>';
        html += '<div style="margin-top:16px;padding:14px 16px;background:rgba(0,240,255,0.05);border-radius:12px;text-align:center;font-size:13px;color:rgba(255,255,255,0.6);">';
        html += '🛡️ <strong>Protect yourself:</strong> Use a VPN, block third-party cookies, and use a privacy-focused browser.';
        html += '</div>';
        
        privacyResult.innerHTML = html;
    }

    // ============================================================
    // USERNAME SEARCH
    // ============================================================
    var usernameInput = document.getElementById('usernameInput');
    var usernameBtn = document.getElementById('usernameBtn');
    var usernameResult = document.getElementById('usernameResult');

    if (usernameBtn) {
        usernameBtn.addEventListener('click', function() {
            var username = usernameInput.value.trim();
            if (!username) {
                usernameResult.innerHTML = 'Please enter a username to search.';
                return;
            }

            usernameResult.innerHTML = 'Searching for ' + username + '...';
            usernameBtn.disabled = true;
            usernameBtn.textContent = 'Searching...';

            var githubCheck = new XMLHttpRequest();
            githubCheck.open('GET', 'https://api.github.com/users/' + username);
            githubCheck.onload = function() {
                var resultHtml = 'Results for <strong>' + username + '</strong>:<br><br>';
                
                if (githubCheck.status === 200) {
                    resultHtml += '✅ GitHub: <a href="https://github.com/' + username + '" target="_blank">https://github.com/' + username + '</a><br>';
                } else {
                    resultHtml += '❌ GitHub: Not found<br>';
                }

                var redditCheck = new XMLHttpRequest();
                redditCheck.open('GET', 'https://www.reddit.com/user/' + username + '/about.json');
                redditCheck.onload = function() {
                    if (redditCheck.status === 200) {
                        try {
                            var data = JSON.parse(redditCheck.responseText);
                            if (data.data && data.data.name) {
                                resultHtml += '✅ Reddit: <a href="https://reddit.com/user/' + username + '" target="_blank">https://reddit.com/user/' + username + '</a><br>';
                            } else {
                                resultHtml += '❌ Reddit: Not found<br>';
                            }
                        } catch (e) {
                            resultHtml += '❌ Reddit: Error checking<br>';
                        }
                    } else {
                        resultHtml += '❌ Reddit: Not found<br>';
                    }
                    
                    resultHtml += '<br>Instagram and Facebook require a backend server and cannot be checked from this site.';
                    usernameResult.innerHTML = resultHtml;
                    usernameBtn.disabled = false;
                    usernameBtn.textContent = 'Search';
                };
                redditCheck.onerror = function() {
                    resultHtml += '❌ Reddit: Error checking<br>';
                    usernameResult.innerHTML = resultHtml;
                    usernameBtn.disabled = false;
                    usernameBtn.textContent = 'Search';
                };
                redditCheck.send();
            };
            githubCheck.onerror = function() {
                usernameResult.innerHTML = '❌ GitHub: Error checking. Please try again.';
                usernameBtn.disabled = false;
                usernameBtn.textContent = 'Search';
            };
            githubCheck.send();
        });
    }

    // ============================================================
    // ENTER KEY SUPPORT
    // ============================================================
    if (breachInput) {
        breachInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && breachBtn) breachBtn.click();
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && generateBtn) generateBtn.click();
        });
    }

    if (usernameInput) {
        usernameInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && usernameBtn) usernameBtn.click();
        });
    }

    console.log('✅ SicuroPass loaded successfully');
});
