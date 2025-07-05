document.addEventListener('DOMContentLoaded', () => {
    // --- State & Element Management ---
    let activeView = 'world-clock';
    let intervals = { worldClock: null, stopwatch: null, timer: null };
    let animationFrames = { timer: null };
    const elements = {
        modeButtons: document.querySelectorAll('.mode-btn'),
        views: document.querySelectorAll('.view'),
        devModalOverlay: document.getElementById('dev-modal-overlay'),
        settingsBtn: document.querySelector('.settings-btn'),
        closeModalBtn: document.querySelector('.close-modal-btn')
    };

    // --- Component: World Clock ---
    const worldClock = {
        els: { timezoneSelector: document.getElementById('timezone-selector'), locationHero: document.getElementById('location-hero'), locationNameEl: document.getElementById('location-name'), dateDisplayEl: document.getElementById('date-display'), timeEl: document.querySelector('#world-clock-view .main-clock-display'), digits: { h1: document.getElementById('h1'), h2: document.getElementById('h2'), m1: document.getElementById('m1'), m2: document.getElementById('m2'), s1: document.getElementById('s1'), s2: document.getElementById('s2') },},
        state: { activeCityId: citiesData[0].id },
        setupListeners() { this.els.timezoneSelector.addEventListener('click', (e) => { const button = e.target.closest('.city-btn'); if (button && button.dataset.cityId !== this.state.activeCityId) this.setActiveCity(button.dataset.cityId); }); },
        start() { intervals.worldClock = setInterval(() => this.updateClock(), 1000); this.updateClock(); },
        stop() { clearInterval(intervals.worldClock); },
        populateTimezoneSelector() { if(this.els.timezoneSelector.children.length > 0) return; citiesData.forEach(city => { const btn = document.createElement('button'); btn.className = 'city-btn'; btn.dataset.cityId = city.id; btn.setAttribute('role', 'radio'); btn.innerHTML = `<span class="city-name">${city.name}</span><span class="city-time" id="time-${city.id}">00:00</span>`; this.els.timezoneSelector.appendChild(btn); }); },
        updateHero(city) { this.els.locationHero.classList.add('fade-out'); setTimeout(() => { this.els.locationNameEl.textContent = city.longName; this.els.locationHero.style.backgroundImage = `url('${city.imageUrl}')`; this.els.locationHero.classList.remove('fade-out'); }, 400); },
        updateDigit(el, val) { if (el.textContent !== val) { el.textContent = val; el.classList.add('digit-flip'); el.addEventListener('animationend', () => el.classList.remove('digit-flip'), { once: true }); } },
        updateClock() { citiesData.forEach(city => { const now = new Date(); const timeString = now.toLocaleTimeString('en-US', { timeZone: city.timezone, hour12: false, hour: '2-digit', minute: '2-digit' }); if (city.id === this.state.activeCityId) { const [hours, minutes] = timeString.split(':'); const seconds = now.toLocaleTimeString('en-US', { timeZone: city.timezone, second: '2-digit' }).padStart(2, '0'); this.updateDigit(this.els.digits.h1, hours[0]); this.updateDigit(this.els.digits.h2, hours[1]); this.updateDigit(this.els.digits.m1, minutes[0]); this.updateDigit(this.els.digits.m2, minutes[1]); this.updateDigit(this.els.digits.s1, seconds[0]); this.updateDigit(this.els.digits.s2, seconds[1]); this.els.timeEl.setAttribute('datetime', now.toISOString()); this.els.dateDisplayEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: city.timezone }); } document.getElementById(`time-${city.id}`).textContent = timeString; }); },
        setActiveCity(cityId) { this.state.activeCityId = cityId; const cityData = citiesData.find(c => c.id === cityId); document.querySelectorAll('.city-btn').forEach(btn => { const isPressed = btn.dataset.cityId === cityId; btn.classList.toggle('active', isPressed); btn.setAttribute('aria-checked', isPressed); }); this.updateHero(cityData); this.updateClock(); }
    };
    
    // --- Component: Stopwatch ---
    const stopwatch = {
        els: { display: document.querySelector('#stopwatch-view .stopwatch-display'), startStopBtn: document.getElementById('stopwatch-start-stop'), lapBtn: document.getElementById('stopwatch-lap'), resetBtn: document.getElementById('stopwatch-reset'), lapsList: document.getElementById('laps-list') },
        state: { startTime: 0, elapsedTime: 0, running: false, laps: [] },
        setupListeners() { this.els.startStopBtn.addEventListener('click', () => this.toggle()); this.els.lapBtn.addEventListener('click', () => this.recordLap()); this.els.resetBtn.addEventListener('click', () => this.reset()); },
        toggle() { this.state.running ? this.stop() : this.start(); },
        start() { this.state.running = true; this.state.startTime = Date.now() - this.state.elapsedTime; intervals.stopwatch = setInterval(() => this.update(), 10); this.els.startStopBtn.textContent = 'Stop'; this.els.lapBtn.disabled = false; },
        stop() { this.state.running = false; clearInterval(intervals.stopwatch); this.els.startStopBtn.textContent = 'Start'; },
        reset() { this.stop(); this.state.elapsedTime = 0; this.state.laps = []; this.els.display.innerHTML = '00:00<span class="ms">.00</span>'; this.els.lapsList.innerHTML = ''; this.els.lapBtn.disabled = true; },
        recordLap() { if (!this.state.running) return; const lapTime = this.state.elapsedTime; this.state.laps.push(lapTime); const li = document.createElement('li'); li.innerHTML = `<span class="lap-num">Lap ${this.state.laps.length}</span><span class="lap-time">${this.formatTime(lapTime)}</span>`; this.els.lapsList.prepend(li); },
        update() { this.state.elapsedTime = Date.now() - this.state.startTime; this.els.display.innerHTML = this.formatTime(this.state.elapsedTime); },
        formatTime(ms) { const d = new Date(ms); const mins = String(d.getUTCMinutes()).padStart(2, '0'); const secs = String(d.getUTCSeconds()).padStart(2, '0'); const millis = String(d.getUTCMilliseconds()).padStart(3, '0').slice(0, 2); return `${mins}:${secs}<span class="ms">.${millis}</span>`; }
    };

    // --- Component: Timer (Rewritten & Simplified) ---
    const timer = {
        els: { setupView: document.getElementById('timer-setup-view'), displayView: document.getElementById('timer-display-view'), digitalDisplay: document.getElementById('timer-digital-display'), inputH: document.getElementById('timer-input-h'), inputM: document.getElementById('timer-input-m'), inputS: document.getElementById('timer-input-s'), startPauseBtn: document.getElementById('timer-start-pause'), resetBtn: document.getElementById('timer-reset'), },
        state: { initialDuration: 0, timeRemaining: 0, endTime: 0, status: 'idle' }, // idle, running, paused, finished
        init() { this.setupListeners(); this.reset(); },
        setupListeners() {
            this.els.startPauseBtn.addEventListener('click', () => this.toggle());
            this.els.resetBtn.addEventListener('click', () => this.reset());
            // Auto-advance cursor in input fields
            [this.els.inputH, this.els.inputM, this.els.inputS].forEach(input => {
                input.addEventListener('input', (e) => { if (e.target.value.length === 2) e.target.nextElementSibling?.nextElementSibling?.focus(); });
            });
        },
        toggle() { this.state.status === 'running' ? this.pause() : this.start(); },
        start() {
            if (this.state.status === 'idle') {
                const h = parseInt(this.els.inputH.value) || 0; const m = parseInt(this.els.inputM.value) || 0; const s = parseInt(this.els.inputS.value) || 0;
                this.state.initialDuration = (h * 3600 + m * 60 + s) * 1000;
                if (this.state.initialDuration <= 0) return;
                this.state.timeRemaining = this.state.initialDuration;
            }
            if (this.state.status === 'finished') return; // Don't restart a finished timer
            
            this.state.status = 'running';
            this.state.endTime = performance.now() + this.state.timeRemaining;
            animationFrames.timer = requestAnimationFrame((t) => this.update(t));

            this.els.setupView.classList.add('hidden');
            this.els.displayView.classList.remove('hidden');
            this.els.startPauseBtn.textContent = 'Pause';
            this.els.digitalDisplay.classList.remove('is-finished');
        },
        pause() { if (this.state.status !== 'running') return; this.state.status = 'paused'; cancelAnimationFrame(animationFrames.timer); this.els.startPauseBtn.textContent = 'Resume'; },
        reset() {
            this.state.status = 'idle'; cancelAnimationFrame(animationFrames.timer);
            this.state.initialDuration = 0; this.state.timeRemaining = 0;
            this.els.inputH.value = this.els.inputM.value = this.els.inputS.value = '';
            
            this.els.setupView.classList.remove('hidden');
            this.els.displayView.classList.add('hidden');
            this.els.digitalDisplay.classList.remove('is-finished');
            this.els.startPauseBtn.textContent = 'Start';
            this.updateDisplay();
        },
        update(timestamp) {
            if (this.state.status !== 'running') return;
            this.state.timeRemaining = this.state.endTime - timestamp;

            if (this.state.timeRemaining <= 0) {
                this.state.timeRemaining = 0; this.state.status = 'finished';
                this.els.startPauseBtn.textContent = 'Start'; this.els.startPauseBtn.disabled = true;
                this.els.digitalDisplay.classList.add('is-finished');
                cancelAnimationFrame(animationFrames.timer);
            }
            this.updateDisplay();
            if(this.state.status === 'running') animationFrames.timer = requestAnimationFrame((t) => this.update(t));
        },
        updateDisplay() {
            const time = this.state.status === 'idle' ? 0 : this.state.timeRemaining;
            const h = Math.floor(time / 3600000);
            const m = Math.floor((time % 3600000) / 60000);
            const s = Math.ceil((time % 60000) / 1000);
            this.els.digitalDisplay.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
    };
    
    // --- Main Control Functions ---
    function switchView(viewName) {
        if (activeView === viewName) return;
        worldClock.stop(); if (stopwatch.state.running) stopwatch.stop(); if (timer.state.status === 'running') timer.pause();
        activeView = viewName;
        elements.modeButtons.forEach(btn => { btn.classList.toggle('active', btn.dataset.view === viewName); btn.setAttribute('aria-selected', btn.dataset.view === viewName); });
        elements.views.forEach(view => { view.classList.toggle('active-view', view.id === `${viewName}-view`); });
        if (viewName === 'world-clock') worldClock.start();
    }
    
    function setupModal() {
        document.getElementById('dev-photo').src = developerInfo.profileImageUrl;
        document.querySelector('.dev-name').textContent = developerInfo.name;
        document.querySelector('.dev-title').textContent = developerInfo.title;
        const socialLinksContainer = document.getElementById('social-links');
        socialLinksContainer.innerHTML = developerInfo.socials.map(social => `<a href="${social.url}" target="_blank" rel="noopener noreferrer" aria-label="${social.name}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="${social.svgPath}"></path></svg></a>`).join('');
        const today = new Date();
        if (today.getDate() % 2 !== 0) { const quoteEl = document.getElementById('dev-quote'); const randomIndex = Math.floor(Math.random() * developerInfo.quotes.length); quoteEl.textContent = `“${developerInfo.quotes[randomIndex]}”`; quoteEl.classList.remove('hidden'); }
        const openModal = () => elements.devModalOverlay.classList.remove('hidden');
        const closeModal = () => elements.devModalOverlay.classList.add('hidden');
        elements.settingsBtn.addEventListener('click', openModal);
        elements.closeModalBtn.addEventListener('click', closeModal);
        elements.devModalOverlay.addEventListener('click', (e) => { if (e.target === elements.devModalOverlay) closeModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !elements.devModalOverlay.classList.contains('hidden')) closeModal(); });
    }
    
    function init() {
        worldClock.populateTimezoneSelector();
        worldClock.setupListeners();
        stopwatch.setupListeners();
        timer.init();
        setupModal();
        elements.modeButtons.forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
        worldClock.setActiveCity(worldClock.state.activeCityId);
        worldClock.start();
    }

    init();
});
