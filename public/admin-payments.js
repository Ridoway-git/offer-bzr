// Payment Management Functions
let payments = [];
let merchantsWithPaymentStatus = [];

// Load payments when section is shown
document.addEventListener('DOMContentLoaded', function() {
    // Override showSection to load payments when payments section is shown
    const originalShowSection = window.showSection;
    window.showSection = function(sectionName) {
        originalShowSection(sectionName);
        if (sectionName === 'payments') {
            loadPayments();
            loadMerchantsWithPaymentStatus();
            loadMerchantsForFeeForm();
        }
    };
});

// Load all payments
async function loadPayments() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/payments/all`, {
            headers: {
                'Authorization': 'Bearer admin-token',
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            payments = data.data || [];
            displayPayments(payments);
        } else {
            showToast('Error loading payments', 'error');
            document.getElementById('paymentsList').innerHTML = '<div class="loading">Error loading payments</div>';
        }
    } catch (error) {
        console.error('Error loading payments:', error);
        showToast('Error loading payments', 'error');
        document.getElementById('paymentsList').innerHTML = '<div class="loading">Error loading payments</div>';
    }
}

// Display payments
function displayPayments(paymentsList) {
    const paymentsListElement = document.getElementById('paymentsList');
    
    if (paymentsList.length === 0) {
        paymentsListElement.innerHTML = '<div class="empty-state">No payments found</div>';
        return;
    }

    paymentsListElement.innerHTML = paymentsList.map(payment => `
        <div class="payment-item">
            <div class="payment-header">
                <div class="payment-info">
                    <div class="payment-merchant">
                        <strong>${payment.merchant?.name || 'N/A'}</strong>
                        <span class="payment-email">${payment.merchant?.email || ''}</span>
                    </div>
                    <div class="payment-amount">
                        <span class="amount-label">Amount:</span>
                        <span class="amount-value">৳${payment.amount.toFixed(2)}</span>
                    </div>
                </div>
                <div class="payment-status">
                    <span class="status-badge ${payment.status === 'approved' ? 'status-approved' : payment.status === 'rejected' ? 'status-rejected' : 'status-pending'}">
                        ${payment.status}
                    </span>
                </div>
            </div>
            
            <div class="payment-details-grid">
                <div class="detail-item">
                    <div class="detail-icon">
                        <i class="fas fa-calendar"></i>
                    </div>
                    <div class="detail-content">
                        <span class="detail-label">Date</span>
                        <span class="detail-text">${new Date(payment.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-icon">
                        <i class="fas fa-credit-card"></i>
                    </div>
                    <div class="detail-content">
                        <span class="detail-label">Payment Method</span>
                        <span class="detail-text">${payment.paymentMethod.replace('_', ' ').toUpperCase()}</span>
                    </div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-icon">
                        <i class="fas fa-receipt"></i>
                    </div>
                    <div class="detail-content">
                        <span class="detail-label">Transaction ID</span>
                        <span class="detail-text" style="font-family: monospace; font-size: 0.9em;">${payment.transactionId}</span>
                    </div>
                </div>
            </div>
            
            <div class="payment-actions">
                <button class="btn btn-secondary" onclick="viewPaymentDetails('${payment._id}')">
                    <i class="fas fa-eye"></i> View Details
                </button>
                <button class="btn btn-danger" onclick="deletePayment('${payment._id}')" style="margin-left: 5px;">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Approve payment
async function approvePayment(paymentId) {
    if (!confirm('Approve this payment?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/payments/${paymentId}/approve`, {
            method: 'PATCH',
            headers: {
                'Authorization': 'Bearer admin-token',
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            showToast('Payment approved successfully!', 'success');
            loadPayments();
            loadMerchantsWithPaymentStatus();
        } else {
            showToast(data.message || 'Error approving payment', 'error');
        }
    } catch (error) {
        console.error('Error approving payment:', error);
        showToast('Error approving payment', 'error');
    }
}

// Reject payment
async function rejectPayment(paymentId) {
    if (!confirm('Reject this payment?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/payments/${paymentId}/reject`, {
            method: 'PATCH',
            headers: {
                'Authorization': 'Bearer admin-token',
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            showToast('Payment rejected!', 'success');
            loadPayments();
        } else {
            showToast(data.message || 'Error rejecting payment', 'error');
        }
    } catch (error) {
        console.error('Error rejecting payment:', error);
        showToast('Error rejecting payment', 'error');
    }
}

// View payment details
async function viewPaymentDetails(paymentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/payments/${paymentId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken') || 'admin-token'}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            const payment = data.data;
            const details = `
                <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 800px; margin: 2rem auto;">
                    <h3>Payment Details</h3>
                    <div style="margin-top: 1rem;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div>
                                <p><strong>Merchant:</strong> ${payment.merchant?.name || 'N/A'}</p>
                                <p><strong>Email:</strong> ${payment.merchant?.email || 'N/A'}</p>
                                <p><strong>Amount:</strong> ৳${payment.amount.toFixed(2)}</p>
                                <p><strong>Method:</strong> ${payment.paymentMethod.replace('_', ' ').toUpperCase()}</p>
                                <p><strong>Transaction ID:</strong> ${payment.transactionId}</p>
                                <p><strong>Status:</strong> ${payment.status}</p>
                                <p><strong>Date:</strong> ${new Date(payment.createdAt).toLocaleString()}</p>
                                ${payment.senderPhone ? `<p><strong>Sender Phone:</strong> ${payment.senderPhone}</p>` : ''}
                                ${payment.receiverPhone ? `<p><strong>Receiver Phone:</strong> ${payment.receiverPhone}</p>` : ''}
                                ${payment.bankName ? `<p><strong>Bank:</strong> ${payment.bankName}</p>` : ''}
                                ${payment.bankAccountNumber ? `<p><strong>Account:</strong> ${payment.bankAccountNumber}</p>` : ''}
                            </div>
                            <div style="text-align: center;">
                                ${payment.paymentProof ? `
                                    <p><strong>Payment Proof:</strong></p>
                                    <img src="${payment.paymentProof}" alt="Payment Proof" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                                    <div style="display: none; margin-top: 10px;">No image preview available</div>
                                    <a href="${payment.paymentProof}" target="_blank" style="display: inline-block; margin-top: 10px; padding: 5px 10px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">Open Image in New Tab</a>
                                ` : '<p>No payment proof provided</p>'}
                            </div>
                        </div>
                    </div>
                    <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()" style="margin-top: 1rem;">Close</button>
                </div>
            `;
            
            const modal = document.createElement('div');
            modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center; overflow-y: auto; padding: 20px;';
            modal.innerHTML = details;
            document.body.appendChild(modal);
        } else {
            showToast(data.message || 'Error loading payment details', 'error');
        }
    } catch (error) {
        console.error('Error loading payment details:', error);
        showToast('Error loading payment details', 'error');
    }
}

// Delete payment
async function deletePayment(paymentId) {
    if (!confirm('Are you sure you want to delete this payment? This action cannot be undone.')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/payments/${paymentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken') || 'admin-token'}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Payment deleted successfully!', 'success');
            loadPayments();
        } else {
            showToast(data.message || 'Error deleting payment', 'error');
        }
    } catch (error) {
        console.error('Error deleting payment:', error);
        showToast('Error deleting payment', 'error');
    }
}

// Load merchants with payment status
async function loadMerchantsWithPaymentStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/merchants/payment-status`, {
            headers: {
                'Authorization': 'Bearer admin-token',
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            merchantsWithPaymentStatus = data.data || [];
            updateMerchantsDisplay();
        }
    } catch (error) {
        console.error('Error loading merchants with payment status:', error);
    }
}

// Update merchants display with payment status
function updateMerchantsDisplay() {
    // This will be called when merchants section is shown
    // We'll update the displayMerchants function to include payment info
}

// Load merchants for fee form
async function loadMerchantsForFeeForm() {
    try {
        const response = await fetch(`${API_BASE_URL}/merchants`, {
            headers: {
                'Authorization': 'Bearer admin-token',
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            const select = document.getElementById('feeMerchantSelect');
            select.innerHTML = '<option value="">Select Merchant</option>';
            
            data.data.forEach(merchant => {
                const option = document.createElement('option');
                option.value = merchant._id;
                option.textContent = `${merchant.name} (${merchant.email})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading merchants for fee form:', error);
    }
}

// Set access fee form submission
document.getElementById('accessFeeForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const merchantId = formData.get('merchantId');
    const accessFee = parseFloat(formData.get('accessFee'));

    try {
        const response = await fetch(`${API_BASE_URL}/admin/merchants/${merchantId}/set-access-fee`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer admin-token',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ accessFee })
        });

        const data = await response.json();

        if (data.success) {
            showToast('Access fee set successfully!', 'success');
            this.reset();
            loadMerchantsWithPaymentStatus();
            loadMerchants();
        } else {
            showToast(data.message || 'Error setting access fee', 'error');
        }
    } catch (error) {
        console.error('Error setting access fee:', error);
        showToast('Error setting access fee', 'error');
    }
});

// Mark access fee as paid
async function markAccessFeePaid(merchantId) {
    if (!confirm('Mark access fee as paid for this merchant?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/merchants/${merchantId}/mark-fee-paid`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer admin-token',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });

        const data = await response.json();

        if (data.success) {
            showToast('Access fee marked as paid!', 'success');
            loadMerchantsWithPaymentStatus();
            loadMerchants();
        } else {
            showToast(data.message || 'Error marking fee as paid', 'error');
        }
    } catch (error) {
        console.error('Error marking fee as paid:', error);
        showToast('Error marking fee as paid', 'error');
    }
}

