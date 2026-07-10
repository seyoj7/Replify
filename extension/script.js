document.addEventListener('DOMContentLoaded', () => {
    // --- DOM References ---
    const variationsSlider = document.getElementById('variations-slider');
    const variationsVal = document.getElementById('variations-val');
    const settingsView = document.getElementById('settings-view');
    const generatorView = document.getElementById('generator-view');
    const headerGeneratorBtn = document.getElementById('header-settings-btn');
    const headerPreferencesBtn = document.getElementById('header-preferences-btn');
    const generateBtn = document.getElementById('generate-btn');
    const urlInput = document.getElementById('x-post-url');
    const loadingSpinner = document.getElementById('loading-spinner');
    const resultsContainer = document.getElementById('results-container');
    const saveSettingsBtn = document.getElementById('save-settings-btn');

    // Settings elements
    const toneSelect = document.getElementById('tone-select');
    const lengthSelect = document.getElementById('length-select');
    const instructionsTextarea = document.getElementById('instructions-textarea');
    const emojiToggle = document.querySelector('.toggle-wrapper input');

    // --- Slider ---
    if (variationsSlider && variationsVal) {
        variationsSlider.addEventListener('input', (e) => {
            variationsVal.textContent = e.target.value;
        });
    }

    // --- View Toggling ---
    function hideAllViews() {
        settingsView.style.display = 'none';
        generatorView.style.display = 'none';
    }

    if (headerPreferencesBtn) {
        headerPreferencesBtn.addEventListener('click', () => {
            hideAllViews();
            settingsView.style.display = 'flex';
        });
    }

    if (headerGeneratorBtn) {
        headerGeneratorBtn.addEventListener('click', () => {
            hideAllViews();
            generatorView.style.display = 'flex';
        });
    }

    // --- Settings Persistence ---
    const SETTINGS_KEY = 'replify_settings';

    /**
     * Storage abstraction — uses chrome.storage.local in the extension context,
     * falls back to localStorage for local development/testing.
     */
    function getStorage() {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            return {
                get: (key) => new Promise((resolve) => {
                    chrome.storage.local.get([key], (result) => resolve(result[key]));
                }),
                set: (key, value) => new Promise((resolve) => {
                    chrome.storage.local.set({ [key]: value }, resolve);
                })
            };
        }
        // Fallback for non-extension environments
        return {
            get: (key) => {
                try { return Promise.resolve(JSON.parse(localStorage.getItem(key))); }
                catch { return Promise.resolve(null); }
            },
            set: (key, value) => {
                localStorage.setItem(key, JSON.stringify(value));
                return Promise.resolve();
            }
        };
    }

    const storage = getStorage();

    async function loadSettings() {
        try {
            const settings = await storage.get(SETTINGS_KEY);
            if (!settings) return;

            if (settings.tone && toneSelect) toneSelect.value = settings.tone;
            if (settings.numVariations && variationsSlider) {
                variationsSlider.value = settings.numVariations;
                if (variationsVal) variationsVal.textContent = settings.numVariations;
            }
            if (settings.length && lengthSelect) lengthSelect.value = settings.length;
            if (settings.instructions !== undefined && instructionsTextarea) {
                instructionsTextarea.value = settings.instructions;
            }
            if (settings.emoji !== undefined && emojiToggle) {
                emojiToggle.checked = settings.emoji;
            }
        } catch (err) {
            console.error('Failed to load settings:', err);
        }
    }

    async function saveSettings() {
        const settings = {
            tone: toneSelect?.value || 'professional',
            numVariations: variationsSlider?.value || '3',
            length: lengthSelect?.value || 'short',
            instructions: instructionsTextarea?.value || '',
            emoji: emojiToggle ? emojiToggle.checked : true
        };

        try {
            await storage.set(SETTINGS_KEY, settings);

            // Visual feedback on save
            if (saveSettingsBtn) {
                saveSettingsBtn.innerHTML = '<span class="material-symbols-outlined">check</span> Saved!';
                setTimeout(() => {
                    saveSettingsBtn.innerHTML = '<span class="material-symbols-outlined">save</span> Save Settings';
                }, 1500);
            }
        } catch (err) {
            console.error('Failed to save settings:', err);
        }
    }

    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }

    // Load persisted settings on startup
    loadSettings();

    // --- Generator Logic ---
    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            const postUrl = urlInput.value.trim();
            if (!postUrl) {
                alert("Please enter a valid X post link");
                return;
            }

            // Read current settings values (they may have been loaded from storage)
            const tone = toneSelect?.value || 'professional';
            const numVariations = parseInt(variationsSlider?.value || '3', 10);
            const length = lengthSelect?.value || 'short';
            const instructions = instructionsTextarea?.value || '';
            const includeEmoji = emojiToggle ? emojiToggle.checked : true;

            resultsContainer.innerHTML = '';
            loadingSpinner.style.display = 'block';
            generateBtn.disabled = true;

            try {
                const response = await fetch('http://127.0.0.1:8000/generate-replies', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        post_url: postUrl,
                        post_text: "",
                        tone: tone,
                        num_variations: numVariations,
                        length: length,
                        custom_instructions: instructions,
                        emoji: includeEmoji
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    const detail = errorData?.detail || response.statusText;
                    throw new Error(`Server error: ${detail}`);
                }

                const data = await response.json();
                const replies = data.replies || [];

                loadingSpinner.style.display = 'none';

                replies.forEach((reply) => {
                    const replyCard = document.createElement('div');
                    replyCard.className = 'history-item';
                    replyCard.style.marginBottom = '12px';
                    replyCard.innerHTML = `
                        <div class="font-body-sm history-reply">${reply}</div>
                        <div class="history-actions">
                            <button class="action-icon-btn copy-btn-gen" data-reply="${encodeURIComponent(reply)}" title="Copy">
                                <span class="material-symbols-outlined">content_copy</span>
                            </button>
                        </div>
                    `;
                    resultsContainer.appendChild(replyCard);
                });

                // Attach copy listeners
                document.querySelectorAll('.copy-btn-gen').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const replyText = decodeURIComponent(e.currentTarget.getAttribute('data-reply'));
                        try {
                            await navigator.clipboard.writeText(replyText);
                            const icon = e.currentTarget.querySelector('.material-symbols-outlined');
                            icon.textContent = 'check';
                            setTimeout(() => { icon.textContent = 'content_copy'; }, 2000);
                        } catch (err) {
                            console.error('Failed to copy: ', err);
                        }
                    });
                });

            } catch (err) {
                console.error(err);
                alert("Failed to generate replies. Make sure the server is running and the link is valid.");
                loadingSpinner.style.display = 'none';
            } finally {
                generateBtn.disabled = false;
            }
        });
    }
});