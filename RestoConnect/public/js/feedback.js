function setupStarRating(starContainerId, ratingTextId) {
    const stars = document.querySelectorAll(`#${starContainerId} .star`);
    const ratingText = document.getElementById(ratingTextId);

    stars.forEach(star => {
        star.addEventListener('click', function() {
            let rating = this.getAttribute('data-value');

            stars.forEach(s => s.classList.remove('selected'));

            for (let i = 0; i < rating; i++) {
                stars[i].classList.add('selected');
            }

            const ratingLabels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
            ratingText.textContent = ratingLabels[rating - 1];
        });
    });
}

setupStarRating('starRating', 'diningRatingText');
setupStarRating('orderStarRating', 'orderRatingText');

document.querySelectorAll('.tag').forEach(tag => {
    tag.addEventListener('click', function() {
        this.classList.toggle('selected');
    });
});
