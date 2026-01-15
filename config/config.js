/**
 * Configuration settings for Google Maps Crawler
 */

module.exports = {
    // Browser settings
    browser: {
        headless: false, // Keep as false - visible mode is more reliable
        defaultViewport: null,
        args: [
            '--start-maximized',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    },

    // User agent string
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

    // Timing settings (in milliseconds)
    delays: {
        pageLoad: 2000,           // Wait after page navigation
        cookieConsent: 2000,      // Wait for cookie dialog
        afterCookieAccept: 3000,  // Wait after accepting cookies
        resultsLoad: 4000,        // Wait for results to load
        scrollWait: 2000,         // Wait between scroll attempts
        businessClick: 2000       // Wait after clicking on business
    },

    // Scroll settings
    scroll: {
        maxAttempts: 10,          // Maximum number of scroll attempts
        selector: '[role="feed"]' // Scrollable element selector
    },

    // Selectors for Google Maps elements
    selectors: {
        feed: '[role="feed"]',
        articles: 'div[role="article"]',
        businessLink: 'a.hfpxzc',
        phoneButton: 'button[data-item-id^="phone"]',
        addressButton: 'button[data-item-id="address"]',
        addressElements: 'div[class*="fontBodyMedium"]'
    },

    // Output settings
    output: {
        defaultFilename: 'google_maps_results.json',
        indent: 2 // JSON indentation
    }
};
