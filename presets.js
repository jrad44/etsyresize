// Dynamically load social platform presets and render preset cards.
// This script fetches the social-image-presets-2025.json file and builds a
// platform selector with a corresponding grid of preset cards. When a user
// selects a preset, its dimensions and format are stored in a hidden input
// (#selectedSocialPreset) for the main process handler to pick up.

(() => {
  const platformSelect = document.getElementById('platformSelect');
  const grid = document.getElementById('socialPresetGrid');
  if (!platformSelect) {
    return;
  }
  // Hide the old card grid by default; we'll use dropdowns instead
  if (grid) {
    grid.style.display = 'none';
  }
  // Create placement label and select for second-level presets
  const placementLabel = document.createElement('label');
  placementLabel.setAttribute('for', 'placementSelect');
  placementLabel.textContent = 'Placement:';
  placementLabel.style.marginLeft = '12px';
  const placementSelect = document.createElement('select');
  placementSelect.id = 'placementSelect';
  placementSelect.style.marginLeft = '8px';
  // Insert placement controls after the platform select
  platformSelect.insertAdjacentElement('afterend', placementSelect);
  platformSelect.insertAdjacentElement('afterend', placementLabel);
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
    // Lock aspect ratio by checking the keepAspect checkbox
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
      // Populate platform dropdown
      platforms.forEach(platform => {
        const opt = document.createElement('option');
        opt.value = platform;
        opt.textContent = platform;
        platformSelect.appendChild(opt);
      });
      // Change handler for platform select
      function onPlatformChange() {
        const platform = platformSelect.value;
        placementSelect.innerHTML = '';
        // Populate placement select
        const placements = data[platform] ? Object.keys(data[platform]) : [];
        placements.forEach(pl => {
          const o = document.createElement('option');
          o.value = pl;
          // Human friendly: replace underscores with spaces and capitalize words
          o.textContent = pl.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          placementSelect.appendChild(o);
        });
        // If there is at least one placement, select the first and apply preset
        if (placements.length > 0) {
          placementSelect.value = placements[0];
          const spec = data[platform][placements[0]];
          applyPreset(platform, placements[0], spec);
        }
      }
      platformSelect.addEventListener('change', onPlatformChange);
      // Change handler for placement select
      placementSelect.addEventListener('change', () => {
        const platform = platformSelect.value;
        const placement = placementSelect.value;
        const spec = data[platform] && data[platform][placement];
        if (spec) {
          applyPreset(platform, placement, spec);
        }
      });
      // Trigger initial population
      if (platforms.length > 0) {
        platformSelect.value = platforms[0];
        onPlatformChange();
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
      function onPlatformChange() {
        const platform = platformSelect.value;
        placementSelect.innerHTML = '';
        const placements = data[platform] ? Object.keys(data[platform]) : [];
        placements.forEach(pl => {
          const o = document.createElement('option');
          o.value = pl;
          o.textContent = pl.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          placementSelect.appendChild(o);
        });
        if (placements.length > 0) {
          placementSelect.value = placements[0];
          const spec = data[platform][placements[0]];
          applyPreset(platform, placements[0], spec);
        }
      }
      platformSelect.addEventListener('change', onPlatformChange);
      placementSelect.addEventListener('change', () => {
        const platform = platformSelect.value;
        const placement = placementSelect.value;
        const spec = data[platform][placement];
        applyPreset(platform, placement, spec);
      });
      // Trigger initial population
      platformSelect.value = platforms[0];
      onPlatformChange();
    });
})();