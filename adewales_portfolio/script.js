const welcomeScreen = document.getElementById('welcomeScreen');
const typewriterText = document.getElementById('typewriterText');
const mobileMenuButton = document.getElementById('mobileMenuButton');
const sidebar = document.getElementById('sidebar');
const toastStack = document.getElementById('toastStack');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
const modalText = document.getElementById('modalText');

const enterSite = document.getElementById('enterSite');
const matrixFinal = document.getElementById('matrixFinal');
const buildLabStage = document.getElementById('buildLabStage');

function typeInto(element, text, speed = 76) {
    return new Promise(resolve => {
        let index = 0;
        element.textContent = '';


    'this is just s aample text to test the typing effect in the code snippet provided.';

        function tick() {
            if (index <= text.length) {
                element.textContent = text.slice(0, index);
                index += 1;
                setTimeout(tick, speed);
            } else {
                resolve();
            }
        }

        tick();
    });
}

async function runMatrixWelcome() {
    if (buildLabStage) buildLabStage.classList.add('show');
    await typeInto(matrixFinal, 'Welcome to my build lab', 50);

    if (enterSite) {
        enterSite.classList.add('ready');
        enterSite.focus();
    }
}

if (enterSite) {
    enterSite.addEventListener('click', () => {
        welcomeScreen.classList.add('done');

        setTimeout(() => {
            welcomeScreen.remove();
        }, 1000);
    });
}

window.addEventListener('load', () => {
    runMatrixWelcome();
});

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastStack.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(8px)';
    }, 2500);

    setTimeout(() => toast.remove(), 2900);
}

function openModal(title, body, sourceElement = null) {
    modalTitle.textContent = title;
    modalText.textContent = body;

    const modalCard = modalBackdrop.querySelector('.modal-card');
    if (modalCard && sourceElement) {
        const sourceRect = sourceElement.getBoundingClientRect();
        const sourceX = sourceRect.left + sourceRect.width / 2;
        const sourceY = sourceRect.top + sourceRect.height / 2;
        modalCard.style.transformOrigin = `${Math.round(sourceX / window.innerWidth * 100)}% ${Math.round(sourceY / window.innerHeight * 100)}%`;
    }

    modalBackdrop.classList.add('active');
    document.body.classList.add('modal-open');
}

function closeModal() {
    modalBackdrop.classList.remove('active');
    document.body.classList.remove('modal-open');
}

modalClose.addEventListener('click', closeModal);

modalBackdrop.addEventListener('click', event => {
    if (event.target === modalBackdrop) closeModal();
});

mobileMenuButton.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    document.body.classList.toggle('nav-open');
});

document.querySelectorAll('.side-nav a').forEach(link => {
    link.addEventListener('click', () => {
        sidebar.classList.remove('active');
        document.body.classList.remove('nav-open');
    });
});

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', event => {
        if (reducedMotionQuery.matches) return;
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const rotateY = ((x / rect.width) - 0.5) * 7;
        const rotateX = -((y / rect.height) - 0.5) * 7;

        card.style.setProperty('--rx', rotateX + 'deg');
        card.style.setProperty('--ry', rotateY + 'deg');
    });

    card.addEventListener('mouseleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
    });
});

const navLinks = Array.from(document.querySelectorAll('.side-nav a'));
const sections = navLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
let sectionOffsets = sections.map(section => section.offsetTop);
let activeNavId = null;

function refreshSectionOffsets() {
    sectionOffsets = sections.map(section => section.offsetTop);
    updateActiveNav();
}

function updateActiveNav() {
    const scrollPosition = window.scrollY + window.innerHeight * 0.32;

    let activeId = sections[0]?.id;

    sectionOffsets.forEach((offset, index) => {
        if (offset <= scrollPosition) {
            activeId = sections[index].id;
        }
    });

    if (activeId === activeNavId) return;
    activeNavId = activeId;
    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + activeId);
    });
}

let scrollUpdateQueued = false;

function updateScrollUi() {
    scrollUpdateQueued = false;
    updateActiveNav();
    updateMobileControlsOnScroll();
}

function queueScrollUiUpdate() {
    if (scrollUpdateQueued) return;
    scrollUpdateQueued = true;
    requestAnimationFrame(updateScrollUi);
}

window.addEventListener('scroll', queueScrollUiUpdate, { passive: true });
updateActiveNav();
window.addEventListener('load', refreshSectionOffsets);
window.addEventListener('resize', refreshSectionOffsets);
if (typeof ResizeObserver !== 'undefined') {
    const pageShell = document.querySelector('.page-shell');
    if (pageShell) new ResizeObserver(refreshSectionOffsets).observe(pageShell);
}

const themes = ['default', 'green', 'blue', 'gold'];
let themeIndex = 0;

document.getElementById('paletteCard').addEventListener('click', () => {
    themeIndex = (themeIndex + 1) % themes.length;
    const theme = themes[themeIndex];
    const isWhite = document.documentElement.getAttribute('data-theme') === 'white';

    if (isWhite) {
        if (theme === 'default') document.documentElement.removeAttribute('data-palette');
        else document.documentElement.setAttribute('data-palette', theme);
    } else if (theme === 'default') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }

    showToast('Palette switched to ' + theme + ' mode.');
});

const typefaceModes = [
    { className: '', label: 'Default' },
    { className: 'mono-mode', label: 'Mono' },
    { className: 'editorial-mode', label: 'Editorial' }
];
let typefaceIndex = 0;
const typefaceCurrent = document.getElementById('typefaceCurrent');

document.getElementById('typefaceCard').addEventListener('click', () => {
    typefaceIndex = (typefaceIndex + 1) % typefaceModes.length;
    document.body.classList.remove('mono-mode', 'editorial-mode');

    const selectedTypeface = typefaceModes[typefaceIndex];
    if (selectedTypeface.className) document.body.classList.add(selectedTypeface.className);
    if (typefaceCurrent) typefaceCurrent.textContent = `${selectedTypeface.label} · ${typefaceIndex + 1}/3`;
    showToast(`${selectedTypeface.label} typeface enabled.`);
});

const vibeCard = document.getElementById('vibeCard');
const vibeCurrent = document.getElementById('vibeCurrent');
const vibeStates = [
    { label: 'Full ambient', toast: 'Ambient lights and card motion enabled.', lightsOff: false, motionOff: false },
    { label: 'Motion only', toast: 'Background lights switched off.', lightsOff: true, motionOff: false },
    { label: 'Still', toast: 'Background lights and card motion paused.', lightsOff: true, motionOff: true }
];
let vibeStateIndex = 0;

if (vibeCard) {
    vibeCard.addEventListener('click', () => {
        vibeStateIndex = (vibeStateIndex + 1) % vibeStates.length;
        const state = vibeStates[vibeStateIndex];
        document.body.classList.toggle('vibe-lights-off', state.lightsOff);
        document.body.classList.toggle('vibe-motion-off', state.motionOff);
        vibeCard.classList.toggle('active', vibeStateIndex === 0);
        vibeCard.setAttribute('aria-label', `Vibes: ${state.label}. Click for the next setting.`);
        if (vibeCurrent) vibeCurrent.textContent = state.label;
        showToast(state.toast);
    });
}

const f1FolderCard = document.getElementById('f1Card');
const f1FolderToggle = document.getElementById('f1FolderToggle');
const f1FolderDetails = document.getElementById('f1FolderDetails');

if (f1FolderCard && f1FolderToggle && f1FolderDetails) {
    const f1MobileLayout = window.matchMedia('(max-width: 980px)');
    const f1FolderSheets = f1FolderCard.querySelectorAll('[data-f1-view]');
    let f1PreviewShown = false;
    let f1PreviewActive = false;
    let f1UserOpened = false;
    let f1PreviewTimer = null;

    const setF1FolderOpen = isOpen => {
        f1FolderCard.classList.toggle('folder-open', isOpen);
        f1FolderToggle.setAttribute('aria-expanded', String(isOpen));
        f1FolderToggle.setAttribute('aria-label', `${isOpen ? 'Close' : 'Open'} F1 Intelligence folder`);
        f1FolderDetails.setAttribute('aria-hidden', String(!isOpen));
        f1FolderSheets.forEach(sheet => {
            sheet.tabIndex = isOpen ? 0 : -1;
            sheet.setAttribute('aria-hidden', String(!isOpen));
        });
    };

    const closeF1Folder = () => {
        clearTimeout(f1PreviewTimer);
        f1PreviewActive = false;
        f1UserOpened = false;
        setF1FolderOpen(false);
    };

    f1FolderToggle.addEventListener('click', event => {
        if (!f1MobileLayout.matches && event.detail !== 0) {
            setF1FolderOpen(true);
            return;
        }

        if (f1PreviewActive) {
            clearTimeout(f1PreviewTimer);
            f1PreviewActive = false;
            f1UserOpened = true;
            setF1FolderOpen(true);
            return;
        }

        f1UserOpened = !f1UserOpened;
        setF1FolderOpen(f1UserOpened);
    });

    f1FolderCard.addEventListener('pointerenter', event => {
        if (!f1MobileLayout.matches && event.pointerType === 'mouse') setF1FolderOpen(true);
    });

    f1FolderCard.addEventListener('pointerleave', event => {
        if (!f1MobileLayout.matches && event.pointerType === 'mouse' && !f1FolderCard.querySelector(':focus-visible')) closeF1Folder();
    });

    f1FolderToggle.addEventListener('focus', () => {
        if (!f1MobileLayout.matches) setF1FolderOpen(true);
    });

    f1FolderCard.addEventListener('focusout', event => {
        if (!f1MobileLayout.matches && !f1FolderCard.contains(event.relatedTarget) && !f1FolderCard.matches(':hover')) closeF1Folder();
    });

    const f1Visibility = new IntersectionObserver(entries => {
        if (!f1MobileLayout.matches) return;
        const visibility = entries[0].intersectionRatio;

        if (visibility < .15) {
            closeF1Folder();
            return;
        }

        if (visibility >= .6 && !f1PreviewShown) {
            f1PreviewShown = true;
            f1PreviewActive = true;
            setF1FolderOpen(true);
            f1PreviewTimer = setTimeout(() => {
                f1PreviewActive = false;
                if (!f1UserOpened) setF1FolderOpen(false);
            }, 2000);
        }
    }, { threshold: [.15, .6] });

    f1Visibility.observe(f1FolderCard);
    f1MobileLayout.addEventListener('change', () => {
        closeF1Folder();
    });
}

document.getElementById('contrastCard').addEventListener('click', () => {
    document.body.classList.toggle('contrast-mode');
    showToast(document.body.classList.contains('contrast-mode') ? 'High contrast enabled.' : 'Standard contrast restored.');
});

document.querySelectorAll('.project-filter button').forEach(button => {
    button.addEventListener('click', () => {
        const filter = button.dataset.filter;

        document.querySelectorAll('.project-filter button').forEach(item => item.classList.remove('active'));
        button.classList.add('active');

        document.querySelectorAll('.project-card').forEach(card => {
            const categories = card.dataset.category || '';
            card.classList.toggle('hidden', filter !== 'all' && !categories.includes(filter));
        });
    });
});

const projectDetails = {
    'Educational Coding Platform': 'A prototype for gamified programming lessons using responsive interfaces, FastAPI routes, SQLite3 schema planning, code-feedback workflows, and student progress tracking.',
    'Healthcare Workflow Automation': 'Production automations for visit confirmation, invoice balance adjustments, and rejected claims. These workflows remove approximately 50, 40, and 10 hours of weekly manual work respectively, using UiPath, Python, JavaScript, and API integrations.',
    'Large-Scale Web Extraction & Code Parsing': 'A Python and JavaScript workflow for ingesting a 25-page web platform, removing layout-heavy markup, and producing standalone files for analysis and reuse.',
    'Automated Electric Groundnut Roaster': 'C++ and microcontroller software for an automated roasting system, connecting sensor input, heating control, and physical operation.',
    'UI Replication & Front-End Systems': 'Responsive Figma-to-code interfaces with working navigation, search, modals, mobile menus, translation controls, and stateful DOM behaviour.'
};

document.querySelectorAll('.project-more').forEach(button => {
    button.addEventListener('click', () => {
        const card = button.closest('.project-card');
        const title = card.querySelector('h3').textContent;
        openModal(title, projectDetails[title] || card.querySelector('p').textContent, button);
    });
});

// Immediate, reversible press feedback for primary interactive surfaces.
document.querySelectorAll([
    '.console-control',
    '.project-filter button',
    '.project-more',
    '.theme-toggle-card',
    '.language-trigger',
    '.language-menu button',
    '.enter-site',
    '.primary-action',
    '.ghost-action',
    '.mobile-menu-button'
].join(',')).forEach(control => {
    const release = () => control.classList.remove('is-pressed');

    control.addEventListener('pointerdown', event => {
        if (event.button !== undefined && event.button !== 0) return;
        control.classList.add('is-pressed');
    });
    control.addEventListener('pointerup', release);
    control.addEventListener('pointercancel', release);
    control.addEventListener('pointerleave', release);
    control.addEventListener('blur', release);
});

function setClock(timeId, dateId, timeZone, label) {
    const now = new Date();

    const timeElement = document.getElementById(timeId);
    const dateElement = document.getElementById(dateId);

    if (!timeElement || !dateElement) return;

    timeElement.textContent = new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(now);

    dateElement.textContent = label + ' · ' + new Intl.DateTimeFormat('en-GB', {
        timeZone,
        weekday: 'short',
        day: '2-digit',
        month: 'short'
    }).format(now);
}

function updateClocks() {
    const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos';

    setClock('localTime', 'localDate', localZone, localZone);
    setClock('ukTime', 'ukDate', 'Europe/London', 'United Kingdom');
    setClock('usTime', 'usDate', 'America/New_York', 'United States');
}

updateClocks();
setInterval(updateClocks, 1000);

document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        closeModal();
        sidebar.classList.remove('active');
        document.body.classList.remove('nav-open');
    }
});


const metricCounters = document.querySelectorAll('.counter');

function formatCounterValue(value, counter) {
    const decimals = Number(counter.dataset.decimals || 0);
    const prefix = counter.dataset.prefix || '';
    const suffix = counter.dataset.suffix || '';
    const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-GB');

    return prefix + formatted + suffix;
}

const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting || entry.target.dataset.done) return;

        const counter = entry.target;
        const target = Number(counter.dataset.target || 0);
        const duration = 1500;
        const startTime = performance.now();

        counter.dataset.done = 'true';

        function animateCounter(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = target * eased;

            counter.textContent = formatCounterValue(current, counter);

            if (progress < 1) {
                requestAnimationFrame(animateCounter);
            } else {
                counter.textContent = formatCounterValue(target, counter);
            }
        }

        requestAnimationFrame(animateCounter);
    });
}, { threshold: 0.45 });

metricCounters.forEach(counter => counterObserver.observe(counter));


const themeToggle = document.getElementById('themeToggle');

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const isWhite = document.documentElement.getAttribute('data-theme') === 'white';

        if (isWhite) {
            if (themes[themeIndex] === 'default') document.documentElement.removeAttribute('data-theme');
            else document.documentElement.setAttribute('data-theme', themes[themeIndex]);
            document.documentElement.removeAttribute('data-palette');
            themeToggle.querySelector('.theme-mode-word').textContent = 'White';
            showToast('Dark portfolio mode restored.');
        } else {
            document.documentElement.setAttribute('data-theme', 'white');
            if (themes[themeIndex] === 'default') document.documentElement.removeAttribute('data-palette');
            else document.documentElement.setAttribute('data-palette', themes[themeIndex]);
            themeToggle.querySelector('.theme-mode-word').textContent = 'Dark';
            showToast('White reading mode enabled.');
        }
    });
}


const languageSelector = document.getElementById('languageSelector');
const languageTrigger = document.getElementById('languageTrigger');
const languageCurrent = document.getElementById('languageCurrent');
const languageOptions = document.querySelectorAll('[data-language]');

window.googleTranslateElementInit = function googleTranslateElementInit() {
    if (!window.google?.translate || !document.getElementById('google_translate_element')) return;
    new window.google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'en,fr,ha,ig,yo',
        autoDisplay: false
    }, 'google_translate_element');
};

function closeLanguageMenu() {
    if (!languageSelector || !languageTrigger) return;
    languageSelector.classList.remove('open');
    languageTrigger.setAttribute('aria-expanded', 'false');
}

function applyGoogleLanguage(languageCode, attempts = 0) {
    const googleSelect = document.querySelector('.goog-te-combo');
    if (!googleSelect && attempts < 20) {
        setTimeout(() => applyGoogleLanguage(languageCode, attempts + 1), 150);
        return;
    }

    if (!googleSelect) {
        showToast('Translation service is unavailable. Please try again shortly.');
        return;
    }

    googleSelect.value = languageCode;
    googleSelect.dispatchEvent(new Event('change'));
}

if (languageTrigger && languageSelector) {
    const savedLanguage = localStorage.getItem('portfolio-language') || 'en';
    const savedOption = Array.from(languageOptions).find(option => option.dataset.language === savedLanguage);
    if (savedOption) {
        languageCurrent.textContent = savedOption.dataset.label;
        languageOptions.forEach(item => item.setAttribute('aria-selected', String(item === savedOption)));
    }

    languageTrigger.addEventListener('click', event => {
        event.stopPropagation();
        const isOpen = languageSelector.classList.toggle('open');
        languageTrigger.setAttribute('aria-expanded', String(isOpen));
    });

    languageOptions.forEach(option => {
        option.addEventListener('click', () => {
            const languageCode = option.dataset.language;
            languageCurrent.textContent = option.dataset.label;
            languageOptions.forEach(item => item.setAttribute('aria-selected', String(item === option)));
            localStorage.setItem('portfolio-language', languageCode);
            closeLanguageMenu();
            applyGoogleLanguage(languageCode);
        });
    });

    document.addEventListener('click', event => {
        if (!languageSelector.contains(event.target)) closeLanguageMenu();
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeLanguageMenu();
    });

    if (savedLanguage !== 'en') {
        window.addEventListener('load', () => applyGoogleLanguage(savedLanguage));
    }
}


// V5 mobile menu accessibility polish.
if (mobileMenuButton && sidebar) {
    mobileMenuButton.setAttribute('aria-expanded', sidebar.classList.contains('active') ? 'true' : 'false');

    mobileMenuButton.addEventListener('click', () => {
        setTimeout(() => {
            mobileMenuButton.setAttribute('aria-expanded', sidebar.classList.contains('active') ? 'true' : 'false');
        }, 0);
    });

    document.querySelectorAll('.side-nav a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuButton.setAttribute('aria-expanded', 'false');
        });
    });
}



// V7 fix Applications nav and close menu state.
document.querySelectorAll('.side-nav a').forEach(link => {
    link.addEventListener('click', () => {
        if (mobileMenuButton) {
            mobileMenuButton.setAttribute('aria-expanded', 'false');
        }
    });
});


// Top controls recede while scrolling down and return when scrolling reverses.
let lastMobileScrollY = window.scrollY;
function updateMobileControlsOnScroll() {
    const currentY = window.scrollY;
    const isMobileLayout = window.innerWidth <= 980;

    if (isMobileLayout) {
        document.body.classList.toggle('mobile-brand-away', currentY > 24);
        const scrollingDown = currentY > lastMobileScrollY + 2 && currentY > 90;
        const scrollingUp = currentY < lastMobileScrollY - 2;
        if (scrollingDown) document.body.classList.add('mobile-controls-dim');
        if (scrollingUp || currentY < 90) document.body.classList.remove('mobile-controls-dim');
        lastMobileScrollY = Math.max(currentY, 0);
        return;
    }

    document.body.classList.remove('mobile-brand-away');

    const scrollingDown = currentY > lastMobileScrollY + 2 && currentY > 90;
    const scrollingUp = currentY < lastMobileScrollY - 2;

    if (scrollingDown) document.body.classList.add('mobile-controls-dim');
    if (scrollingUp || currentY < 90) document.body.classList.remove('mobile-controls-dim');

    lastMobileScrollY = Math.max(currentY, 0);
}

window.addEventListener('resize', queueScrollUiUpdate);
window.addEventListener('load', queueScrollUiUpdate);


// V16 restore mobile menu and social-icon state when returning via browser history/BFCache.
function restorePortfolioUiState() {
    document.querySelectorAll('.sidebar-footer .social-icon').forEach(icon => {
        icon.style.removeProperty('display');
        icon.style.removeProperty('visibility');
        icon.style.removeProperty('opacity');
        icon.style.removeProperty('transform');
    });

    document.querySelectorAll('.sidebar-footer .social-svg').forEach(icon => {
        icon.style.removeProperty('display');
        icon.style.removeProperty('visibility');
        icon.style.removeProperty('opacity');
        icon.style.removeProperty('filter');
    });

    if (sidebar && mobileMenuButton) {
        mobileMenuButton.setAttribute(
            'aria-expanded',
            sidebar.classList.contains('active') ? 'true' : 'false'
        );
    }
}

window.addEventListener('pageshow', restorePortfolioUiState);
window.addEventListener('focus', restorePortfolioUiState);
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) restorePortfolioUiState();
});


// Spotify listening card. Credentials remain in the serverless API route.
const spotifyCard = document.getElementById('spotifyCard');
const spotifyArtwork = document.getElementById('spotifyArtwork');
const spotifyArtworkPlaceholder = document.getElementById('spotifyArtworkPlaceholder');
const spotifyStatus = document.getElementById('spotifyStatus');
const spotifyHeading = document.getElementById('spotifyHeading');
const spotifyArtist = document.getElementById('spotifyArtist');
const spotifyLink = document.getElementById('spotifyLink');
const spotifyPulse = document.getElementById('spotifyPulse');

async function loadSpotifyStatus() {
    if (!spotifyCard) return;

    try {
        const response = await fetch('/api/spotify', {
            headers: { Accept: 'application/json' }
        });

        if (!response.ok) throw new Error('Spotify status is unavailable');

        const song = await response.json();
        spotifyCard.classList.toggle('is-playing', song.isPlaying);
        spotifyPulse.classList.toggle('is-live', song.isPlaying);
        spotifyStatus.textContent = song.isPlaying ? 'Now playing' : 'Last played';
        spotifyHeading.textContent = song.title;
        spotifyArtist.textContent = song.artist;

        if (song.albumArt) {
            spotifyArtwork.src = song.albumArt;
            spotifyArtwork.alt = `${song.title} album artwork`;
            spotifyArtwork.hidden = false;
            spotifyArtworkPlaceholder.hidden = true;
        }

        if (song.spotifyUrl) {
            spotifyLink.href = song.spotifyUrl;
            spotifyLink.hidden = false;
        }
    } catch (error) {
        spotifyCard.classList.add('is-unavailable');
        spotifyStatus.textContent = 'Spotify';
        spotifyHeading.textContent = 'Listening status unavailable';
        spotifyArtist.textContent = 'The music feed will return shortly.';
    }
}

window.addEventListener('load', loadSpotifyStatus);

// WakaTime activity card. The OAuth token is used only by the serverless route.
const wakatimeStatus = document.getElementById('wakatimeStatus');
const wakatimeHeading = document.getElementById('wakatimeHeading');
const wakatimeDetail = document.getElementById('wakatimeDetail');
const wakatimeLink = document.getElementById('wakatimeLink');

function setWakatimeHeading(text) {
    if (!wakatimeHeading) return;
    wakatimeHeading.textContent = text;
    wakatimeHeading.classList.toggle('is-long-title', text.length > 32);
    wakatimeHeading.classList.toggle('is-very-long-title', text.length > 52);
}

async function loadWakatimeStatus() {
    if (!wakatimeHeading) return;

    try {
        const response = await fetch('/api/wakatime', { cache: 'no-store', headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error('WakaTime activity is unavailable');

        const activity = await response.json();
        wakatimeStatus.textContent = activity.isActive ? 'Coding now' : activity.relativeTime;
        setWakatimeHeading(activity.project
            ? `Working on ${activity.project}`
            : 'See what I am working on');
        wakatimeDetail.textContent = [activity.language, activity.category].filter(Boolean).join(' · ') || 'Recent development activity';
        if (activity.profileUrl) wakatimeLink.href = activity.profileUrl;
    } catch (error) {
        wakatimeStatus.textContent = 'Development status';
        setWakatimeHeading('See what I am working on');
        wakatimeDetail.textContent = 'WakaTime connection is waiting to be configured.';
    }
}

window.addEventListener('load', loadWakatimeStatus);
window.setInterval(() => {
    if (!document.hidden) loadWakatimeStatus();
}, 60_000);
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) loadWakatimeStatus();
});

