// IndexedDB setup
let db;
const DB_NAME = 'GoldTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'purchases';

// Initialize IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Database failed to open');
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('Database opened successfully');
            resolve();
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;

            // Create object store if it doesn't exist
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, {
                    keyPath: 'id',
                    autoIncrement: true
                });
                objectStore.createIndex('date', 'date', { unique: false });
                console.log('Object store created');
            }
        };
    });
}

// Add purchase to IndexedDB
function addPurchase(purchase) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.add(purchase);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Get all purchases from IndexedDB
function getAllPurchases() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.getAll();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Delete purchase from IndexedDB
function deletePurchase(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.delete(id);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Update purchase in IndexedDB
function updatePurchase(id, purchase) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        purchase.id = id; // Ensure the ID is set
        const request = objectStore.put(purchase);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Get single purchase by ID
function getPurchaseById(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.get(id);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Current gold price per gram (stored in memory)
let currentGoldPrice = 0;
let bankBuyPricePerGram = 0;

// XAU to grams conversion constant
const XAU_TO_GRAMS = 31.1035;

// Bank rate adjustment (AED per XAU)
const BANK_RATE_ADJUSTMENT_BUY = 250;
const BANK_RATE_ADJUSTMENT_SELL = 200;

// Update change indicator with arrow and styling
function updateChangeIndicator(elementId, change, percent) {
    const element = document.getElementById(elementId);
    const isPositive = change > 0;
    const arrow = isPositive ? '▲' : '▼';
    const sign = isPositive ? '+' : '';

    element.textContent = `${arrow} ${sign}${change.toFixed(2)} ${sign}${percent.toFixed(2)}%`;
    element.className = 'price-change ' + (isPositive ? 'price-up' : 'price-down');
}

// Fetch current gold price from API
async function fetchGoldPrice() {
    try {
        const response = await fetch('https://data-asg.goldprice.org/dbXRates/AED');
        if (!response.ok) {
            throw new Error('Failed to fetch gold price');
        }

        const data = await response.json();
        const xauPrice = data.items[0].xauPrice; // Price per troy ounce
        const pricePerGram = xauPrice / XAU_TO_GRAMS;
        const xauChange = data.items[0].chgXau; // Change in XAU price
        const xauPercent = data.items[0].pcXau; // Percent change in XAU

        // Calculate change per gram
        const gramChange = xauChange / XAU_TO_GRAMS;

        // Update global variable
        currentGoldPrice = pricePerGram;

        // Store in localStorage
        localStorage.setItem('currentGoldPrice', pricePerGram.toString());
        localStorage.setItem('lastPriceUpdate', new Date().toISOString());
        localStorage.setItem('xauChange', xauChange.toString());
        localStorage.setItem('xauPercent', xauPercent.toString());

        // Calculate bank rates
        const bankBuyRate = xauPrice - BANK_RATE_ADJUSTMENT_BUY;
        const bankSellRate = xauPrice + BANK_RATE_ADJUSTMENT_SELL;
        const bankBuyPerGram = bankBuyRate / XAU_TO_GRAMS;
        const bankSellPerGram = bankSellRate / XAU_TO_GRAMS;

        // Store bank buy rate for P/L calculations (what you'd get selling to bank)
        bankBuyPricePerGram = bankBuyPerGram;
        localStorage.setItem('bankBuyPricePerGram', bankBuyPerGram.toString());

        // Update UI
        document.getElementById('xauPrice').textContent = xauPrice.toFixed(2);
        document.getElementById('perGramPrice').textContent = pricePerGram.toFixed(2);
        document.getElementById('bankBuyXau').textContent = bankBuyRate.toFixed(2);
        document.getElementById('bankSellXau').textContent = bankSellRate.toFixed(2);
        document.getElementById('bankBuyGram').textContent = '(' + bankBuyPerGram.toFixed(2) + ' AED/g)';
        document.getElementById('bankSellGram').textContent = '(' + bankSellPerGram.toFixed(2) + ' AED/g)';

        // Update change indicators
        updateChangeIndicator('xauChange', xauChange, xauPercent);
        updateChangeIndicator('perGramChange', gramChange, xauPercent);

        // Show last update time
        const updateTime = new Date().toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('priceUpdateTime').textContent = 'Last updated: ' + updateTime;

        return pricePerGram;
    } catch (error) {
        console.error('Failed to fetch gold price:', error);

        // Try to load from localStorage as fallback
        const savedPrice = localStorage.getItem('currentGoldPrice');
        if (savedPrice) {
            currentGoldPrice = parseFloat(savedPrice);
            const xauPrice = currentGoldPrice * XAU_TO_GRAMS;
            document.getElementById('xauPrice').textContent = xauPrice.toFixed(2);
            document.getElementById('perGramPrice').textContent = currentGoldPrice.toFixed(2);

            // Calculate and display bank rates
            const bankBuyRate = xauPrice - BANK_RATE_ADJUSTMENT_BUY;
            const bankSellRate = xauPrice + BANK_RATE_ADJUSTMENT_SELL;
            const bankBuyPerGram = bankBuyRate / XAU_TO_GRAMS;
            const bankSellPerGram = bankSellRate / XAU_TO_GRAMS;

            bankBuyPricePerGram = bankBuyPerGram;

            document.getElementById('bankBuyXau').textContent = bankBuyRate.toFixed(2);
            document.getElementById('bankSellXau').textContent = bankSellRate.toFixed(2);
            document.getElementById('bankBuyGram').textContent = '(' + bankBuyPerGram.toFixed(2) + ' AED/g)';
            document.getElementById('bankSellGram').textContent = '(' + bankSellPerGram.toFixed(2) + ' AED/g)';

            // Load cached change data
            const savedXauChange = localStorage.getItem('xauChange');
            const savedXauPercent = localStorage.getItem('xauPercent');
            if (savedXauChange && savedXauPercent) {
                const xauChange = parseFloat(savedXauChange);
                const xauPercent = parseFloat(savedXauPercent);
                const gramChange = xauChange / XAU_TO_GRAMS;
                updateChangeIndicator('xauChange', xauChange, xauPercent);
                updateChangeIndicator('perGramChange', gramChange, xauPercent);
            }

            const lastUpdate = localStorage.getItem('lastPriceUpdate');
            if (lastUpdate) {
                const updateDate = new Date(lastUpdate);
                const updateTime = updateDate.toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                document.getElementById('priceUpdateTime').textContent = 'Last updated: ' + updateTime + ' (cached)';
            }
        } else {
            document.getElementById('xauPrice').textContent = 'Failed to load';
            document.getElementById('perGramPrice').textContent = 'Failed to load';
            document.getElementById('priceUpdateTime').textContent = 'Unable to fetch price. Please check your connection.';
        }

        return currentGoldPrice;
    }
}

// Initialize the app
async function init() {
    try {
        await initDB();
        await fetchGoldPrice();
        displayPurchases();
        setupEventListeners();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        alert('Failed to initialize the application. Please refresh the page.');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Add Purchase button
    document.getElementById('addPurchaseBtn').addEventListener('click', openAddModal);

    // Form submission
    document.getElementById('purchaseForm').addEventListener('submit', handleFormSubmit);

    // Add modal event listeners
    const addModal = document.getElementById('addModal');
    const addModalClose = document.getElementById('addModalClose');
    const addCancelBtn = document.getElementById('addCancelBtn');

    addModalClose.addEventListener('click', closeAddModal);
    addCancelBtn.addEventListener('click', closeAddModal);

    // Edit modal event listeners
    const editModal = document.getElementById('editModal');
    const editCloseBtn = document.querySelector('#editModal .close');
    const cancelBtn = document.getElementById('cancelBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const editForm = document.getElementById('editForm');

    editCloseBtn.addEventListener('click', closeEditModal);
    cancelBtn.addEventListener('click', closeEditModal);
    deleteBtn.addEventListener('click', handleDeleteFromModal);
    editForm.addEventListener('submit', handleEditFormSubmit);

    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === editModal) {
            closeEditModal();
        }
        if (event.target === addModal) {
            closeAddModal();
        }
    });
}

// Open add purchase modal
function openAddModal() {
    document.getElementById('addModal').style.display = 'block';
    document.getElementById('purchaseDate').valueAsDate = new Date();
}

// Close add purchase modal
function closeAddModal() {
    document.getElementById('addModal').style.display = 'none';
    document.getElementById('purchaseForm').reset();
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();

    const date = document.getElementById('purchaseDate').value;
    const xauAmount = parseFloat(document.getElementById('xauAmount').value);
    const totalPrice = parseFloat(document.getElementById('totalPrice').value);

    if (!date || !xauAmount || !totalPrice) {
        alert('Please fill in all fields');
        return;
    }

    // Calculate grams and price per gram from XAU amount
    const grams = xauAmount * XAU_TO_GRAMS;
    const purchasePrice = totalPrice / grams;

    const purchase = {
        date: date,
        xau: xauAmount,
        grams: grams,
        purchasePrice: purchasePrice,
        totalCost: totalPrice
    };

    try {
        await addPurchase(purchase);

        // Close modal and clear form
        closeAddModal();

        // Refresh display
        displayPurchases();
    } catch (error) {
        console.error('Failed to add purchase:', error);
        alert('Failed to add purchase. Please try again.');
    }
}

// Display all purchases
async function displayPurchases() {
    try {
        const purchases = await getAllPurchases();
        const tbody = document.getElementById('purchasesBody');

        // Clear existing rows
        tbody.innerHTML = '';

        if (purchases.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No purchases yet. Add your first gold purchase above!</td></tr>';
            updateTotals(0, 0, 0, 0);
            return;
        }

        // Sort by date (newest first)
        purchases.sort((a, b) => new Date(b.date) - new Date(a.date));

        let totalCost = 0;
        let totalCurrentValue = 0;

        purchases.forEach(purchase => {
            const row = createPurchaseRow(purchase);
            tbody.appendChild(row);

            totalCost += purchase.totalCost;
            if (bankBuyPricePerGram > 0) {
                totalCurrentValue += purchase.grams * bankBuyPricePerGram;
            }
        });

        const totalPL = bankBuyPricePerGram > 0 ? totalCurrentValue - totalCost : 0;
        const totalPLPercent = totalCost > 0 && bankBuyPricePerGram > 0
            ? (totalPL / totalCost) * 100
            : 0;

        updateTotals(totalCost, totalCurrentValue, totalPL, totalPLPercent);
    } catch (error) {
        console.error('Failed to display purchases:', error);
    }
}

// Calculate days since purchase
function calculateDaysOld(purchaseDate) {
    const today = new Date();
    const purchase = new Date(purchaseDate + 'T00:00:00');
    const diffTime = Math.abs(today - purchase);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Create a table row for a purchase
function createPurchaseRow(purchase) {
    const row = document.createElement('tr');

    // Calculate XAU from grams if not stored (backward compatibility)
    const xauAmount = purchase.xau || (purchase.grams / XAU_TO_GRAMS);

    const currentValue = bankBuyPricePerGram > 0 ? purchase.grams * bankBuyPricePerGram : 0;
    const profitLoss = bankBuyPricePerGram > 0 ? currentValue - purchase.totalCost : 0;
    const profitLossPercent = bankBuyPricePerGram > 0 ? (profitLoss / purchase.totalCost) * 100 : 0;

    const plClass = profitLoss > 0 ? 'profit' : profitLoss < 0 ? 'loss' : '';
    const plSign = profitLoss > 0 ? '+' : '';

    const daysOld = calculateDaysOld(purchase.date);

    row.innerHTML = `
        <td data-label="Date">${formatDate(purchase.date)}</td>
        <td data-label="XAU">${formatGrams(xauAmount)}</td>
        <td data-label="Grams">${formatGrams(purchase.grams)}</td>
        <td data-label="Price (AED/g)">${purchase.purchasePrice.toFixed(2)}</td>
        <td data-label="Total Cost (AED)">${purchase.totalCost.toFixed(2)}</td>
        <td data-label="Current Value (AED)">${bankBuyPricePerGram > 0 ? currentValue.toFixed(2) : '-'}</td>
        <td data-label="P/L (AED)" class="${plClass}" data-pl="${bankBuyPricePerGram > 0 ? plSign + profitLoss.toFixed(2) : '-'}" data-days="${daysOld}">${bankBuyPricePerGram > 0 ? plSign + profitLoss.toFixed(2) : '-'}</td>
        <td data-label="P/L %" class="${plClass}">${bankBuyPricePerGram > 0 ? plSign + profitLossPercent.toFixed(2) + '%' : '-'}</td>
        <td><button class="update-btn" onclick="openEditModal(${purchase.id})">Update</button></td>
    `;

    // Make row clickable on mobile (tapping anywhere opens edit modal)
    row.addEventListener('click', function (e) {
        // Don't trigger if clicking the update button itself
        if (!e.target.classList.contains('update-btn')) {
            openEditModal(purchase.id);
        }
    });

    return row;
}

// Update totals in summary section
function updateTotals(totalCost, totalCurrentValue, totalPL, totalPLPercent) {
    document.getElementById('totalCost').textContent = totalCost.toFixed(2) + ' AED';

    const totalCurrentValueCell = document.getElementById('totalCurrentValue');
    totalCurrentValueCell.textContent = bankBuyPricePerGram > 0 ? totalCurrentValue.toFixed(2) + ' AED' : '- AED';

    const totalPLCell = document.getElementById('totalPL');
    const totalPLPercentCell = document.getElementById('totalPLPercent');

    if (bankBuyPricePerGram > 0) {
        const plClass = totalPL > 0 ? 'profit' : totalPL < 0 ? 'loss' : '';
        const plSign = totalPL > 0 ? '+' : '';

        totalPLCell.textContent = plSign + totalPL.toFixed(2) + ' AED';
        totalPLCell.className = 'summary-value ' + plClass;

        totalPLPercentCell.textContent = plSign + totalPLPercent.toFixed(2) + '%';
        totalPLPercentCell.className = 'summary-value ' + plClass;
    } else {
        totalPLCell.textContent = '- AED';
        totalPLCell.className = 'summary-value';
        totalPLPercentCell.textContent = '-%';
        totalPLPercentCell.className = 'summary-value';
    }
}

// Store current editing purchase ID
let editingPurchaseId = null;

// Open edit modal with purchase data
async function openEditModal(id) {
    try {
        const purchase = await getPurchaseById(id);
        if (!purchase) {
            alert('Purchase not found');
            return;
        }

        editingPurchaseId = id;

        // Calculate XAU from grams if not stored (backward compatibility)
        const xauAmount = purchase.xau || (purchase.grams / XAU_TO_GRAMS);

        // Populate form fields
        document.getElementById('editDate').value = purchase.date;
        document.getElementById('editXauAmount').value = xauAmount;
        document.getElementById('editTotalPrice').value = purchase.totalCost;

        // Show modal
        document.getElementById('editModal').style.display = 'block';
    } catch (error) {
        console.error('Failed to load purchase:', error);
        alert('Failed to load purchase data. Please try again.');
    }
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    editingPurchaseId = null;
    document.getElementById('editForm').reset();
}

// Handle edit form submission
async function handleEditFormSubmit(event) {
    event.preventDefault();

    if (!editingPurchaseId) {
        alert('No purchase selected for editing');
        return;
    }

    const date = document.getElementById('editDate').value;
    const xauAmount = parseFloat(document.getElementById('editXauAmount').value);
    const totalPrice = parseFloat(document.getElementById('editTotalPrice').value);

    if (!date || !xauAmount || !totalPrice) {
        alert('Please fill in all fields');
        return;
    }

    // Calculate grams and price per gram from XAU amount
    const grams = xauAmount * XAU_TO_GRAMS;
    const purchasePrice = totalPrice / grams;

    const updatedPurchase = {
        date: date,
        xau: xauAmount,
        grams: grams,
        purchasePrice: purchasePrice,
        totalCost: totalPrice
    };

    try {
        await updatePurchase(editingPurchaseId, updatedPurchase);
        closeEditModal();
        displayPurchases();
    } catch (error) {
        console.error('Failed to update purchase:', error);
        alert('Failed to update purchase. Please try again.');
    }
}

// Handle delete from modal
async function handleDeleteFromModal() {
    if (!editingPurchaseId) {
        alert('No purchase selected');
        return;
    }

    if (!confirm('Are you sure you want to delete this purchase?')) {
        return;
    }

    try {
        await deletePurchase(editingPurchaseId);
        closeEditModal();
        displayPurchases();
    } catch (error) {
        console.error('Failed to delete purchase:', error);
        alert('Failed to delete purchase. Please try again.');
    }
}

// Format grams to preserve up to 4 decimal places without trailing zeros
function formatGrams(grams) {
    // Convert to string and check if it has decimals
    const str = grams.toString();
    if (str.includes('.')) {
        // Remove trailing zeros but keep up to 4 decimal places
        return parseFloat(grams.toFixed(4)).toString();
    }
    return grams.toString();
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Initialize the app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
