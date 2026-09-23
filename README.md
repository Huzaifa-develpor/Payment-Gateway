# Payment Gateway Integration Demo

A simple **Next.js payment gateway integration project** built to understand the core payment flow from the application side — from creating a checkout session to redirecting the customer to a sandbox payment page, handling return URLs, receiving webhooks, and tracking payment status.

> **This was my first hands-on payment gateway integration project, created as a focused proof of concept before integrating the same concepts into a larger application.**

## Live Demo

**Live Application:**  
https://payment-gateway-mocha-eight.vercel.app/

**GitHub Repository:**  
https://github.com/Huzaifa-develpor/Payment-Gateway

---

## Short Description

> **A simple Next.js payment gateway demo integrating SafePay sandbox checkout, return URLs, webhooks, and payment status tracking.**

---

## Overview

This project was intentionally kept small and focused on one goal: **understanding how an online payment integration works inside a web application**.

The application presents a simple checkout screen for a **Rs. 1,000** payment. When the user clicks **Pay Now**, the application starts the payment flow and redirects the user to the payment provider's sandbox checkout environment.

The project helped establish the foundation for the payment functionality later used in larger projects.

The live application currently presents a **Test Premium Plan** with an amount due of **Rs. 1,000** and a **Pay Now** action. citeturn0view1

---

## What I Learned

This project focused on the practical concepts behind payment integrations rather than building a complete e-commerce system.

### Payment Checkout

Learned how a backend can create a payment/checkout request and return the required information to the frontend.

### Sandbox Payment Flow

Integrated the payment provider in a sandbox/test environment so the complete payment flow could be developed without processing real payments.

### Payment Redirect

Learned how the customer is redirected from the application to the payment provider's hosted checkout experience.

### Return URL

Implemented the concept of a return URL so that the customer can be sent back to the application after the checkout flow.

### Webhooks

Learned why payment confirmation should come from a server-to-server webhook instead of relying only on what happens in the browser.

The webhook receives payment-related events from the provider and allows the application backend to process the resulting payment state.

### Payment Status

Implemented the concept of tracking a payment through its lifecycle instead of treating the initial checkout request as proof that the payment was completed.

### Order / Payment Identification

Learned how an application can associate a payment with its own order/payment identifier so the result can be tracked after the customer leaves the application.

---

## Payment Flow

The core flow of the project can be represented as:

```text
┌──────────────────────┐
│   User opens app     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   Checkout UI        │
│   Amount: Rs. 1,000  │
└──────────┬───────────┘
           │
           │ Pay Now
           ▼
┌──────────────────────┐
│   Next.js API        │
│ Create Checkout      │
└──────────┬───────────┘
           │
           │ Checkout URL
           ▼
┌──────────────────────┐
│ SafePay Sandbox      │
│ Hosted Checkout      │
└──────────┬───────────┘
           │
           ├──────────────► Return URL
           │
           │
           ▼
┌──────────────────────┐
│ SafePay Webhook      │
│ Payment Event        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Backend updates      │
│ payment status       │
└──────────────────────┘
```

The important concept is that **redirect and payment confirmation are separate parts of the flow**.

A customer returning to the application does not, by itself, represent a reliable server-side payment confirmation. The webhook is the mechanism used to receive the provider's payment event.

---

## Architecture

```text
Frontend
   │
   │ POST /api/checkout
   ▼
Next.js API Route
   │
   │ Create payment / checkout
   ▼
SafePay Sandbox
   │
   ├──────────────► Return URL
   │
   └──────────────► Webhook
                         │
                         ▼
                  Payment Processing
                         │
                         ▼
                   Status Tracking
```

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | Full-stack application framework |
| React 19 | User interface |
| Tailwind CSS 4 | Styling |
| SafePay Node SDK | Payment gateway integration |
| MongoDB / Mongoose | Payment/order persistence |
| JavaScript | Application logic |
| Vercel | Deployment |

The repository's current `package.json` confirms Next.js 16.3.4, React 19.2.8, Tailwind CSS 4, Mongoose 9.9.4, dotenv, and `@sfpy/node-sdk` 3.0.2. citeturn1view0

---

## Core Concepts

### 1. Checkout Creation

The application starts the payment process from a server-side API route.

Conceptually:

```text
Frontend
   ↓
POST /api/checkout
   ↓
Backend creates payment
   ↓
Backend creates checkout
   ↓
Checkout URL returned
   ↓
User redirected to gateway
```

This keeps the payment-provider interaction on the server where secret credentials can remain protected.

---

### 2. Hosted Checkout

Instead of building and processing raw card information inside the application, the customer is redirected to the payment provider's checkout environment.

This is an important architectural concept because payment-sensitive information should not be unnecessarily handled or stored by the application itself.

---

### 3. Return URL

The return URL provides a path back to the application after the checkout experience.

Conceptually:

```text
Application
    ↓
Payment Provider
    ↓
Customer completes / leaves checkout
    ↓
Return URL
    ↓
Application
```

The return URL is primarily part of the customer-facing flow.

---

### 4. Webhook

A webhook is a server-to-server notification from the payment provider to the application.

```text
Payment Provider
       │
       │ POST webhook
       ▼
Next.js API Route
       │
       ▼
Verify / process event
       │
       ▼
Update payment status
```

This allows the backend to receive payment events even though the customer may have closed the browser, refreshed the page, or navigated away.

---

### 5. Payment Status Tracking

A payment integration needs a way to distinguish different stages of a payment.

For example:

```text
pending
   ↓
processing
   ↓
completed
```

or, depending on the provider event:

```text
pending
   ↓
failed
```

The important lesson is that **creating a checkout is not the same thing as completing a payment**.

---

## Why This Project Matters

Although the project is intentionally simple, it introduced several concepts that are difficult to understand properly without implementing them.

Before this project, payment gateways were mostly an abstract concept. This project provided hands-on experience with:

- Payment provider SDKs
- Server-side payment requests
- Checkout creation
- Hosted payment pages
- Redirect-based payment flows
- Return URLs
- Webhooks
- Payment status handling
- Order/payment identifiers
- Sandbox testing
- Environment variables for gateway credentials
- Deploying payment-related API routes to Vercel

These concepts later became useful when integrating payment functionality into a larger event management application.

---

## Project Scope

This project is a **focused payment integration proof of concept**, not a full payment platform.

It intentionally does not try to solve:

- Product catalog management
- Shopping cart functionality
- User account management
- Subscription management
- Multi-vendor payments
- Production financial reconciliation
- Real-money payment processing

The purpose was to understand and implement the **core payment integration lifecycle** in a small application.

---

## Environment Variables

Payment gateway credentials and other private configuration should be stored in environment variables rather than committed to GitHub.

Example structure:

```env
SAFEPAY_API_KEY=your_api_key
SAFEPAY_WEBHOOK_SECRET=your_webhook_secret
```

Use the exact environment variable names configured by the application when running the project locally.

**Never commit real API keys or webhook secrets to the repository.**

---

## Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/Huzaifa-develpor/Payment-Gateway.git
cd Payment-Gateway
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create:

```text
.env.local
```

and add the required payment gateway credentials.

### 4. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The repository's configured scripts include `dev`, `build`, `start`, and `lint`. citeturn1view0

---

## Sandbox Testing

The project uses a sandbox/test payment flow for development.

The live interface is currently presented as a **Test Premium Plan** with:

```text
Amount: Rs. 1,000
```

and a **Pay Now** button. citeturn0view1

Use the payment provider's official sandbox credentials/test payment details when testing the checkout flow.

---

## Deployment

The application is deployed on Vercel.

### Deployment flow

```text
GitHub Repository
       ↓
Vercel
       ↓
Environment Variables
       ↓
Production Build
       ↓
Live Application
```

Live:

https://payment-gateway-mocha-eight.vercel.app/

---

## Important Payment Architecture Lesson

One of the most important lessons from this project is:

> **Do not treat a frontend redirect as proof that a payment was successfully completed.**

A robust payment integration separates:

1. Checkout creation
2. Customer redirect
3. Return URL
4. Provider webhook
5. Backend payment status update
6. Application business logic

This separation becomes especially important when the payment result controls access to a product, event, subscription, ticket, or other paid resource.

---

## Relationship to EventFlow

This project served as the **first focused payment integration experiment** before payment functionality was incorporated into the larger EventFlow application.

The progression was:

```text
Payment Gateway POC
        │
        ├── Checkout
        ├── Redirect
        ├── Return URL
        ├── Webhook
        └── Payment Status
                 │
                 ▼
          EventFlow
                 │
                 ├── Organizer Payments
                 ├── Attendee Payments
                 ├── Event Registrations
                 └── Digital Tickets
```

Keeping this project separate made it easier to understand the payment lifecycle before connecting payments with more complex business logic.

---

## What This Project Demonstrates

This project demonstrates practical understanding of:

- Next.js App Router
- Next.js API routes
- React frontend integration
- Server-side API communication
- Payment gateway SDK integration
- Checkout creation
- Hosted payment flows
- Redirect URLs
- Return URLs
- Webhooks
- Payment state handling
- MongoDB persistence
- Environment configuration
- Vercel deployment
- Sandbox payment testing

---

## Future Improvements

Possible extensions include:

- Payment history dashboard
- Better order management
- Multiple payment amounts
- Payment receipt generation
- Failed-payment retry flow
- Refund handling
- Stronger webhook signature verification
- Idempotent webhook processing
- Better transaction reconciliation
- Production merchant configuration

---

## Author

**Muhammad Huzaifa Anwar**

GitHub:  
https://github.com/Huzaifa-develpor

---

## Project Links

- **Live Demo:** https://payment-gateway-mocha-eight.vercel.app/
- **GitHub:** https://github.com/Huzaifa-develpor/Payment-Gateway

---

## Final Note

This project was built as a practical learning project around one specific problem:

**How does a real web application communicate with a payment gateway, send a customer to checkout, receive the payment result, and update its own backend state?**

The project kept the UI and business logic intentionally simple so the payment integration concepts could remain the main focus.
