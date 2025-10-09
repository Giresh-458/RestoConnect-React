document.addEventListener('DOMContentLoaded', () => {
    // Initialize counters based on cart data passed from server
    const cart = window.cartData || [];

    cart.forEach(item => {
        const counters = document.querySelectorAll(`.counter[data-dish="${item.dish}"]`);
        counters.forEach(counter => {
            const index = counter.getAttribute('data-index');
            const cartButton = document.querySelector(`.cart_button[data-index="${index}"]`);
            const itemCount = counter.querySelector('.item_count');
            if(cartButton && counter && itemCount){
                cartButton.style.display = 'none';
                counter.style.display = 'flex';
                itemCount.textContent = item.quantity;
                counter.classList.add('active');
            }
        });
    });

    document.getElementById('menu').addEventListener('click', function(event) {
        const target = event.target;
        const index = target.dataset.index;
        
        if (!index) return;

        const cartButton = document.querySelector(`.cart_button[data-index="${index}"]`);
        const counter = document.querySelector(`.counter[data-index="${index}"]`);
        const itemCount = counter.querySelector('.item_count');

        if (target.classList.contains('cart_button')) {
            cartButton.style.display = 'none';
            counter.style.display = 'flex';
            itemCount.textContent = 1;
            counter.classList.add('active');
        } 

        if (target.classList.contains('increase')) {
            itemCount.textContent = parseInt(itemCount.textContent) + 1;
        }

        if (target.classList.contains('decrease')) {
            let count = parseInt(itemCount.textContent) - 1;
            itemCount.textContent = count;
            
            if (count === 0) {
                cartButton.style.display = 'inline-block';
                counter.style.display = 'none';
            }
        }
    });

    // The order button submits the hidden form to /customer/cart/order
});
