// API Base URL
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : '/api';

// Global variables
let stores = [];
let offers = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    loadDashboard();
    loadStores();
    loadOffers();
    loadMerchants();
});

// Navigation functions
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected section
    document.getElementById(sectionName).classList.add('active');

    // Add active class to clicked nav button
    event.target.classList.add('active');
}

// Dashboard functions
async function loadDashboard() {
    try {
        const [storesResponse, offersResponse, featuredResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/stores`),
            fetch(`${API_BASE_URL}/offers`),
            fetch(`${API_BASE_URL}/offers/featured`)
        ]);

        const storesData = await storesResponse.json();
        const offersData = await offersResponse.json();
        const featuredData = await featuredResponse.json();

        document.getElementById('totalStores').textContent = storesData.pagination?.totalStores || 0;
        document.getElementById('totalOffers').textContent = offersData.pagination?.totalOffers || 0;
        document.getElementById('featuredOffers').textContent = featuredData.data?.length || 0;

        const activeStores = storesData.data?.filter(store => store.isActive).length || 0;
        document.getElementById('activeStores').textContent = activeStores;
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('Error loading dashboard data', 'error');
    }
}

// Store functions
async function loadStores() {
    try {
        const response = await fetch(`${API_BASE_URL}/stores?isActive=all`);
        const data = await response.json();

        if (data.success) {
            stores = data.data;
            displayStores(stores);
        } else {
            showToast('Error loading stores', 'error');
        }
    } catch (error) {
        console.error('Error loading stores:', error);
        showToast('Error loading stores', 'error');
    }
}

function displayStores(storesList) {
    const storesListElement = document.getElementById('storesList');

    if (storesList.length === 0) {
        storesListElement.innerHTML = '<div class="loading">No stores found. Create your first store!</div>';
        return;
    }

    storesListElement.innerHTML = storesList.map(store => `
        <div class="store-item">
            <div class="store-header">
                <div class="store-info">
                    <div class="store-logo-container">
                        ${store.logoUrl ?
            `<img src="${store.logoUrl}" alt="${store.name} Logo" class="store-logo" onerror="this.style.display='none'">` :
            `<div class="store-logo-placeholder"><i class="fas fa-store"></i></div>`
        }
                    </div>
                <div class="store-details-text">
                    <div class="store-title">${store.name}</div>
                    <div class="store-category">${store.category}</div>
                    ${store.merchant ? `<div class="merchant-badge">By Merchant</div>` : ''}
                </div>
                </div>
                <div class="status-badge ${store.isActive ? 'status-active' : 'status-inactive'}">
                    ${store.isActive ? 'Active' : 'Inactive'}
                </div>
            </div>
            <div class="store-description">${store.description}</div>
            <div class="store-details">
                ${store.websiteUrl ? `
                    <div class="detail-item website-item">
                        <div class="detail-icon">
                            <i class="fas fa-globe"></i>
                        </div>
                        <div class="detail-content">
                            <span class="detail-label">Website</span>
                            <a href="${store.websiteUrl}" target="_blank" class="detail-link">${store.websiteUrl}</a>
                        </div>
                    </div>
                ` : ''}
                ${store.contactEmail ? `
                    <div class="detail-item email-item">
                        <div class="detail-icon">
                            <i class="fas fa-envelope"></i>
                        </div>
                        <div class="detail-content">
                            <span class="detail-label">Email</span>
                            <a href="mailto:${store.contactEmail}" class="detail-link">${store.contactEmail}</a>
                        </div>
                    </div>
                ` : ''}
                <div class="detail-item date-item">
                    <div class="detail-icon">
                        <i class="fas fa-calendar"></i>
                    </div>
                    <div class="detail-content">
                        <span class="detail-label">Created</span>
                        <span class="detail-text">${new Date(store.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
            <div class="store-actions">
                <button class="btn btn-secondary" onclick="editStore('${store._id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn ${store.isActive ? 'btn-danger' : 'btn-success'}" 
                        onclick="toggleStoreStatus('${store._id}', ${store.isActive})">
                    <i class="fas fa-${store.isActive ? 'pause' : 'play'}"></i>
                    ${store.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button class="btn btn-danger" onclick="deleteStore('${store._id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function showCreateStoreForm() {
    document.getElementById('createStoreForm').style.display = 'block';
    document.getElementById('storeForm').reset();
    document.getElementById('storeActive').checked = true;

    // Reset form title and button
    document.querySelector('#createStoreForm h3').textContent = 'Create New Store';
    document.querySelector('#createStoreForm button[type="submit"]').textContent = 'Create Store';
    document.getElementById('storeForm').removeAttribute('data-edit-id');
}

function hideCreateStoreForm() {
    document.getElementById('createStoreForm').style.display = 'none';
}

// Store form submission
document.getElementById('storeForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const storeData = {
        name: formData.get('name'),
        category: formData.get('category'),
        description: formData.get('description'),
        websiteUrl: formData.get('websiteUrl') && formData.get('websiteUrl').trim() !== '' ? formData.get('websiteUrl') : undefined,
        contactEmail: formData.get('contactEmail') && formData.get('contactEmail').trim() !== '' ? formData.get('contactEmail') : undefined,
        logoUrl: formData.get('logoUrl') && formData.get('logoUrl').trim() !== '' ? formData.get('logoUrl') : undefined,
        isActive: formData.get('isActive') === 'on'
    };

    const isEdit = this.dataset.editId;
    const url = isEdit ? `${API_BASE_URL}/admin/stores/${isEdit}` : `${API_BASE_URL}/admin/stores`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer admin-token' // Simple admin token for now
            },
            body: JSON.stringify(storeData)
        });

        const data = await response.json();

        if (data.success) {
            showToast(isEdit ? 'Store updated successfully!' : 'Store created successfully!', 'success');
            hideCreateStoreForm();
            loadStores();
            loadDashboard();
        } else {
            // Show detailed validation errors
            if (data.errors && data.errors.length > 0) {
                const errorMessages = data.errors.map(err => err.msg).join(', ');
                showToast(`Validation Error: ${errorMessages}`, 'error');
            } else {
                showToast(data.message || `Error ${isEdit ? 'updating' : 'creating'} store`, 'error');
            }
        }
    } catch (error) {
        console.error(`Error ${isEdit ? 'updating' : 'creating'} store:`, error);
        showToast(`Error ${isEdit ? 'updating' : 'creating'} store`, 'error');
    }
});

// Offer functions
async function loadOffers() {
    try {
        // Fetch ALL offers (including deactivated ones) for admin panel
        const response = await fetch(`${API_BASE_URL}/offers?isActive=all`);
        const data = await response.json();

        if (data.success) {
            offers = data.data;
            displayOffers(offers);
        } else {
            showToast('Error loading offers', 'error');
        }
    } catch (error) {
        console.error('Error loading offers:', error);
        showToast('Error loading offers', 'error');
    }
}

function displayOffers(offersList) {
    const offersListElement = document.getElementById('offersList');

    if (offersList.length === 0) {
        offersListElement.innerHTML = '<div class="loading">No offers found. Create your first offer!</div>';
        return;
    }

    offersListElement.innerHTML = offersList.map(offer => `
        <div class="offer-item ${!offer.isActive ? 'deactivated' : ''}">
            <div class="offer-header">
                <div>
                    <div class="offer-title">
                        ${offer.title}
                        ${!offer.isActive ? '<span class="deactivated-label">(DEACTIVATED)</span>' : ''}
                    </div>
                    <div class="offer-category">${offer.category}</div>
                    ${offer.merchant ? `<div class="merchant-badge">By Merchant</div>` : ''}
                </div>
                <div>
                    ${offer.isFeatured ? '<span class="status-badge status-featured">Featured</span>' : ''}
                    <span class="status-badge ${offer.isActive ? 'status-active' : 'status-inactive'}">
                        ${offer.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>
            <div class="offer-description">${offer.description}</div>
            <div class="offer-details">
                <div class="detail-item">
                    <i class="fas fa-tag"></i>
                    Code: <strong>${offer.offerCode}</strong>
                </div>
                <div class="detail-item">
                    <i class="fas fa-percentage"></i>
                    Discount: <strong>${offer.discount}${offer.discountType === 'Percentage' ? '%' : ''}</strong>
                </div>
                <div class="detail-item">
                    <i class="fas fa-store"></i>
                    Store: <strong>${offer.store?.name || 'Unknown'}</strong>
                </div>
                <div class="detail-item">
                    <i class="fas fa-clock"></i>
                    Expires: ${new Date(offer.expiryDate).toLocaleDateString()}
                </div>
                ${offer.minPurchaseAmount > 0 ? `
                    <div class="detail-item">
                        <i class="fas fa-dollar-sign"></i>
                        Min Purchase: $${offer.minPurchaseAmount}
                    </div>
                ` : ''}
            </div>
            <div class="offer-actions">
                <button class="btn btn-secondary" onclick="editOffer('${offer._id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn ${offer.isFeatured ? 'btn-secondary' : 'btn-success'}" 
                        onclick="toggleOfferFeatured('${offer._id}', ${offer.isFeatured})">
                    <i class="fas fa-star"></i>
                    ${offer.isFeatured ? 'Unfeature' : 'Feature'}
                </button>
                <button class="btn ${offer.isActive ? 'btn-danger' : 'btn-success'}" 
                        onclick="toggleOfferStatus('${offer._id}', ${offer.isActive})">
                    <i class="fas fa-${offer.isActive ? 'pause' : 'play'}"></i>
                    ${offer.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button class="btn btn-danger" onclick="deleteOffer('${offer._id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function showCreateOfferForm() {
    document.getElementById('createOfferForm').style.display = 'block';
    document.getElementById('offerForm').reset();
    loadStoreOptions();

    // Reset form title and button
    document.querySelector('#createOfferForm h3').textContent = 'Create New Offer';
    document.querySelector('#createOfferForm button[type="submit"]').textContent = 'Create Offer';
    document.getElementById('offerForm').removeAttribute('data-edit-id');
}

function hideCreateOfferForm() {
    document.getElementById('createOfferForm').style.display = 'none';
}

async function loadStoreOptions() {
    const storeSelect = document.getElementById('offerStore');
    storeSelect.innerHTML = '<option value="">Select a store</option>';

    stores.forEach(store => {
        const option = document.createElement('option');
        option.value = store._id;
        option.textContent = store.name;
        storeSelect.appendChild(option);
    });
}

// Offer form submission
document.getElementById('offerForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const offerData = {
        title: formData.get('title'),
        offerCode: formData.get('offerCode'),
        description: formData.get('description'),
        imageUrl: formData.get('imageUrl') && formData.get('imageUrl').trim() !== '' ? formData.get('imageUrl') : undefined,
        productUrl: formData.get('productUrl') && formData.get('productUrl').trim() !== '' ? formData.get('productUrl') : undefined,
        discount: parseInt(formData.get('discount')),
        discountType: formData.get('discountType'),
        store: formData.get('store'),
        category: formData.get('category'),
        expiryDate: new Date(formData.get('expiryDate')).toISOString(),
        minPurchaseAmount: parseFloat(formData.get('minPurchaseAmount')) || 0,
        isFeatured: formData.get('isFeatured') === 'on'
    };

    const isEdit = this.dataset.editId;
    const url = isEdit ? `${API_BASE_URL}/admin/offers/${isEdit}` : `${API_BASE_URL}/admin/offers`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        console.log('Admin offer submission - URL:', url);
        console.log('Admin offer submission - Method:', method);
        console.log('Admin offer submission - Data:', offerData);

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer admin-token' // Simple admin token for now
            },
            body: JSON.stringify(offerData)
        });

        console.log('Admin offer response status:', response.status);
        const data = await response.json();
        console.log('Admin offer response data:', data);

        if (data.success) {
            showToast(isEdit ? 'Offer updated successfully!' : 'Offer created successfully!', 'success');
            hideCreateOfferForm();
            loadOffers();
            loadDashboard();
        } else {
            // Show detailed validation errors
            if (data.errors && data.errors.length > 0) {
                console.log('Admin offer validation errors:', data.errors);
                const errorMessages = data.errors.map(err => err.msg).join(', ');
                showToast(`Validation Error: ${errorMessages}`, 'error');
            } else {
                console.log('Admin offer error:', data.message);
                showToast(data.message || `Error ${isEdit ? 'updating' : 'creating'} offer`, 'error');
            }
        }
    } catch (error) {
        console.error(`Error ${isEdit ? 'updating' : 'creating'} offer:`, error);
        showToast(`Error ${isEdit ? 'updating' : 'creating'} offer`, 'error');
    }
});

// Action functions
async function toggleStoreStatus(storeId, currentStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/stores/${storeId}/toggle-status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer admin-token' // Simple admin token for now
            }
        });

        const data = await response.json();

        if (data.success) {
            showToast(data.message, 'success');
            loadStores();
            loadDashboard();
        } else {
            showToast(data.message || 'Error updating store status', 'error');
        }
    } catch (error) {
        console.error('Error updating store status:', error);
        showToast('Error updating store status', 'error');
    }
}

async function deleteStore(storeId) {
    if (!confirm('Are you sure you want to delete this store? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/stores/${storeId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer admin-token' // Simple admin token for now
            }
        });

        const data = await response.json();

        if (data.success) {
            showToast('Store deleted successfully!', 'success');
            loadStores();
            loadDashboard();
        } else {
            showToast(data.message || 'Error deleting store', 'error');
        }
    } catch (error) {
        console.error('Error deleting store:', error);
        showToast('Error deleting store', 'error');
    }
}

async function toggleOfferFeatured(offerId, currentStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/offers/${offerId}/toggle-featured`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer admin-token' // Simple admin token for now
            }
        });

        const data = await response.json();

        if (data.success) {
            showToast(data.message, 'success');
            loadOffers();
            loadDashboard();
        } else {
            showToast(data.message || 'Error updating offer featured status', 'error');
        }
    } catch (error) {
        console.error('Error updating offer featured status:', error);
        showToast('Error updating offer featured status', 'error');
    }
}

async function toggleOfferStatus(offerId, currentStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/offers/${offerId}/toggle-status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer admin-token' // Simple admin token for now
            }
        });

        const data = await response.json();

        if (data.success) {
            showToast(data.message, 'success');
            loadOffers();
            loadDashboard();
        } else {
            showToast(data.message || 'Error updating offer status', 'error');
        }
    } catch (error) {
        console.error('Error updating offer status:', error);
        showToast('Error updating offer status', 'error');
    }
}

async function deleteOffer(offerId) {
    if (!confirm('Are you sure you want to delete this offer? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/offers/${offerId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer admin-token' // Simple admin token for now
            }
        });

        const data = await response.json();

        if (data.success) {
            showToast('Offer deleted successfully!', 'success');
            loadOffers();
            loadDashboard();
        } else {
            showToast(data.message || 'Error deleting offer', 'error');
        }
    } catch (error) {
        console.error('Error deleting offer:', error);
        showToast('Error deleting offer', 'error');
    }
}

// Edit Store Function
function editStore(storeId) {
    const store = stores.find(s => s._id === storeId);
    if (!store) {
        showToast('Store not found', 'error');
        return;
    }

    // Show create form and populate with store data
    showCreateStoreForm();

    // Populate form with existing data
    document.getElementById('storeName').value = store.name;
    document.getElementById('storeCategory').value = store.category;
    document.getElementById('storeDescription').value = store.description;
    document.getElementById('storeWebsite').value = store.websiteUrl || '';
    document.getElementById('storeEmail').value = store.contactEmail || '';
    document.getElementById('storeLogo').value = store.logoUrl || '';
    document.getElementById('storeActive').checked = store.isActive;

    // Change form title and submit button
    document.querySelector('#createStoreForm h3').textContent = 'Edit Store';
    document.querySelector('#createStoreForm button[type="submit"]').textContent = 'Update Store';

    // Store the store ID for update
    document.getElementById('storeForm').dataset.editId = storeId;
}

// Edit Offer Function
function editOffer(offerId) {
    const offer = offers.find(o => o._id === offerId);
    if (!offer) {
        showToast('Offer not found', 'error');
        return;
    }

    // Show create form and populate with offer data
    showCreateOfferForm();

    // Populate form with existing data
    document.getElementById('offerTitle').value = offer.title;
    document.getElementById('offerCode').value = offer.offerCode;
    document.getElementById('offerDescription').value = offer.description;
    document.getElementById('offerImage').value = offer.imageUrl || '';
    document.getElementById('offerProductUrl').value = offer.productUrl || '';
    document.getElementById('offerDiscount').value = offer.discount;
    document.getElementById('offerDiscountType').value = offer.discountType;
    document.getElementById('offerStore').value = offer.store._id;
    document.getElementById('offerCategory').value = offer.category;

    // Format date for datetime-local input
    const expiryDate = new Date(offer.expiryDate);
    const formattedDate = expiryDate.toISOString().slice(0, 16);
    document.getElementById('offerExpiry').value = formattedDate;

    document.getElementById('offerMinPurchase').value = offer.minPurchaseAmount || 0;
    document.getElementById('offerFeatured').checked = offer.isFeatured;

    // Change form title and submit button
    document.querySelector('#createOfferForm h3').textContent = 'Edit Offer';
    document.querySelector('#createOfferForm button[type="submit"]').textContent = 'Update Offer';

    // Store the offer ID for update
    document.getElementById('offerForm').dataset.editId = offerId;
}

// Search Functions
function searchStores() {
    const searchTerm = document.getElementById('storeSearch').value.toLowerCase();
    const filteredStores = stores.filter(store =>
        store.name.toLowerCase().includes(searchTerm) ||
        store.category.toLowerCase().includes(searchTerm) ||
        store.description.toLowerCase().includes(searchTerm)
    );
    displayStores(filteredStores);
}

function searchOffers() {
    const searchTerm = document.getElementById('offerSearch').value.toLowerCase();
    const filteredOffers = offers.filter(offer =>
        offer.title.toLowerCase().includes(searchTerm) ||
        offer.offerCode.toLowerCase().includes(searchTerm) ||
        offer.description.toLowerCase().includes(searchTerm) ||
        offer.category.toLowerCase().includes(searchTerm) ||
        (offer.store && offer.store.name.toLowerCase().includes(searchTerm))
    );
    displayOffers(filteredOffers);
}

// Image upload functions removed - using URL input only

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

let merchants = [];
let pendingStores = [];
let pendingOffers = [];

async function loadMerchants() {
    try {
        // Try to load merchants with payment status first
        const response = await fetch(`${API_BASE_URL}/admin/merchants/payment-status`, {
            headers: {
                'Authorization': 'Bearer admin-token',
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                merchants = data.data;
                displayMerchants();
                // Dispatch event for merchant control system
                window.dispatchEvent(new CustomEvent('merchantsLoaded'));
                // Add control buttons after displaying merchants
                setTimeout(() => {
                    if (typeof addMerchantControlButtons === 'function') {
                        addMerchantControlButtons();
                    }
                }, 100);
                return;
            }
        }

        // Fallback to regular merchants endpoint
        const fallbackResponse = await fetch(`${API_BASE_URL}/merchants`);
        const fallbackData = await fallbackResponse.json();

        if (fallbackData.success) {
            merchants = fallbackData.data;
            displayMerchants();
            // Dispatch event for merchant control system
            window.dispatchEvent(new CustomEvent('merchantsLoaded'));
            // Add control buttons after displaying merchants
            setTimeout(() => {
                if (typeof addMerchantControlButtons === 'function') {
                    addMerchantControlButtons();
                }
            }, 100);
        } else {
            showToast('Error loading merchants', 'error');
        }
    } catch (error) {
        console.error('Error loading merchants:', error);
        showToast('Error loading merchants', 'error');
    }
}

function displayMerchants() {
    const merchantsListElement = document.getElementById('merchantsList');

    if (merchants.length === 0) {
        merchantsListElement.innerHTML = '<div class="empty-state">No merchants found</div>';
        return;
    }

    merchantsListElement.innerHTML = merchants.map(merchant => `
        <div class="merchant-item">
            <div class="merchant-header">
                <div class="merchant-info">
                    <div class="merchant-avatar">
                        ${merchant.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="merchant-details">
                        <div class="merchant-name">${merchant.name}</div>
                        <div class="merchant-business">${merchant.businessName || 'Business Name Not Provided'}</div>
                        ${merchant.businessType ? `
                        <div class="merchant-type">
                            <span class="detail-label">Business Type:</span>
                            <span class="detail-text">${merchant.businessType}</span>
                        </div>` : ''}
                    </div>
                </div>

            </div>
            
            <div class="merchant-details-grid">

                <div class="detail-item">
                    <div class="detail-icon">
                        <i class="fas fa-envelope"></i>
                    </div>
                    <div class="detail-content">
                        <span class="detail-label">Email</span>
                        <span class="detail-text">${merchant.email}</span>
                    </div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-icon">
                        <i class="fas fa-phone"></i>
                    </div>
                    <div class="detail-content">
                        <span class="detail-label">Phone</span>
                        <span class="detail-text">${merchant.phone || 'Not provided'}</span>
                    </div>
                </div>
                
                ${merchant.website ? `
                    <div class="detail-item website-item">
                        <div class="detail-icon">
                            <i class="fas fa-globe"></i>
                        </div>
                        <div class="detail-content">
                            <span class="detail-label">Website</span>
                            <a href="${merchant.website}" target="_blank" class="detail-link">${merchant.website}</a>
                        </div>
                    </div>
                ` : ''}
                
                <div class="detail-item">
                    <div class="detail-icon">
                        <i class="fas fa-map-marker-alt"></i>
                    </div>
                    <div class="detail-content">
                        <span class="detail-label">Address</span>
                        <span class="detail-text">${merchant.address || 'Not provided'}</span>
                    </div>
                </div>
            </div>
            
            <div class="merchant-actions">

                <button class="btn ${merchant.isApproved ? 'btn-danger' : 'btn-success'}" 
                        onclick="toggleMerchantApproval('${merchant._id}', ${!!merchant.isApproved})">
                    <i class="fas fa-${merchant.isApproved ? 'times' : 'check'}"></i>
                    ${merchant.isApproved ? 'Reject' : 'Approve'}
                </button>
                <button class="btn btn-primary" onclick="sendNotificationToMerchant('${merchant._id}')">
                    <i class="fas fa-bell"></i> Notify
                </button>
                ${merchant.accessFee !== undefined && !merchant.accessFeePaid && merchant.accessFee > 0 ? `
                    <button class="btn btn-success" onclick="markAccessFeePaid('${merchant._id}')">
                        <i class="fas fa-check"></i> Mark Fee Paid
                    </button>
                ` : ''}
                <button class="btn btn-danger" onclick="deleteMerchant('${merchant._id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}


function displayPendingStores() {
    const pendingStoresElement = document.getElementById('pendingStores');

    if (pendingStores.length === 0) {
        pendingStoresElement.innerHTML = '<div class="empty-state">No pending stores</div>';
        return;
    }

    pendingStoresElement.innerHTML = pendingStores.map(store => `
        <div class="pending-item">
            <h4>${store.name}</h4>
            <p><strong>Category:</strong> ${store.category}</p>
            <p><strong>Description:</strong> ${store.description}</p>
            <p><strong>Merchant:</strong> ${store.merchant ? store.merchant.name : 'Unknown'}</p>
            <p><strong>Merchant ID:</strong> ${store.merchant ? store.merchant._id : 'N/A'}</p>
            <div class="approval-actions">
                <button class="btn btn-success" onclick="approveStore('${store._id}')">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn btn-danger" onclick="rejectStore('${store._id}')">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>
        </div>
    `).join('');
}

function displayPendingOffers() {
    const pendingOffersElement = document.getElementById('pendingOffers');

    if (pendingOffers.length === 0) {
        pendingOffersElement.innerHTML = '<div class="empty-state">No pending offers</div>';
        return;
    }

    pendingOffersElement.innerHTML = pendingOffers.map(offer => `
        <div class="pending-item">
            <h4>${offer.title}</h4>
            <p><strong>Store:</strong> ${offer.store ? offer.store.name : 'Unknown'}</p>
            <p><strong>Description:</strong> ${offer.description}</p>
            <p><strong>Merchant:</strong> ${offer.merchant ? offer.merchant.name : 'Unknown'}</p>
            <p><strong>Merchant ID:</strong> ${offer.merchant ? offer.merchant._id : 'N/A'}</p>
            <div class="approval-actions">
                <button class="btn btn-success" onclick="approveOffer('${offer._id}')">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn btn-danger" onclick="rejectOffer('${offer._id}')">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>
        </div>
    `).join('');
}

function updateApprovalCounts() {
    document.getElementById('storeCount').textContent = pendingStores.length;
    document.getElementById('offerCount').textContent = pendingOffers.length;
}

function showApprovalTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.approval-content').forEach(content => content.style.display = 'none');

    event.target.classList.add('active');

    if (tabName === 'stores') {
        document.getElementById('pendingStores').style.display = 'block';
    } else if (tabName === 'offers') {
        document.getElementById('pendingOffers').style.display = 'block';
    }
}

async function searchMerchants() {
    const searchTerm = document.getElementById('merchantSearch').value.toLowerCase();
    const filteredMerchants = merchants.filter(merchant =>
        merchant.name.toLowerCase().includes(searchTerm) ||
        merchant.businessName.toLowerCase().includes(searchTerm) ||
        merchant.email.toLowerCase().includes(searchTerm)
    );

    const merchantsListElement = document.getElementById('merchantsList');

    if (filteredMerchants.length === 0) {
        merchantsListElement.innerHTML = '<div class="empty-state">No merchants found matching your search</div>';
        return;
    }

    merchantsListElement.innerHTML = filteredMerchants.map(merchant => `
        <div class="merchant-item">
            <div class="merchant-header">
                <div class="merchant-info">
                    <div class="merchant-avatar">
                        ${merchant.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="merchant-details">
                        <div class="merchant-name">${merchant.name}</div>
                        <div class="merchant-business">${merchant.businessName || 'Business Name Not Provided'}</div>
                        ${merchant.businessType ? `
                        <div class="merchant-type">
                            <span class="detail-label">Business Type:</span>
                            <span class="detail-text">${merchant.businessType}</span>
                        </div>` : ''}
                    </div>
                </div>

            </div>
            
            <div class="merchant-details-grid">
                <div class="detail-item">
                    <div class="detail-icon">
                        <i class="fas fa-envelope"></i>
                    </div>
                    <div class="detail-content">
                        <span class="detail-label">Email</span>
                        <span class="detail-text">${merchant.email}</span>
                    </div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-icon">
                        <i class="fas fa-phone"></i>
                    </div>
                    <div class="detail-content">
                        <span class="detail-label">Phone</span>
                        <span class="detail-text">${merchant.phone || 'Not provided'}</span>
                    </div>
                </div>
                
                ${merchant.website ? `
                    <div class="detail-item website-item">
                        <div class="detail-icon">
                            <i class="fas fa-globe"></i>
                        </div>
                        <div class="detail-content">
                            <span class="detail-label">Website</span>
                            <a href="${merchant.website}" target="_blank" class="detail-link">${merchant.website}</a>
                        </div>
                    </div>
                ` : ''}
                
                <div class="detail-item">
                    <div class="detail-icon">
                        <i class="fas fa-map-marker-alt"></i>
                    </div>
                    <div class="detail-content">
                        <span class="detail-label">Address</span>
                        <span class="detail-text">${merchant.address || 'Not provided'}</span>
                    </div>
                </div>
            </div>
            
            <div class="merchant-actions">

                <button class="btn ${merchant.isApproved ? 'btn-warning' : 'btn-success'}" 
                <button class="btn btn-success" 
                        onclick="toggleMerchantApproval('${merchant._id}', false)" 
                        ${merchant.isApproved ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn btn-danger" 
                        onclick="toggleMerchantApproval('${merchant._id}', true)" 
                        ${!merchant.isApproved ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                    <i class="fas fa-times"></i> Reject
                </button>
                <button class="btn btn-primary" onclick="sendNotificationToMerchant('${merchant._id}')">
                    <i class="fas fa-bell"></i> Notify
                </button>
                <button class="btn btn-danger" onclick="deleteMerchant('${merchant._id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

async function toggleMerchantApproval(merchantId, currentStatus) {
    // Convert currentStatus to proper boolean if it's undefined
    const isCurrentlyApproved = !!currentStatus;

    // OPTIMISTIC UPDATE: Update local state immediately
    const merchant = merchants.find(m => m._id === merchantId);
    if (merchant) {
        merchant.isApproved = !isCurrentlyApproved;
        displayMerchants(); // Re-render immediately to update button color
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/merchants/${merchantId}/toggle-approval`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer admin-token'
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            const newStatus = !isCurrentlyApproved;
            // User requested specific messages
            let msg = '';
            if (newStatus) {
                msg = 'Merchant approved successfully!';
            } else {
                msg = 'Merchant reject successfully!';
            }
            showToast(msg, 'success');
            setTimeout(loadMerchants, 1000); // Sync with server after delay
        } else {
            // Revert on failure
            if (merchant) {
                merchant.isApproved = isCurrentlyApproved;
                displayMerchants();
            }
            showToast(data.message || `Error ${isCurrentlyApproved ? 'rejecting' : 'approving'} merchant`, 'error');
        }
    } catch (error) {
        // Revert on error
        if (merchant) {
            merchant.isApproved = isCurrentlyApproved;
            displayMerchants();
        }
        console.error('Error toggling merchant approval:', error);
        showToast(`Error ${isCurrentlyApproved ? 'rejecting' : 'approving'} merchant`, 'error');
    }
}

async function approveStore(storeId) {
    try {
        const response = await fetch(`${API_BASE_URL}/merchants/stores/${storeId}/approve`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer admin-token' // Simple admin token for now
            }
        });

        const data = await response.json();

        if (data.success) {
            showToast('Store approved successfully', 'success');
        } else {
            showToast(data.message || 'Error approving store', 'error');
        }
    } catch (error) {
        console.error('Error approving store:', error);
        showToast('Error approving store', 'error');
    }
}

async function approveOffer(offerId) {
    try {
        const response = await fetch(`${API_BASE_URL}/merchants/offers/${offerId}/approve`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer admin-token' // Simple admin token for now
            }
        });

        const data = await response.json();

        if (data.success) {
            showToast('Offer approved successfully', 'success');
        } else {
            showToast(data.message || 'Error approving offer', 'error');
        }
    } catch (error) {
        console.error('Error approving offer:', error);
        showToast('Error approving offer', 'error');
    }
}

async function deleteMerchant(merchantId) {
    if (!confirm('Are you sure you want to delete this merchant?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/merchants/${merchantId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer admin-token' // Simple admin token for now
            }
        });

        const data = await response.json();

        if (data.success) {
            showToast('Merchant deleted successfully', 'success');
            loadMerchants();
        } else {
            showToast(data.message || 'Error deleting merchant', 'error');
        }
    } catch (error) {
        console.error('Error deleting merchant:', error);
        showToast('Error deleting merchant', 'error');
    }
}

function hideCreateMerchantForm() {
    document.getElementById('createMerchantForm').style.display = 'none';
    document.getElementById('merchantForm').reset();
}

document.getElementById('merchantForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const merchantData = Object.fromEntries(formData.entries());

    Object.keys(merchantData).forEach(key => {
        if (merchantData[key] === '') {
            merchantData[key] = undefined;
        }
    });

    try {
        const response = await fetch(`${API_BASE_URL}/merchants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(merchantData)
        });

        const data = await response.json();

        if (data.success) {
            showToast('Merchant created successfully!', 'success');
            hideCreateMerchantForm();
            loadMerchants();
        } else {
            showToast(data.message || 'Error creating merchant', 'error');
        }
    } catch (error) {
        console.error('Error creating merchant:', error);
        showToast('Error creating merchant', 'error');
    }
});


// Merchant Control Functions
async function toggleMerchantStatus(merchantId, currentStatus) {
    try {
        const newStatus = !currentStatus;
        const response = await fetch(`${API_BASE_URL}/admin/merchants/${merchantId}/toggle-status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer admin-token'
            },
            body: JSON.stringify({ isActive: newStatus })
        });

        const data = await response.json();

        if (data.success) {
            showToast(`Merchant ${newStatus ? 'activated' : 'deactivated'} successfully!`, 'success');
            loadMerchants();
        } else {
            showToast(data.message || 'Error updating merchant status', 'error');
        }
    } catch (error) {
        console.error('Error updating merchant status:', error);
        showToast('Error updating merchant status', 'error');
    }
}

async function sendNotificationToMerchant(merchantId) {
    const message = prompt('Enter notification message:');
    if (!message) return;

    try {
        const response = await fetch(`${API_BASE_URL}/merchants/${merchantId}/notify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer admin-token' // Simple admin token for now
            },
            body: JSON.stringify({
                message,
                type: 'general'
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast('Notification sent successfully!', 'success');
        } else {
            showToast(data.message || 'Error sending notification', 'error');
        }
    } catch (error) {
        console.error('Error sending notification:', error);
        showToast('Error sending notification', 'error');
    }
}
