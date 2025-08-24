# Etsy Resize – Marketplace Image Resizer

This repository contains a simple single‑page web application that resizes images to match common marketplace requirements. Users can upload one or multiple images, choose a preset size, and download resized files. The site offers a free tier with a watermark and a paid unlock via Stripe for batch processing and watermark removal. Unlock tokens are stored in Upstash Redis so they persist across restarts.

## Features

* Drag & drop images or use a file picker
* Preset sizes for Amazon, Etsy, Shopify and eBay
* Free tier: process one image at a time with a watermark
* Paid unlock: batch up to 50 images, remove the watermark
* Payments via Stripe Checkout (one‑time $2 payment)
* Unlock tokens issued automatically via Stripe webhooks and stored in Upstash Redis
* No login required; tokens are saved in localStorage on the client
* Ads can be displayed via Google AdSense (replace placeholders with your own publisher and slot IDs)
* In‑memory fallback for tokens if Redis is not configured (tokens lost on restart)

## Running locally

1. Install Node.js (v16 or later recommended).
2. Clone this repository and install dependencies:

       npm install

3. Copy `.env.example` to `.env` and fill in your credentials:

   * `STRIPE_SECRET` – your Stripe secret key (test or live).
   * `STRIPE_WEBHOOK_SECRET` – the webhook signing secret from Stripe dashboard.
   * `UPSTASH_REDIS_REST_URL` – Upstash Redis REST URL.
   * `UPSTASH_REDIS_REST_TOKEN` – Upstash Redis REST token.

4. Run the server:

       npm start

5. Open `http://localhost:3000` in your browser.

## Deployment

The application is designed to run on free hosting platforms such as Render. It serves static files and API endpoints from the same Node.js process.

### Environment variables

When deploying, ensure the following environment variables are set in your hosting provider:

* `STRIPE_SECRET` – Stripe secret key.
* `STRIPE_WEBHOOK_SECRET` – Stripe webhook signing secret.
* `UPSTASH_REDIS_REST_URL` – Upstash Redis URL.
* `UPSTASH_REDIS_REST_TOKEN` – Upstash Redis token.
* `PORT` (optional) – Port to listen on (defaults to `3000`).

### Stripe setup

1. Create a product in Stripe and a corresponding $2 payment link (one‑time).
2. Set the payment link success URL to:

       https://yourdomain.com/success.html?session_id={CHECKOUT_SESSION_ID}

3. Create a webhook endpoint in Stripe pointing to:

       https://yourdomain.com/webhook

   Select the `checkout.session.completed` event and copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

### Redis setup

Create a free Upstash Redis database and copy the REST URL and token into your environment variables. If these are not provided, unlock tokens will be stored in memory and will be lost when the server restarts.

### Ads

Replace all occurrences of `ca-pub-XXXX` and slot IDs in `index.html` with your own Google AdSense publisher ID and ad unit IDs. Update `ads.txt` with your publisher ID.

### Domain

Purchase a domain (e.g., `etsyresize.com`), add it to your hosting provider (e.g., Render), and update DNS records. The site will then be served on your own domain.

## Files

* `index.html` – The main single‑page application.
* `success.html` – Intermediate page that handles payment success and token retrieval.
* `server.js` – Node/Express server with image processing and payment logic.
* `package.json` – Project metadata and dependencies.
* `.env.example` – Template for environment variables.
* `privacy.html` & `terms.html` – Sample privacy policy and terms of service.
* `ads.txt` & `robots.txt` – Auxiliary files for ads and search engines.

## License

This project is provided “as is” without warranty. You are free to use and modify it for your own purposes.
