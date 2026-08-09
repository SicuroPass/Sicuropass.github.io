// ============================================================
// TAB SWITCHING
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔒 SicuroPass loaded');

    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = {
        strength: document.getElementById('strength'),
        breach: document.getElementById('breach'),
        fingerprint: document.getElementById('fingerprint'),
        username: document.getElementById('username'),
        privacy: document.getElementById('privacy')
    };

    navBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            navBtns.forEach(function(b) {
                b.classList.remove('active');
            });
            this.classList.add('active');

            var tab = this.dataset.tab;
            for (var key in sections) {
                if (sections[key]) {
                    sections[key].classList.toggle('active', key === tab);
                }
            }

            if (tab === 'fingerprint') {
                loadFingerprint();
            }
            if (tab === 'privacy') {
                loadPrivacyWarning();
            }
        });
    });

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
                strengthResult.innerHTML = '<span class="placeholder">Your password strength will appear here.</span>';
                if (suggestionsContainer) {
                    suggestionsContainer.classList.add('suggestions-hidden');
                }
                return;
            }

            var result = checkStrength(password);
            meterBar.style.width = result.score + '%';
            meterBar.style.background = result.color;
            strengthResult.innerHTML = '<strong style="color:' + result.color + '">' + result.label + '</strong> – ' + result.details;
            
            if (result.score >= 50) {
                checkBreachAuto(password);
            }
        });
    }

    function checkStrength(password) {
        var score = 0;
        var details = [];

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

        var common = ['password', '123456', 'qwerty', 'admin', 'letmein', 'welcome', 'monkey', 'dragon'];
        for (var i = 0; i < common.length; i++) {
            if (password.toLowerCase().indexOf(common[i]) !== -1) {
                score = Math.max(0, score - 30);
                details.push('⚠️ Contains common pattern');
                break;
            }
        }

        score = Math.min(100, score);

        var label, color;
        if (score >= 80) { label = 'Strong 🔒'; color = '#4ade80'; } 
        else if (score >= 50) { label = 'Medium 🔓'; color = '#fbbf24'; } 
        else { label = 'Weak ⚠️'; color = '#f87171'; }

        return { score: score, label: label, color: color, details: details.join(', ') };
    }

    // ============================================================
    // GENERATE 3 STRONG PASSWORDS
    // ============================================================
    if (generateBtn) {
        generateBtn.addEventListener('click', function() {
            var passwords = [];
            for (var i = 0; i < 3; i++) {
                passwords.push(generatePassword(16));
            }
            
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
                    copySelectedBtn.disabled = false;
                    copySelectedBtn.textContent = '📋 Copy Selected';
                });
                suggestionList.appendChild(div);
            }
            
            suggestionsContainer.classList.remove('suggestions-hidden');
            copySelectedBtn.disabled = true;
            copySelectedBtn.textContent = '📋 Select a password first';
            selectedPassword = '';
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
    // COPY SELECTED PASSWORD
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
    // BREACH CHECKER
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

            checkBreach(password, breachResult, breachBadge, breachBtn);
        });
    }

    function checkBreachAuto(password) {
        performBreachCheck(password).then(function(result) {
            if (result.found) {
                strengthResult.innerHTML += '<br><span style="color:#f87171; font-size:13px;">⚠️ This password has appeared in ' + result.count.toLocaleString() + ' breaches!</span>';
                showBadge(true);
            } else {
                strengthResult.innerHTML += '<br><span style="color:#4ade80; font-size:13px;">✅ No breaches found for this password.</span>';
            }
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

    function checkBreach(password, resultElement, badgeElement, btnElement) {
        performBreachCheck(password).then(function(result) {
            if (result.error) {
                resultElement.innerHTML = '<span style="color:#f87171">⚠️ Error checking breach. Please try again.</span>';
            } else if (result.found && result.count > 0) {
                resultElement.innerHTML = '<div style="color:#f87171; font-weight:600;">⚠️ BREACH FOUND!</div><div>This password has appeared <strong>' + result.count.toLocaleString() + '</strong> times in known data breaches.</div><div style="margin-top:8px; font-size:13px; color:rgba(255,255,255,0.6);">🔐 You should <strong>never</strong> use this password anywhere.</div>';
                showBadge(true, badgeElement);
            } else {
                resultElement.innerHTML = '<div style="color:#4ade80; font-weight:600;">✅ No breaches found!</div><div>This password has not been exposed in any known data breaches.</div><div style="margin-top:8px; font-size:13px; color:rgba(255,255,255,0.6);">👍 Still make sure it\'s strong and unique!</div>';
                showBadge(false, badgeElement);
            }

            btnElement.disabled = false;
            btnElement.textContent = '🔍 Check for Breaches';
        });
    }

    function showBadge(show, badgeElement) {
        if (!badgeElement) badgeElement = breachBadge;
        if (show) {
            badgeElement.className = 'badge-visible';
        } else {
            badgeElement.className = 'badge-hidden';
        }
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

    if (breachInput) {
        breachInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') breachBtn.click();
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && generateBtn) generateBtn.click();
        });
    }

    // ============================================================
    // DIGITAL FINGERPRINT
    // ============================================================
    var fingerprintResult = document.getElementById('fingerprintResult');
    var refreshFingerprint = document.getElementById('refreshFingerprint');

    function loadFingerprint() {
        if (!fingerprintResult) return;
        fingerprintResult.innerHTML = '<span class="placeholder">🔄 Loading your fingerprint...</span>';
        
        var browserData = getBrowserFingerprint();
        var geoData = null;
        
        getGeoLocation().then(function(data) {
            geoData = data;
            displayFingerprint(browserData, geoData);
        }).catch(function() {
            displayFingerprint(browserData, null);
        });
    }

    function getBrowserFingerprint() {
        var ua = navigator.userAgent;
        var os = 'Unknown';
        var browser = 'Unknown';
        
        if (ua.indexOf('Android') !== -1) {
            os = 'Android';
        } else if (ua.indexOf('iPhone') !== -1 || ua.indexOf('iPad') !== -1 || ua.indexOf('iPod') !== -1) {
            os = 'iOS';
        } else if (ua.indexOf('Windows') !== -1) {
            os = 'Windows';
        } else if (ua.indexOf('Mac OS') !== -1) {
            os = 'macOS';
        } else if (ua.indexOf('Linux') !== -1) {
            os = 'Linux (Desktop)';
        } else if (ua.indexOf('CrOS') !== -1) {
            os = 'Chrome OS';
        }
        
        if (ua.indexOf('OPR') !== -1 || ua.indexOf('Opera') !== -1) {
            browser = 'Opera';
        } else if (ua.indexOf('Edg') !== -1) {
            browser = 'Edge';
        } else if (ua.indexOf('Firefox') !== -1) {
            browser = 'Firefox';
        } else if (ua.indexOf('SamsungBrowser') !== -1) {
            browser = 'Samsung Internet';
        } else if (ua.indexOf('Chrome') !== -1) {
            browser = 'Chrome';
        } else if (ua.indexOf('Safari') !== -1) {
            browser = 'Safari';
        }
        
        var isMobile = /Mobi|Android|iPhone|iPad|iPod|Opera Mini|BlackBerry|IEMobile|WPDesktop/i.test(ua);
        var device = isMobile ? 'Mobile' : 'Desktop';
        
        var fonts = getInstalledFonts();
        
        var battery = 'Not available';
        try {
            if (navigator.getBattery) {
                navigator.getBattery().then(function(batt) {
                    var level = Math.round(batt.level * 100);
                    battery = level + '% ' + (batt.charging ? '⚡ Charging' : '🔋 Not charging');
                }).catch(function() {
                    battery = 'Not available';
                });
            }
        } catch (e) {
            battery = 'Not available';
        }
        
        var network = 'Not available';
        var speed = 'Not available';
        if (navigator.connection) {
            var conn = navigator.connection;
            network = conn.effectiveType || 'Unknown';
            speed = conn.downlink ? conn.downlink + ' Mbps' : 'Unknown';
        }
        
        var canvasFP = getCanvasFingerprint();
        var audioFP = getAudioFingerprint();
        var plugins = [];
        if (navigator.plugins) {
            for (var i = 0; i < navigator.plugins.length; i++) {
                plugins.push(navigator.plugins[i].name);
            }
        }
        
        var webgl = 'Not supported';
        try {
            var canvas = document.createElement('canvas');
            var gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
            if (gl) {
                webgl = gl.getParameter(gl.VERSION) || 'Supported';
            }
        } catch (e) {
            webgl = 'Not supported';
        }
        
        var platform = navigator.platform || 'Unknown';
        var timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
        var touchSupport = ('ontouchstart' in window || navigator.maxTouchPoints > 0) ? '✅ Supported' : '❌ Not supported';
        
        return {
            os: os,
            browser: browser,
            device: device,
            screen: screen.width + ' × ' + screen.height,
            colorDepth: screen.colorDepth + '-bit',
            language: navigator.language || navigator.languages[0] || 'Unknown',
            fonts: fonts,
            doNotTrack: navigator.doNotTrack || 'Not set',
            cookiesEnabled: navigator.cookieEnabled ? 'Enabled' : 'Disabled',
            hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown',
            deviceMemory: navigator.deviceMemory || 'Unknown',
            battery: battery,
            network: network,
            speed: speed,
            canvasFP: canvasFP,
            audioFP: audioFP,
            plugins: plugins,
            webgl: webgl,
            platform: platform,
            timezone: timezone,
            touchSupport: touchSupport
        };
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

    function getCanvasFingerprint() {
        try {
            var canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 50;
            var ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('SicuroPass', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('🔒', 150, 8);
            var dataUrl = canvas.toDataURL();
            return dataUrl.substring(0, 50) + '... (truncated)';
        } catch (e) {
            return 'Not available';
        }
    }

    function getAudioFingerprint() {
        try {
            var ctx = new (window.AudioContext || window.webkitAudioContext)();
            var oscillator = ctx.createOscillator();
            var analyser = ctx.createAnalyser();
            oscillator.connect(analyser);
            analyser.connect(ctx.destination);
            oscillator.frequency.value = 440;
            oscillator.type = 'sawtooth';
            oscillator.start(0);
            oscillator.stop(0.1);
            var data = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(data);
            var hash = 0;
            for (var i = 0; i < Math.min(data.length, 50); i++) {
                hash = (hash * 31 + data[i]) & 0xFFFFFFFF;
            }
            return 'Audio fingerprint: ' + hash.toString(16).padStart(8, '0') + ' (truncated)';
        } catch (e) {
            return 'Not available';
        }
    }

    function getGeoLocation() {
        return fetch('https://ip-api.com/json/').then(function(response) {
            if (!response.ok) throw new Error('API failed');
            return response.json();
        }).then(function(data) {
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
        }).catch(function(error) {
            console.log('Geolocation API failed:', error);
            return null;
        });
    }

    function displayFingerprint(browserData, geoData) {
        var html = '';
        
        html += '<div style="grid-column: 1 / -1; font-size: 12px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom: 6px;">💻 System</div>';
        
        html += '<div class="fingerprint-item"><span class="label">Operating System</span><span class="value">' + browserData.os + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Platform</span><span class="value">' + browserData.platform + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Browser</span><span class="value">' + browserData.browser + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Device Type</span><span class="value">' + browserData.device + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Screen Resolution</span><span class="value">' + browserData.screen + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Color Depth</span><span class="value">' + browserData.colorDepth + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Touch Support</span><span class="value">' + browserData.touchSupport + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Language</span><span class="value">' + browserData.language + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Time Zone</span><span class="value">' + browserData.timezone + '</span></div>';
        
        html += '<div style="grid-column: 1 / -1; font-size: 12px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 1px; margin-top: 12px; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom: 6px;">⚙️ Hardware</div>';
        
        html += '<div class="fingerprint-item"><span class="label">CPU Cores</span><span class="value">' + browserData.hardwareConcurrency + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Device Memory</span><span class="value">' + browserData.deviceMemory + ' GB</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Battery</span><span class="value">' + browserData.battery + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Network</span><span class="value">' + browserData.network + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Connection Speed</span><span class="value">' + browserData.speed + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">WebGL</span><span class="value">' + browserData.webgl + '</span></div>';
        
        html += '<div style="grid-column: 1 / -1; font-size: 12px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 1px; margin-top: 12px; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom: 6px;">🎨 Advanced Fingerprinting</div>';
        
        html += '<div class="fingerprint-item"><span class="label">Installed Fonts</span><span class="value">' + browserData.fonts + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Canvas ID</span><span class="value" style="font-size: 11px;">' + browserData.canvasFP + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Audio ID</span><span class="value" style="font-size: 11px;">' + browserData.audioFP + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Browser Plugins</span><span class="value" style="font-size: 11px;">' + (browserData.plugins.length > 0 ? browserData.plugins.join(', ') : 'None') + '</span></div>';
        
        html += '<div style="grid-column: 1 / -1; font-size: 12px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 1px; margin-top: 12px; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom: 6px;">🛡️ Privacy</div>';
        
        html += '<div class="fingerprint-item"><span class="label">Do Not Track</span><span class="value">' + browserData.doNotTrack + '</span></div>';
        html += '<div class="fingerprint-item"><span class="label">Cookies</span><span class="value">' + browserData.cookiesEnabled + '</span></div>';
        
        if (geoData) {
            html += '<div style="grid-column: 1 / -1; font-size: 12px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 1px; margin-top: 12px; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom: 6px;">🌍 Network</div>';
            
            html += '<div class="fingerprint-item"><span class="label">IP Address</span><span class="value">' + geoData.ip + '</span></div>';
            html += '<div class="fingerprint-item"><span class="label">Country</span><span class="value">' + geoData.country + '</span></div>';
            html += '<div class="fingerprint-item"><span class="label">City</span><span class="value">' + geoData.city + '</span></div>';
            html += '<div class="fingerprint-item"><span class="label">Region</span><span class="value">' + geoData.region + '</span></div>';
            html += '<div class="fingerprint-item"><span class="label">ISP</span><span class="value">' + geoData.isp + '</span></div>';
            html += '<div class="fingerprint-item"><span class="label">Time Zone (API)</span><span class="value">' + geoData.timezone + '</span></div>';
        } else {
            html += '<div class="fingerprint-item" style="grid-column: 1 / -1; justify-content: center; padding: 12px 0; border-bottom: none;"><span style="color: rgba(255,255,255,0.3); font-style: italic; text-align: center;">🌍 IP geolocation is not available in your region.</span></div>';
        }
        
        html += '<div style="grid-column: 1 / -1; margin-top: 16px; padding: 14px 16px; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.06);"><div style="font-size: 13px; color: rgba(255,255,255,0.4); text-align: center; line-height: 1.6;">🛡️ <strong>Websites CANNOT see:</strong> Your email, phone number, exact device model, or saved passwords. These are private and stored securely on your device! <span style="display: block; margin-top: 4px; font-size: 12px; color: rgba(255,255,255,0.25);">The data above is everything a website can see about you.</span></div></div>';
        
        html += '<div class="fingerprint-note">⚠️ This is what every website can see about you. Use a VPN or privacy tools to protect your data.</div>';
        
        fingerprintResult.innerHTML = html;
    }

    if (refreshFingerprint) {
        refreshFingerprint.addEventListener('click', loadFingerprint);
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
                usernameResult.innerHTML = '<span style="color:#f87171">⚠️ Please enter a username to search.</span>';
                return;
            }

            usernameBtn.disabled = true;
            usernameBtn.textContent = '⏳ Searching...';
            usernameResult.innerHTML = '<span style="color:rgba(255,255,255,0.5)">🔍 Searching ' + username + ' across platforms...</span>';

            searchUsername(username).then(function(results) {
                displayUsernameResults(results, username);
                usernameBtn.disabled = false;
                usernameBtn.textContent = '🔍 Search';
            });
        });
    }

    function searchUsername(username) {
        var results = [];

        return fetch('https://api.github.com/users/' + username).then(function(response) {
            if (response.ok) {
                results.push({ platform: 'GitHub', found: true, url: 'https://github.com/' + username });
            } else if (response.status === 404) {
                results.push({ platform: 'GitHub', found: false });
            } else {
                results.push({ platform: 'GitHub', found: false, error: 'API limit' });
            }
            return fetch('https://www.reddit.com/user/' + username + '/about.json');
        }).then(function(response) {
            if (response.ok) {
                return response.json().then(function(data) {
                    if (data.data && data.data.name) {
                        results.push({ platform: 'Reddit', found: true, url: 'https://reddit.com/user/' + username });
                    } else {
                        results.push({ platform: 'Reddit', found: false });
                    }
                });
            } else if (response.status === 404) {
                results.push({ platform: 'Reddit', found: false });
            } else {
                results.push({ platform: 'Reddit', found: false, error: 'API limit' });
            }
            return fetch('https://www.youtube.com/@' + username);
        }).then(function(response) {
            if (response.ok) {
                return response.text().then(function(html) {
                    if (html.indexOf("This channel doesn't exist") !== -1 || html.indexOf('This page is not available') !== -1) {
                        results.push({ platform: 'YouTube', found: false });
                    } else {
                        results.push({ platform: 'YouTube', found: true, url: 'https://youtube.com/@' + username });
                    }
                });
            } else {
                results.push({ platform: 'YouTube', found: false });
            }
        }).catch(function() {
            results.push({ platform: 'GitHub', found: false, error: 'Failed to fetch' });
            results.push({ platform: 'Reddit', found: false, error: 'Failed to fetch' });
            results.push({ platform: 'YouTube', found: false, error: 'Failed to fetch' });
        }).then(function() {
            results.push({ platform: 'Instagram', found: false, error: '🔒 Requires backend API' });
            results.push({ platform: 'Facebook', found: false, error: '🔒 Requires backend API' });
            return results;
        });
    }

    function displayUsernameResults(results, username) {
        var html = '<div style="margin-bottom: 12px; font-weight: 500;">Results for "<strong>' + username + '</strong>":</div>';
        var foundCount = 0;

        for (var i = 0; i < results.length; i++) {
            var result = results[i];
            if (result.found) {
                foundCount++;
                html += '<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);"><span style="color: #4ade80;">✅ ' + result.platform + '</span><span style="color: rgba(255,255,255,0.5); font-size: 13px;"><a href="' + result.url + '" target="_blank" style="color: #00f0ff; text-decoration: none;">' + result.url + '</a></span></div>';
            } else if (result.error && result.error.indexOf('Requires backend') !== -1) {
                html += '<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);"><span style="color: #fbbf24;">⚠️ ' + result.platform + '</span><span style="color: rgba(255,255,255,0.3); font-size: 12px;">' + result.error + '</span></div>';
            } else if (result.error) {
                html += '<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);"><span style="color: #fbbf24;">⚠️ ' + result.platform + '</span><span style="color: rgba(255,255,255,0.3); font-size: 13px;">' + result.error + '</span></div>';
            } else {
                html += '<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);"><span style="color: #f87171;">❌ ' + result.platform + '</span><span style="color: rgba(255,255,255,0.3); font-size: 13px;">Not found</span></div>';
            }
        }

        if (foundCount === 0) {
            html += '<div style="margin-top: 16px; padding: 12px 16px; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); text-align: center; color: rgba(255,255,255,0.4); font-size: 13px;">😕 No accounts found for "' + username + '" on supported platforms.<br><span style="font-size: 12px;">Instagram and Facebook require a backend server.</span></div>';
        } else {
            html += '<div style="margin-top: 16px; padding: 12px 16px; background: rgba(0,240,255,0.05); border-radius: 12px; border: 1px solid rgba(0,240,255,0.1); text-align: center; color: rgba(255,255,255,0.6); font-size: 13px;">✅ Found ' + foundCount + ' account' + (foundCount > 1 ? 's' : '') + ' for "' + username + '".</div>';
        }

        usernameResult.innerHTML = html;
    }

    if (usernameInput) {
        usernameInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') usernameBtn.click();
        });
    }

    // ============================================================
    // PRIVACY WARNING
    // ============================================================
    var privacyResult = document.getElementById('privacyResult');

    function loadPrivacyWarning() {
        if (!privacyResult) return;
        
        var ua = navigator.userAgent;
        var isMobile = /Mobi|Android|iPhone|iPad|iPod|Opera Mini|BlackBerry|IEMobile|WPDesktop/i.test(ua);
        var language = navigator.language || navigator.languages[0] || 'Unknown';
        var screenRes = screen.width + ' × ' + screen.height;
        var browser = getBrowserFingerprint().browser;
        var os = getBrowserFingerprint().os;
        
        var riskScore = 0;
        var risks = [];
        
        riskScore += 20;
        risks.push('Your browser sends a unique fingerprint to every website you visit');
        
        if (isMobile) {
            riskScore += 10;
            risks.push('Mobile devices share more location data than desktop computers');
        }
        
        if (language && language.indexOf('en') !== 0) {
            riskScore += 10;
            risks.push('Your language reveals your geographic region to websites');
        }
        
        if (screenRes && screenRes !== '0 × 0') {
            riskScore += 10;
            risks.push('Your screen size can be used to identify your specific device model');
        }
        
        var fonts = getInstalledFonts();
        if (fonts && fonts !== 'None detected' && fonts.split(',').length > 3) {
            riskScore += 15;
            risks.push('Your installed fonts create a unique fingerprint (like a digital DNA)');
        }
        
        if (navigator.doNotTrack !== '1') {
            riskScore += 10;
            risks.push('You have not enabled "Do Not Track" – advertisers can track you more easily');
        }
        
        if (navigator.cookieEnabled) {
            riskScore += 10;
            risks.push('Cookies are enabled – websites can store tracking data on your device');
        }
        
        riskScore = Math.min(100, riskScore);
        
        var level, color, icon;
        if (riskScore >= 80) { level = 'VERY HIGH'; color = '#f87171'; icon = '🔴'; }
        else if (riskScore >= 60) { level = 'HIGH'; color = '#fbbf24'; icon = '🟠'; }
        else if (riskScore >= 40) { level = 'MEDIUM'; color = '#fbbf24'; icon = '🟡'; }
        else { level = 'LOW'; color = '#4ade80'; icon = '🟢'; }
        
        var html = '<div style="margin-bottom: 16px;"><div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); padding: 16px 20px; border-radius: 16px; border: 1px solid ' + color + '33;"><span style="font-size: 24px; font-weight: 700;">' + icon + ' Risk Level: <span style="color: ' + color + ';">' + level + '</span></span><span style="font-size: 16px; color: rgba(255,255,255,0.4);">Score: ' + riskScore + '/100</span></div></div>';
        
        html += '<div style="margin-bottom: 16px; padding: 14px 16px; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);"><div style="font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 6px;">YOUR FINGERPRINT SUMMARY</div><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; font-size: 13px;"><span>🖥️ ' + browser + ' on ' + os + '</span><span>📱 ' + (isMobile ? 'Mobile' : 'Desktop') + '</span><span>🌐 ' + language + '</span><span>📐 ' + screenRes + '</span></div></div>';
        
        html += '<div style="margin-bottom: 12px; font-weight: 500; font-size: 14px;">🔍 What this data reveals about you:</div><ul style="list-style: none; padding: 0; margin: 0;">';
        
        for (var i = 0; i < risks.length; i++) {
            html += '<li style="padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 13px; color: rgba(255,255,255,0.7);">⚠️ ' + risks[i] + '</li>';
        }
        
        html += '</ul>';
        html += '<div style="margin-top: 16px; padding: 14px 16px; background: rgba(0,240,255,0.05); border-radius: 12px; border: 1px solid rgba(0,240,255,0.1); text-align: center; font-size: 13px; color: rgba(255,255,255,0.6);">🛡️ <strong>Protect yourself:</strong> Use a VPN, block third-party cookies, and use a privacy-focused browser.</div>';
        
        privacyResult.innerHTML = html;
    }

    console.log('✅ SicuroPass initialized successfully');
});
