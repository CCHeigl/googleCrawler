# Google Maps Crawler

A Node.js crawler that searches Google Maps for businesses in Germany based on branch name (Branche) and postal code (Postleitzahl), extracting company names, complete addresses, and phone numbers.

## Features

- Searches Google Maps for German businesses matching specified criteria
- Extracts distinct business entries with:
  - Company name (Firmenname)
  - Complete address (full street address with house number, postal code, and city)
  - Phone number (Telefonnummer)
- Removes duplicate entries automatically
- Runs in **visible browser mode** for reliability and transparency
- Exports results to JSON format
- Uses stealth mode to avoid bot detection
- Handles German language cookie consent automatically

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

1. Open `index.js` and modify the search parameters in the `main()` function (around line 267):

```javascript
const branchName = 'medizingroßhändler'; // Change to your business type
const postalCode = '44388';              // Change to your German postal code
```

2. Run the crawler:
```bash
npm start
```

### Customizing Search Parameters

**Branch Name Examples (German):**
- `'apotheke'` - Pharmacy
- `'zahnarzt'` - Dentist
- `'bäckerei'` - Bakery
- `'friseur'` - Hair salon
- `'autowerkstatt'` - Auto repair
- `'restaurant'` - Restaurant
- `'medizingroßhändler'` - Medical wholesaler

**Postal Code Examples (Germany):**
- `'44388'` (Dortmund)
- `'10115'` (Berlin)
- `'80331'` (Munich)
- `'20095'` (Hamburg)
- `'50667'` (Cologne)

### Output

The crawler will:
1. Open a **visible** Chrome browser window (recommended for reliability)
2. Navigate to Google Maps
3. Handle German cookie consent automatically
4. Search for the specified business type and postal code
5. Scroll through all results to load complete listings
6. Click on each business to extract detailed information
7. Extract complete addresses from detail panels
8. Display results in the console
9. Save results to `google_maps_results.json`

### Example Output (JSON)

```json
[
  {
    "name": "Sanacorp Pharmahandel GmbH",
    "address": "Beguinenstraße 8, 44388 Dortmund",
    "phone": "+49 231 9696100"
  },
  {
    "name": "GEHE Pharma Handel GmbH",
    "address": "Stockholmer Allee 53, 44388 Dortmund",
    "phone": "+49 231 9696200"
  }
]
```

**Note:** The crawler extracts complete German addresses in the format: `Street HouseNumber, PostalCode City`

## Configuration Options

You can modify the crawler behavior in `index.js`:

### Browser Settings (Line ~16)
```javascript
this.browser = await puppeteer.launch({
  headless: false,  // Keep as false - visible mode is more reliable
  defaultViewport: null,
  args: [
    '--start-maximized',
    '--no-sandbox',
    '--disable-setuid-sandbox'
  ]
});
```

**Important:** Headless mode (`headless: true`) has been tested and produces fewer results. Visible mode is recommended for accurate data extraction.

### Scroll Settings (Line ~75)
```javascript
const maxScrollAttempts = 10; // Increase for more results (e.g., 15-20)
```

### Delay Settings
```javascript
await delay(2000); // Adjust delay between actions (in milliseconds)
```

## Programmatic Usage

You can also use the crawler as a module in your own scripts:

```javascript
const GoogleMapsCrawler = require('./index.js');

async function customSearch() {
  const crawler = new GoogleMapsCrawler();
  
  try {
    await crawler.initialize();
    const results = await crawler.searchBusinesses('apotheke', '44388');
    await crawler.saveToJSON(results, 'my_custom_results.json');
    
    console.log(`Found ${results.length} businesses`);
  } finally {
    await crawler.close();
  }
}

customSearch();
```

## Troubleshooting

### No results found
- Verify the German postal code is valid (5 digits, e.g., 44388)
- Try a more general branch name (e.g., "restaurant" instead of "italienisches restaurant")
- Check your internet connection
- Ensure Google Maps is accessible in your region

### Browser doesn't open
- Ensure Puppeteer is properly installed: `npm install puppeteer --force`
- Check if Chrome/Chromium is installed on your system
- Try running with administrator/sudo privileges

### Missing phone numbers or addresses
- Some businesses may not have complete information on Google Maps
- The crawler will mark missing data as `null` or `'N/A'`
- Phone numbers are extracted from the detail panel after clicking each listing

### Fewer results than expected
- **Do NOT use headless mode** - it produces fewer results
- Increase `maxScrollAttempts` in the code (line ~75)
- Some results may be sponsored listings that appear/disappear
- Google Maps may show different results based on various factors

### Rate limiting / IP blocking
- Add longer delays between requests (increase delay values)
- Reduce the number of scroll attempts
- Run the crawler during off-peak hours
- Consider using proxy rotation for large-scale crawling
- Avoid running multiple instances simultaneously

### Cookie consent issues
- The crawler automatically handles German cookie consent
- If issues persist, manually accept cookies in the visible browser
- Check if your IP is in a different region

## Testing Results

The crawler has been tested with:
- ✅ "apotheke 44388" - 6-8 results (with sponsored variations)
- ✅ "zahnarzt 44357" - 47 results
- ✅ "medizingroßhändler 44388" - Multiple results with complete addresses
- ✅ German language cookie consent handling
- ✅ Complete address extraction (Street, House Number, Postal Code, City)
- ✅ Duplicate removal functionality

## Important Notes

- **Visible mode is required** for reliable results (headless mode produces fewer results)
- The crawler uses reasonable delays to respect Google's services
- Results depend on what's publicly available on Google Maps
- Some businesses may have incomplete information (phone, address)
- Duplicate entries are automatically removed based on name and address
- Sponsored listings may cause result count variations (this is normal)
- The crawler is optimized for German postal codes and business types

## GitHub Repository

This project is available on GitHub: [https://github.com/CCHeigl/googleCrawler](https://github.com/CCHeigl/googleCrawler)

## Future Enhancements

Potential improvements being considered:
- Batch processing for multiple postal codes
- Regional crawling (by Bundesland or city)
- Postal code range support
- Progress tracking and resume capability
- Export to CSV/Excel formats
- Proxy rotation support

## License

ISC
