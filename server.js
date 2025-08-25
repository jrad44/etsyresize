import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import archiver from 'archiver';
import rateLimit from 'express-rate-limit';
import Stripe from 'stripe';
import bodyParser from 'body-parser';
import { Redis } from '@upstash/redis';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env for local development
dotenv.config();

const app = express();

// Initialize Stripe
const stripeSecret = process.env.STRIPE_SECRET;
if (!stripeSecret) {
  console.warn('Warning: STRIPE_SECRET is not set. Webhook and /token will not work correctly.');
}
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2022-11-15' }) : null;

// Initialize Upstash Redis
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
let redis = null;
if (upstashUrl && upstashToken) {
  redis = new Redis({ url: upstashUrl, token: upstashToken });
} else {
  console.warn('Warning: Upstash Redis env vars are not set. Unlock tokens will be stored in memory and lost on restart.');
  // Fallback in-memory store when Redis not configured
}

// Fallback in-memory structures used only when Redis isn't configured
const memoryTokenSet = new Set();
const memorySessionMap = new Map();

// Generate a random token
function randomToken() {
  return 'tok_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

// Issue or retrieve an unlock token for a given session
async function issueTokenForSession(sessionId) {
  if (redis) {
    // Check if token already exists
    const existing = await redis.get(`session:${sessionId}`);
    if (existing) return existing;
    const t = randomToken();
    // Store mapping and mark token in set; 1 year expiration (365 days)
    await redis.set(`session:${sessionId}`, t, { ex: 60 * 60 * 24 * 365 });
    await redis.sadd('tokens', t);
    return t;
  }
  // Fallback memory logic
  if (memorySessionMap.has(sessionId)) return memorySessionMap.get(sessionId);
  const t = randomToken();
  memorySessionMap.set(sessionId, t);
  memoryTokenSet.add(t);
  return t;
}

// Check if a token is valid
async function tokenIsValid(token) {
  if (!token) return false;
  if (redis) {
    const m = await redis.sismember('tokens', token);
    return !!m;
  }
  return memoryTokenSet.has(token);
}

// Multer for handling file uploads. Increase the per‑file size limit to 50 MB to
// accommodate large images captured on modern smartphones. Without this some
// mobile uploads may exceed the previous 20 MB limit and cause a "processing"
// error on the client. Higher limit helps avoid failures on mobile.
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } });

// Basic rate limiting: 300 requests per hour per IP
app.use(rateLimit({ windowMs: 60 * 60 * 1000, max: 300 }));

// Serve static files (index.html, success.html, etc.)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(__dirname));

// Webhook endpoint to capture Stripe events
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).send('Stripe not configured');
  }
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  // Handle the checkout session completion event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const sid = session.id;
    try {
      await issueTokenForSession(sid);
    } catch (e) {
      console.error('Failed to issue token in webhook:', e.message);
    }
  }
  res.status(200).end();
});

// Endpoint to retrieve a token given a session ID (used by success.html)
app.get('/token', async (req, res) => {
  const sid = req.query.session_id;
  if (!sid) return res.json({ ok: false, error: 'missing session_id' });
  let token;
  // First check if we already have token in storage
  if (redis) {
    token = await redis.get(`session:${sid}`);
  } else {
    token = memorySessionMap.get(sid);
  }
  if (token) {
    return res.json({ ok: true, token });
  }
  // If token doesn't exist yet, fetch session from Stripe (in case webhook hasn't run yet)
  if (!stripe) return res.json({ ok: false });
  try {
    const session = await stripe.checkout.sessions.retrieve(sid);
    if (session && session.payment_status === 'paid') {
      token = await issueTokenForSession(sid);
      return res.json({ ok: true, token });
    }
  } catch (e) {
    console.error('Error retrieving session in /token:', e.message);
  }
  return res.json({ ok: false });
});

// Endpoint to verify if a token is valid (used by index.html)
app.get('/unlock', async (req, res) => {
  const t = (req.query.token || '').toString();
  const ok = await tokenIsValid(t);
  res.json({ ok, token: ok ? t : undefined });
});

// Core image processing endpoint
app.post('/process', upload.array('files'), async (req, res) => {
  // Determine if caller has unlocked the paid tier
  const token = (req.body.token || '').toString();
  const isUnlocked = await tokenIsValid(token);

  const files = req.files || [];
  if (!files.length) return res.status(400).send('No files');
  // Enforce free tier: 1 file only
  if (!isUnlocked && files.length > 1) return res.status(402).send('Free tier allows 1 file at a time.');

  // Parse parameters
  const w = parseInt(req.body.w, 10) || 0;
  const h = parseInt(req.body.h, 10) || 0;
  const fmt = (req.body.fmt || 'jpeg').toLowerCase();
  const q = Math.round((parseFloat(req.body.q) || 0.85) * 100);
  const keep = req.body.keepAspect === '1';
  // If free tier, force watermark on
  let wm = req.body.watermark === '1';
  if (!isUnlocked) wm = true;

  // Helper to process a single buffer
  async function processOne(buf) {
    let img = sharp(buf).rotate();
    // Build resize options. Use the high-quality Lanczos filter for resampling to
    // produce the best visual results when shrinking images. When keeping
    // aspect, fit the image inside the target box; otherwise, cover and crop.
    const resizeOpts = { width: w, height: h, kernel: sharp.kernel.lanczos3 };
    if (keep) {
      resizeOpts.fit = 'inside';
      // allow enlargement when the source is smaller; disabling withoutEnlargement can
      // result in smaller than requested outputs when users choose custom sizes.
      resizeOpts.withoutEnlargement = false;
    } else {
      resizeOpts.fit = 'cover';
      resizeOpts.position = 'centre';
    }
    img = img.resize(resizeOpts);
    // Apply simple watermark bottom-right. Sharp requires the overlay dimensions
    // to be equal or smaller than the base image. In rare cases the base image
    // may be smaller than the preset size (e.g. due to rotation/metadata), so
    // constrain the watermark height to a small band (60px) across the full
    // width. Using a smaller overlay avoids the "Image to composite must have
    // same dimensions or smaller" error seen on Render logs.
    if (wm) {
      // Determine the final width/height after resizing to avoid overlay larger
      // than the output image. When keepAspect=true, the output dimensions
      // depend on the original aspect ratio. Compute them based on metadata.
      const meta = await sharp(buf).metadata();
      let finalW = w;
      let finalH = h;
      if (keep) {
        const aspect = meta.width / meta.height;
        const targetAspect = w / h;
        if (aspect > targetAspect) {
          finalW = w;
          finalH = Math.round(w / aspect);
        } else {
          finalH = h;
          finalW = Math.round(h * aspect);
        }
      }
      // Determine the watermark band height as roughly 10% of the final image
      // height. This value is clamped between 40px and the entire image height
      // to ensure the watermark is both visible and proportionally scaled on
      // small and large images. This makes the free‑tier watermark more
      // prominent, as requested.
      // Compute watermark band height. Use 15% of the final height with a minimum of
      // 80px. This yields a larger band for better legibility on free images.
      const wmHeight = Math.max(80, Math.min(finalH, Math.round(finalH * 0.15)));
      const wmWidth = finalW;
      // Scale the font size relative to the watermark band. Increase the ratio to
      // 0.5 and raise the minimum font size to 16px so the text fills more of
      // the band.
      const fontSize = Math.max(16, Math.round(wmHeight * 0.5));
      // Build the watermark SVG. Place the text near the lower right corner
      // with a small margin, and use a white fill with a dark stroke for
      // contrast. Using a dynamic font size helps ensure legibility across
      // different image dimensions.
      const svg = `<svg width="${wmWidth}" height="${wmHeight}" xmlns="http://www.w3.org/2000/svg"><text x="${wmWidth - 20}" y="${wmHeight - 10}" text-anchor="end" font-size="${fontSize}" fill="rgba(255,255,255,0.85)" style="font-family:Arial; paint-order: stroke; stroke: rgba(0,0,0,0.6); stroke-width: 2px;">resizedimage.com</text></svg>`;
      img = img.composite([{ input: Buffer.from(svg), gravity: 'south' }]);
    }
    if (fmt === 'png') {
      return await img.png({ compressionLevel: 9 }).toBuffer();
    }
    return await img.jpeg({ quality: q, mozjpeg: true }).toBuffer();
  }
  try {
        if (files.length === 1) {
          const out = await processOne(files[0].buffer);
          // Set appropriate content type for single-file responses
          res.setHeader('Content-Type', fmt === 'png' ? 'image/png' : 'image/jpeg');
          // Set Content-Disposition so browsers treat the response as a download.
          // Without this header some browsers may open the image inline and our
          // client-side download handler might not trigger as expected.
          res.setHeader('Content-Disposition', `attachment; filename="resized.${fmt}"`);
          return res.send(out);
        }
    // Multiple files: return a zip
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="resized.zip"');
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);
    await Promise.all(files.map(async (f) => {
      const out = await processOne(f.buffer);
      const name = f.originalname.replace(/\.[^.]+$/, '');
      archive.append(out, { name: `${name}_${w}x${h}.${fmt}` });
    }));
    archive.finalize();
  } catch (err) {
    console.error('Error processing images:', err.message);
    res.status(500).send('Processing failed');
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});