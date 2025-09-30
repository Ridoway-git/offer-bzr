// Admin Merchant Control Functions
// This file contains functions for admin to control merchants

// Toggle merchant active/inactive status
async function toggleMerchantStatus(merchantId, currentStatus) {
    try {
        const newStatus = !currentStatus;
        const response = await fetch(`${API_BASE_URL}/merchants/${merchantId}/toggle-status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
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

// Send custom notification to merchant
async function sendNotificationToMerchant(merchantId) {
    const message = prompt('Enter notification message:');
    if (!message) return;

    try {
        const response = await fetch(`${API_BASE_URL}/merchants/${merchantId}/notify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message })
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

// Enhanced merchant card HTML with control buttons
function createMerchantCardHTML(merchant) {
    return `
        <div class="merchant-item">
            <div class="merchant-header">
                <div class="merchant-info">
                    <div class="merchant-avatar">
                        ${merchant.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="merchant-details">
                        <div class="merchant-name">${merchant.name}</div>
                        <div class="merchant-business">${merchant.businessName} - ${merchant.businessType}</div>
                        <div class="merchant-id">ID: ${merchant._id}</div>
                    </div>
                </div>
                <div class="merchant-status">
                    <span class="status-badge ${merchant.isApproved ? 'status-approved' : 'status-pending'}">
                        ${merchant.isApproved ? 'Approved' : 'Pending'}
                    </span>
                    <span class="status-badge ${merchant.isActive ? 'status-active' : 'status-inactive'}">
                        ${merchant.isActive ? 'Active' : 'Inactive'}
                    </span>
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
                        <span class="detail-text">${merchant.phone}</span>
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
                        <span class="detail-text">${merchant.address}</span>
                    </div>
                </div>
            </div>
            
            <div class="merchant-actions">
                <button class="btn btn-info" onclick="openMerchantDashboard('${merchant._id}')">
                    <i class="fas fa-external-link-alt"></i> Go to Dashboard
                </button>
                <button class="btn btn-secondary" onclick="editMerchant('${merchant._id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn ${merchant.isApproved ? 'btn-warning' : 'btn-success'}" 
                        onclick="toggleMerchantApproval('${merchant._id}', ${merchant.isApproved})">
                    <i class="fas fa-${merchant.isApproved ? 'times' : 'check'}"></i>
                    ${merchant.isApproved ? 'Disapprove' : 'Approve'}
                </button>
                <button class="btn ${merchant.isActive ? 'btn-warning' : 'btn-success'}" 
                        onclick="toggleMerchantStatus('${merchant._id}', ${merchant.isActive})">
                    <i class="fas fa-${merchant.isActive ? 'pause' : 'play'}"></i>
                    ${merchant.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button class="btn btn-primary" onclick="sendNotificationToMerchant('${merchant._id}')">
                    <i class="fas fa-bell"></i> Notify
                </button>
                <button class="btn btn-danger" onclick="deleteMerchant('${merchant._id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
}
