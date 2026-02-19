// ===================================
// CONFIGURATION
// ===================================
// Using Pollinations.ai - free, no API key needed

// ===================================
// STATE MANAGEMENT
// ===================================
const state = {
    generatedImages: [],
    currentLightboxImage: null,
    isGenerating: false
};

// ===================================
// DOM ELEMENTS (Robust Selection)
// ===================================
const elements = {};

function bindElements() {
    const ids = [
        'imageForm', 'prompt', 'charCount', 'style', 'aspectRatio',
        'optionsToggle', 'advancedOptions', 'generateBtn',
        'loadingState', 'emptyState', 'imageGrid', 'imageCount',
        'lightbox', 'lightboxImage', 'lightboxPrompt',
        'lightboxClose', 'downloadBtn'
    ];

    ids.forEach(id => {
        elements[id] = document.getElementById(id);
        if (!elements[id]) {
            console.warn(`[Studio.AI] CRITICAL: Element #${id} not found in DOM.`);
        }
    });

    // Special selection for elements with classes
    elements.loadingText = document.querySelector('.loading-text');
    elements.loadingSubtext = document.querySelector('.loading-subtext');
}

// ===================================
// INITIALIZATION
// ===================================
function init() {
    console.log('[Studio.AI] Initializing Art Engine...');
    bindElements();
    setupEventListeners();
    loadFromLocalStorage();
    updateImageCount();

    // Responsive adjustments
    if (window.innerWidth < 768 && elements.prompt) {
        elements.prompt.rows = 2;
    }
}

// ===================================
// EVENT LISTENERS
// ===================================
function setupEventListeners() {
    if (elements.prompt) elements.prompt.addEventListener('input', updateCharCount);
    if (elements.optionsToggle) elements.optionsToggle.addEventListener('click', toggleAdvancedOptions);
    if (elements.imageForm) elements.imageForm.addEventListener('submit', handleFormSubmit);
    if (elements.lightboxClose) elements.lightboxClose.addEventListener('click', closeLightbox);

    if (elements.lightbox) {
        elements.lightbox.addEventListener('click', (e) => {
            if (e.target === elements.lightbox || e.target.classList.contains('lightbox-backdrop')) {
                closeLightbox();
            }
        });
    }

    if (elements.downloadBtn) elements.downloadBtn.addEventListener('click', downloadImage);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.lightbox && elements.lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });

    // Handle clicks outside of advanced options
    document.addEventListener('click', (e) => {
        if (elements.advancedOptions && elements.optionsToggle) {
            if (!elements.advancedOptions.contains(e.target) &&
                !elements.optionsToggle.contains(e.target) &&
                elements.advancedOptions.classList.contains('open')) {
                toggleAdvancedOptions();
            }
        }
    });
}

// ===================================
// CHARACTER COUNTER
// ===================================
function updateCharCount() {
    if (!elements.prompt || !elements.charCount) return;
    const count = elements.prompt.value.length;
    elements.charCount.textContent = count;

    if (count > 450) {
        elements.charCount.classList.add('warning');
    } else {
        elements.charCount.classList.remove('warning');
    }
}

// ===================================
// ADVANCED OPTIONS TOGGLE
// ===================================
function toggleAdvancedOptions() {
    if (!elements.advancedOptions || !elements.optionsToggle) return;
    const isOpen = elements.advancedOptions.classList.toggle('open');
    elements.optionsToggle.classList.toggle('active', isOpen);

    const icon = elements.optionsToggle.querySelector('i');
    if (icon) {
        icon.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0)';
    }
}

// ===================================
// FORM SUBMISSION
// ===================================
async function handleFormSubmit(e) {
    if (e) e.preventDefault();
    if (state.isGenerating) return;

    const prompt = elements.prompt ? elements.prompt.value.trim() : '';
    if (!prompt) {
        showNotification('Please enter a creative prompt first', 'error');
        if (elements.prompt) elements.prompt.focus();
        return;
    }

    await generateImage(prompt);
}

// ===================================
// IMAGE GENERATION
// ===================================
async function generateImage(prompt) {
    console.log(`[Studio.AI] Starting generation for: "${prompt.substring(0, 30)}..."`);
    try {
        state.isGenerating = true;
        showLoadingState();

        const style = elements.style ? elements.style.value : '';
        const aspectRatio = elements.aspectRatio ? elements.aspectRatio.value : '1:1';

        // Build enhanced prompt
        let enhancedPrompt = prompt;
        if (style) {
            enhancedPrompt = `${prompt}, ${style} style, masterpiece, high quality, highly detailed, 8k resolution, cinematic lighting`;
        } else {
            enhancedPrompt = `${prompt}, masterpiece, hyper-detailed, global illumination, ray tracing, 8k`;
        }

        const dimensions = getImageDimensions(aspectRatio);
        const seed = Math.floor(Math.random() * 999999);

        // Build the Pollinations URL - FAILSAFE SIMPLE STRUCTURE
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${dimensions.width}&height=${dimensions.height}&seed=${seed}&model=turbo&nologo=true`;

        console.log(`[Studio.AI] Built Diagnostic URL: ${imageUrl}`);

        // Create image object immediately (Bypass preloading for diagnostic)
        const imageData = {
            id: Date.now(),
            url: imageUrl,
            prompt: prompt,
            enhancedPrompt: enhancedPrompt,
            style: style || 'Auto',
            aspectRatio: aspectRatio,
            timestamp: new Date().toISOString()
        };

        // Add to state and save
        state.generatedImages.unshift(imageData);
        saveToLocalStorage();

        // Update UI immediately
        renderGrid();
        updateImageCount();

        // Inform user and provide a test link
        const testLink = `<a href="${imageUrl}" target="_blank" style="color: var(--primary-neon); text-decoration: underline;">Test API directly</a>`;
        showNotification(`Art ignited! If it stays blank: ${testLink}`, 'success');

        // Console log for easy clicking
        console.group('[Studio.AI] Diagnostic Info');
        console.log('Prompt:', prompt);
        console.log('Result URL:', imageUrl);
        console.log('Click above URL to test API directly.');
        console.groupEnd();

        if (elements.imageGrid) elements.imageGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (elements.imageForm) elements.imageForm.reset();
        updateCharCount();

    } catch (error) {
        console.error('[Studio.AI] Execution trace:', error);
        showNotification('The engine stalled. Check console (F12) for URL.', 'error');
    } finally {
        state.isGenerating = false;
        hideLoadingState();
    }
}

// ===================================
// IMAGE PRELOADING (Bypassed for now)
// ===================================
function loadImageWithRetry(url) {
    return Promise.resolve(url);
}

function updateLoadingDisplay(progress) {
    const dots = '.'.repeat((Math.floor(Date.now() / 500) % 3) + 1);
    updateLoadingText(`Igniting AI Engine${dots}`, `Processing your imagination: ${Math.floor(progress)}%`);
}

// ===================================
// UTILITIES
// ===================================
function getImageDimensions(aspectRatio) {
    const map = {
        '1:1': { width: 1024, height: 1024 },
        '16:9': { width: 1280, height: 720 },
        '9:16': { width: 720, height: 1280 },
        '4:3': { width: 1024, height: 768 }
    };
    return map[aspectRatio] || map['1:1'];
}

function showLoadingState() {
    if (elements.loadingState) elements.loadingState.classList.add('active');
    if (elements.generateBtn) elements.generateBtn.disabled = true;
    document.body.style.cursor = 'wait';
}

function hideLoadingState() {
    if (elements.loadingState) elements.loadingState.classList.remove('active');
    if (elements.generateBtn) elements.generateBtn.disabled = false;
    document.body.style.cursor = 'default';
}

function updateLoadingText(main, sub) {
    if (elements.loadingText) elements.loadingText.textContent = main;
    if (elements.loadingSubtext) elements.loadingSubtext.textContent = sub;
}

function renderGrid() {
    if (!elements.imageGrid) return;
    elements.imageGrid.innerHTML = '';

    if (state.generatedImages.length === 0) {
        if (elements.emptyState) elements.emptyState.classList.remove('hidden');
    } else {
        if (elements.emptyState) elements.emptyState.classList.add('hidden');
        state.generatedImages.forEach((img, index) => {
            const card = createImageCard(img, index);
            elements.imageGrid.appendChild(card);
        });
    }
}

function createImageCard(imgData, index) {
    const card = document.createElement('div');
    card.className = 'image-card';
    card.style.animationDelay = `${index * 50}ms`;

    const mediaWrap = document.createElement('div');
    mediaWrap.className = 'card-media';

    const img = document.createElement('img');
    img.src = imgData.url;
    img.alt = imgData.prompt;
    img.loading = 'lazy';

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const copyBtn = createActionBtn('copy', 'Copy Prompt', (e) => {
        e.stopPropagation();
        copyToClipboard(imgData.prompt);
    });

    const expandBtn = createActionBtn('maximize-2', 'View Large', () => openLightbox(imgData));

    actions.appendChild(copyBtn);
    actions.appendChild(expandBtn);

    const info = document.createElement('div');
    info.className = 'card-info';
    info.innerHTML = `
        <p class="card-prompt">${imgData.prompt}</p>
        <div class="card-meta">
            <span class="meta-tag">${imgData.style}</span>
            <span class="meta-tag">${imgData.aspectRatio}</span>
        </div>
    `;

    mediaWrap.appendChild(img);
    mediaWrap.appendChild(actions);
    card.appendChild(mediaWrap);
    card.appendChild(info);

    card.addEventListener('click', () => openLightbox(imgData));
    return card;
}

function createActionBtn(icon, title, onClick) {
    const btn = document.createElement('button');
    btn.className = 'action-btn';
    btn.title = title;
    btn.innerHTML = `<i data-lucide="${icon}"></i>`;
    btn.onclick = onClick;
    if (window.lucide) setTimeout(() => window.lucide.createIcons(), 0);
    return btn;
}

function updateImageCount() {
    if (!elements.imageCount) return;
    const count = state.generatedImages.length;
    elements.imageCount.textContent = `${count} creative${count !== 1 ? 's' : ''}`;
}

function openLightbox(imageData) {
    if (!elements.lightbox || !elements.lightboxImage) return;
    state.currentLightboxImage = imageData;
    elements.lightboxImage.src = imageData.url;
    if (elements.lightboxPrompt) elements.lightboxPrompt.textContent = imageData.prompt;
    elements.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    if (elements.lightbox) elements.lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

async function downloadImage() {
    if (!state.currentLightboxImage) return;
    const btn = elements.downloadBtn;
    const originalContent = btn ? btn.innerHTML : '';

    try {
        if (btn) {
            btn.innerHTML = `<i class="spinner"></i> Exporting...`;
            btn.disabled = true;
        }

        const response = await fetch(state.currentLightboxImage.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `studio-ai-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showNotification('Export successful!', 'success');
    } catch (e) {
        console.error('[Studio.AI] Export failure:', e);
        window.open(state.currentLightboxImage.url, '_blank');
        showNotification('Opening image in new tab...', 'info');
    } finally {
        if (btn) {
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Prompt captured!', 'success');
    }).catch(err => {
        showNotification('Capture failed', 'error');
    });
}

function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info';

    toast.innerHTML = `
        <div class="toast-content">
            <i data-lucide="${icon}"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => toast.classList.add('visible'), 10);
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('studio_gallery_v2', JSON.stringify(state.generatedImages.slice(0, 50)));
    } catch (e) {
        console.warn('[Studio.AI] Storage full or disabled.');
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('studio_gallery_v2');
        if (saved) {
            state.generatedImages = JSON.parse(saved);
            renderGrid();
        }
    } catch (e) {
        state.generatedImages = [];
    }
}

// Start Engine
init();
