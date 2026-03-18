# Stripe Payment Integration Documentation

## Overview
This document explains how Stripe payment processing has been integrated into the RestoConnect-React project. The integration enables secure online payments for restaurant orders through Stripe's Payment Intents API.

## Architecture
The Stripe integration follows a two-tier architecture:
- **Backend (Node.js/Express)**: Handles secure payment intent creation and server-side operations
- **Frontend (React)**: Manages payment UI and client-side payment processing

## Dependencies

### Backend Dependencies
```json
{
  "stripe": "^20.4.1"
}
```

### Frontend Dependencies
```json
{
  "@stripe/react-stripe-js": "^5.6.1",
  "@stripe/stripe-js": "^8.10.0"
}
```

## Environment Configuration

### Backend Environment Variables
```env
STRIPE_SECRET_KEY=sk_test_...  # Your Stripe secret key
```

### Frontend Environment Variables
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Your Stripe publishable key
```

## Backend Implementation

### Stripe Route (`Backend/routes/stripe.js`)

The backend handles Payment Intent creation with the following features:

#### Key Components:
1. **Stripe Initialization**
   ```javascript
   const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
   ```

2. **Payment Intent Creation Endpoint**
   - **Route**: `POST /api/create-payment-intent`
   - **Validations**:
     - Amount must be a positive integer (in smallest currency unit)
     - Currency must be a valid 3-letter ISO code
   - **Response**: Returns `clientSecret` for frontend payment confirmation

#### Security Features:
- Environment variable validation on startup
- Input sanitization and validation
- Error handling with appropriate HTTP status codes

## Frontend Implementation

### App-Level Configuration (`Frontend/src/App.jsx`)

The Stripe provider is configured at the application root:

```javascript
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

// Wrapped around RouterProvider
{stripePromise ? (
  <Elements stripe={stripePromise}>
    <RouterProvider router={router} />
  </Elements>
) : (
  <RouterProvider router={router} />
)}
```

### Payment Page Implementation (`Frontend/src/pages/PaymentPage.jsx`)

#### Core Components:

1. **StripeCheckout Component**
   - Handles the payment form submission
   - Integrates with Stripe Elements for secure card input
   - Manages payment processing states

2. **Payment Flow**:
   ```javascript
   // 1. Create Payment Intent on backend
   const resp = await fetch('/api/create-payment-intent', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ 
       amount: Math.round(grandTotal * 100), 
       currency: 'inr' 
     }),
   });

   // 2. Confirm payment with Stripe
   const result = await stripe.confirmCardPayment(data.clientSecret, {
     payment_method: {
       card: cardEl,
     },
   });

   // 3. Handle success/failure
   if (result.paymentIntent?.status === 'succeeded') {
     // Create order and redirect
   }
   ```

#### Features:
- **Secure Card Input**: Uses `CardElement` from Stripe Elements
- **Error Handling**: Comprehensive error states and user feedback
- **Loading States**: Processing indicators during payment
- **Order Integration**: Automatically creates order after successful payment
- **Promo Code Support**: Integrates with existing promo system

## Integration Points

### 1. Payment Intent Creation
- Frontend sends amount and currency to backend
- Backend creates Stripe Payment Intent
- Backend returns `clientSecret` to frontend

### 2. Payment Confirmation
- Frontend uses `clientSecret` to confirm payment
- Stripe handles card processing and security
- Payment status returned to frontend

### 3. Order Creation
- On successful payment, frontend creates order
- Stripe Payment Intent ID is stored with order for reference
- User redirected to order confirmation page

## Security Considerations

### Backend Security:
- Secret key stored in environment variables
- Input validation and sanitization
- HTTPS required for production
- No sensitive data logged

### Frontend Security:
- Publishable key only (no secret keys)
- Stripe Elements handles sensitive card data
- No card details ever touch your servers
- PCI compliance simplified through Stripe

## Payment Flow Diagram

```
User → Payment Page → Backend Payment Intent → Stripe → Client Secret
                ↓
            Card Input (Stripe Elements)
                ↓
        Confirm Payment → Stripe Processing → Payment Status
                ↓
          Order Creation → Order Confirmation
```

## Currency Configuration

Currently configured for Indian Rupees (INR):
- Backend: Default currency `inr`
- Frontend: Amount converted to paise (multiply by 100)
- Display: Formatted as ₹ symbol

## Error Handling

### Backend Errors:
- Invalid amount/currency
- Missing Stripe keys
- Stripe API errors

### Frontend Errors:
- Stripe not ready
- Card element not found
- Payment confirmation failures
- Order creation failures

## Testing

### Test Mode:
- Use Stripe test keys for development
- Test card numbers provided by Stripe
- No real charges in test mode

### Recommended Test Cards:
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- Insufficient Funds: `4000 0000 0000 9995`

## Production Deployment

### Required Steps:
1. Update Stripe keys to production values
2. Ensure HTTPS is enabled
3. Configure webhook endpoints (if needed)
4. Update environment variables securely
5. Test with small amounts first

## Future Enhancements

### Potential Improvements:
1. **Webhook Integration**: Handle payment status updates
2. **Saved Cards**: Allow customers to save payment methods
3. **Multiple Payment Methods**: Add Apple Pay, Google Pay
4. **Subscription Support**: For recurring orders
5. **Refund Management**: Admin interface for refunds
6. **Dispute Handling**: Automated chargeback management

## File Structure

```
Backend/
├── routes/
│   └── stripe.js              # Payment intent creation
├── .env                       # Stripe secret key

Frontend/
├── src/
│   ├── App.jsx               # Stripe provider setup
│   └── pages/
│       └── PaymentPage.jsx   # Payment UI and logic
├── .env                      # Stripe publishable key
```

## Support and Resources

### Official Documentation:
- [Stripe Node.js Documentation](https://stripe.com/docs/node)
- [Stripe React Documentation](https://stripe.com/docs/stripe-js/react)
- [Payment Intents API](https://stripe.com/docs/api/payment_intents)

### Troubleshooting:
- Check environment variables are set correctly
- Verify Stripe account is in test mode for development
- Ensure CORS is properly configured
- Check browser console for Stripe-related errors

---

**Note**: This integration handles credit/debit card payments through Stripe's secure payment processing. All sensitive card data is handled directly by Stripe, ensuring PCI compliance and security for your customers.
