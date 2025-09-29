const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : '/api';

let merchantId = null;
let myStores = [];
let myOffers = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeMerchant();
});

async function initializeMerchant() {
    const urlParams = new URLSearchParams(window.location.search);
    merchantId = urlParams.get('merchantId');
    
    if (!merchantId) {
        showToast('Merchant ID not found', 'error');
        return;
    }
    
    await loadMerchantData();
    await loadMyStores();
    await loadMyOffers();
    updateStats();
}

async function loadMerchantData() {
    try {
        const response = await fetch(`${API_BASE_URL}/merchants/${merchantId}`);
        const data = await response.json();
        
        if (data.success) {
            const merchant = data.data;
            document.getElementById('merchantName').textContent = merchant.name;
            document.getElementById('merchantAvatar').textContent = merchant.name.charAt(0).toUpperCase();
        }
    } catch (error) {
        console.error('Error loading merchant data:', error);
    }
}

async function loadMyStores() {
    try {
        const response = await fetch(`${API_BASE_URL}/stores?merchant=${merchantId}`);
        const data = await response.json();
        
        if (data.success) {
            myStores = data.data;
            displayMyStores();
        }
    } catch (error) {
        console.error('Error loading stores:', error);
        showToast('Error loading stores', 'error');
    }
}

async function loadMyOffers() {
    try {
        const response = await fetch(`${API_BASE_URL}/offers?merchant=${merchantId}`);
        const data = await response.json();
        
        if (data.success) {
            myOffers = data.data;
            displayMyOffers();
            updateStoreSelect();
        }
    } catch (error) {
        console.error('Error loading offers:', error);
        showToast('Error loading offers', 'error');
    }
}

function displayMyStores() {
    const storesListElement = document.getElementById('myStoresList');
    
    if (myStores.length === 0) {
        storesListElement.innerHTML = `
            <div style="color: rgba(255, 255, 255, 0.6); text-align: center; padding: 40px;">
                <i class="fas fa-store" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                <div>No stores found. Create your first store!</div>
            </div>
        `;
        return;
    }
    
    storesListElement.innerHTML = myStores.map(store => `
        <div class="merchant-item">
            <div class="item-header">
                <div class="item-title">${store.name}</div>
                <div class="item-status ${store.isApproved ? 'status-approved' : 'status-pending'}">
                    ${store.isApproved ? 'Approved' : 'Pending'}
                </div>
            </div>
            <div class="item-details">
                <div><strong>Category:</strong> ${store.category}</div>
                <div><strong>Description:</strong> ${store.description}</div>
                ${store.websiteUrl ? `<div><strong>Website:</strong> <a href="${store.websiteUrl}" target="_blank" style="color: #60a5fa;">${store.websiteUrl}</a></div>` : ''}
                ${store.contactEmail ? `<div><strong>Email:</strong> ${store.contactEmail}</div>` : ''}
            </div>
        </div>
    `).join('');
}

function displayMyOffers() {
    const offersListElement = document.getElementById('myOffersList');
    
    if (myOffers.length === 0) {
        offersListElement.innerHTML = `
            <div style="color: rgba(255, 255, 255, 0.6); text-align: center; padding: 40px;">
                <i class="fas fa-tags" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                <div>No offers found. Create your first offer!</div>
            </div>
        `;
        return;
    }
    
    offersListElement.innerHTML = myOffers.map(offer => `
        <div class="merchant-item">
            <div class="item-header">
                <div class="item-title">${offer.title}</div>
                <div class="item-status ${offer.isApproved ? 'status-approved' : 'status-pending'}">
                    ${offer.isApproved ? 'Approved' : 'Pending'}
                </div>
            </div>
            <div class="item-details">
                <div><strong>Store:</strong> ${offer.store ? offer.store.name : 'Unknown'}</div>
                <div><strong>Description:</strong> ${offer.description}</div>
                <div><strong>Discount:</strong> ${offer.discount}</div>
                <div><strong>Valid Until:</strong> ${new Date(offer.validUntil).toLocaleDateString()}</div>
            </div>
        </div>
    `).join('');
}

function updateStoreSelect() {
    const storeSelect = document.getElementById('offerStore');
    storeSelect.innerHTML = '<option value="">Select store</option>';
    
    myStores.forEach(store => {
        if (store.isApproved) {
            const option = document.createElement('option');
            option.value = store._id;
            option.textContent = store.name;
            storeSelect.appendChild(option);
        }
    });
}

function updateStats() {
    document.getElementById('totalStores').textContent = myStores.length;
    document.getElementById('totalOffers').textContent = myOffers.length;
    
    const pendingStores = myStores.filter(store => !store.isApproved).length;
    const pendingOffers = myOffers.filter(offer => !offer.isApproved).length;
    document.getElementById('pendingItems').textContent = pendingStores + pendingOffers;
}

function showAddStore() {
    document.getElementById('addStoreSection').style.display = 'block';
    document.getElementById('addOfferSection').style.display = 'none';
}

function hideAddStore() {
    document.getElementById('addStoreSection').style.display = 'none';
    document.getElementById('storeForm').reset();
}

function showAddOffer() {
    document.getElementById('addOfferSection').style.display = 'block';
    document.getElementById('addStoreSection').style.display = 'none';
}

function hideAddOffer() {
    document.getElementById('addOfferSection').style.display = 'none';
    document.getElementById('offerForm').reset();
}

document.getElementById('storeForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const storeData = Object.fromEntries(formData.entries());
    
    storeData.merchant = merchantId;
    
    Object.keys(storeData).forEach(key => {
        if (storeData[key] === '') {
            storeData[key] = undefined;
        }
    });
    
    try {
        const response = await fetch(`${API_BASE_URL}/stores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(storeData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Store created successfully! Waiting for admin approval.', 'success');
            hideAddStore();
            loadMyStores();
            updateStats();
        } else {
            showToast(data.message || 'Error creating store', 'error');
        }
    } catch (error) {
        console.error('Error creating store:', error);
        showToast('Error creating store', 'error');
    }
});

document.getElementById('offerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const offerData = Object.fromEntries(formData.entries());
    
    offerData.merchant = merchantId;
    
    Object.keys(offerData).forEach(key => {
        if (offerData[key] === '') {
            offerData[key] = undefined;
        }
    });
    
    try {
        const response = await fetch(`${API_BASE_URL}/offers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(offerData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Offer created successfully! Waiting for admin approval.', 'success');
            hideAddOffer();
            loadMyOffers();
            updateStats();
        } else {
            showToast(data.message || 'Error creating offer', 'error');
        }
    } catch (error) {
        console.error('Error creating offer:', error);
        showToast('Error creating offer', 'error');
    }
});

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
