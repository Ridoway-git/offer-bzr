// Notification functions for admin dashboard

// Load notifications when section is shown
function showNotificationSection() {
    loadRecentNotifications();
}

// Make function available globally
window.showNotificationSection = showNotificationSection;

// Load recent notifications
async function loadRecentNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    if (!notificationsList) return;

    notificationsList.innerHTML = '<div class="loading">Loading notifications...</div>';

    try {
        const notifications = await window.loadRecentNotifications();
        
        if (notifications.length === 0) {
            notificationsList.innerHTML = '<div class="loading">No notifications sent yet.</div>';
            return;
        }

        notificationsList.innerHTML = notifications.map(notification => {
            const date = notification.createdAt instanceof Date 
                ? notification.createdAt 
                : new Date(notification.createdAt);
            const formattedDate = date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const typeColors = {
                info: 'bg-blue-100 text-blue-800',
                success: 'bg-green-100 text-green-800',
                warning: 'bg-yellow-100 text-yellow-800',
                error: 'bg-red-100 text-red-800'
            };

            return `
                <div class="store-item">
                    <div class="store-header">
                        <div class="store-info">
                            <div class="store-details-text">
                                <div class="store-title">${notification.title}</div>
                                <div class="store-category">
                                    <span class="badge ${typeColors[notification.type] || typeColors.info}">${notification.type || 'info'}</span>
                                    <span class="text-gray-500 ml-2">${formattedDate}</span>
                                </div>
                                <div class="store-description" style="margin-top: 8px;">${notification.message}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading notifications:', error);
        notificationsList.innerHTML = '<div class="loading">Error loading notifications.</div>';
    }
}

// Handle notification form submission
document.addEventListener('DOMContentLoaded', function() {
    const notificationForm = document.getElementById('notificationForm');
    if (notificationForm) {
        notificationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const title = document.getElementById('notificationTitle').value.trim();
            const message = document.getElementById('notificationMessage').value.trim();
            const type = document.getElementById('notificationType').value;

            if (!title || !message) {
                showToast('Please fill in all required fields', 'error');
                return;
            }

            const submitBtn = notificationForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

            try {
                const result = await window.sendNotificationToAll(title, message, type);
                
                if (result.success) {
                    showToast('Notification sent successfully to all users!', 'success');
                    notificationForm.reset();
                    loadRecentNotifications();
                } else {
                    showToast(result.error || 'Error sending notification', 'error');
                }
            } catch (error) {
                console.error('Error sending notification:', error);
                showToast('Error sending notification', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // Override showSection to load notifications when section is shown
    const originalShowSection = window.showSection;
    if (originalShowSection) {
        window.showSection = function(sectionName) {
            originalShowSection(sectionName);
            if (sectionName === 'notifications') {
                setTimeout(() => {
                    showNotificationSection();
                }, 100);
            }
        };
    } else {
        // If showSection doesn't exist yet, wait for it
        const checkShowSection = setInterval(() => {
            if (window.showSection) {
                clearInterval(checkShowSection);
                const originalShowSection = window.showSection;
                window.showSection = function(sectionName) {
                    originalShowSection(sectionName);
                    if (sectionName === 'notifications') {
                        setTimeout(() => {
                            showNotificationSection();
                        }, 100);
                    }
                };
            }
        }, 100);
        
        // Stop checking after 5 seconds
        setTimeout(() => {
            clearInterval(checkShowSection);
        }, 5000);
    }
});

