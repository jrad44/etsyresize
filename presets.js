// Dynamically load social platform presets and render preset cards.
// This script fetches the social-image-presets-2025.json file and builds a
// platform selector with a corresponding grid of preset cards. When a user
// selects a preset, its dimensions and format are stored in a hidden input
// (#selectedSocialPreset) for the main process handler to pick up.

(() => {
  const platformSelect = document.getElementById('platformSelect');
  const grid = document.getElementById('socialPresetGrid');
  if (!platformSelect || !grid) {
    return;
  }
  // We'll render clickable preset cards inside `socialPresetGrid` instead of a second dropdown.
  // Helper to clear existing cards and track currently selected one.
  let currentCard = null;
  // Helper to ensure a hidden input exists for storing the selected preset
  function ensureHidden() {
    let hidden = document.getElementById('selectedSocialPreset');
    if (!hidden) {
      hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.id = 'selectedSocialPreset';
      document.body.appendChild(hidden);
    }
    return hidden;
  }
  const hiddenInput = ensureHidden();
  // Element to display selected preset info
  const infoEl = document.getElementById('socialPresetInfo');
  // Helper to apply a preset: update hidden input and optionally update the UI
  function applyPreset(platform, placement, spec) {
    const presetObj = {
      w: spec.w,
      h: spec.h,
      fmt: 'jpeg',
      q: 0.8,
      name: `${platform} – ${placement}`,
      aspect: spec.aspect || `${spec.w}:${spec.h}`
    };
    hiddenInput.value = JSON.stringify(presetObj);
    // Update visible custom width/height inputs if they exist to reflect the preset
    const wInput = document.getElementById('customW');
    const hInput = document.getElementById('customH');
    const keepAspect = document.getElementById('keepAspect');
    if (wInput && hInput) {
      wInput.value = spec.w;
      hInput.value = spec.h;
    }
    // Lock aspect ratio by unchecking the keepAspect checkbox (we want cropping by default for presets)
    if (keepAspect) {
      keepAspect.checked = false;
    }
    // Force update of preset state by dispatching change on the marketplace preset select
    const presetSelect = document.getElementById('preset');
    if (presetSelect) {
      presetSelect.value = JSON.stringify({ w: spec.w, h: spec.h, fmt: 'jpeg', q: 0.8, name: `${platform} – ${placement}` });
      presetSelect.dispatchEvent(new Event('change'));
    }
    // Update the info element with dimensions and aspect
    if (infoEl) {
      const aspectText = spec.aspect || `${spec.w}:${spec.h}`;
      infoEl.textContent = `${spec.w} × ${spec.h} (aspect ${aspectText})`;
    }
  }
  // Fetch the presets JSON. On failure, fall back to a minimal set
  fetch('/social-image-presets-2025.json')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(rawData => {
      const data = rawData && typeof rawData === 'object' ? rawData : {};
      const platforms = Object.keys(data).sort();
      // Populate the platform dropdown
      platforms.forEach(platform => {
        const opt = document.createElement('option');
        opt.value = platform;
        opt.textContent = platform;
        platformSelect.appendChild(opt);
      });
      // Render a grid of preset cards for the selected platform
      function renderGrid(platform) {
        grid.innerHTML = '';
        const placements = data[platform] ? Object.keys(data[platform]) : [];
        placements.forEach((pl, idx) => {
          const spec = data[platform][pl];
          const card = document.createElement('div');
          card.className = 'preset-card';
          card.dataset.platform = platform;
          card.dataset.placement = pl;
          // Build human-friendly label
          const label = pl.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          // Create inner structure similar to marketplace presets
          const titleDiv = document.createElement('div');
          titleDiv.className = 'title';
          titleDiv.textContent = label;
          const sizeDiv = document.createElement('div');
          sizeDiv.className = 'size';
          sizeDiv.textContent = `${spec.w} × ${spec.h}`;
          const qualityDiv = document.createElement('div');
          qualityDiv.className = 'quality';
          const aspectText = spec.aspect || `${spec.w}:${spec.h}`;
          qualityDiv.textContent = `Aspect ${aspectText}`;
          const checkDiv = document.createElement('div');
          checkDiv.className = 'checkmark';
          checkDiv.textContent = '✔';
          card.appendChild(titleDiv);
          card.appendChild(sizeDiv);
          card.appendChild(qualityDiv);
          card.appendChild(checkDiv);
          // Click handler: apply the preset and highlight selected card
          card.addEventListener('click', () => {
            // Remove selection from previous card
            if (currentCard) currentCard.classList.remove('selected');
            card.classList.add('selected');
            currentCard = card;
            applyPreset(platform, pl, spec);
          });
          grid.appendChild(card);
          // Automatically select the first card
          if (idx === 0) {
            setTimeout(() => {
              card.click();
            }, 0);
          }
        });
      }
      // When platform changes, re-render grid
      platformSelect.addEventListener('change', () => {
        const platform = platformSelect.value;
        renderGrid(platform);
      });
      // Trigger initial render
      if (platforms.length > 0) {
        platformSelect.value = platforms[0];
        renderGrid(platforms[0]);
      }
    })
    .catch(err => {
      console.error('Error loading social presets:', err);
      // Inline fallback if presets fail to load
      const fallback = {
        Instagram: {
          post_square: { w: 1080, h: 1080, aspect: '1:1' },
          post_portrait: { w: 1080, h: 1350, aspect: '4:5' }
        },
        OpenGraph: {
          og: { w: 1200, h: 630, aspect: '1200:630' }
        }
      };
      const data = fallback;
      const platforms = Object.keys(data);
      platforms.forEach(platform => {
        const opt = document.createElement('option');
        opt.value = platform;
        opt.textContent = platform;
        platformSelect.appendChild(opt);
      });
      function renderGrid(platform) {
        grid.innerHTML = '';
        const placements = data[platform] ? Object.keys(data[platform]) : [];
        placements.forEach((pl, idx) => {
          const spec = data[platform][pl];
          const card = document.createElement('div');
          card.className = 'preset-card';
          card.dataset.platform = platform;
          card.dataset.placement = pl;
          const label = pl.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          const titleDiv = document.createElement('div');
          titleDiv.className = 'title';
          titleDiv.textContent = label;
          const sizeDiv = document.createElement('div');
          sizeDiv.className = 'size';
          sizeDiv.textContent = `${spec.w} × ${spec.h}`;
          const qualityDiv = document.createElement('div');
          qualityDiv.className = 'quality';
          const aspectText = spec.aspect || `${spec.w}:${spec.h}`;
          qualityDiv.textContent = `Aspect ${aspectText}`;
          const checkDiv = document.createElement('div');
          checkDiv.className = 'checkmark';
          checkDiv.textContent = '✔';
          card.appendChild(titleDiv);
          card.appendChild(sizeDiv);
          card.appendChild(qualityDiv);
          card.appendChild(checkDiv);
          card.addEventListener('click', () => {
            if (currentCard) currentCard.classList.remove('selected');
            card.classList.add('selected');
            currentCard = card;
            applyPreset(platform, pl, spec);
          });
          grid.appendChild(card);
          if (idx === 0) {
            setTimeout(() => card.click(), 0);
          }
        });
      }
      platformSelect.addEventListener('change', () => {
        const platform = platformSelect.value;
        renderGrid(platform);
      });
      // Initial render
      platformSelect.value = platforms[0];
      renderGrid(platforms[0]);
    });
})();