// Admin Merchant Control Functions
// This file contains functions for admin to control merchants

// Override the searchMerchants function to include new buttons
function updateMerchantCardHTML() {
    // This function will be called to update merchant cards with new buttons
    if (typeof searchMerchants === 'function') {
        const originalSearchMerchants = searchMerchants;
        searchMerchants = function () {
            originalSearchMerchants();
            // Add new buttons after the original function runs
            addMerchantControlButtons();
        };
    }
}

function addMerchantControlButtons() {
    // Add control buttons to existing merchant cards
    const merchantItems = document.querySelectorAll('.merchant-item');
    merchantItems.forEach(item => {
        const actionsDiv = item.querySelector('.merchant-actions');
        if (actionsDiv && !actionsDiv.querySelector('.btn-primary')) {
            // Add new buttons if they don't exist
            const merchantId = item.querySelector('.merchant-id')?.textContent?.replace('ID: ', '');
            if (merchantId) {
                const newButtons = `
                    <button class="btn btn-primary" onclick="sendNotificationToMerchant('${merchantId}')">
                        <i class="fas fa-bell"></i> Notify
                    </button>
                `;
                actionsDiv.insertAdjacentHTML('beforeend', newButtons);
            }
        }
    });
}

// Toggle merchant active/inactive status
async function toggleMerchantStatus(merchantId, currentStatus) {
    try {
        const newStatus = !currentStatus;
        const response = await fetch(`${API_BASE_URL}/admin/merchants/${merchantId}/toggle-status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer admin-token' // Simple admin token for now
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

// Toggle merchant active/inactive status
async function toggleMerchantStatus(merchantId, currentStatus) {
    try {
        const newStatus = !currentStatus;
        const response = await fetch(`${API_BASE_URL}/admin/merchants/${merchantId}/toggle-status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer admin-token' // Simple admin token for now
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

// Enhanced merchant card HTML with control buttons


// Initialize merchant control system when page loads
document.addEventListener('DOMContentLoaded', function () {
    // Wait for the page to fully load
    setTimeout(() => {
        if (typeof addMerchantControlButtons === 'function') {
            addMerchantControlButtons();
        }
    }, 1000);
});

// Also run when merchants are loaded
window.addEventListener('merchantsLoaded', function () {
    if (typeof addMerchantControlButtons === 'function') {
        addMerchantControlButtons();
    }
});


