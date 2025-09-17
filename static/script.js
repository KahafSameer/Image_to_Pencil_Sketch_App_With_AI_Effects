// Enhanced JavaScript for Photo Editor Pro
// Global variables and state management
let sketchHistoryStack = [];
let effectHistoryStack = [];
let originalImageUrl = "";
let activeCustomEffect = null;
let cropper = null;

// DOM elements
const choose_img_Btn = document.querySelector(".upload-btn");
const choose_Input = document.querySelector("#imageUploader");
const imgSrc = document.querySelector("#mainImage");
const filter_buttons = document.querySelectorAll(".filter-btn");
const slider = document.querySelector("#brightnessSlider");
const slider_name = document.querySelector(".slider-name");
const slider_value = document.querySelector(".slider-value");
const rotate_btns = document.querySelectorAll(".transform-btn");
const reset = document.querySelector(".reset");
const save = document.querySelector(".save");
const cropBtn = document.querySelector(".cropBtn");
const demo_Crop = document.querySelector("#demo_Crop");

// Filter and transform state
let filters = {
    brightness: 100,
    contrast: 100,
    saturate: 100,
    invert: 0,
    blur: 0,
    grayscale: 0,
    sepia: 0,
    hue: 0,
    noise: 0,
    pixelate: 0,
    vignette: 0
};

let transform = {
    rotate: 0,
    flip_x: 1,
    flip_y: 1
};

// Enhanced initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupKeyboardShortcuts();
});

function initializeApp() {
    // Initialize tool sections
    document.querySelectorAll('.tool-section').forEach(section => {
        section.classList.add('open');
        const content = section.querySelector('.section-content');
        if (content) content.style.display = 'block';
    });

    // Set initial slider state
    updateSliderDisplay();
    
    // Set default image as original image URL for sketch effects
    const defaultImg = document.querySelector('#mainImage');
    if (defaultImg && defaultImg.src) {
        originalImageUrl = defaultImg.src;
    }

    showToast('Welcome to Photo Editor Pro! Upload an image to get started.', 'info');
}

function setupEventListeners() {
    // Upload functionality
choose_img_Btn.addEventListener("click", () => choose_Input.click());
    choose_Input.addEventListener("change", handleImageUpload);

    // Filter buttons
    filter_buttons.forEach((element) => {
        element.addEventListener("click", handleFilterClick);
    });

    // Slider functionality
    slider.addEventListener("input", handleSliderChange);

    // Transform buttons
    rotate_btns.forEach((element) => {
        element.addEventListener("click", handleTransformClick);
    });

    // Action buttons
    reset.addEventListener("click", resetAll);
    save.addEventListener("click", saveImage);
    cropBtn.addEventListener("click", applyCrop);

    // Section toggles
    document.querySelectorAll('.section-toggle').forEach(btn => {
        btn.addEventListener('click', toggleSection);
    });

    // Sketch variation buttons
    document.querySelectorAll('.sketch-variation-btn').forEach(btn => {
        btn.addEventListener('click', handleSketchVariation);
    });

    // Effect buttons
    document.querySelectorAll('.effect-btn').forEach(btn => {
        btn.addEventListener('click', handleEffectClick);
    });

    // Clear effects button
    document.querySelector('.clear-effects').addEventListener('click', clearAllEffects);

    // Undo sketch button
    const undoBtn = document.getElementById('undo-sketch-btn');
    if (undoBtn) {
        undoBtn.addEventListener('click', undoSketch);
    }

    // Undo AI effect button
    const undoAiBtn = document.getElementById('undo-ai-btn');
    console.log('Undo AI button found:', undoAiBtn);
    if (undoAiBtn) {
        undoAiBtn.addEventListener('click', function() {
            console.log('Undo AI button clicked!');
            undoAiEffect();
        });
    } else {
        console.error('Undo AI button not found!');
    }

    // Drag and drop functionality
    setupDragAndDrop();
}

function setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case "z":
                    e.preventDefault();
                    resetAll();
                    break;
                case "s":
                    e.preventDefault();
                    saveImage();
                    break;
                case "o":
                    e.preventDefault();
                    choose_Input.click();
                    break;
            }
        }
    });
}

function setupDragAndDrop() {
    const imageWrapper = document.querySelector('.image-wrapper');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        imageWrapper.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        imageWrapper.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        imageWrapper.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        imageWrapper.classList.add('drag-over');
    }

    function unhighlight(e) {
        imageWrapper.classList.remove('drag-over');
    }

    imageWrapper.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            choose_Input.files = files;
            handleImageUpload();
        }
    }
}

// Enhanced image upload handling
function handleImageUpload() {
    const file = choose_Input.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file.', 'error');
        return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
        showToast('File size must be less than 10MB.', 'error');
        return;
    }

    showSpinner();
    
    const reader = new FileReader();
    reader.onload = (e) => {
        imgSrc.src = e.target.result;
        originalImageUrl = e.target.result;
        imgSrc.addEventListener("load", () => {
            resetAll();
            // Add uploaded image to undo stacks so undo works for uploads
            sketchHistoryStack.length = 0;
            effectHistoryStack.length = 0;
            sketchHistoryStack.push(imgSrc.src);
            effectHistoryStack.push(imgSrc.src);
            imgSrc.style.animation = "fadeIn 0.5s ease-out";
            hideSpinner();
            showToast('Image uploaded successfully!', 'success');
            // Hide upload prompt
            const overlay = document.querySelector('.image-overlay');
            if (overlay) overlay.style.display = 'none';
            // Adjust image display based on dimensions
            adjustImageDisplay();
        }, { once: true });
    };
    
    reader.onerror = () => {
        hideSpinner();
        showToast('Error reading file. Please try again.', 'error');
    };
    
    reader.readAsDataURL(file);
}

// Function to adjust image display based on dimensions
function adjustImageDisplay() {
    const img = document.querySelector('#mainImage');
    if (!img) return;
    
    // Wait for image to load completely
    if (img.complete) {
        adjustImageSize();
    } else {
        img.addEventListener('load', adjustImageSize);
    }
}

function adjustImageSize() {
    const img = document.querySelector('#mainImage');
    const wrapper = document.querySelector('.image-wrapper');
    
    if (!img || !wrapper) return;
    
    // Reset any previous styling
    img.style.width = 'auto';
    img.style.height = 'auto';
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    
    // Always maintain fixed container size, let image fit within
    img.style.objectFit = 'contain';
    img.style.objectPosition = 'center';
}

// Enhanced filter handling
function handleFilterClick() {
        document.querySelector(".filter-grid .active")?.classList.remove("active");
    this.classList.add("active");
    slider_name.innerText = this.id;
    
    const filterId = this.id;
    const filterValue = filters[filterId];
    
    updateSliderForFilter(filterId, filterValue);
    updateSliderDisplay();
}

function updateSliderForFilter(filterId, value) {
    switch (filterId) {
            case "brightness":
            case "contrast":
            case "saturate":
                slider.max = "200";
                slider.value = value || 100;
                break;
            case "invert":
            case "blur":
            case "grayscale":
            case "sepia":
            case "noise":
            case "pixelate":
            case "vignette":
                slider.max = "100";
                slider.value = value || 0;
                break;
            case "hue":
                slider.max = "360";
                slider.value = value || 0;
                break;
        }
}

function handleSliderChange() {
    const activeFilter = document.querySelector(".filter-grid .active")?.id;
    if (activeFilter) {
        filters[activeFilter] = slider.value;
        updateSliderDisplay();
        applyFilters();
    }
}

function updateSliderDisplay() {
    const activeFilter = document.querySelector(".filter-grid .active")?.id;
    if (activeFilter) {
        slider_name.innerText = activeFilter;
        slider_value.innerText = `${slider.value}%`;
    }
}

// Enhanced transform handling
function handleTransformClick() {
    const transformId = this.id;
    
    switch (transformId) {
            case "rotate_left":
                transform.rotate -= 90;
                break;
            case "rotate_right":
                transform.rotate += 90;
                break;
            case "flip_x":
                transform.flip_x = transform.flip_x === 1 ? -1 : 1;
                break;
            case "flip_y":
                transform.flip_y = transform.flip_y === 1 ? -1 : 1;
                break;
            case "crop":
                cropimgFunction();
                break;
        }
    
        applyTransformations();
    showToast(`Applied ${transformId.replace('_', ' ')} transformation`, 'info');
}

// Enhanced sketch variation handling
function handleSketchVariation() {
    const img = document.querySelector('#mainImage');
    if (!img || !img.src || img.src.includes('data:,')) {
        showToast('Please upload an image first.', 'warning');
        return;
    }

    // Update active state
    document.querySelectorAll('.sketch-variation-btn.active').forEach(b => b.classList.remove('active'));
    this.classList.add('active');

    // --- NEW LOGIC: Reset image to original before applying new sketch effect ---
    if (typeof originalImageUrl === 'string' && originalImageUrl.length > 0) {
        img.src = originalImageUrl;
    }

    const blurSigma = parseFloat(this.getAttribute('data-blur'));
    const sharpenValue = parseFloat(this.getAttribute('data-sharpen'));
    showSpinner();

    // Save current state to history before applying effect
    if (img.src) {
        sketchHistoryStack.push(img.src);
    }

    // Apply the selected sketch effect
    applyPencilSketch(blurSigma, sharpenValue);
}

function undoSketch() {
    console.log('Undo sketch called, history stack length:', sketchHistoryStack.length);
    const img = document.querySelector('#mainImage');
    if (!img) {
        showToast('No image found!', 'error');
        return;
    }
    
    if (sketchHistoryStack.length > 0) {
        const prevSrc = sketchHistoryStack.pop();
        console.log('Restoring from history:', prevSrc.substring(0, 50) + '...');
        img.src = prevSrc;
        img.style.opacity = "1";
        document.querySelectorAll('.sketch-variation-btn').forEach(b => b.classList.remove('active'));
        showToast('Sketch effect undone', 'info');
    } else {
        showToast('No sketch to undo.', 'warning');
    }
}

function undoAiEffect() {
    console.log('=== UNDO AI EFFECT DEBUG ===');
    console.log('Undo AI effect called, history stack length:', effectHistoryStack.length);
    console.log('History stack contents:', effectHistoryStack);
    
    const img = document.querySelector('#mainImage');
    console.log('Image element found:', img);
    console.log('Current image src:', img ? img.src.substring(0, 50) + '...' : 'No image');
    
    if (!img) {
        showToast('No image found!', 'error');
        return;
    }
    
    if (effectHistoryStack.length > 0) {
        const prevSrc = effectHistoryStack.pop();
        console.log('Restoring from AI history:', prevSrc.substring(0, 50) + '...');
        img.src = prevSrc;
        img.style.opacity = "1";
        document.querySelectorAll('.effect-btn').forEach(b => b.classList.remove('active'));
        showToast('AI effect undone', 'info');
        console.log('Undo completed successfully');
    } else {
        console.log('No history to undo');
        showToast('No AI effect to undo.', 'warning');
    }
    console.log('=== END DEBUG ===');
}

// Enhanced effect handling
function handleEffectClick() {
    const img = document.querySelector('#mainImage');
    if (!img || !img.src) {
        showToast('Please upload an image first.', 'warning');
        return;
    }

    clearActiveEffect();
    this.classList.add('active');
    activeCustomEffect = this;
    
    // Save current state to history before applying effect
    console.log('=== SAVING AI EFFECT HISTORY ===');
    console.log('Current image src:', img.src.substring(0, 50) + '...');
    console.log('History stack before save:', effectHistoryStack);
    
    if (img.src && (effectHistoryStack.length === 0 || effectHistoryStack[effectHistoryStack.length - 1] !== img.src)) {
        console.log('Saving to AI effect history:', img.src.substring(0, 50) + '...');
        effectHistoryStack.push(img.src);
        console.log('AI history stack length after save:', effectHistoryStack.length);
        console.log('History stack after save:', effectHistoryStack);
    } else {
        console.log('Not saving - duplicate or no image src');
    }
    console.log('=== END SAVE DEBUG ===');
    
    showSpinner();
    applyCustomEffect(this.id);
}

function applyCustomEffect(effect) {
    switch (effect) {
        case "sketch":
            pencilSketchImage();
            break;
        case "background_removal":
            removeBackground();
            break;
        case "compression":
            compressImage();
            break;
        case "colorization":
            colorizeImage();
            break;
        case "enhancer":
            // Apply enhance effect using canvas to create a new image
            applyEnhanceEffect();
            break;
        case "oil_painting":
            oilPaintImage();
            break;
        default:
            console.warn("Unknown custom effect:", effect);
            hideSpinner();
            showToast('Effect not available', 'error');
    }
}

// Enhanced section toggle
function toggleSection() {
    const section = this.closest('.tool-section');
    section.classList.toggle('open');
    
    const content = section.querySelector('.section-content');
    if (section.classList.contains('open')) {
        content.style.display = 'block';
    } else {
        content.style.display = 'none';
    }
}

// Enhanced clear effects
function clearAllEffects() {
    // Remove custom effects
    imgSrc.style.filter = '';
    document.querySelectorAll(".effects-grid button.active, .sketch-variation-btn.active").forEach(b => b.classList.remove("active"));
    effectHistoryStack = [];
    sketchHistoryStack = [];

    // Reset all adjustment filters to their defaults
    Object.keys(filters).forEach(key => {
        filters[key] = (key === "brightness" || key === "contrast" || key === "saturate") ? 100 : 0;
    });

    // Update slider value and display
    const activeFilter = document.querySelector(".filter-grid .active")?.id;
    if (activeFilter) {
        // Update slider value based on the active filter
        switch (activeFilter) {
            case "brightness":
            case "contrast":
            case "saturate":
                slider.value = 100;
                break;
            case "invert":
            case "blur":
            case "grayscale":
            case "sepia":
                slider.value = 0;
                break;
            case "hue":
                slider.value = 0;
                break;
        }
    } else {
        // If no active filter, default to brightness
        slider.value = 100;
    }

    // Update slider display
    updateSliderDisplay();
    applyFilters();

    showToast('All effects cleared', 'info');
}

// Enhanced filter application
function applyFilters() {
    const filterString = `brightness(${filters.brightness}%) 
                         contrast(${filters.contrast}%) 
                         saturate(${filters.saturate}%) 
                         invert(${filters.invert}%) 
                         blur(${filters.blur}px)
                         grayscale(${filters.grayscale}%)
                         sepia(${filters.sepia}%)
                         hue-rotate(${filters.hue}deg)`;
    
    imgSrc.style.filter = filterString;
}

function applyTransformations() {
    imgSrc.style.transform = `rotate(${transform.rotate}deg) scale(${transform.flip_x}, ${transform.flip_y})`;
}

// Enhanced reset functionality
function resetAll() {
    Object.keys(filters).forEach(key => {
        filters[key] = key === "brightness" || key === "contrast" || key === "saturate" ? 100 : 0;
    });

    transform.rotate = 0;
    transform.flip_x = 1;
    transform.flip_y = 1;

    applyFilters();
    applyTransformations();

    // Properly destroy cropper
    if (cropper) {
    cropper.destroy();
        cropper = null;
        cropBtn.style.display = "none";
        cropBtn.textContent = "Apply Crop";
    }
    demo_Crop.style.display = "none";

    updateSliderDisplay();
    document.querySelector(".filter-grid .active")?.classList.remove("active");
    filter_buttons[0].classList.add("active");

    // Clear effect history
    effectHistoryStack = [];
    sketchHistoryStack = [];
    document.querySelectorAll(".effects-grid button.active, .sketch-variation-btn.active").forEach(b => b.classList.remove("active"));

    // Reset image display
    adjustImageDisplay();

    showToast('All changes reset', 'info');
}

// Enhanced crop functionality
function cropimgFunction() {
    if (cropper) cropper.destroy();
    
    // Check if image is loaded
    if (!imgSrc.src || imgSrc.src === '') {
        showToast('Please upload an image first!', 'error');
        return;
    }
    
    // Hide crop button initially
    cropBtn.style.display = "none";
    
    cropper = new Cropper(imgSrc, {
        aspectRatio: NaN,
        viewMode: 1,
        dragMode: "crop",
        autoCropArea: 0.8,
        restore: false,
        guides: true,
        center: true,
        highlight: true,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
        ready: function() {
            showToast('Crop mode activated. Drag to select area.', 'info');
            // Show crop button after cropper is ready
            cropBtn.style.display = "block";
            cropBtn.textContent = "Apply Crop";
        },
        cropstart: function() {
            // Show crop button when user starts cropping
            cropBtn.style.display = "block";
        }
    });
}

function applyCrop() {
    if (!cropper) {
        showToast('No crop area selected!', 'error');
        return;
    }
    
    try {
        const canvas = cropper.getCroppedCanvas({
            width: imgSrc.naturalWidth,
            height: imgSrc.naturalHeight,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high'
        });
        
        if (!canvas) {
            showToast('Crop failed. Please try again.', 'error');
            return;
        }
        
        imgSrc.src = canvas.toDataURL('image/jpeg', 0.9);
        cropper.destroy();
        cropper = null;
        cropBtn.style.display = "none";
        
        showToast('Crop applied successfully!', 'success');
    } catch (error) {
        console.error('Crop error:', error);
        showToast('Crop failed. Please try again.', 'error');
    }
}

// Enhanced save functionality
function saveImage() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = imgSrc.naturalWidth;
    canvas.height = imgSrc.naturalHeight;

    ctx.filter = `brightness(${filters.brightness}%) 
                 contrast(${filters.contrast}%) 
                 saturate(${filters.saturate}%) 
                 invert(${filters.invert}%) 
                 blur(${filters.blur}px)
                 grayscale(${filters.grayscale}%)
                 sepia(${filters.sepia}%)
                 hue-rotate(${filters.hue}deg)`;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(transform.flip_x, transform.flip_y);
    ctx.rotate((transform.rotate * Math.PI) / 180);
    ctx.drawImage(
        imgSrc,
        -canvas.width / 2,
        -canvas.height / 2,
        canvas.width,
        canvas.height
    );

    if (filters.noise > 0) {
        applyNoise(ctx, canvas.width, canvas.height, filters.noise);
    }
    if (filters.pixelate > 0) {
        applyPixelate(ctx, canvas.width, canvas.height, filters.pixelate);
    }
    if (filters.vignette > 0) {
        applyVignette(ctx, canvas.width, canvas.height, filters.vignette);
    }

    const link = document.createElement("a");
    link.download = "edited-image.jpg";
    link.href = canvas.toDataURL("image/jpeg", 0.9);
    link.click();
    
    showToast('Image saved successfully!', 'success');
}

// Utility functions
function dataURLtoBlob(dataurl) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}

// Enhanced API calls with better error handling
function makeApiCall(endpoint, formData, successMessage) {
    return fetch(endpoint, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.blob();
    })
    .then(resultBlob => {
        const url = URL.createObjectURL(resultBlob);
        imgSrc.src = url;
        
        // Ensure overlay stays hidden when AI effects are applied
        const overlay = document.querySelector('.image-overlay');
        if (overlay) overlay.style.display = 'none';
        
        hideSpinner();
        showToast(successMessage, 'success');
    })
    .catch((err) => {
        hideSpinner();
        showToast(`Operation failed: ${err.message}`, 'error');
        console.error('API Error:', err);
    });
}

// API functions
function removeBackground() {
    const imgElement = document.querySelector('#mainImage');
    if (!imgElement || !imgElement.src) {
        showToast('No image found!', 'error');
        return;
    }
    
    let blobPromise;
    if (imgElement.src.startsWith('data:')) {
        blobPromise = Promise.resolve(dataURLtoBlob(imgElement.src));
    } else {
        blobPromise = fetch(imgElement.src).then(res => res.blob());
    }
    
    blobPromise.then(blob => {
        const formData = new FormData();
        formData.append('image', blob, 'image.png');
        makeApiCall('/remove-bg', formData, 'Background removed successfully!');
    });
}

function compressImage() {
    const imgElement = document.querySelector('#mainImage');
    if (!imgElement || !imgElement.src) {
        showToast('No image found!', 'error');
        return;
    }
    
    let blobPromise;
    if (imgElement.src.startsWith('data:')) {
        blobPromise = Promise.resolve(dataURLtoBlob(imgElement.src));
    } else {
        blobPromise = fetch(imgElement.src).then(res => res.blob());
    }
    
    blobPromise.then(blob => {
        const formData = new FormData();
        formData.append('image', blob, 'image.jpg');
        makeApiCall('/compress', formData, 'Image compressed successfully!');
    });
}

function colorizeImage() {
    const imgElement = document.querySelector('#mainImage');
    if (!imgElement || !imgElement.src) {
        showToast('No image found!', 'error');
        return;
    }
    
    let blobPromise;
    if (imgElement.src.startsWith('data:')) {
        blobPromise = Promise.resolve(dataURLtoBlob(imgElement.src));
    } else {
        blobPromise = fetch(imgElement.src).then(res => res.blob());
    }
    
    blobPromise.then(blob => {
        const formData = new FormData();
        formData.append('image', blob, 'image.png');
        makeApiCall('/colorize', formData, 'Image colorized successfully!');
    });
}

function oilPaintImage() {
    const imgElement = document.querySelector('#mainImage');
    if (!imgElement || !imgElement.src) {
        showToast('No image found!', 'error');
        return;
    }
    
    let blobPromise;
    if (imgElement.src.startsWith('data:')) {
        blobPromise = Promise.resolve(dataURLtoBlob(imgElement.src));
    } else {
        blobPromise = fetch(imgElement.src).then(res => res.blob());
    }
    
    blobPromise.then(blob => {
        const formData = new FormData();
        formData.append('image', blob, 'image.jpg');
        makeApiCall('/oil_paint', formData, 'Oil painting effect applied!');
    });
}

function pencilSketchImage() {
    const imgElement = document.querySelector('#mainImage');
    if (!imgElement || !imgElement.src) {
        showToast('No image found!', 'error');
        return;
    }
    
    let blobPromise;
    if (imgElement.src.startsWith('data:')) {
        blobPromise = Promise.resolve(dataURLtoBlob(imgElement.src));
    } else {
        blobPromise = fetch(imgElement.src).then(res => res.blob());
    }
    
    blobPromise.then(blob => {
        const formData = new FormData();
        formData.append('image', blob, 'image.png');
        makeApiCall('/pencil_sketch', formData, 'Pencil sketch created!');
    });
}

// Fallback for applyPencilSketch if not defined
if (typeof applyPencilSketch !== 'function') {
    window.applyPencilSketch = function(blurSigma, sharpenValue) {
        const imgElement = document.querySelector('#mainImage');
        if (!imgElement || !imgElement.src) {
            showToast('No image found!', 'error');
            return;
        }
        
        let blobPromise;
        if (imgElement.src.startsWith('data:')) {
            blobPromise = Promise.resolve(dataURLtoBlob(imgElement.src));
        } else {
            blobPromise = fetch(imgElement.src).then(res => res.blob());
        }
        
        blobPromise.then(blob => {
            const formData = new FormData();
            formData.append('image', blob, 'image.png');
            formData.append('blurSigma', blurSigma);
            formData.append('sharpenValue', sharpenValue);
            makeApiCall('/pencil_sketch', formData, 'Sketch variation applied!');
        });
    }
}

// Effect functions
function applyNoise(ctx, width, height, intensity) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * intensity;
        data[i] += noise;
        data[i + 1] += noise;
        data[i + 2] += noise;
    }
    ctx.putImageData(imageData, 0, 0);
}

function applyPixelate(ctx, width, height, intensity) {
    const size = Math.max(1, Math.floor(intensity / 10));
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCtx.drawImage(ctx.canvas, 0, 0);
    
    ctx.clearRect(0, 0, width, height);
    for (let y = 0; y < height; y += size) {
        for (let x = 0; x < width; x += size) {
            const pixel = tempCtx.getImageData(x, y, 1, 1).data;
            ctx.fillStyle = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
            ctx.fillRect(x, y, size, size);
        }
    }
}

function applyVignette(ctx, width, height, intensity) {
    const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) / 2
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity / 100})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
}

// Enhanced utility functions
function applyEnhanceEffect() {
    const img = document.querySelector('#mainImage');
    if (!img || !img.src) {
        showToast('No image found!', 'error');
        hideSpinner();
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Create a temporary image to work with
    const tempImg = new Image();
    tempImg.crossOrigin = 'anonymous';
    
    tempImg.onload = function() {
        canvas.width = tempImg.naturalWidth;
        canvas.height = tempImg.naturalHeight;
        
        // Apply enhance effect using canvas filters
        ctx.filter = "brightness(115%) contrast(130%) saturate(110%)";
        ctx.drawImage(tempImg, 0, 0);
        
        // Convert canvas to data URL and update image
        const enhancedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        img.src = enhancedDataUrl;
        
        // Ensure overlay stays hidden when enhance effect is applied
        const overlay = document.querySelector('.image-overlay');
        if (overlay) overlay.style.display = 'none';
        
        hideSpinner();
        showToast('Image enhanced successfully!', 'success');
    };
    
    tempImg.onerror = function() {
        hideSpinner();
        showToast('Failed to enhance image', 'error');
    };
    
    tempImg.src = img.src;
}

function clearActiveEffect() {
    document.querySelectorAll('.effects-grid button.active, .sketch-variation-btn.active')
        .forEach(btn => btn.classList.remove('active'));

    if (imgSrc && originalImageUrl) {
        imgSrc.src = originalImageUrl;
    }

    imgSrc.style.filter = "";
    imgSrc.style.opacity = "1";
    activeCustomEffect = null;
}

// Export functions for global access
window.downloadImage = function() {
    const img = document.getElementById('mainImage');
    if (!img || !img.src) {
        showToast('No image to download', 'warning');
        return;
    }
    const link = document.createElement('a');
    link.href = img.src;
    link.download = 'edited-image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Image downloaded successfully!', 'success');
}

window.toggleTheme = function() {
    document.body.classList.toggle('light-theme');
    const icon = document.querySelector('.theme-toggle i');
    if (document.body.classList.contains('light-theme')) {
        icon.className = 'fas fa-sun';
        showToast('Switched to light theme', 'info');
    } else {
        icon.className = 'fas fa-moon';
        showToast('Switched to dark theme', 'info');
    }
}

window.showToast = function(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

window.showSpinner = function() {
    document.getElementById('spinnerOverlay').classList.add('active');
}

window.hideSpinner = function() {
    document.getElementById('spinnerOverlay').classList.remove('active');
}
