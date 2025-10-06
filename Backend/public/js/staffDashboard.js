// Add event listener for remove reservation buttons
document.addEventListener('DOMContentLoaded', () => {
    const removeButtons = document.querySelectorAll('.remove-reservation-btn');
    removeButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const reservationId = event.target.getAttribute('data-reservation-id');
            if (!reservationId) return;

            if (!confirm('Are you sure you want to remove this reservation?')) {
                return;
            }

            try {
                const response = await fetch(`/staff/Dashboard/remove-reservation/${reservationId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    window.location.reload();
                } else {
                    alert('Failed to remove reservation.');
                }
            } catch (error) {
                console.error('Error removing reservation:', error);
                alert('Error removing reservation.');
            }
        });
    });
});
