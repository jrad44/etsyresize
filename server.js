const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const archiver = require('archiver');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 120, files: 50 }
});

// Plan limits
const FREE_MAX_FILES = 1;
const FREE_MAX_FILE_MB = 10;
const PRO_MAX_FILES = 50;
const PRO_MAX_FILE_MB = 100;
const PRO_MAX_TOTAL_MB = 500; // batch cap

// Valid tokens from env (comma separated)
const validTokens = new Set(
  (process.env.PRO_TOKENS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
);

// Basic rate limiter to protect the service
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
  })
);

// Helper to parse cookies manually
function getCookie(req, name) {
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [k, v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v);
  }
  return null;
}

// Helper to check Pro access from cookie
function isPro(req) {
  const token = getCookie(req, 'pro_access');
  return token && validTokens.has(token);
}

// /me endpoint returns current pro status
app.get('/me', (req, res) => {
  res.json({ pro: isPro(req) });
});

// /unlock endpoint consumes token query param, sets cookie if valid
app.get('/unlock', (req, res) => {
  const token = (req.query.token || '').toString();
  const ok = validTokens.has(token);
  if (ok) {
    // Set cookie manually via res.setHeader
    // cookie flags: HttpOnly, Secure, SameSite=Lax, max-age ~2 years
    const cookieStr = `pro_access=${encodeURIComponent(token)}; Max-Age=${60 * 60 * 24 * 730}; Path=/; HttpOnly; SameSite=Lax; Secure`;
    res.setHeader('Set-Cookie', cookieStr);
  }
  res.json({ ok });
});

// Presets for marketplace sizes (square orientation)
const PRESETS = {
  amazon: { width: 2000, height: 2000 },
  etsy: { width: 2000, height: 2000 },
  shopify: { width: 2048, height: 2048 },
  ebay: { width: 1600, height: 1600 }
};

// Core processing endpoint
app.post('/process', upload.array('files'), async (req, res) => {
  try {
    const pro = isPro(req);
    const files = req.files || [];

    // Enforce plan limits
    if (pro) {
      if (files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded.' });
      }
      if (files.length > PRO_MAX_FILES) {
        return res.status(400).json({
          error: `Too many files. Pro users may upload up to ${PRO_MAX_FILES} files at once.`
        });
      }
      let totalMb = 0;
      for (const file of files) {
        const mb = file.size / (1024 * 1024);
        totalMb += mb;
        if (mb > PRO_MAX_FILE_MB) {
          return res.status(400).json({
            error: `File ${file.originalname} exceeds the per-file limit of ${PRO_MAX_FILE_MB}MB.`
          });
        }
      }
      if (totalMb > PRO_MAX_TOTAL_MB) {
        return res.status(400).json({
          error: `Batch total exceeds ${PRO_MAX_TOTAL_MB}MB.`
        });
      }
    } else {
      // Free path: exactly 1 file
      if (files.length !== 1) {
        return res.status(400).json({
          error: `Free users may upload exactly ${FREE_MAX_FILES} file.`
        });
      }
      const mb = files[0].size / (1024 * 1024);
      if (mb > FREE_MAX_FILE_MB) {
        return res.status(400).json({
          error: `File exceeds the free limit of ${FREE_MAX_FILE_MB}MB.`
        });
      }
    }

    // Determine sizing options
    let { preset } = req.body;
    let width = parseInt(req.body.width) || undefined;
    let height = parseInt(req.body.height) || undefined;
    const fit = req.body.fit === 'cover' ? 'cover' : 'inside';
    const quality = Math.max(1, Math.min(100, parseInt(req.body.quality) || 80));

    if (preset && PRESETS[preset]) {
      width = PRESETS[preset].width;
      height = PRESETS[preset].height;
    }

    // Helper to process a single file
    async function processOne(file) {
      let inputBuffer = file.buffer;
      let ext = path.extname(file.originalname).toLowerCase();
      let image = sharp(inputBuffer);

      // Rotate based on EXIF
      image = image.rotate();

      // Resize if requested
      if (width || height) {
        image = image.resize({
          width,
          height,
          fit: fit === 'cover' ? sharp.fit.cover : sharp.fit.inside
        });
      }

      // Determine output format: convert HEIC/HEIF to JPEG; preserve PNG
      let outputFormat = 'jpeg';
      if (ext === '.png') {
        outputFormat = 'png';
      }
      if (outputFormat === 'png') {
        image = image.png();
      } else {
        image = image.jpeg({ quality });
      }
      const buffer = await image.toBuffer();

      // Build filename with suffix
      const baseName = path.parse(file.originalname).name;
      let suffix = '';
      if (width && height) {
        suffix = `_${width}x${height}`;
      } else if (width) {
        suffix = `_${width}w`;
      } else if (height) {
        suffix = `_${height}h`;
      }
      const extOut = outputFormat === 'png' ? '.png' : '.jpg';
      const newName = baseName + suffix + extOut;
      return { buffer, filename: newName };
    }

    // Process files concurrently
    const outputs = await Promise.all(files.map(processOne));

    if (outputs.length === 1) {
      const { buffer, filename } = outputs[0];
      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store'
      });
      return res.send(buffer);
    }

    // Multiple files: send as ZIP
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="resized_images.zip"',
      'Cache-Control': 'no-store'
    });
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', err => {
      throw err;
    });
    archive.pipe(res);
    for (const out of outputs) {
      archive.append(out.buffer, { name: out.filename });
    }
    await archive.finalize();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error processing images.' });
  }
});

// Serve static files from root (index.html)
// Custom blog route: map slugs to their respective HTML files so that SEO-friendly
// paths like /blog/my-article resolve correctly without the .html suffix.  If a
// slug matches one of the known posts, serve the corresponding file from the
// blog directory. Otherwise fall through to the static middleware below.
const blogMap = {
  'webp-vs-avif-which-to-use-2025': 'webp-vs-avif-which-to-use-2025.html',
  'ultimate-guide-to-image-aspect-ratios': 'ultimate-guide-to-image-aspect-ratios.html',
  'resize-images-without-losing-quality': 'resize-images-without-losing-quality.html',
  'best-image-sizes-for-social-media-2025': 'best-image-sizes-for-social-media-2025.html',
  'compressing-images-for-faster-websites': 'compressing-images-for-faster-websites.html',
  'difference-between-resizing-and-compressing': 'difference-between-resizing-and-compressing.html'
};

    // Serve PDF and Background tool pages without .html extension
    app.get('/pdf', (req, res) => {
      const filePath = path.join(__dirname, 'pdf.html');
      return res.sendFile(filePath);
    });
    app.get('/background', (req, res) => {
      const filePath = path.join(__dirname, 'background.html');
      return res.sendFile(filePath);
    });

app.get('/blog/:slug', (req, res, next) => {
  const slug = req.params.slug;
  const file = blogMap[slug];
  if (file) {
    const filePath = path.join(__dirname, 'blog', file);
    return res.sendFile(filePath);
  }
  return next();
});

app.use(express.static(path.join(__dirname)));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
