const express = require('express');
const path = require('path');

const app = express();

// Serve static files from root
console.log('Serving static files from:', path.join(__dirname));
app.use(express.static(path.join(__dirname)));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
