# Google Maps Crawler

A Node.js crawler that searches Google Maps for businesses in Germany based on branch name (Branche) and postal code (Postleitzahl), extracting company names, complete addresses, and phone numbers.

## Features

- 🔍 Searches Google Maps for German businesses matching specified criteria
- 📊 Extracts distinct business entries with:
  - Company name (Firmenname)
  - Complete address (street, house number, postal code, city)
  - Phone number (Telefonnummer)
- 🔄 Removes duplicate entries automatically
- 👁️ Runs in **visible browser mode** for reliability
- 💾 Exports results to JSON format
- 🛡️ Uses stealth mode to avoid bot detection
- ✅ Input validation for German postal codes
- 🇩🇪 Handles German language cookie consent automatically

## Project Structure

```
googleCrawler/
├── config/
│   └── config.js              # Configuration settings (browser, delays, selectors)
├── src/
│   ├── GoogleMapsCrawler.js   # Main crawler class
│   └── utils.js               # Helper functions (delay, input, validation)
├── index.js                   # Application entry point
├── package.json               # Dependencies and scripts
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Windows, macOS, or Linux

## Installation

1. Clone the repository:
```bash
git clone https://github.com/CCHeigl/googleCrawler.git
cd googleCrawler
```

2. Install dependencies:
```bash
npm install
```

This will install:
- `puppeteer` - Browser automation (v22.0.0)
- `puppeteer-extra` - Enhanced Puppeteer functionality
- `puppeteer-extra-plugin-stealth` - Stealth mode to avoid detection

## Usage

### Basic Usage

1. Run the crawler:
```bash
npm start
```

2. The application will prompt you to enter:
   - **Branche** (business type): e.g., `apotheke`, `zahnarzt`, `restaurant`
   - **Postleitzahl** (5-digit postal code): e.g., `44388`, `10115`, `80331`

Example:
```
=== Google Maps Crawler ===

Bitte geben Sie die Branche ein (z.B. restaurants, zahnarzt, apotheke): apotheke
Bitte geben Sie die Postleitzahl ein (z.B. 44388, 10001): 44388

Starte Suche nach "apotheke" in "44388"...
```

### Branch Name Examples (German)

- `'apotheke'` - Pharmacy
- `'zahnarzt'` - Dentist
- `'bäckerei'` - Bakery
- `'friseur'` - Hair salon
- `'autowerkstatt'` - Auto repair
- `'restaurant'` - Restaurant
- `'medizingroßhändler'` - Medical wholesaler

### Postal Code Examples (Germany)

- `'44388'` (Dortmund)
- `'10115'` (Berlin)
- `'80331'` (Munich)
- `'20095'` (Hamburg)
- `'50667'` (Cologne)

### Output

The crawler will:
1. Open a **visible** Chrome browser window
2. Navigate to Google Maps
3. Handle German cookie consent automatically
4. Search for the specified business type and postal code
5. Scroll through all results
6. Click on each business to extract detailed information
7. Display results in the console
8. Save results to `google_maps_results.json`

### Example Output (JSON)

```json
[
  {
    "name": "farma-plus Apotheke Central",
    "address": "Provinzialstraße 413, 44388 Dortmund",
    "phone": "0231699192"
  },
  {
    "name": "Wildschütz Apotheke",
    "address": "Lütgendortmunder Str. 140, 44388 Dortmund",
    "phone": "0231630782"
  }
]
```

## Configuration

All configuration settings are centralized in `config/config.js`:

### Browser Settings
```javascript
browser: {
  headless: false,  // Keep as false - visible mode is more reliable
  defaultViewport: null,
  args: [
    '--start-maximized',
    '--no-sandbox',
    '--disable-setuid-sandbox'
  ]
}
```

### Timing Settings (milliseconds)
```javascript
delays: {
  pageLoad: 2000,           // Wait after page navigation
  cookieConsent: 2000,      // Wait for cookie dialog
  afterCookieAccept: 3000,  // Wait after accepting cookies
  resultsLoad: 4000,        // Wait for results to load
  scrollWait: 2000,         // Wait between scroll attempts
  businessClick: 2000       // Wait after clicking on business
}
```

### Scroll Settings
```javascript
scroll: {
  maxAttempts: 10,          // Maximum number of scroll attempts
  selector: '[role="feed"]' // Scrollable element selector
}
```

### Selectors
All CSS selectors for Google Maps elements are defined in the config for easy maintenance.

## Programmatic Usage

You can also use the crawler as a module in your own code:

```javascript
const GoogleMapsCrawler = require('./src/GoogleMapsCrawler');

async function customSearch() {
  const crawler = new GoogleMapsCrawler();
  
  try {
    await crawler.initialize();
    const results = await crawler.searchBusinesses('apotheke', '44388');
    await crawler.saveToJSON(results, 'my_results.json');
    
    console.log(`Found ${results.length} businesses`);
  } finally {
    await crawler.close();
  }
}

customSearch();
```

### Available Methods

- `initialize()` - Initialize the browser
- `searchBusinesses(branchName, postalCode)` - Search for businesses
- `saveToJSON(data, filename)` - Save results to JSON file
- `close()` - Close the browser

### Utility Functions

```javascript
const { getUserInput, isValidGermanPostalCode, isValidBranchName } = require('./src/utils');

// Get user input
const input = await getUserInput('Enter something: ');

// Validate postal code (5 digits)
if (isValidGermanPostalCode('44388')) {
  console.log('Valid postal code');
}

// Validate branch name
if (isValidBranchName('apotheke')) {
  console.log('Valid branch name');
}
```

## Testing Results

The crawler has been tested with various German business types and postal codes:

| Test Case | Postal Code | Results | Status |
|-----------|-------------|---------|--------|
| Apotheke | 44388 | 5-8 businesses | ✅ Working |
| Zahnarzt | 44357 | 47 businesses | ✅ Working |
| Medizingroßhändler | 44388 | Multiple results | ✅ Working |

**Note:** Visible mode (headless: false) provides more consistent results than headless mode.

## Troubleshooting

### No results found
- Verify the postal code is valid (5 digits)
- Try a more general branch name
- Check your internet connection
- Ensure Google Maps is accessible in your region

### Browser doesn't open
- Ensure Puppeteer is properly installed: `npm install puppeteer --force`
- Check if Chrome/Chromium is installed on your system
- Try running with administrator/sudo privileges

### Missing phone numbers or addresses
- Some businesses may not have complete information on Google Maps
- The crawler will mark missing data as `null` or `'N/A'`

### Rate limiting / IP blocking
- Add longer delays in `config/config.js`
- Reduce the number of scroll attempts
- Run the crawler during off-peak hours
- Avoid running multiple instances simultaneously

### Cookie consent issues
- The crawler automatically handles German cookie dialogs
- If issues persist, manually accept cookies when the browser opens

## Future Enhancements

Potential improvements being considered:

1. **Multi-Postal-Code Support**: Crawl multiple postal codes in batch
2. **Export Formats**: Add CSV and Excel export options
3. **Advanced Filtering**: Filter by ratings, opening hours, etc.
4. **Progress Tracking**: Real-time progress indicators for large batches
5. **Error Recovery**: Automatic retry logic for failed extractions
6. **Logging System**: Structured logging with different levels
7. **Regional Batching**: Crawl by Bundesland or city ranges

## Contributing

This is a public repository. Feel free to:
- Report issues
- Suggest improvements
- Submit pull requests

## Repository

GitHub: [https://github.com/CCHeigl/googleCrawler](https://github.com/CCHeigl/googleCrawler)

## Important Notes

- **Visible mode is required** for reliable results
- The crawler uses reasonable delays to respect Google's services
- Results depend on what's publicly available on Google Maps
- Some businesses may have incomplete information
- Duplicate entries are automatically removed based on name and address
- The crawler is optimized for German postal codes and business types

## License

ISC
