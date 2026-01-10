// Package Management Functions
let packages = [];

// Load packages when section is shown
document.addEventListener('DOMContentLoaded', function() {
    // Override showSection to load packages when packages section is shown
    const originalShowSection = window.showSection;
    window.showSection = function(sectionName) {
        originalShowSection(sectionName);
        if (sectionName === 'packages') {
            loadPackages();
        }
    };
});

// Show create package form
function showCreatePackageForm() {
    document.getElementById('createPackageForm').style.display = 'block';
}

// Hide create package form
function hideCreatePackageForm() {
    document.getElementById('createPackageForm').style.display = 'none';
    document.getElementById('packageForm').reset();
}

// Load all packages
async function loadPackages() {
    try {
        const response = await fetch(`${API_BASE_URL}/packages`, {
            headers: {
                'Authorization': 'Bearer admin-token',
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            packages = data.data || [];
            displayPackages(packages);
        } else {
            showToast('Error loading packages', 'error');
            document.getElementById('packagesList').innerHTML = '<div class="loading">Error loading packages</div>';
        }
    } catch (error) {
        console.error('Error loading packages:', error);
        showToast('Error loading packages', 'error');
        document.getElementById('packagesList').innerHTML = '<div class="loading">Error loading packages</div>';
    }
}

// Display packages
function displayPackages(packagesList) {
    const packagesListElement = document.getElementById('packagesList');
    
    if (packagesList.length === 0) {
        packagesListElement.innerHTML = '<div class="empty-state">No packages found</div>';
        return;
    }

    packagesListElement.innerHTML = packagesList.map(pkg => `
        <div class="package-item">
            <div class="package-header">
                <div class="package-info">
                    <div class="package-name">
                        <strong>${pkg.name}</strong>
                        <span class="package-duration">${pkg.durationInMonths} Month${pkg.durationInMonths > 1 ? 's' : ''}</span>
                    </div>
                    <div class="package-price">
                        <span class="price-label">Price:</span>
                        <span class="price-value">৳${pkg.price.toFixed(2)}</span>
                    </div>
                </div>
                <div class="package-status">
                    <span class="status-badge ${pkg.isActive ? 'status-active' : 'status-inactive'}">
                        ${pkg.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>
            
            <div class="package-details-grid">
                <div class="detail-item">
                    <div class="detail-icon">
                        <i class="fas fa-calendar"></i>
                    </div>
                    <div class="detail-content">
                        <span class="detail-label">Created</span>
                        <span class="detail-text">${new Date(pkg.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="detail-content">
                        <span class="detail-label">Description</span>
                        <span class="detail-text">${pkg.description || 'No description'}</span>
                    </div>
                </div>
            </div>
            
            <div class="package-actions">
                <button class="btn btn-warning" onclick="editPackage('${pkg._id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger" onclick="deletePackage('${pkg._id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Submit package form
document.getElementById('packageForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const packageData = {
        name: formData.get('name'),
        durationInMonths: parseInt(formData.get('durationInMonths')),
        price: parseFloat(formData.get('price')),
        description: formData.get('description'),
        isActive: formData.get('isActive') === 'on' || formData.get('isActive') === 'true'
    };

    try {
        const response = await fetch(`${API_BASE_URL}/packages`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer admin-token',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(packageData)
        });

        const data = await response.json();

        if (data.success) {
            showToast('Package created successfully!', 'success');
            hideCreatePackageForm();
            loadPackages();
            this.reset();
        } else {
            showToast(data.message || 'Error creating package', 'error');
        }
    } catch (error) {
        console.error('Error creating package:', error);
        showToast('Error creating package', 'error');
    }
});

// Edit package
async function editPackage(packageId) {
    const pkg = packages.find(p => p._id === packageId);
    if (!pkg) return;

    // Fill form with package data
    document.getElementById('packageName').value = pkg.name;
    document.getElementById('packageDuration').value = pkg.durationInMonths;
    document.getElementById('packagePrice').value = pkg.price;
    document.getElementById('packageDescription').value = pkg.description || '';
    document.getElementById('packageActive').checked = pkg.isActive;

    // Change form to update mode
    const form = document.getElementById('packageForm');
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = 'Update Package';
    
    // Temporarily change form submission to update
    const originalSubmit = form.onsubmit;
    form.onsubmit = async function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const packageData = {
            name: formData.get('name'),
            durationInMonths: parseInt(formData.get('durationInMonths')),
            price: parseFloat(formData.get('price')),
            description: formData.get('description'),
            isActive: formData.get('isActive') === 'on' || formData.get('isActive') === 'true'
        };

        try {
            const response = await fetch(`${API_BASE_URL}/packages/${packageId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer admin-token',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(packageData)
            });

            const data = await response.json();

            if (data.success) {
                showToast('Package updated successfully!', 'success');
                hideCreatePackageForm();
                loadPackages();
                form.reset();
                submitButton.textContent = 'Create Package';
                form.onsubmit = originalSubmit;
            } else {
                showToast(data.message || 'Error updating package', 'error');
            }
        } catch (error) {
            console.error('Error updating package:', error);
            showToast('Error updating package', 'error');
        }
    };

    showCreatePackageForm();
}

// Delete package
async function deletePackage(packageId) {
    if (!confirm('Delete this package? This action cannot be undone.')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/packages/${packageId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer admin-token',
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            showToast('Package deleted successfully!', 'success');
            loadPackages();
        } else {
            showToast(data.message || 'Error deleting package', 'error');
        }
    } catch (error) {
        console.error('Error deleting package:', error);
        showToast('Error deleting package', 'error');
    }
}