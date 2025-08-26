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
  fetch('/social-image-presets-2025.json')
    .then(res => res.json())
    .then(data => {
      // Populate the platform dropdown
      Object.keys(data).forEach(platform => {
        const opt = document.createElement('option');
        opt.value = platform;
        opt.textContent = platform;
        platformSelect.appendChild(opt);
      });
      // Ensure we have a hidden input to store the selected preset
      let hidden = document.getElementById('selectedSocialPreset');
      if (!hidden) {
        hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.id = 'selectedSocialPreset';
        document.body.appendChild(hidden);
      }
      const renderGrid = platform => {
        grid.innerHTML = '';
        const presets = data[platform] || {};
        Object.entries(presets).forEach(([name, spec]) => {
          const card = document.createElement('div');
          card.className = 'preset-card';
          // Each social preset uses JPEG by default at 80% quality. You can
          // adjust this per preset if needed.
          const presetObj = {
            w: spec.w,
            h: spec.h,
            fmt: 'jpeg',
            q: 0.8,
            name: `${platform} – ${name}`
          };
          card.dataset.preset = JSON.stringify(presetObj);
          // Use the human-friendly name by replacing underscores with spaces
          const niceName = name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          card.innerHTML = `
            <div class="title">${niceName}</div>
            <div class="size">${spec.w} × ${spec.h}</div>
            <div class="quality">JPEG • 80%</div>
            <div class="checkmark">✔</div>
          `;
          card.addEventListener('click', () => {
            // Remove selection from other social cards
            grid.querySelectorAll('.preset-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            hidden.value = card.dataset.preset;
          });
          grid.appendChild(card);
        });
      };
      // Initial render
      const firstPlatform = platformSelect.options[0]?.value;
      if (firstPlatform) {
        platformSelect.value = firstPlatform;
        renderGrid(firstPlatform);
      }
      platformSelect.addEventListener('change', () => {
        renderGrid(platformSelect.value);
      });
    })
    .catch(err => {
      console.error('Error loading social presets:', err);
    });
})();