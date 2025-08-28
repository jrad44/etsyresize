const express = require('express');
const path = require('path');

const app = express();

// Serve static files from root
console.log('Serving static files from:', path.join(__dirname, 'client/dist'));
app.use(express.static(path.join(__dirname, 'client/dist')));

const multer = require('multer');
const sharp = require('sharp');
const upload = multer();

app.post('/api/transform', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No image uploaded.');
  }

  try {
    // In a real implementation, you would get the resize/crop options
    // from the request body and apply them with sharp.
    const transformedImage = await sharp(req.file.buffer)
      .resize(800) // Placeholder resize
      .png()
      .toBuffer();

    res.set('Content-Type', 'image/png');
    res.send(transformedImage);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing the image.');
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
