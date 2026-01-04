/**
 * Add to Calendar PWA
 * Handles share target, event parsing, and calendar integration
 */

// ===== Configuration =====
const CONFIG = {
    // Proxy URL for CORS bypass (will need to be deployed)
    proxyUrl: 'https://api.allorigins.win/raw?url=',
    // Alternative proxies if needed:
    // proxyUrl: 'https://corsproxy.io/?',
    // proxyUrl: '/api/proxy?url=',

    // TinkerHub event URL pattern
    eventUrlPattern: /tinkerhub\.org\/events\/([A-Z0-9]+)\//i,

    // Default event duration in hours if end time not found
    defaultDurationHours: 2,

    // Timezone
    timezone: 'Asia/Kolkata'
};

// ===== DOM Elements =====
const elements = {
    landingPage: document.getElementById('landing-page'),
    sharePage: document.getElementById('share-page'),
    loadingState: document.getElementById('loading-state'),
    eventState: document.getElementById('event-state'),
    errorState: document.getElementById('error-state'),
    installBtn: document.getElementById('install-btn'),
    manualUrl: document.getElementById('manual-url'),
    manualBtn: document.getElementById('manual-btn'),
    retryBtn: document.getElementById('retry-btn'),
    addGoogleCal: document.getElementById('add-google-cal'),
    downloadIcs: document.getElementById('download-ics'),
    eventTitle: document.getElementById('event-title'),
    eventType: document.getElementById('event-type'),
    eventDate: document.getElementById('event-date'),
    eventTime: document.getElementById('event-time'),
    eventLocation: document.getElementById('event-location'),
    eventDescriptionShort: document.getElementById('event-description-short'),
    eventSourceLink: document.getElementById('event-source-link'),
    errorMessage: document.getElementById('error-message')
};

// ===== State =====
let currentEventData = null;
let deferredInstallPrompt = null;

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Check URL for share target or route
    const urlParams = new URLSearchParams(window.location.search);
    const path = window.location.pathname;

    // Handle share target route
    if (path === '/share' || path === '/share.html' || urlParams.has('url') || urlParams.has('text')) {
        handleShareTarget(urlParams);
    } else {
        showLandingPage();
    }

    // Setup event listeners
    setupEventListeners();

    // Setup PWA install
    setupPWAInstall();

    // Register service worker
    registerServiceWorker();
}

// ===== Event Listeners =====
function setupEventListeners() {
    // Manual URL submission
    elements.manualBtn?.addEventListener('click', () => {
        const url = elements.manualUrl?.value?.trim();
        if (url) {
            handleEventUrl(url);
        }
    });

    elements.manualUrl?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            elements.manualBtn?.click();
        }
    });

    // Retry button
    elements.retryBtn?.addEventListener('click', () => {
        if (currentEventData?.sourceUrl) {
            handleEventUrl(currentEventData.sourceUrl);
        }
    });

    // Calendar buttons
    elements.addGoogleCal?.addEventListener('click', () => {
        if (currentEventData) {
            openGoogleCalendar(currentEventData);
        }
    });

    elements.downloadIcs?.addEventListener('click', () => {
        if (currentEventData) {
            downloadIcsFile(currentEventData);
        }
    });

    // Install button
    elements.installBtn?.addEventListener('click', async () => {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            const { outcome } = await deferredInstallPrompt.userChoice;
            if (outcome === 'accepted') {
                elements.installBtn.textContent = '✓ Installed';
                elements.installBtn.disabled = true;
            }
            deferredInstallPrompt = null;
        }
    });
}

// ===== PWA Install =====
function setupPWAInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        elements.installBtn?.classList.remove('hidden');
    });

    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        if (elements.installBtn) {
            elements.installBtn.textContent = '✓ Installed';
            elements.installBtn.disabled = true;
        }
    });

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
        if (elements.installBtn) {
            elements.installBtn.textContent = '✓ Installed';
            elements.installBtn.disabled = true;
        }
    }
}

// ===== Service Worker =====
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registered:', reg.scope))
            .catch(err => console.log('SW registration failed:', err));
    }
}

// ===== Page Navigation =====
function showLandingPage() {
    elements.landingPage?.classList.remove('hidden');
    elements.sharePage?.classList.add('hidden');
}

function showSharePage() {
    elements.landingPage?.classList.add('hidden');
    elements.sharePage?.classList.remove('hidden');
}

function showLoadingState() {
    showSharePage();
    elements.loadingState?.classList.remove('hidden');
    elements.eventState?.classList.add('hidden');
    elements.errorState?.classList.add('hidden');
}

function showEventState() {
    elements.loadingState?.classList.add('hidden');
    elements.eventState?.classList.remove('hidden');
    elements.errorState?.classList.add('hidden');
}

function showErrorState(message) {
    elements.loadingState?.classList.add('hidden');
    elements.eventState?.classList.add('hidden');
    elements.errorState?.classList.remove('hidden');
    if (elements.errorMessage) {
        elements.errorMessage.textContent = message;
    }
}

// ===== Share Target Handler =====
function handleShareTarget(urlParams) {
    // Try to find event URL from share data
    let eventUrl = urlParams.get('url') || '';
    const text = urlParams.get('text') || '';
    const title = urlParams.get('title') || '';

    // If no direct URL, try to extract from text
    if (!eventUrl && text) {
        const urlMatch = text.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
            eventUrl = urlMatch[0];
        }
    }

    // Clean up URL (remove trailing question marks, etc.)
    eventUrl = eventUrl.replace(/\?$/, '').trim();

    if (eventUrl && CONFIG.eventUrlPattern.test(eventUrl)) {
        handleEventUrl(eventUrl);
    } else if (eventUrl) {
        // Try anyway, might work
        handleEventUrl(eventUrl);
    } else {
        showLandingPage();
        // Pre-fill manual input if we have any text
        if (text && elements.manualUrl) {
            elements.manualUrl.value = text;
        }
    }
}

// ===== Event URL Handler =====
async function handleEventUrl(url) {
    showLoadingState();

    try {
        const eventData = await fetchAndParseEvent(url);
        currentEventData = eventData;
        displayEventData(eventData);
        showEventState();
    } catch (error) {
        console.error('Error fetching event:', error);
        currentEventData = { sourceUrl: url };
        showErrorState(error.message || 'Failed to fetch event details. Please try again.');
    }
}

// ===== Fetch and Parse Event =====
async function fetchAndParseEvent(url) {
    // Use CORS proxy
    const proxyUrl = CONFIG.proxyUrl + encodeURIComponent(url);

    const response = await fetch(proxyUrl, {
        headers: {
            'Accept': 'text/html,application/xhtml+xml'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch event page (${response.status})`);
    }

    const html = await response.text();
    return parseEventHtml(html, url);
}

// ===== Parse Event HTML =====
function parseEventHtml(html, sourceUrl) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract event data using multiple strategies
    const eventData = {
        title: '',
        description: '',
        startDate: null,
        endDate: null,
        rawStartTime: '',  // Store original time string for display
        rawEndTime: '',    // Store original time string for display
        rawStartDate: '',  // Store original date string for display
        rawEndDate: '',    // Store original date string for display
        location: '',
        type: 'Event',
        sourceUrl: sourceUrl
    };

    // Strategy 1: OG Meta Tags
    const ogTitle = doc.querySelector('meta[property="og:title"]')?.content;
    const ogDescription = doc.querySelector('meta[property="og:description"]')?.content;

    // Strategy 2: Page title
    const pageTitle = doc.querySelector('title')?.textContent?.split('»')[0]?.trim();

    // Strategy 3: Main heading
    const mainHeading = doc.querySelector('h1, h2')?.textContent?.trim();

    // Set title (priority: OG > heading > page title)
    eventData.title = ogTitle || mainHeading || pageTitle || 'TinkerHub Event';

    // Clean up title (remove " » TinkerHub" suffix)
    eventData.title = eventData.title.replace(/\s*[»|]\s*TinkerHub$/i, '').trim();

    // Set description
    eventData.description = ogDescription || '';

    // Extract event type from badges/tags
    const badges = doc.querySelectorAll('[class*="badge"], [class*="tag"], [class*="chip"]');
    badges.forEach(badge => {
        const text = badge.textContent?.trim().toLowerCase();
        if (['workshop', 'hackathon', 'meetup', 'talk', 'webinar', 'conference', 'bootcamp'].includes(text)) {
            eventData.type = badge.textContent.trim();
        }
    });

    // Also check for specific text patterns
    const bodyText = doc.body?.textContent || '';
    if (bodyText.includes('Workshop')) eventData.type = 'Workshop';
    else if (bodyText.includes('Hackathon')) eventData.type = 'Hackathon';
    else if (bodyText.includes('Meetup')) eventData.type = 'Meetup';

    // Extract dates - Look for date patterns in the HTML
    // TinkerHub pages have dates like "Jan 10" and times like "9:00 AM" on separate lines
    const allText = doc.body?.innerText || '';

    // Find all date and time patterns
    const monthDayPattern = /(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})/gi;
    const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM)/gi;

    const monthMatches = [...allText.matchAll(monthDayPattern)];
    const timeMatches = [...allText.matchAll(timePattern)];

    // Parse the dates we found
    const year = new Date().getFullYear();

    if (monthMatches.length >= 1 && timeMatches.length >= 1) {
        // Store raw strings for display
        eventData.rawStartDate = monthMatches[0][0];
        eventData.rawStartTime = timeMatches[0][0];

        // Parse start date components
        const startMonth = parseMonth(monthMatches[0][1]);
        const startDay = parseInt(monthMatches[0][2]);
        const startHour = parseHour(parseInt(timeMatches[0][1]), timeMatches[0][3]);
        const startMinute = parseInt(timeMatches[0][2]);

        // Create date in IST by adjusting for timezone offset
        // IST is UTC+5:30, so we subtract 5:30 to store as UTC equivalent
        eventData.startDate = createISTDate(year, startMonth, startDay, startHour, startMinute);

        // If the date is in the past, assume next year
        const now = new Date();
        if (eventData.startDate < now) {
            eventData.startDate = createISTDate(year + 1, startMonth, startDay, startHour, startMinute);
        }

        // End date
        if (monthMatches.length >= 2 && timeMatches.length >= 2) {
            eventData.rawEndDate = monthMatches[1][0];
            eventData.rawEndTime = timeMatches[1][0];

            const endMonth = parseMonth(monthMatches[1][1]);
            const endDay = parseInt(monthMatches[1][2]);
            const endHour = parseHour(parseInt(timeMatches[1][1]), timeMatches[1][3]);
            const endMinute = parseInt(timeMatches[1][2]);

            eventData.endDate = createISTDate(year, endMonth, endDay, endHour, endMinute);

            // If end is before start, assume next year
            if (eventData.endDate < eventData.startDate) {
                eventData.endDate = createISTDate(eventData.startDate.getFullYear() + 1, endMonth, endDay, endHour, endMinute);
            }
        } else if (timeMatches.length >= 2) {
            // Same day, different end time
            eventData.rawEndDate = eventData.rawStartDate;
            eventData.rawEndTime = timeMatches[1][0];

            const endHour = parseHour(parseInt(timeMatches[1][1]), timeMatches[1][3]);
            const endMinute = parseInt(timeMatches[1][2]);
            eventData.endDate = createISTDate(
                eventData.startDate.getFullYear(),
                startMonth,
                startDay,
                endHour,
                endMinute
            );
        } else {
            // Default duration (2 hours)
            eventData.endDate = new Date(eventData.startDate.getTime() + CONFIG.defaultDurationHours * 60 * 60 * 1000);
            eventData.rawEndTime = '';
        }
    }

    // Extract location - look for TinkerSpace or location-related text
    const locationPatterns = [
        /TinkerSpace\s+\w+/gi,
        /Location:\s*([^\n]+)/gi,
        /Venue:\s*([^\n]+)/gi
    ];

    for (const pattern of locationPatterns) {
        const match = allText.match(pattern);
        if (match) {
            eventData.location = match[0].replace(/^(Location|Venue):\s*/i, '').trim();
            break;
        }
    }

    // If no location found, try to find TinkerSpace mentions
    if (!eventData.location) {
        const tinkerSpaceMatch = allText.match(/TinkerSpace\s*\w*/i);
        if (tinkerSpaceMatch) {
            eventData.location = tinkerSpaceMatch[0];
        }
    }

    return eventData;
}

// ===== Date Parsing Helpers =====
function parseMonth(monthStr) {
    const months = {
        'jan': 0, 'january': 0,
        'feb': 1, 'february': 1,
        'mar': 2, 'march': 2,
        'apr': 3, 'april': 3,
        'may': 4,
        'jun': 5, 'june': 5,
        'jul': 6, 'july': 6,
        'aug': 7, 'august': 7,
        'sep': 8, 'september': 8,
        'oct': 9, 'october': 9,
        'nov': 10, 'november': 10,
        'dec': 11, 'december': 11
    };
    return months[monthStr.toLowerCase()] ?? 0;
}

function parseHour(hour, ampm) {
    if (ampm.toUpperCase() === 'PM' && hour !== 12) {
        return hour + 12;
    } else if (ampm.toUpperCase() === 'AM' && hour === 12) {
        return 0;
    }
    return hour;
}

// Create a Date object that represents a specific time in IST
// This adjusts the UTC time so that when converted to IST, it shows the intended time
function createISTDate(year, month, day, hour, minute) {
    // Create a date string in ISO format with IST timezone offset (+05:30)
    const pad = (n) => n.toString().padStart(2, '0');
    const isoString = `${year}-${pad(month + 1)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+05:30`;
    return new Date(isoString);
}

// ===== Display Event Data =====
function displayEventData(eventData) {
    if (elements.eventTitle) {
        elements.eventTitle.textContent = eventData.title;
    }

    if (elements.eventType) {
        elements.eventType.textContent = eventData.type;
    }

    if (elements.eventDate && eventData.startDate) {
        // Use raw strings if available, otherwise format from Date objects
        if (eventData.rawStartDate) {
            let dateStr = eventData.rawStartDate;
            if (eventData.rawEndDate && eventData.rawEndDate !== eventData.rawStartDate) {
                dateStr += ` - ${eventData.rawEndDate}`;
            }
            // Add year
            dateStr += `, ${eventData.startDate.getFullYear()}`;
            elements.eventDate.textContent = dateStr;
        } else {
            const options = { month: 'long', day: 'numeric', year: 'numeric', timeZone: CONFIG.timezone };
            let dateStr = eventData.startDate.toLocaleDateString('en-US', options);

            if (eventData.endDate && eventData.endDate.getDate() !== eventData.startDate.getDate()) {
                dateStr = `${eventData.startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: CONFIG.timezone })} - ${eventData.endDate.toLocaleDateString('en-US', options)}`;
            }

            elements.eventDate.textContent = dateStr;
        }
    }

    if (elements.eventTime && eventData.startDate) {
        // Use raw time strings if available
        if (eventData.rawStartTime) {
            let timeStr = eventData.rawStartTime;
            if (eventData.rawEndTime) {
                timeStr += ` - ${eventData.rawEndTime}`;
            }
            elements.eventTime.textContent = timeStr;
        } else {
            const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: CONFIG.timezone };
            let timeStr = eventData.startDate.toLocaleTimeString('en-US', timeOptions);

            if (eventData.endDate) {
                timeStr += ` - ${eventData.endDate.toLocaleTimeString('en-US', timeOptions)}`;
            }

            elements.eventTime.textContent = timeStr;
        }
    }

    if (elements.eventLocation) {
        elements.eventLocation.textContent = eventData.location || 'Location TBA';
    }

    if (elements.eventDescriptionShort) {
        const shortDesc = eventData.description?.length > 150
            ? eventData.description.substring(0, 150) + '...'
            : eventData.description || 'No description available.';
        elements.eventDescriptionShort.textContent = shortDesc;
    }

    if (elements.eventSourceLink) {
        elements.eventSourceLink.href = eventData.sourceUrl;
    }
}

// ===== Calendar Integration =====
function formatDateForGoogle(date) {
    // Format: YYYYMMDDTHHMMSS (local time, Google handles conversion)
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

function openGoogleCalendar(eventData) {
    if (!eventData.startDate || !eventData.endDate) {
        alert('Could not determine event dates. Please check the original event page.');
        return;
    }

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: eventData.title,
        dates: `${formatDateForGoogle(eventData.startDate)}/${formatDateForGoogle(eventData.endDate)}`,
        details: `${eventData.description}\n\nOriginal event: ${eventData.sourceUrl}`,
        location: eventData.location || '',
        ctz: CONFIG.timezone
    });

    const googleCalUrl = `https://calendar.google.com/calendar/render?${params.toString()}`;
    window.open(googleCalUrl, '_blank');
}

function downloadIcsFile(eventData) {
    if (!eventData.startDate || !eventData.endDate) {
        alert('Could not determine event dates. Please check the original event page.');
        return;
    }

    const formatIcsDate = (date) => {
        const pad = (n) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
    };

    const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@add2cal`;
    const now = new Date();

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Add to Calendar//TinkerHub Events//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${formatIcsDate(now)}`,
        `DTSTART;TZID=${CONFIG.timezone}:${formatIcsDate(eventData.startDate)}`,
        `DTEND;TZID=${CONFIG.timezone}:${formatIcsDate(eventData.endDate)}`,
        `SUMMARY:${eventData.title.replace(/,/g, '\\,')}`,
        `DESCRIPTION:${(eventData.description + '\\n\\nOriginal event: ' + eventData.sourceUrl).replace(/\n/g, '\\n').replace(/,/g, '\\,')}`,
        `LOCATION:${(eventData.location || '').replace(/,/g, '\\,')}`,
        `URL:${eventData.sourceUrl}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventData.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
