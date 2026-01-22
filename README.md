# Gold Purchase Tracker

A simple, lightweight web application for tracking gold purchases and monitoring profit/loss based on current gold prices.

## Features

- **Track Gold Purchases**: Record date, grams, purchase price, and total cost
- **Real-time P/L Calculation**: Automatically calculates profit/loss based on current gold price
- **Summary Dashboard**: View total grams owned, total investment, current value, and overall P/L
- **Edit & Delete**: Update or remove purchase records via an intuitive modal interface
- **Persistent Storage**: All data stored locally using IndexedDB
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **High Precision**: Supports up to 4 decimal places for gram measurements

## Technology Stack

- **Vanilla JavaScript** - No frameworks or libraries required
- **IndexedDB** - Local database for purchase records
- **localStorage** - Stores current gold price
- **CSS3** - Modern dark theme with responsive design

## Getting Started

1. Clone or download this repository
2. Open `index.html` in any modern web browser
3. No installation or build process required!

## Usage

1. **Set Current Gold Price**: Enter the current price per gram (AED) and click "Update Price"
2. **Add Purchase**: Fill in the form with:
   - Purchase date
   - Grams purchased (supports up to 4 decimal places)
   - Purchase price per gram (AED)
   - Total cost will be calculated automatically
3. **View Summary**: Check the summary cards at the top for your portfolio overview
4. **Edit/Delete**: Click the "Update" button on any purchase to modify or remove it

## Data Storage

All data is stored locally in your browser:
- Purchase records are saved in IndexedDB
- Current gold price is stored in localStorage
- No data is sent to any server

## Browser Compatibility

Works with any modern browser that supports:
- IndexedDB
- ES6+ JavaScript
- CSS Grid/Flexbox

## License

This project is open source and available for personal use.
