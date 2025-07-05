class ProfessionalStopwatch {
    constructor() {
        // Core timing properties
        this.time = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.startTime = 0;
        this.pausedTime = 0;
        this.intervalId = null;
        
        // Records and timing data
        this.lapTimes = [];
        this.splitTimes = [];
        this.sessionStartTime = Date.now();
        this.totalSessionTime = 0;
        
        // Settings
        this.settings = {
            precision: 'centiseconds', // 'centiseconds' or 'milliseconds'
            soundEnabled: true,
            autoLapInterval: 0, // 0 = disabled
            confirmReset: true,
            theme: 'light'
        };
        
        // Auto-lap timer
        this.autoLapTimer = null;
        this.lastAutoLapTime = 0;
        
        // Performance tracking
        this.performanceMetrics = {
            bestLap: null,
            worstLap: null,
            averageLap: 0,
            consistency: 0
        };
        
        this.initializeElements();
        this.loadSettings();
        this.bindEvents();
        this.updateDisplay();
        this.updateAnalytics();
        
        // Initialize theme
        this.applyTheme();
        
        console.log('ProTimer initialized successfully');
    }
    
    initializeElements() {
        // Main display elements
        this.timeDisplay = document.getElementById('timeDisplay');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        this.elapsedTime = document.getElementById('elapsedTime');
        this.precisionValue = document.getElementById('precisionValue');
        
        // Control buttons
        this.startStopBtn = document.getElementById('startStopBtn');
        this.lapBtn = document.getElementById('lapBtn');
        this.splitBtn = document.getElementById('splitBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        // Analytics elements
        this.totalLaps = document.getElementById('totalLaps');
        this.avgLapTime = document.getElementById('avgLapTime');
        this.sessionTime = document.getElementById('sessionTime');
        this.bestLapStat = document.getElementById('bestLapStat');
        this.worstLapStat = document.getElementById('worstLapStat');
        this.consistencyScore = document.getElementById('consistencyScore');
        
        // Records section
        this.recordsSection = document.getElementById('recordsSection');
        this.recordsCount = document.getElementById('recordsCount');
        this.recordsList = document.getElementById('recordsList');
        this.sortBy = document.getElementById('sortBy');
        this.filterType = document.getElementById('filterType');
        
        // Header controls
        this.themeToggle = document.getElementById('themeToggle');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        
        // Settings modal
        this.settingsModal = document.getElementById('settingsModal');
        this.closeSettings = document.getElementById('closeSettings');
        this.precisionSetting = document.getElementById('precisionSetting');
        this.soundEnabled = document.getElementById('soundEnabled');
        this.autoLap = document.getElementById('autoLap');
        this.confirmReset = document.getElementById('confirmReset');
    }
    
    bindEvents() {
        // Control button events
        this.startStopBtn.addEventListener('click', () => this.handleStartStop());
        this.lapBtn.addEventListener('click', () => this.handleLap());
        this.splitBtn.addEventListener('click', () => this.handleSplit());
        this.resetBtn.addEventListener('click', () => this.handleReset());
        
        // Header control events
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.exportBtn.addEventListener('click', () => this.exportData());
        this.clearAllBtn.addEventListener('click', () => this.clearAllRecords());
        
        // Settings modal events
        this.closeSettings.addEventListener('click', () => this.closeSettingsModal());
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) this.closeSettingsModal();
        });
        
        // Settings change events
        this.precisionSetting.addEventListener('change', () => this.updatePrecisionSetting());
        this.soundEnabled.addEventListener('change', () => this.updateSoundSetting());
        this.autoLap.addEventListener('change', () => this.updateAutoLapSetting());
        this.confirmReset.addEventListener('change', () => this.updateConfirmResetSetting());
        
        // Records filter events
        this.sortBy.addEventListener('change', () => this.updateRecordsDisplay());
        this.filterType.addEventListener('change', () => this.updateRecordsDisplay());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => this.handleKeyboardShortcuts(event));
        
        // Prevent context menu on long press (mobile)
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Session time tracking
        setInterval(() => this.updateSessionTime(), 1000);
    }
    
    handleKeyboardShortcuts(event) {
        // Prevent shortcuts when typing in inputs
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') {
            return;
        }
        
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.handleStartStop();
                break;
            case 'KeyL':
                if (this.isRunning) {
                    event.preventDefault();
                    this.handleLap();
                }
                break;
            case 'KeyS':
                if (this.isRunning) {
                    event.preventDefault();
                    this.handleSplit();
                }
                break;
            case 'KeyR':
                if (!event.ctrlKey && !event.metaKey) {
                    event.preventDefault();
                    this.handleReset();
                }
                break;
            case 'F11':
                event.preventDefault();
                this.toggleFullscreen();
                break;
            case 'Escape':
                if (this.settingsModal.classList.contains('active')) {
                    this.closeSettingsModal();
                }
                break;
        }
    }
    
    formatTime(milliseconds, precision = null) {
        const usePrecision = precision || this.settings.precision;
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        if (usePrecision === 'milliseconds') {
            const ms = Math.floor(milliseconds % 1000);
            return `${minutes.toString().padStart(2, '0')}:${seconds
                .toString()
                .padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
        } else {
            const cs = Math.floor((milliseconds % 1000) / 10);
            return `${minutes.toString().padStart(2, '0')}:${seconds
                .toString()
                .padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
        }
    }
    
    updateDisplay() {
        this.timeDisplay.textContent = this.formatTime(this.time);
        this.elapsedTime.textContent = `Total: ${this.formatTime(this.time)}`;
        
        // Update precision indicator
        const precisionText = this.settings.precision === 'milliseconds' ? '±0.001s' : '±0.01s';
        this.precisionValue.textContent = precisionText;
        
        // Update status
        this.updateStatus();
    }
    
    updateStatus() {
        this.statusIndicator.className = 'status-indicator';
        
        if (this.isRunning) {
            this.statusIndicator.classList.add('running');
            this.statusText.textContent = 'Running';
            this.timeDisplay.classList.add('running');
            this.timeDisplay.classList.remove('paused');
        } else if (this.isPaused) {
            this.statusIndicator.classList.add('paused');
            this.statusText.textContent = 'Paused';
            this.timeDisplay.classList.add('paused');
            this.timeDisplay.classList.remove('running');
        } else {
            this.statusIndicator.classList.add('stopped');
            this.statusText.textContent = this.time > 0 ? 'Stopped' : 'Ready';
            this.timeDisplay.classList.remove('running', 'paused');
        }
    }
    
    updateButtons() {
        const btnContent = this.startStopBtn.querySelector('.btn-content');
        const btnIcon = btnContent.querySelector('.btn-icon');
        const btnText = btnContent.querySelector('.btn-text');
        
        if (this.isRunning) {
            btnIcon.innerHTML = `
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
            `;
            btnText.textContent = 'Pause';
            this.startStopBtn.classList.add('pause-btn');
            this.lapBtn.disabled = false;
            this.splitBtn.disabled = false;
        } else {
            btnIcon.innerHTML = `<polygon points="5,3 19,12 5,21"/>`;
            btnText.textContent = this.time > 0 ? 'Resume' : 'Start';
            this.startStopBtn.classList.remove('pause-btn');
            this.lapBtn.disabled = true;
            this.splitBtn.disabled = true;
        }
    }
    
    handleStartStop() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
        this.playSound('click');
    }
    
    start() {
        this.isRunning = true;
        this.isPaused = false;
        this.startTime = Date.now() - this.time;
        
        // Start the high-precision timer
        this.intervalId = setInterval(() => {
            this.time = Date.now() - this.startTime;
            this.updateDisplay();
            this.checkAutoLap();
        }, this.settings.precision === 'milliseconds' ? 1 : 10);
        
        this.updateButtons();
        this.updateStatus();
        
        console.log('Stopwatch started');
    }
    
    pause() {
        this.isRunning = false;
        this.isPaused = true;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.updateButtons();
        this.updateStatus();
        
        console.log('Stopwatch paused');
    }
    
    handleReset() {
        if (this.settings.confirmReset && (this.time > 0 || this.lapTimes.length > 0)) {
            if (!confirm('Are you sure you want to reset the stopwatch? All current timing data will be lost.')) {
                return;
            }
        }
        
        this.reset();
        this.playSound('reset');
    }
    
    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.time = 0;
        this.startTime = 0;
        this.pausedTime = 0;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        if (this.autoLapTimer) {
            clearInterval(this.autoLapTimer);
            this.autoLapTimer = null;
        }
        
        // Clear current session data
        this.lapTimes = [];
        this.splitTimes = [];
        this.lastAutoLapTime = 0;
        
        this.updateDisplay();
        this.updateButtons();
        this.updateAnalytics();
        this.updateRecordsDisplay();
        
        console.log('Stopwatch reset');
    }
    
    handleLap() {
        if (!this.isRunning) return;
        
        const currentTime = this.time;
        const lapTime = this.lapTimes.length > 0 
            ? currentTime - this.lapTimes[this.lapTimes.length - 1].totalTime 
            : currentTime;
        
        const lap = {
            id: this.lapTimes.length + 1,
            lapTime: lapTime,
            totalTime: currentTime,
            timestamp: new Date(),
            type: 'lap'
        };
        
        this.lapTimes.push(lap);
        this.updateAnalytics();
        this.updateRecordsDisplay();
        this.showRecordsSection();
        this.playSound('lap');
        
        console.log(`Lap ${lap.id}: ${this.formatTime(lapTime)}`);
    }
    
    handleSplit() {
        if (!this.isRunning) return;
        
        const split = {
            id: this.splitTimes.length + 1,
            time: this.time,
            timestamp: new Date(),
            type: 'split'
        };
        
        this.splitTimes.push(split);
        this.updateRecordsDisplay();
        this.showRecordsSection();
        this.playSound('split');
        
        console.log(`Split ${split.id}: ${this.formatTime(split.time)}`);
    }
    
    checkAutoLap() {
        if (this.settings.autoLapInterval > 0) {
            const intervalMs = this.settings.autoLapInterval * 1000;
            const currentInterval = Math.floor(this.time / intervalMs);
            const lastInterval = Math.floor(this.lastAutoLapTime / intervalMs);
            
            if (currentInterval > lastInterval) {
                this.handleLap();
                this.lastAutoLapTime = this.time;
            }
        }
    }
    
    updateAnalytics() {
        // Update basic stats
        this.totalLaps.textContent = this.lapTimes.length;
        
        if (this.lapTimes.length > 0) {
            // Calculate average lap time
            const totalLapTime = this.lapTimes.reduce((sum, lap) => sum + lap.lapTime, 0);
            const avgTime = totalLapTime / this.lapTimes.length;
            this.avgLapTime.textContent = this.formatTime(avgTime);
            
            // Find best and worst laps
            const bestLap = this.lapTimes.reduce((best, current) => 
                current.lapTime < best.lapTime ? current : best
            );
            const worstLap = this.lapTimes.reduce((worst, current) => 
                current.lapTime > worst.lapTime ? current : worst
            );
            
            this.bestLapStat.textContent = this.formatTime(bestLap.lapTime);
            this.worstLapStat.textContent = this.formatTime(worstLap.lapTime);
            
            // Calculate consistency score
            if (this.lapTimes.length > 1) {
                const variance = this.lapTimes.reduce((sum, lap) => {
                    const diff = lap.lapTime - avgTime;
                    return sum + (diff * diff);
                }, 0) / this.lapTimes.length;
                
                const standardDeviation = Math.sqrt(variance);
                const consistencyScore = Math.max(0, 100 - (standardDeviation / avgTime * 100));
                this.consistencyScore.textContent = `${Math.round(consistencyScore)}%`;
            } else {
                this.consistencyScore.textContent = '100%';
            }
            
            // Update performance metrics
            this.performanceMetrics = {
                bestLap: bestLap,
                worstLap: worstLap,
                averageLap: avgTime,
                consistency: this.consistencyScore.textContent
            };
        } else {
            this.avgLapTime.textContent = '--:--';
            this.bestLapStat.textContent = '--:--';
            this.worstLapStat.textContent = '--:--';
            this.consistencyScore.textContent = '--%';
        }
    }
    
    updateSessionTime() {
        const sessionDuration = Date.now() - this.sessionStartTime;
        const sessionMinutes = Math.floor(sessionDuration / 60000);
        const sessionSeconds = Math.floor((sessionDuration % 60000) / 1000);
        this.sessionTime.textContent = `${sessionMinutes}:${sessionSeconds.toString().padStart(2, '0')}`;
    }
    
    showRecordsSection() {
        this.recordsSection.style.display = 'block';
    }
    
    updateRecordsDisplay() {
        const allRecords = [...this.lapTimes, ...this.splitTimes];
        const filteredRecords = this.filterRecords(allRecords);
        const sortedRecords = this.sortRecords(filteredRecords);
        
        this.recordsCount.textContent = `${allRecords.length} record${allRecords.length !== 1 ? 's' : ''}`;
        
        this.recordsList.innerHTML = '';
        
        if (sortedRecords.length === 0) {
            this.recordsList.innerHTML = '<div class="no-records">No records to display</div>';
            return;
        }
        
        const bestLap = this.performanceMetrics.bestLap;
        const worstLap = this.performanceMetrics.worstLap;
        
        sortedRecords.forEach(record => {
            const recordItem = document.createElement('div');
            recordItem.className = 'record-item';
            
            // Add special classes for best/worst laps
            if (record.type === 'lap') {
                if (bestLap && record.id === bestLap.id) {
                    recordItem.classList.add('best');
                } else if (worstLap && record.id === worstLap.id && this.lapTimes.length > 1) {
                    recordItem.classList.add('worst');
                }
            }
            
            const displayTime = record.type === 'lap' ? record.lapTime : record.time;
            const timeLabel = record.type === 'lap' ? 'Lap Time' : 'Split Time';
            
            recordItem.innerHTML = `
                <div class="record-info">
                    <div class="record-number">${record.id}</div>
                    <div class="record-details">
                        <div class="record-time">${this.formatTime(displayTime)}</div>
                        <div class="record-type">${timeLabel}</div>
                    </div>
                </div>
                <div class="record-meta">
                    ${record.type === 'lap' && bestLap && record.id === bestLap.id ? 
                        '<div class="record-badge best">BEST</div>' : ''}
                    ${record.type === 'lap' && worstLap && record.id === worstLap.id && this.lapTimes.length > 1 ? 
                        '<div class="record-badge worst">SLOWEST</div>' : ''}
                    <div class="record-timestamp">${record.timestamp.toLocaleTimeString()}</div>
                </div>
            `;
            
            this.recordsList.appendChild(recordItem);
        });
    }
    
    filterRecords(records) {
        const filterType = this.filterType.value;
        
        switch (filterType) {
            case 'laps':
                return records.filter(record => record.type === 'lap');
            case 'splits':
                return records.filter(record => record.type === 'split');
            default:
                return records;
        }
    }
    
    sortRecords(records) {
        const sortBy = this.sortBy.value;
        
        return [...records].sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return b.timestamp - a.timestamp;
                case 'oldest':
                    return a.timestamp - b.timestamp;
                case 'fastest':
                    const timeA = a.type === 'lap' ? a.lapTime : a.time;
                    const timeB = b.type === 'lap' ? b.lapTime : b.time;
                    return timeA - timeB;
                case 'slowest':
                    const timeA2 = a.type === 'lap' ? a.lapTime : a.time;
                    const timeB2 = b.type === 'lap' ? b.lapTime : b.time;
                    return timeB2 - timeA2;
                default:
                    return 0;
            }
        });
    }
    
    // Settings Management
    loadSettings() {
        const savedSettings = localStorage.getItem('protimer-settings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
        this.applySettings();
    }
    
    saveSettings() {
        localStorage.setItem('protimer-settings', JSON.stringify(this.settings));
    }
    
    applySettings() {
        this.precisionSetting.value = this.settings.precision;
        this.soundEnabled.checked = this.settings.soundEnabled;
        this.autoLap.value = this.settings.autoLapInterval;
        this.confirmReset.checked = this.settings.confirmReset;
    }
    
    updatePrecisionSetting() {
        this.settings.precision = this.precisionSetting.value;
        this.saveSettings();
        this.updateDisplay();
    }
    
    updateSoundSetting() {
        this.settings.soundEnabled = this.soundEnabled.checked;
        this.saveSettings();
    }
    
    updateAutoLapSetting() {
        this.settings.autoLapInterval = parseInt(this.autoLap.value) || 0;
        this.saveSettings();
    }
    
    updateConfirmResetSetting() {
        this.settings.confirmReset = this.confirmReset.checked;
        this.saveSettings();
    }
    
    // Theme Management
    toggleTheme() {
        this.settings.theme = this.settings.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.saveSettings();
    }
    
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.settings.theme);
    }
    
    // Modal Management
    openSettings() {
        this.settingsModal.classList.add('active');
    }
    
    closeSettingsModal() {
        this.settingsModal.classList.remove('active');
    }
    
    // Fullscreen Management
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
            document.body.classList.add('fullscreen');
        } else {
            document.exitFullscreen();
            document.body.classList.remove('fullscreen');
        }
    }
    
    // Data Management
    exportData() {
        const data = {
            session: {
                startTime: this.sessionStartTime,
                totalTime: this.time,
                lapTimes: this.lapTimes,
                splitTimes: this.splitTimes,
                performanceMetrics: this.performanceMetrics
            },
            settings: this.settings,
            exportTime: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `protimer-session-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.playSound('export');
        console.log('Data exported successfully');
    }
    
    clearAllRecords() {
        if (this.lapTimes.length === 0 && this.splitTimes.length === 0) {
            return;
        }
        
        if (confirm('Are you sure you want to clear all records? This action cannot be undone.')) {
            this.lapTimes = [];
            this.splitTimes = [];
            this.updateAnalytics();
            this.updateRecordsDisplay();
            this.recordsSection.style.display = 'none';
            this.playSound('clear');
            console.log('All records cleared');
        }
    }
    
    // Sound Effects
    playSound(type) {
        if (!this.settings.soundEnabled) return;
        
        // Create audio context for sound generation
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Different sounds for different actions
        switch (type) {
            case 'click':
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                break;
            case 'lap':
                oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                break;
            case 'split':
                oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.12, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.12);
                break;
            case 'reset':
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                break;
            case 'export':
                oscillator.frequency.setValueAtTime(1500, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                break;
            case 'clear':
                oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                break;
        }
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.stopwatch = new ProfessionalStopwatch();
    
    // Handle fullscreen change events
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            document.body.classList.remove('fullscreen');
        }
    });
    
    // Handle visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('Tab hidden - stopwatch continues running');
        } else {
            console.log('Tab visible - syncing display');
            if (window.stopwatch.isRunning) {
                window.stopwatch.updateDisplay();
            }
        }
    });
    
    // Handle page unload
    window.addEventListener('beforeunload', (e) => {
        if (window.stopwatch.isRunning) {
            e.preventDefault();
            e.returnValue = 'The stopwatch is still running. Are you sure you want to leave?';
        }
    });
    
    console.log('ProTimer application loaded successfully');
});