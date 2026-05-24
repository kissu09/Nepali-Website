/* ==========================================================================
   NEPALI HERITAGE INTERACTIVE ENGINE (नेपालीपन)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------
    // 0. GSAP SCROLL ZOOM INTRO TUNNEL
    // ----------------------------------------------------------------------
    // Register GreenSock ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Initial states
    gsap.set(".main-header", { y: -80, opacity: 0 });
    gsap.set("#heroIntroContent", { scale: 0.9, opacity: 0 });

    // Pinned Scroll Zoom Timeline
    const introTimeline = gsap.timeline({
        scrollTrigger: {
            trigger: ".intro-page-wrapper",
            start: "top top",
            end: "+=150%", // Scroll 150% of viewport height for smooth scrub zoom
            scrub: 1,      // Connects scrollbar directly to animation ticks
            pin: ".intro-page-wrapper", // PINS THE ENTIRE WRAPPER STABLE
            pinSpacing: true,
            anticipatePin: 1
        }
    });

    // A. Zoom through the center window pane (Scale up)
    introTimeline.to("#windowFrameOverlay", {
        scale: 18,
        ease: "power1.in"
    });

    // B. Fade out the guidance prompt early in scroll
    introTimeline.to("#windowIntroPrompt", {
        opacity: 0,
        scale: 0.7,
        duration: 0.25
    }, 0);

    // C. Fade out the window overlay near the end of zoom
    introTimeline.to("#windowFrameOverlay", {
        opacity: 0,
        duration: 0.25
    }, "<80%");

    // D. Fade in the underlying Hero content
    introTimeline.to("#heroIntroContent", {
        scale: 1,
        opacity: 1,
        duration: 0.35
    }, "<40%");

    // E. Independent Header Trigger (Guarantees header visibility and avoids scroll-up locks)
    ScrollTrigger.create({
        trigger: ".intro-page-wrapper",
        start: "bottom-=30% top", // Reveals header when zoom is 70% complete
        onEnter: () => {
            gsap.to(".main-header", { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" });
        },
        onLeaveBack: () => {
            gsap.to(".main-header", { y: -80, opacity: 0, duration: 0.4, ease: "power2.in" });
        }
    });

    // ----------------------------------------------------------------------
    // 1. GLOBAL STATE & WEB AUDIO ENGINE
    // ----------------------------------------------------------------------
    let audioCtx = null;
    let isAmbientPlaying = false;
    let ambientNodes = []; // References to clear active ambient oscillators
    
    // Lazy initialize AudioContext on user action
    function initAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    // ----------------------------------------------------------------------
    // 2. CUSTOM GLOWING CURSOR HANDLERS
    // ----------------------------------------------------------------------
    const cursor = document.getElementById('customCursor');
    const follower = document.getElementById('customCursorFollower');
    
    let mouseX = 0, mouseY = 0;
    let followerX = 0, followerY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Instant cursor movement
        cursor.style.left = `${mouseX}px`;
        cursor.style.top = `${mouseY}px`;
    });

    // Smooth lerping animation for follower
    function animateCursorFollower() {
        const lerpFactor = 0.15;
        followerX += (mouseX - followerX) * lerpFactor;
        followerY += (mouseY - followerY) * lerpFactor;
        
        follower.style.left = `${followerX}px`;
        follower.style.top = `${followerY}px`;
        
        requestAnimationFrame(animateCursorFollower);
    }
    requestAnimationFrame(animateCursorFollower);

    // Hover expansions
    const hoverables = document.querySelectorAll('a, button, [role="button"], .vector-diyo, .heritage-card, .fest-tab, .modal-close');
    hoverables.forEach(elem => {
        elem.addEventListener('mouseenter', () => {
            cursor.classList.add('cursor-hover');
            follower.classList.add('follower-hover');
        });
        elem.addEventListener('mouseleave', () => {
            cursor.classList.remove('cursor-hover');
            follower.classList.remove('follower-hover');
        });
    });

    // ----------------------------------------------------------------------
    // 3. PAGE UI INTERACTIONS & HEADER SCROLL PROGRESS
    // ----------------------------------------------------------------------
    const header = document.querySelector('.main-header');
    const scrollProgress = document.getElementById('scrollProgress');
    
    window.addEventListener('scroll', () => {
        // Sticky Header scroll styling
        if (window.scrollY > 50) {
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled');
        }
        
        // Scroll Progress Bar calculation
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const progress = (scrollTop / docHeight) * 100;
        scrollProgress.style.width = `${progress}%`;
    });

    // Mobile Navbar Toggle
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    
    mobileToggle.addEventListener('click', () => {
        mobileToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close menu when clicking links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            mobileToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // ----------------------------------------------------------------------
    // 4. WEB AUDIO SYNTHESIZERS (MEDITATIVE AMBIENCE, BELL & BOWL)
    // ----------------------------------------------------------------------
    
    // Synthesize a brief warm spark/chime when lighting a Diyo
    function playDiyoSparkAudio() {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        
        // 1. Flame Spark Noise Burst (friction sound)
        const bufferSize = audioCtx.sampleRate * 0.05; // 50ms burst
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noiseNode = audioCtx.createBufferSource();
        noiseNode.buffer = buffer;
        
        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(1500, now);
        
        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.04, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        
        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        noiseNode.start(now);
        
        // 2. High Ringing Spark Chime (metal pin spark)
        const osc = audioCtx.createOscillator();
        const oscGain = audioCtx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2500, now);
        osc.frequency.exponentialRampToValueAtTime(3200, now + 0.12);
        
        oscGain.gain.setValueAtTime(0.03, now);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
        
        osc.connect(oscGain);
        oscGain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    // Synthesize Sacred Temple Bell (Inharmonic multi-partial additive synthesis)
    function playTempleBellAudio() {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        
        // Frequencies representing traditional large cast bronze bell
        const partials = [
            { freq: 220, vol: 0.8, decay: 6.0 },   // Hum (fundamental tone)
            { freq: 330, vol: 0.5, decay: 4.5 },   // Prime (harmonic)
            { freq: 442, vol: 0.9, decay: 3.5 },   // Tierce (minor third feeling)
            { freq: 554, vol: 0.6, decay: 2.5 },   // Quint (fifth)
            { freq: 700, vol: 0.4, decay: 1.8 },   // Nominal (bright octave overlay)
            { freq: 880, vol: 0.3, decay: 1.2 },   // Supernominal
            { freq: 1200, vol: 0.2, decay: 0.6 }   // Sharp metallic strike transient
        ];
        
        const masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.3, now);
        masterGain.connect(audioCtx.destination);
        
        partials.forEach(p => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            // Add a micro frequency drift to make it sound organic and complex
            osc.type = 'sine';
            osc.frequency.setValueAtTime(p.freq, now);
            osc.frequency.linearRampToValueAtTime(p.freq * 0.998, now + p.decay);
            
            gainNode.gain.setValueAtTime(0.001, now);
            // Sharp strike attack (2ms)
            gainNode.gain.linearRampToValueAtTime(p.vol, now + 0.005);
            // Long decay
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);
            
            osc.connect(gainNode);
            gainNode.connect(masterGain);
            
            osc.start(now);
            osc.stop(now + p.decay + 0.5);
        });
    }

    // Meditative Ambient Loop Synthesizer (Warm Singing Bowl Hum + Random Chimes)
    function playAmbientAudio() {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        
        // 1. Meditative Hum base (Obsidian soundscape)
        const baseOsc = audioCtx.createOscillator();
        const baseGain = audioCtx.createGain();
        baseOsc.type = 'sine';
        baseOsc.frequency.setValueAtTime(98, now); // G2 note (Earth grounding frequency)
        
        // 2. Harmonic layer
        const octaveOsc = audioCtx.createOscillator();
        const octaveGain = audioCtx.createGain();
        octaveOsc.type = 'sine';
        octaveOsc.frequency.setValueAtTime(196, now); // G3 note
        
        // Filter out harsh highs for warm dark feeling
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(150, now);
        
        // Volume envelopes
        baseGain.gain.setValueAtTime(0.001, now);
        baseGain.gain.linearRampToValueAtTime(0.08, now + 3);
        
        octaveGain.gain.setValueAtTime(0.001, now);
        octaveGain.gain.linearRampToValueAtTime(0.03, now + 4);
        
        baseOsc.connect(filter);
        octaveOsc.connect(filter);
        
        filter.connect(baseGain);
        filter.connect(octaveGain);
        
        baseGain.connect(audioCtx.destination);
        octaveGain.connect(audioCtx.destination);
        
        baseOsc.start(now);
        octaveOsc.start(now);
        
        ambientNodes = [baseOsc, octaveOsc, baseGain, octaveGain];
        
        // 3. Random Himalayan wind chimes interval engine
        function triggerRandomWindChime() {
            if (!isAmbientPlaying) return;
            const nowTime = audioCtx.currentTime;
            
            const frequencies = [659.25, 783.99, 880.00, 987.77, 1174.66, 1318.51]; // E5, G5, A5, B5, D6, E6 (Pentatonic Scale)
            const randomFreq = frequencies[Math.floor(Math.random() * frequencies.length)];
            
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(randomFreq, nowTime);
            
            gain.gain.setValueAtTime(0.001, nowTime);
            gain.gain.linearRampToValueAtTime(0.015, nowTime + 0.05); // Slow attack
            gain.gain.exponentialRampToValueAtTime(0.0001, nowTime + 3.5); // long decay
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.start(nowTime);
            osc.stop(nowTime + 4);
            
            // Re-schedule next chime
            const nextChimeMs = 4000 + Math.random() * 5000; // between 4s and 9s
            setTimeout(triggerRandomWindChime, nextChimeMs);
        }
        
        setTimeout(triggerRandomWindChime, 2000);
    }

    function stopAmbientAudio() {
        if (ambientNodes.length > 0) {
            const now = audioCtx ? audioCtx.currentTime : 0;
            // Ramp volumes to zero to avoid popping noises
            const baseGain = ambientNodes[2];
            const octaveGain = ambientNodes[3];
            
            if (baseGain && octaveGain && audioCtx) {
                baseGain.gain.setValueAtTime(baseGain.gain.value, now);
                baseGain.gain.linearRampToValueAtTime(0.0001, now + 1.5);
                octaveGain.gain.setValueAtTime(octaveGain.gain.value, now);
                octaveGain.gain.linearRampToValueAtTime(0.0001, now + 1.5);
            }
            
            // Clean shutdown oscillators
            setTimeout(() => {
                try {
                    ambientNodes[0].stop();
                    ambientNodes[1].stop();
                } catch(e) {}
                ambientNodes = [];
            }, 1600);
        }
    }

    // Toggle Ambient Sound Controller
    const ambientToggle = document.getElementById('ambientToggle');
    ambientToggle.addEventListener('click', () => {
        initAudioContext();
        
        isAmbientPlaying = !isAmbientPlaying;
        if (isAmbientPlaying) {
            playAmbientAudio();
            ambientToggle.classList.add('active');
            ambientToggle.querySelector('.sound-icon').textContent = '🔊';
            ambientToggle.querySelector('.sound-label').textContent = 'ध्वनि चालु (Playing)';
        } else {
            stopAmbientAudio();
            ambientToggle.classList.remove('active');
            ambientToggle.querySelector('.sound-icon').textContent = '🔈';
            ambientToggle.querySelector('.sound-label').textContent = 'ध्वनि बन्द (Muted)';
        }
    });

    // ----------------------------------------------------------------------
    // 5. TIBETAN SINGING BOWL SIMULATOR (GESTURE TRACKING & SYNTH DRONE)
    // ----------------------------------------------------------------------
    const bowlWorkspace = document.getElementById('bowlWorkspace');
    const bowlOverlay = document.getElementById('bowlOverlay');
    const svgBowl = document.getElementById('vectorSingingBowl');
    const mallet = document.getElementById('bowlMallet');
    const bowlAura = document.getElementById('bowlAura');
    const bowlProgress = document.getElementById('bowlProgress');
    
    let isDraggingMallet = false;
    let lastAngle = null;
    let rawIntensity = 0; // Cumulative friction energy
    let targetIntensity = 0;
    
    // Singing Bowl Audio Synthesis Variables
    let bowlOsc1 = null;
    let bowlOsc2 = null;
    let bowlOsc3 = null;
    let frictionNoise = null;
    let bowlGainNode = null;
    let noiseGainNode = null;
    
    function startSingingBowlAudio() {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        
        bowlGainNode = audioCtx.createGain();
        bowlGainNode.gain.setValueAtTime(0.0001, now);
        
        // Cosmic multi-oscillator arrangement
        bowlOsc1 = audioCtx.createOscillator(); // 144Hz - D3 Base
        bowlOsc2 = audioCtx.createOscillator(); // 288Hz - D4 Octave
        bowlOsc3 = audioCtx.createOscillator(); // 432Hz - Sacred cosmic resonance
        
        bowlOsc1.type = 'sine';
        bowlOsc2.type = 'sine';
        bowlOsc3.type = 'sine';
        
        bowlOsc1.frequency.setValueAtTime(144, now);
        bowlOsc2.frequency.setValueAtTime(288, now);
        bowlOsc3.frequency.setValueAtTime(432, now);
        
        // Add a friction noise channel (sizzling feel)
        const bufferSize = audioCtx.sampleRate * 0.5;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for(let i=0; i<bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        frictionNoise = audioCtx.createBufferSource();
        frictionNoise.buffer = buffer;
        frictionNoise.loop = true;
        
        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(650, now);
        noiseFilter.Q.setValueAtTime(10, now);
        
        noiseGainNode = audioCtx.createGain();
        noiseGainNode.gain.setValueAtTime(0.0001, now);
        
        bowlOsc1.connect(bowlGainNode);
        bowlOsc2.connect(bowlGainNode);
        bowlOsc3.connect(bowlGainNode);
        
        frictionNoise.connect(noiseFilter);
        noiseFilter.connect(noiseGainNode);
        
        bowlGainNode.connect(audioCtx.destination);
        noiseGainNode.connect(audioCtx.destination);
        
        bowlOsc1.start(now);
        bowlOsc2.start(now);
        bowlOsc3.start(now);
        frictionNoise.start(now);
    }
    
    function stopSingingBowlAudio() {
        const now = audioCtx ? audioCtx.currentTime : 0;
        if (bowlGainNode && audioCtx) {
            bowlGainNode.gain.setValueAtTime(bowlGainNode.gain.value, now);
            bowlGainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        }
        if (noiseGainNode && audioCtx) {
            noiseGainNode.gain.setValueAtTime(noiseGainNode.gain.value, now);
            noiseGainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
        }
        
        // Shutdown oscillators completely
        setTimeout(() => {
            try {
                if (bowlOsc1) bowlOsc1.stop();
                if (bowlOsc2) bowlOsc2.stop();
                if (bowlOsc3) bowlOsc3.stop();
                if (frictionNoise) frictionNoise.stop();
            } catch(e) {}
            
            bowlOsc1 = bowlOsc2 = bowlOsc3 = frictionNoise = null;
            bowlGainNode = noiseGainNode = null;
        }, 1300);
    }
    
    function updateSingingBowlSynth(intensity) {
        if (!bowlGainNode || !audioCtx) return;
        const now = audioCtx.currentTime;
        
        // Intensity scales from 0 to 1.
        // Cap maximum volume to safe level
        const maxGain = 0.16;
        const currentGain = intensity * maxGain;
        
        // Target resonance level
        bowlGainNode.gain.setTargetAtTime(currentGain, now, 0.1);
        noiseGainNode.gain.setTargetAtTime(intensity * 0.02, now, 0.08);
        
        // Bend frequencies slightly according to energy to represent metallic friction loading
        if (bowlOsc3) {
            bowlOsc3.frequency.setTargetAtTime(432 + (intensity * 2.5), now, 0.15);
        }
    }
    
    // Interaction Handlers
    function handleBowlStart(e) {
        initAudioContext();
        e.preventDefault();
        
        isDraggingMallet = true;
        bowlOverlay.classList.add('faded');
        
        startSingingBowlAudio();
    }
    
    function handleBowlMove(e) {
        if (!isDraggingMallet) return;
        
        const rect = svgBowl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const dx = clientX - centerX;
        const dy = clientY - centerY;
        
        // Calculate current angle in radians
        const angle = Math.atan2(dy, dx);
        
        // Animate mallet vector rotation around center
        const angleDegrees = angle * (180 / Math.PI) + 90;
        mallet.style.transform = `rotate(${angleDegrees}deg)`;
        
        // Calculate velocity (change in angle)
        if (lastAngle !== null) {
            let delta = angle - lastAngle;
            
            // Handle phase wrapping (-PI to PI)
            if (delta > Math.PI) delta -= Math.PI * 2;
            if (delta < -Math.PI) delta += Math.PI * 2;
            
            // Friction energy generated based on speed
            const speed = Math.abs(delta);
            if (speed > 0.01) {
                targetIntensity = Math.min(targetIntensity + speed * 1.5, 1);
            }
        }
        
        lastAngle = angle;
    }
    
    function handleBowlEnd() {
        isDraggingMallet = false;
        lastAngle = null;
        targetIntensity = 0;
        
        stopSingingBowlAudio();
    }
    
    // Event bindings
    bowlWorkspace.addEventListener('mousedown', handleBowlStart);
    window.addEventListener('mousemove', handleBowlMove);
    window.addEventListener('mouseup', handleBowlEnd);
    
    bowlWorkspace.addEventListener('touchstart', handleBowlStart, { passive: false });
    window.addEventListener('touchmove', handleBowlMove, { passive: false });
    window.addEventListener('touchend', handleBowlEnd);
    
    // Smooth frame loops for dragging decays
    function frictionDecayLoop() {
        const smoothing = 0.08;
        rawIntensity += (targetIntensity - rawIntensity) * smoothing;
        
        // Visual updates
        bowlProgress.style.width = `${rawIntensity * 100}%`;
        
        // Render glowing breathing rings
        if (rawIntensity > 0.05) {
            bowlAura.setAttribute('r', 110 + rawIntensity * 30);
            bowlAura.setAttribute('opacity', rawIntensity * 0.85);
            bowlAura.setAttribute('stroke-width', 1 + rawIntensity * 8);
        } else {
            bowlAura.setAttribute('opacity', 0);
        }
        
        // Update Synthesizer values
        if (isDraggingMallet) {
            updateSingingBowlSynth(rawIntensity);
        }
        
        // Decelerate friction energy slowly over time
        if (!isDraggingMallet && targetIntensity > 0) {
            targetIntensity = Math.max(targetIntensity - 0.01, 0);
        }
        
        requestAnimationFrame(frictionDecayLoop);
    }
    requestAnimationFrame(frictionDecayLoop);

    // ----------------------------------------------------------------------
    // 6. SACRED TEMPLE BELL SIMULATOR (3D SWING PHYSICS & CANVAS RIPPLES)
    // ----------------------------------------------------------------------
    const bellWorkspace = document.getElementById('bellWorkspace');
    const bellSwingContainer = document.getElementById('bellSwingContainer');
    const clapper = document.getElementById('bellClapperGroup');
    const canvas = document.getElementById('bellCanvas');
    const ctx = canvas.getContext('2d');
    const strikeBtn = document.getElementById('strikeBellBtn');
    
    let ripples = [];
    
    // Resize ripple canvas to match dimensions
    function resizeCanvas() {
        canvas.width = bellWorkspace.clientWidth;
        canvas.height = bellWorkspace.clientHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function createRipple() {
        const ripple = {
            x: canvas.width / 2,
            y: 190, // Clapper strike point height
            r: 5,
            opacity: 1,
            color: 'rgba(240, 184, 60, ' // gold
        };
        ripples.push(ripple);
    }
    
    function drawRipples() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = ripples.length - 1; i >= 0; i--) {
            const r = ripples[i];
            
            ctx.beginPath();
            ctx.ellipse(r.x, r.y, r.r, r.r * 0.4, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `${r.color}${r.opacity})`;
            ctx.lineWidth = 2 + (1 - r.opacity) * 6;
            ctx.stroke();
            
            // Expand and fade ripple
            r.r += 3.5;
            r.opacity -= 0.012;
            
            if (r.opacity <= 0) {
                ripples.splice(i, 1);
            }
        }
        
        requestAnimationFrame(drawRipples);
    }
    requestAnimationFrame(drawRipples);

    function strikeTempleBell() {
        initAudioContext();
        
        // Remove active class triggers to reset CSS animations cleanly
        bellSwingContainer.classList.remove('bell-ringing');
        clapper.classList.remove('clapper-hitting');
        
        // Force reflow
        void bellSwingContainer.offsetWidth;
        
        // Add ringing animations
        bellSwingContainer.classList.add('bell-ringing');
        clapper.classList.add('clapper-hitting');
        
        // Trigger Web Audio API synthesized bell
        playTempleBellAudio();
        
        // Emit visual ripple wave
        createRipple();
        setTimeout(createRipple, 350); // double strike echo wave
    }

    // Bind triggers
    bellSwingContainer.addEventListener('click', strikeTempleBell);
    strikeBtn.addEventListener('click', strikeTempleBell);

    // ----------------------------------------------------------------------
    // 7. SEASONAL FESTIVALS & RITUALS (DIYO OIL LAMPS & FLYING KITE CANVAS)
    // ----------------------------------------------------------------------
    const tabs = document.querySelectorAll('.fest-tab');
    const tabContents = document.querySelectorAll('.festival-tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            const targetContent = document.getElementById(`tab-${tab.dataset.tab}`);
            targetContent.classList.add('active');
            
            // Initialize Kite Canvas if Dashain tab is opened
            if (tab.dataset.tab === 'dashain') {
                setTimeout(initKitePhysics, 150);
            }
        });
    });

    // Sub-feature A: Tihar Diyo Lamps Ignition
    const diyoPots = document.querySelectorAll('.diyo-pot');
    const ambientBg = document.querySelector('.diyo-ambient-bg');
    
    diyoPots.forEach(diyo => {
        const svgElement = diyo.querySelector('.vector-diyo');
        svgElement.addEventListener('click', () => {
            initAudioContext();
            
            const isAlreadyLit = diyo.classList.contains('lit');
            diyo.classList.toggle('lit');
            
            // Synthesize spark sounds if lighting
            if (!isAlreadyLit) {
                playDiyoSparkAudio();
            }
            
            checkDiyoAmbientGlow();
        });
    });

    function checkDiyoAmbientGlow() {
        const litCount = document.querySelectorAll('.diyo-pot.lit').length;
        if (litCount > 0) {
            ambientBg.classList.add('glowing');
        } else {
            ambientBg.classList.remove('glowing');
        }
    }

    // Light All & Reset Buttons
    document.getElementById('lightAllDiyos').addEventListener('click', () => {
        initAudioContext();
        diyoPots.forEach((diyo, idx) => {
            if (!diyo.classList.contains('lit')) {
                // Ignite one-by-one with staggered timing
                setTimeout(() => {
                    diyo.classList.add('lit');
                    playDiyoSparkAudio();
                    checkDiyoAmbientGlow();
                }, idx * 250);
            }
        });
    });

    document.getElementById('extinguishDiyos').addEventListener('click', () => {
        diyoPots.forEach(diyo => {
            diyo.classList.remove('lit');
        });
        checkDiyoAmbientGlow();
    });

    // Sub-feature B: Dashain Kite Flying Canvas Simulator
    const kiteWorkspace = document.getElementById('kiteWorkspace');
    const kiteCanvas = document.getElementById('kiteCanvas');
    const kiteCtx = kiteCanvas.getContext('2d');
    const domKite = document.getElementById('vectorKite');
    const windspeedEl = document.getElementById('kiteWindspeed');
    const altitudeEl = document.getElementById('kiteAltitude');
    
    let kitePhys = {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        windspeed: 12,
        gustTimer: 0,
        altitude: 45
    };
    
    let clouds = [
        { x: 50, y: 80, speed: 0.15, size: 40 },
        { x: 300, y: 150, speed: 0.22, size: 60 },
        { x: 500, y: 60, speed: 0.12, size: 35 }
    ];

    let isKiteInitialized = false;

    function initKitePhysics() {
        if (isKiteInitialized) return;
        isKiteInitialized = true;
        
        kiteCanvas.width = kiteWorkspace.clientWidth;
        kiteCanvas.height = kiteWorkspace.clientHeight;
        
        // Starting coordinates
        kitePhys.x = kiteCanvas.width / 2;
        kitePhys.y = kiteCanvas.height / 2;
        kitePhys.targetX = kitePhys.x;
        kitePhys.targetY = kitePhys.y;
        
        // Track pointer inside the sky workspace
        kiteWorkspace.addEventListener('mousemove', (e) => {
            const rect = kiteWorkspace.getBoundingClientRect();
            kitePhys.targetX = e.clientX - rect.left;
            kitePhys.targetY = Math.max(e.clientY - rect.top, 50); // limit altitude
        });

        // Touch support
        kiteWorkspace.addEventListener('touchmove', (e) => {
            const rect = kiteWorkspace.getBoundingClientRect();
            kitePhys.targetX = e.touches[0].clientX - rect.left;
            kitePhys.targetY = Math.max(e.touches[0].clientY - rect.top, 50);
        }, { passive: true });

        requestAnimationFrame(updateKiteSkyFrame);
    }

    function updateKiteSkyFrame() {
        if (!isKiteInitialized) return;
        
        kiteCanvas.width = kiteWorkspace.clientWidth;
        kiteCanvas.height = kiteWorkspace.clientHeight;
        
        kiteCtx.clearRect(0, 0, kiteCanvas.width, kiteCanvas.height);
        
        // 1. Draw Clouds
        kiteCtx.fillStyle = 'rgba(255, 255, 255, 0.28)';
        clouds.forEach(c => {
            kiteCtx.beginPath();
            kiteCtx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
            kiteCtx.arc(c.x + c.size * 0.6, c.y - c.size * 0.2, c.size * 0.8, 0, Math.PI * 2);
            ctx.arc(c.x + c.size * 1.2, c.y, c.size * 0.6, 0, Math.PI * 2);
            kiteCtx.fill();
            
            c.x += c.speed;
            if (c.x - c.size * 2 > kiteCanvas.width) {
                c.x = -c.size * 2;
                c.y = 50 + Math.random() * 150;
            }
        });
        
        // 2. Windy Gust calculations
        kitePhys.gustTimer += 0.02;
        const windGust = Math.sin(kitePhys.gustTimer) * 5;
        const absoluteWindspeed = Math.round(12 + Math.abs(windGust));
        windspeedEl.textContent = `${absoluteWindspeed} km/h`;
        
        // 3. Interpolate Kite coordinates (Spring/Lag effect)
        const spring = 0.08;
        kitePhys.x += (kitePhys.targetX - kitePhys.x) * spring;
        kitePhys.y += (kitePhys.targetY - kitePhys.y) * spring;
        
        // Add random breeze shiver
        const noiseX = Math.sin(kitePhys.gustTimer * 6) * (3 + windGust * 0.4);
        const noiseY = Math.cos(kitePhys.gustTimer * 4) * (2 + windGust * 0.3);
        
        const finalKiteX = kitePhys.x + noiseX;
        const finalKiteY = kitePhys.y + noiseY;
        
        // Apply coordinate bounds to keep kite in sky box
        const clampedX = Math.max(30, Math.min(kiteCanvas.width - 30, finalKiteX));
        const clampedY = Math.max(35, Math.min(kiteCanvas.height - 35, finalKiteY));
        
        // Position DOM Kite Element
        domKite.style.left = `${clampedX}px`;
        domKite.style.top = `${clampedY}px`;
        
        // Tilt kite based on travel direction
        const deltaX = kitePhys.targetX - kitePhys.x;
        const tiltAngle = Math.max(-25, Math.min(25, deltaX * 0.4));
        domKite.style.transform = `translate(-50%, -50%) rotate(${tiltAngle}deg)`;
        
        // Calculate Altitude in meters (maps vertical height to meters)
        const altitudeVal = Math.round(((kiteCanvas.height - clampedY) / kiteCanvas.height) * 80 + 10);
        altitudeEl.textContent = `${altitudeVal} m`;
        
        // 4. Draw Kite String line (spanning from bottom left)
        kiteCtx.beginPath();
        kiteCtx.moveTo(20, kiteCanvas.height - 20); // Thread spool starting anchor
        // Quadratic curve to make string look elastic and heavy due to wind
        const controlX = (clampedX + 20) / 2 + 30 + windGust * 8;
        const controlY = (clampedY + kiteCanvas.height - 20) / 2 + 40;
        kiteCtx.quadraticCurveTo(controlX, controlY, clampedX, clampedY + 20);
        
        kiteCtx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        kiteCtx.lineWidth = 1.2;
        kiteCtx.stroke();
        
        requestAnimationFrame(updateKiteSkyFrame);
    }

    // ----------------------------------------------------------------------
    // 8. INTERACTIVE HERITAGE CARDS DETAILS & MODAL HANDLER
    // ----------------------------------------------------------------------
    const detailButtons = document.querySelectorAll('.btn-card-details');
    const modal = document.getElementById('culturalModal');
    const modalClose = document.getElementById('modalCloseBtn');
    const modalContentArea = document.getElementById('modalContentArea');
    
    // Rich cultural data object for detailed viewing
    const culturalData = {
        everest: {
            title: "सगरमाथा",
            englishTitle: "Mount Everest — The Head of the Sky",
            tag: "विश्वको सर्वोच्च शिखर (The Pinnacle of the Earth)",
            para1: "Known to the world as Mount Everest, the Tibetan people as Chomolungma ('Mother Goddess of the World'), and proudly to the Nepalese as Sagarmatha ('Forehead of the Sky'), this colossal peak dominates the Himalayan range, rising to 8,848.86 meters. It represents the sacred crown of Nepalese national sovereignty and rugged natural grace.",
            para2: "The peak lies in the Solukhumbu district, inside the Sagarmatha National Park, which is designated as a UNESCO World Heritage site. For the local Sherpa culture, the peak is highly revered as the dwelling place of Goddess Miyolangsangma, who provides sustenance and security.",
            checklist: ["Peak altitude: 8,848.86 meters", "UNESCO World Heritage Site", "Home to unique Sherpa customs", "Sacred mountain of Miyolangsangma"]
        },
        swayambhu: {
            title: "स्वयम्भूनाथ स्तूप",
            englishTitle: "Swayambhunath — The All-Seeing Wisdom Eyes",
            tag: "प्राचीन बौद्ध स्मारक (Ancient Stupa of Enlightenment)",
            para1: "Standing majestically atop a conical hill in Kathmandu Valley, the dome of Swayambhunath is one of the most sacred Buddhist pilgrimage destinations in Nepal. According to legend, the entire valley was once an enormous lake, out of which a lotus bloomed self-created ('Swayambhu'), crystallizing into the sacred hill.",
            para2: "The stupa features the famous gilded tower painted with the compassionate Eyes of Buddha looking in all four cardinal directions, signifying universal wisdom. The curly symbol between the eyes is the Devanagari character 'Ek' (one), representing the path of unified harmony and enlightenment.",
            checklist: ["Dating back to the 5th century AD", "Sits on a self-arisen sacred lotus site", "Buddha's Eyes of Wisdom & Compassion", "Surrounded by temples, shrines & monkeys"]
        },
        nyatapola: {
            title: "न्यातपोल मन्दिर",
            englishTitle: "Nyatapola — Five Stories of Infinite Balance",
            tag: "वास्तुकलाको उत्कृष्ट नमूना (Masterpiece of Newari Design)",
            para1: "Erected in Bhaktapur under the reign of King Bhupatindra Malla in 1702, Nyatapola translates to 'Five-Storeyed Roof' in the local Newari language. Dedicated to Goddess Siddhi Laxmi, the wrathful avatar of Parvati, it represents the absolute apex of traditional Newarian pagoda architecture, standing over 30 meters tall.",
            para2: "The pagoda is renowned for its incredible seismic balance; it successfully survived the devastating earthquakes of 1934, 2015, and others with minimal structural damage. The stone guardian statues lining its steps represent escalating levels of divine and physical strength.",
            checklist: ["Nepal's tallest traditional pagoda temple", "Survived multiple high-magnitude earthquakes", "Guarded by stone wrestlers, elephants & deities", "Intricate 108 wood-carved structural struts"]
        },
        pashupati: {
            title: "पशुपतिनाथ मन्दिर",
            englishTitle: "Pashupatinath — The Spiritual Sanctuary",
            tag: "पवित्र हिन्दू मन्दिर (The Heart of Shiva Devotion)",
            para1: "Nestled along the banks of the sacred Bagmati River, Pashupatinath is the oldest and most revered Hindu temple complex in Kathmandu, Nepal. Dedicated to Lord Shiva in his manifestation as Pashupati ('Lord of All Living Beings'), its main pagoda features a gold-plated roof, silver-plated doors, and stunning wood carvings.",
            para2: "During the Maha Shivaratri festival, millions of devotees and colourful Sadhus (ascetic monks) from India and across the world gather here in deep prayer, meditation, and ritual celebrations. The daily Bagmati Aarti (lamps offering) forms a mesmerizing, deeply spiritual musical ritual.",
            checklist: ["UNESCO World Heritage Monument", "Oldest Hindu temple complex in Kathmandu", "Bagmati Sandhya Aarti evening prayers", "Sacred destination for global Shiva devotees"]
        }
    };

    function openCulturalModal(landmarkKey) {
        const data = culturalData[landmarkKey];
        if (!data) return;
        
        // Assemble HTML markup dynamically inside modal
        modalContentArea.innerHTML = `
            <div class="modal-content-header">
                <h3>${data.title}</h3>
                <span class="en-subtitle">${data.englishTitle}</span>
            </div>
            <div class="modal-body-section">
                <h4>धरोहरको महत्त्व (Cultural Legacy)</h4>
                <p>${data.para1}</p>
                <p>${data.para2}</p>
            </div>
            <div class="modal-body-section">
                <h4>विशेषताहरू (Key Highlights)</h4>
                <ul class="cultural-checklist">
                    ${data.checklist.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
        `;
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Lock background scroll
    }

    function closeCulturalModal() {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Unlock background scroll
    }

    // Attach click listeners to cards
    detailButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetLandmark = btn.dataset.target;
            openCulturalModal(targetLandmark);
        });
    });

    // Close listeners
    modalClose.addEventListener('click', closeCulturalModal);
    document.querySelector('.modal-backdrop').addEventListener('click', closeCulturalModal);
    
    // Close on ESC key press
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeCulturalModal();
        }
    });

    // ----------------------------------------------------------------------
    // 9. DYNAMIC 3D PARALLAX EFFECT FOR HERITAGE CARDS
    // ----------------------------------------------------------------------
    const cards = document.querySelectorAll('.heritage-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; // Mouse position inside card
            const y = e.clientY - rect.top;
            
            // Set variables for dynamic gradient lighting
            card.style.setProperty('--x', `${x}px`);
            card.style.setProperty('--y', `${y}px`);
            
            // Calculate tilt angle based on mouse distance from center
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((centerY - y) / centerY) * 6; // Max 6 deg tilt
            const rotateY = ((x - centerX) / centerX) * 6;
            
            card.style.transform = `translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        
        card.addEventListener('mouseleave', () => {
            // Reset to defaults
            card.style.transform = '';
        });
    });
});
