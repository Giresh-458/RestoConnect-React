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

    const counter = document.querySelector(`.counter[data-index="${index}"]`);
    const cartButton = document.querySelector(`.cart_button[data-index="${index}"]`);
    const itemCount = counter.querySelector('.item_count');
    const dish = counter.getAttribute('data-dish');

    if (target.classList.contains('cart_button')) {
        event.preventDefault();
        cartButton.style.display = 'none';
        counter.style.display = 'flex';
        itemCount.textContent = 1;
        counter.classList.add('active');
        fetch('/customer/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dish })
        });
    }

    if (target.classList.contains('increase')) {
        event.preventDefault();
        itemCount.textContent = Number(itemCount.textContent) + 1;
        fetch('/customer/cart/increase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dish })
        });
    }

    if (target.classList.contains('decrease')) {
        event.preventDefault();
        let count = Number(itemCount.textContent) - 1;
        itemCount.textContent = count;
        if (count === 0) {
            cartButton.style.display = 'inline-block';
            counter.style.display = 'none';
        }
        fetch('/customer/cart/decrease', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dish })
        });
    }
});




    // The order button submits the hidden form to /customer/cart/order
});
