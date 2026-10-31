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
const matrixLineOne = document.getElementById('matrixLineOne');
const matrixFinal = document.getElementById('matrixFinal');
const buildLabStage = document.getElementById('buildLabStage');

function typeInto(element, text, speed = 76) {
    return new Promise(resolve => {
        let index = 0;
        element.textContent = '';

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
    await typeInto(matrixLineOne, 'welcome neo...', 55);
    await new Promise(resolve => setTimeout(resolve, 420));

    matrixLineOne.parentElement.style.display = 'none';

    if (buildLabStage) buildLabStage.classList.add('show');
    await typeInto(matrixFinal, 'Welcome to my build lab', 38);

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
    setTimeout(runMatrixWelcome, 250);
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

function openModal(title, body) {
    modalTitle.textContent = title;
    modalText.textContent = body;
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

document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', event => {
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

function updateActiveNav() {
    const scrollPosition = window.scrollY + window.innerHeight * 0.32;

    let activeId = sections[0]?.id;

    sections.forEach(section => {
        if (section.offsetTop <= scrollPosition) {
            activeId = section.id;
        }
    });

    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + activeId);
    });
}

window.addEventListener('scroll', updateActiveNav);
updateActiveNav();

const themes = ['default', 'green', 'blue', 'gold'];
let themeIndex = 0;

document.getElementById('paletteCard').addEventListener('click', () => {
    themeIndex = (themeIndex + 1) % themes.length;
    const theme = themes[themeIndex];

    if (theme === 'default') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }

    showToast('Palette switched to ' + theme + ' mode.');
});

document.getElementById('typefaceCard').addEventListener('click', () => {
    document.body.classList.toggle('mono-mode');
    showToast(document.body.classList.contains('mono-mode') ? 'Mono engineering type enabled.' : 'Default typeface restored.');
});

document.getElementById('vibeCard').addEventListener('click', () => {
    document.body.classList.toggle('vibe-mode');
    showToast(document.body.classList.contains('vibe-mode') ? 'Vibes enabled.' : 'Vibes paused.');
});

document.getElementById('focusCard').addEventListener('click', () => {
    document.body.classList.toggle('focus-mode');
    showToast(document.body.classList.contains('focus-mode') ? 'Focus mode enabled.' : 'Focus mode disabled.');
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
    'Front-End & Full-Stack Educational Coding Platform': 'A gamified learning platform concept with responsive UI, FastAPI endpoints, SQLite3 schema planning, real-time code feedback, and progress tracking per student.',
    'Healthcare Revenue Cycle Management Automation': 'A production-level RPA solution for eBilling claims workflows, dynamic claim-count reading, robust selector handling, Orchestrator asset state, and rolling 14-day reporting cycles.',
    'Large-Scale Web Extraction & Code Parsing': 'A Python and JavaScript extraction workflow for a 25-page platform, stripping complex layouts and restructuring clean standalone files for analysis and reuse.',
    'Automated Electric Groundnut Roaster': 'A hardware/software system integrating C++ logic, AC resistive heating, electrical routing, and sensor ports for controlled roasting automation.',
    'UI Replication & Front-End Systems': 'Front-end builds including State House pages, Carbon-style pages, FitMaker Figma-to-code, toast/modals, functional search, Google Translate integration, and responsive menus.',
    'Agent Bob API Workflow Recorder': 'A product concept for recording browser API calls, grouping them into workflow steps, and generating RPA prompts or VB.NET implementation notes.'
};

document.querySelectorAll('.project-more').forEach(button => {
    button.addEventListener('click', () => {
        const card = button.closest('.project-card');
        const title = card.querySelector('h3').textContent;
        openModal(title, projectDetails[title] || card.querySelector('p').textContent);
    });
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
            document.documentElement.removeAttribute('data-theme');
            document.documentElement.removeAttribute('data-palette');
            themeToggle.querySelector('.theme-toggle-label').textContent = 'White Mode';
            showToast('Dark portfolio mode restored.');
        } else {
            document.documentElement.setAttribute('data-theme', 'white');
            document.documentElement.setAttribute('data-palette', themes[themeIndex] === 'default' ? '' : themes[themeIndex]);
            themeToggle.querySelector('.theme-toggle-label').textContent = 'Dark Mode';
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



const buildProgressBar = document.getElementById('buildProgressBar');
const buildProgressText = document.getElementById('buildProgressText');
function animateBuildProgress() {
    if (!buildProgressBar || !buildProgressText) return;
    const target = 90;
    const duration = 2400;
    const start = performance.now();
    function update(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(target * eased);
        buildProgressBar.style.width = value + '%';
        buildProgressText.textContent = value + '%';
        if (progress < 1) requestAnimationFrame(update);
        else { buildProgressBar.style.width = target + '%'; buildProgressText.textContent = target + '%'; }
    }
    requestAnimationFrame(update);
}
window.addEventListener('load', animateBuildProgress);


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
let mobileControlTimer = null;

function updateMobileControlsOnScroll() {
    const currentY = window.scrollY;
    const scrollingDown = currentY > lastMobileScrollY + 2 && currentY > 90;
    const scrollingUp = currentY < lastMobileScrollY - 2;

    if (scrollingDown) document.body.classList.add('mobile-controls-dim');
    if (scrollingUp || currentY < 90) document.body.classList.remove('mobile-controls-dim');

    clearTimeout(mobileControlTimer);
    mobileControlTimer = setTimeout(() => {
        if (window.scrollY < 90) {
            document.body.classList.remove('mobile-controls-dim');
        }
    }, 180);

    lastMobileScrollY = Math.max(currentY, 0);
}

window.addEventListener('scroll', updateMobileControlsOnScroll, { passive: true });
window.addEventListener('resize', updateMobileControlsOnScroll);


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

