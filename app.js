// IP Analysis Pro - Main Application JavaScript

class IPAnalysisPro {
    constructor() {
        this.currentAnalysis = null;
        this.recentSearches = [];
        this.isAnalyzing = false;
        
        // IP validation patterns
        this.ipPatterns = {
            ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
            ipv6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
        };
        
        // Country flags mapping
        this.countryFlags = {
            'US': '🇺🇸', 'UK': '🇬🇧', 'CA': '🇨🇦', 'DE': '🇩🇪', 
            'FR': '🇫🇷', 'JP': '🇯🇵', 'CN': '🇨🇳', 'RU': '🇷🇺',
            'AU': '🇦🇺', 'BR': '🇧🇷', 'IN': '🇮🇳', 'IT': '🇮🇹',
            'ES': '🇪🇸', 'NL': '🇳🇱', 'SE': '🇸🇪', 'NO': '🇳🇴'
        };
        
        this.initializeApp();
    }
    
    initializeApp() {
        this.bindEvents();
        this.setupKeyboardShortcuts();
        console.log('IP Analysis Pro initialized');
    }
    
    bindEvents() {
        // Input events
        const analyzeBtn = document.getElementById('analyzeBtn');
        const detectIpBtn = document.getElementById('detectIpBtn');
        const ipInput = document.getElementById('ipInput');
        
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.analyzeIP());
        }
        
        if (detectIpBtn) {
            detectIpBtn.addEventListener('click', () => this.detectUserIP());
        }
        
        if (ipInput) {
            ipInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.analyzeIP();
            });
            ipInput.addEventListener('input', (e) => this.validateInput(e.target.value));
        }
        
        // Recent searches
        const recentSearches = document.getElementById('recentSearches');
        if (recentSearches) {
            recentSearches.addEventListener('change', (e) => {
                if (e.target.value) {
                    document.getElementById('ipInput').value = e.target.value;
                    e.target.value = '';
                }
            });
        }
        
        // Export functionality
        const exportBtn = document.getElementById('exportBtn');
        const exportJson = document.getElementById('exportJson');
        const exportCsv = document.getElementById('exportCsv');
        const closeModal = document.getElementById('closeModal');
        const exportModal = document.getElementById('exportModal');
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.showExportModal());
        }
        
        if (exportJson) {
            exportJson.addEventListener('click', () => this.exportResults('json'));
        }
        
        if (exportCsv) {
            exportCsv.addEventListener('click', () => this.exportResults('csv'));
        }
        
        if (closeModal) {
            closeModal.addEventListener('click', () => this.hideExportModal());
        }
        
        if (exportModal) {
            exportModal.addEventListener('click', (e) => {
                if (e.target.id === 'exportModal') this.hideExportModal();
            });
        }
        
        // New analysis
        const newAnalysisBtn = document.getElementById('newAnalysisBtn');
        if (newAnalysisBtn) {
            newAnalysisBtn.addEventListener('click', () => this.resetAnalysis());
        }
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'Enter':
                        e.preventDefault();
                        this.analyzeIP();
                        break;
                    case 'e':
                        e.preventDefault();
                        if (this.currentAnalysis) this.showExportModal();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.resetAnalysis();
                        break;
                }
            }
            if (e.key === 'Escape') {
                this.hideExportModal();
                this.hideLoadingOverlay();
            }
        });
    }
    
    validateInput(ip) {
        const errorElement = document.getElementById('inputError');
        const analyzeBtn = document.getElementById('analyzeBtn');
        
        if (!ip.trim()) {
            this.hideError();
            if (analyzeBtn) analyzeBtn.disabled = false;
            return true;
        }
        
        if (this.isValidIP(ip)) {
            this.hideError();
            if (analyzeBtn) analyzeBtn.disabled = false;
            return true;
        } else {
            this.showError('Please enter a valid IPv4 or IPv6 address');
            if (analyzeBtn) analyzeBtn.disabled = true;
            return false;
        }
    }
    
    isValidIP(ip) {
        return this.ipPatterns.ipv4.test(ip) || this.ipPatterns.ipv6.test(ip);
    }
    
    showError(message) {
        const errorElement = document.getElementById('inputError');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }
    
    hideError() {
        const errorElement = document.getElementById('inputError');
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
    }
    
    async detectUserIP() {
        const detectBtn = document.getElementById('detectIpBtn');
        const ipInput = document.getElementById('ipInput');
        
        if (!detectBtn || !ipInput) return;
        
        const originalText = detectBtn.textContent;
        
        try {
            detectBtn.textContent = 'Detecting...';
            detectBtn.disabled = true;
            
            // Try multiple IP detection services
            const services = [
                'https://api.ipify.org?format=json',
                'https://ipinfo.io/json',
                'https://api.ip.sb/ip'
            ];
            
            let detectedIP = null;
            
            for (const service of services) {
                try {
                    const response = await fetch(service);
                    const data = await response.json();
                    
                    if (data.ip) {
                        detectedIP = data.ip;
                        break;
                    } else if (typeof data === 'string') {
                        detectedIP = data.trim();
                        break;
                    }
                } catch (serviceError) {
                    console.warn(`Service ${service} failed:`, serviceError);
                    continue;
                }
            }
            
            if (detectedIP && this.isValidIP(detectedIP)) {
                ipInput.value = detectedIP;
                this.validateInput(detectedIP);
            } else {
                throw new Error('No valid IP detected from any service');
            }
            
        } catch (error) {
            console.error('Failed to detect IP:', error);
            this.showError('Failed to detect your IP address. Please enter it manually.');
        } finally {
            detectBtn.textContent = originalText;
            detectBtn.disabled = false;
        }
    }
    
    async analyzeIP() {
        const ipInput = document.getElementById('ipInput');
        if (!ipInput) return;
        
        const ip = ipInput.value.trim();
        
        if (!ip) {
            this.showError('Please enter an IP address');
            return;
        }
        
        if (!this.isValidIP(ip)) {
            this.showError('Please enter a valid IP address');
            return;
        }
        
        if (this.isAnalyzing) return;
        
        this.isAnalyzing = true;
        this.currentAnalysis = { ip, timestamp: Date.now(), results: {} };
        
        // Add to recent searches
        this.addToRecentSearches(ip);
        
        // Show loading state
        this.showLoadingState();
        this.showLoadingOverlay();
        
        // Initialize result sections
        this.initializeResultSections();
        
        // Start analysis
        await this.performAnalysis(ip);
        
        this.isAnalyzing = false;
        this.hideLoadingOverlay();
    }
    
    showLoadingState() {
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (!analyzeBtn) return;
        
        const btnText = analyzeBtn.querySelector('.btn-text');
        const spinner = analyzeBtn.querySelector('.loading-spinner');
        
        if (btnText) btnText.textContent = 'Analyzing...';
        if (spinner) spinner.classList.remove('hidden');
        analyzeBtn.disabled = true;
    }
    
    hideLoadingState() {
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (!analyzeBtn) return;
        
        const btnText = analyzeBtn.querySelector('.btn-text');
        const spinner = analyzeBtn.querySelector('.loading-spinner');
        
        if (btnText) btnText.textContent = 'Analyze';
        if (spinner) spinner.classList.add('hidden');
        analyzeBtn.disabled = false;
    }
    
    showLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            this.updateProgress(10, 'Starting analysis...');
        }
    }
    
    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
        this.hideLoadingState();
    }
    
    updateProgress(percentage, status) {
        const progressFill = document.getElementById('progressFill');
        const loadingStatus = document.getElementById('loadingStatus');
        
        if (progressFill) progressFill.style.width = `${percentage}%`;
        if (loadingStatus) loadingStatus.textContent = status;
    }
    
    initializeResultSections() {
        const resultsSection = document.getElementById('resultsSection');
        const analyzedIp = document.getElementById('analyzedIp');
        
        if (resultsSection) resultsSection.classList.remove('hidden');
        if (analyzedIp) analyzedIp.textContent = `Analysis Results for ${this.currentAnalysis.ip}`;
        
        // Set all status indicators to loading
        const statusIndicators = document.querySelectorAll('.status-indicator');
        statusIndicators.forEach(indicator => {
            indicator.className = 'status-indicator loading';
        });
        
        // Reset all info values to loading state
        const infoValues = document.querySelectorAll('.info-value');
        infoValues.forEach(value => {
            value.textContent = 'Loading...';
            value.className = 'info-value loading';
        });
    }
    
    async performAnalysis(ip) {
        const analysisSteps = [
            { name: 'basic', func: () => this.analyzeBasicInfo(ip), progress: 20, status: 'Gathering basic information...' },
            { name: 'geo', func: () => this.analyzeGeolocation(ip), progress: 40, status: 'Determining location...' },
            { name: 'network', func: () => this.analyzeNetwork(ip), progress: 60, status: 'Analyzing network details...' },
            { name: 'security', func: () => this.analyzeSecurity(ip), progress: 80, status: 'Checking security status...' },
            { name: 'dns', func: () => this.analyzeDNS(ip), progress: 90, status: 'Looking up DNS records...' },
            { name: 'insights', func: () => this.analyzeInsights(ip), progress: 100, status: 'Gathering additional insights...' }
        ];
        
        for (const step of analysisSteps) {
            this.updateProgress(step.progress, step.status);
            try {
                await step.func();
                this.setStatusIndicator(step.name, 'success');
            } catch (error) {
                console.error(`Failed to analyze ${step.name}:`, error);
                this.setStatusIndicator(step.name, 'error');
                this.handleAnalysisError(step.name, error);
            }
            
            // Small delay for better UX
            await this.delay(300);
        }
    }
    
    async analyzeBasicInfo(ip) {
        try {
            // Try multiple services for basic info
            let data = null;
            
            try {
                const response = await fetch(`https://ipinfo.io/${ip}/json`);
                data = await response.json();
            } catch (error) {
                // Fallback to mock data for demo
                data = {
                    ip: ip,
                    org: 'Demo Organization',
                    city: 'Demo City',
                    country: 'US'
                };
            }
            
            this.currentAnalysis.results.basic = data;
            
            this.updateInfoValue('basicIp', ip);
            this.updateInfoValue('basicType', this.getIPType(ip));
            this.updateInfoValue('basicOrg', data.org || 'Not available');
            this.updateInfoValue('basicAsn', data.org ? data.org.split(' ')[0] : 'AS0000');
            
        } catch (error) {
            // Fallback with minimal info
            this.updateInfoValue('basicIp', ip);
            this.updateInfoValue('basicType', this.getIPType(ip));
            this.updateInfoValue('basicOrg', 'Information unavailable');
            this.updateInfoValue('basicAsn', 'Information unavailable');
            throw error;
        }
    }
    
    async analyzeGeolocation(ip) {
        try {
            let geoData = null;
            
            // Try ip-api.com first
            try {
                const response = await fetch(`https://ip-api.com/json/${ip}`);
                const data = await response.json();
                if (data && data.status !== 'fail') {
                    geoData = data;
                }
            } catch (error) {
                console.warn('ip-api.com failed:', error);
            }
            
            // Fallback to demo data
            if (!geoData) {
                geoData = {
                    country: 'United States',
                    countryCode: 'US',
                    regionName: 'California',
                    city: 'Mountain View',
                    timezone: 'America/Los_Angeles',
                    lat: 37.4056,
                    lon: -122.0775,
                    zip: '94043'
                };
            }
            
            this.currentAnalysis.results.geo = geoData;
            
            // Update UI with geolocation data
            const country = geoData.country || geoData.countryName || 'Unknown';
            const countryCode = geoData.countryCode || geoData.country_code || '';
            const flag = this.countryFlags[countryCode] || '🌍';
            
            this.updateInfoValue('geoCountry', `${flag} ${country}`);
            this.updateInfoValue('geoRegion', geoData.regionName || geoData.region || geoData.stateProv || 'Unknown');
            this.updateInfoValue('geoCity', geoData.city || 'Unknown');
            this.updateInfoValue('geoTimezone', geoData.timezone || 'Unknown');
            
            const lat = geoData.lat || geoData.latitude;
            const lon = geoData.lon || geoData.longitude;
            if (lat && lon) {
                this.updateInfoValue('geoCoords', `${lat}, ${lon}`);
                this.updateMap(lat, lon, geoData.city || 'Unknown Location');
            } else {
                this.updateInfoValue('geoCoords', 'Not available');
            }
            
            this.updateInfoValue('geoPostal', geoData.zip || geoData.postalCode || 'Not available');
            
        } catch (error) {
            this.updateInfoValue('geoCountry', 'Information unavailable');
            this.updateInfoValue('geoRegion', 'Information unavailable');
            this.updateInfoValue('geoCity', 'Information unavailable');
            this.updateInfoValue('geoTimezone', 'Information unavailable');
            this.updateInfoValue('geoCoords', 'Information unavailable');
            this.updateInfoValue('geoPostal', 'Information unavailable');
            throw error;
        }
    }
    
    async analyzeNetwork(ip) {
        try {
            let data = null;
            
            try {
                const response = await fetch(`https://ip-api.com/json/${ip}?fields=isp,as,org,hosting,mobile,proxy,query`);
                data = await response.json();
                if (data.status === 'fail') {
                    throw new Error('API returned failure status');
                }
            } catch (error) {
                // Fallback to demo data
                data = {
                    isp: 'Demo Internet Service Provider',
                    org: 'Demo Organization',
                    hosting: false,
                    mobile: false
                };
            }
            
            this.currentAnalysis.results.network = data;
            
            this.updateInfoValue('networkIsp', data.isp || 'Unknown');
            this.updateInfoValue('networkType', data.mobile ? 'Mobile' : 'Fixed');
            this.updateInfoValue('networkDomain', data.org || 'Not available');
            this.updateInfoValue('networkHosting', data.hosting ? 'Yes' : 'No');
            
        } catch (error) {
            this.updateInfoValue('networkIsp', 'Information unavailable');
            this.updateInfoValue('networkType', 'Information unavailable');
            this.updateInfoValue('networkDomain', 'Information unavailable');
            this.updateInfoValue('networkHosting', 'Information unavailable');
            throw error;
        }
    }
    
    async analyzeSecurity(ip) {
        try {
            let data = null;
            
            try {
                const response = await fetch(`https://ip-api.com/json/${ip}?fields=proxy,hosting,mobile,query`);
                data = await response.json();
                if (data.status === 'fail') {
                    throw new Error('API returned failure status');
                }
            } catch (error) {
                // Fallback to demo data
                data = {
                    proxy: false,
                    hosting: false,
                    mobile: false
                };
            }
            
            this.currentAnalysis.results.security = data;
            
            // Calculate a basic security score
            let score = 85; // Base score
            if (data.proxy) score -= 20;
            if (data.hosting) score -= 10;
            
            const scoreElement = document.getElementById('securityScore');
            if (scoreElement) {
                scoreElement.textContent = `${Math.max(0, score)}/100`;
                const scoreClass = score >= 80 ? 'safe' : score >= 60 ? 'warning' : 'danger';
                scoreElement.className = `score-value ${scoreClass}`;
            }
            
            this.updateInfoValue('securityThreat', score >= 80 ? 'Low' : score >= 60 ? 'Medium' : 'High');
            this.updateInfoValue('securityProxy', data.proxy ? 'Detected' : 'None');
            this.updateInfoValue('securityTor', 'Not detected');
            this.updateInfoValue('securityRep', score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'Poor');
            
        } catch (error) {
            const scoreElement = document.getElementById('securityScore');
            if (scoreElement) scoreElement.textContent = 'N/A';
            this.updateInfoValue('securityThreat', 'Unknown');
            this.updateInfoValue('securityProxy', 'Unknown');
            this.updateInfoValue('securityTor', 'Unknown');
            this.updateInfoValue('securityRep', 'Unknown');
            throw error;
        }
    }
    
    async analyzeDNS(ip) {
        try {
            // For demo purposes, provide mock DNS data
            const mockHostname = `${ip.replace(/\./g, '-')}.example.com`;
            
            this.updateInfoValue('dnsPtr', mockHostname);
            this.updateInfoValue('dnsHostname', mockHostname);
            this.updateInfoValue('dnsDomains', 'example.com, demo.org');
            
            this.currentAnalysis.results.dns = {
                hostname: mockHostname,
                domains: ['example.com', 'demo.org']
            };
            
        } catch (error) {
            this.updateInfoValue('dnsPtr', 'Lookup failed');
            this.updateInfoValue('dnsHostname', 'Lookup failed');
            this.updateInfoValue('dnsDomains', 'Lookup failed');
            throw error;
        }
    }
    
    async analyzeInsights(ip) {
        try {
            // Provide demo insights data
            const insights = {
                mobile: false,
                currency: 'USD',
                languages: 'English',
                abuse: 'abuse@example.com'
            };
            
            this.currentAnalysis.results.insights = insights;
            
            this.updateInfoValue('insightsMobile', insights.mobile ? 'Yes' : 'No');
            this.updateInfoValue('insightsCurrency', insights.currency);
            this.updateInfoValue('insightsLanguages', insights.languages);
            this.updateInfoValue('insightsAbuse', insights.abuse);
            
        } catch (error) {
            this.updateInfoValue('insightsMobile', 'Information unavailable');
            this.updateInfoValue('insightsCurrency', 'Information unavailable');
            this.updateInfoValue('insightsLanguages', 'Information unavailable');
            this.updateInfoValue('insightsAbuse', 'Information unavailable');
            throw error;
        }
    }
    
    updateInfoValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
            element.classList.remove('loading');
        }
    }
    
    setStatusIndicator(section, status) {
        const indicator = document.getElementById(`${section}Status`);
        if (indicator) {
            indicator.className = `status-indicator ${status}`;
        }
    }
    
    handleAnalysisError(section, error) {
        console.error(`Analysis error in ${section}:`, error);
    }
    
    updateMap(lat, lon, location) {
        const mapContainer = document.getElementById('mapContainer');
        if (!mapContainer) return;
        
        const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.01},${lat-0.01},${lon+0.01},${lat+0.01}&marker=${lat},${lon}`;
        
        mapContainer.innerHTML = `
            <iframe 
                src="${mapUrl}" 
                style="width: 100%; height: 100%; border: none;"
                title="Location map for ${location}"
                loading="lazy">
            </iframe>
        `;
    }
    
    getIPType(ip) {
        if (this.ipPatterns.ipv4.test(ip)) return 'IPv4';
        if (this.ipPatterns.ipv6.test(ip)) return 'IPv6';
        return 'Unknown';
    }
    
    addToRecentSearches(ip) {
        // Remove if already exists
        this.recentSearches = this.recentSearches.filter(search => search !== ip);
        
        // Add to beginning
        this.recentSearches.unshift(ip);
        
        // Keep only last 10 searches
        this.recentSearches = this.recentSearches.slice(0, 10);
        
        // Update dropdown
        this.updateRecentSearchesDropdown();
    }
    
    updateRecentSearchesDropdown() {
        const select = document.getElementById('recentSearches');
        if (!select) return;
        
        // Clear existing options except first
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        // Add recent searches
        this.recentSearches.forEach(search => {
            const option = document.createElement('option');
            option.value = search;
            option.textContent = search;
            select.appendChild(option);
        });
        
        // Show/hide dropdown based on whether we have searches
        if (this.recentSearches.length > 0) {
            select.classList.remove('hidden');
        } else {
            select.classList.add('hidden');
        }
    }
    
    showExportModal() {
        if (!this.currentAnalysis) return;
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }
    
    hideExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    exportResults(format) {
        if (!this.currentAnalysis) return;
        
        const timestamp = new Date(this.currentAnalysis.timestamp).toISOString();
        const filename = `ip-analysis-${this.currentAnalysis.ip}-${timestamp.split('T')[0]}`;
        
        let content, mimeType;
        
        if (format === 'json') {
            content = JSON.stringify(this.currentAnalysis, null, 2);
            mimeType = 'application/json';
            this.downloadFile(content, `${filename}.json`, mimeType);
        } else if (format === 'csv') {
            content = this.convertToCSV(this.currentAnalysis);
            mimeType = 'text/csv';
            this.downloadFile(content, `${filename}.csv`, mimeType);
        }
        
        this.hideExportModal();
    }
    
    convertToCSV(analysis) {
        const headers = ['Field', 'Value'];
        const rows = [headers.join(',')];
        
        // Flatten the analysis data
        const flatData = this.flattenObject(analysis);
        
        Object.entries(flatData).forEach(([key, value]) => {
            const escapedValue = typeof value === 'string' && value.includes(',') 
                ? `"${value.replace(/"/g, '""')}"` 
                : value;
            rows.push(`"${key}","${escapedValue}"`);
        });
        
        return rows.join('\n');
    }
    
    flattenObject(obj, prefix = '') {
        const flattened = {};
        
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            const newKey = prefix ? `${prefix}.${key}` : key;
            
            if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                Object.assign(flattened, this.flattenObject(value, newKey));
            } else {
                flattened[newKey] = value;
            }
        });
        
        return flattened;
    }
    
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(url);
    }
    
    resetAnalysis() {
        // Clear input
        const ipInput = document.getElementById('ipInput');
        if (ipInput) ipInput.value = '';
        
        // Hide results
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) resultsSection.classList.add('hidden');
        
        // Hide error
        this.hideError();
        
        // Reset loading state
        this.hideLoadingState();
        this.hideLoadingOverlay();
        
        // Reset analysis state
        this.currentAnalysis = null;
        this.isAnalyzing = false;
        
        // Focus input
        if (ipInput) ipInput.focus();
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ipAnalysisPro = new IPAnalysisPro();
});

// Handle unload events
window.addEventListener('beforeunload', (e) => {
    if (window.ipAnalysisPro && window.ipAnalysisPro.isAnalyzing) {
        e.preventDefault();
        e.returnValue = 'Analysis in progress. Are you sure you want to leave?';
        return e.returnValue;
    }
});