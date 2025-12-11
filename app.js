const feed = document.getElementById('feed');
const loadingContainer = feed.querySelector('.loading-container');
const likeBtn = document.getElementById('like');
const commentBtn = document.getElementById('comment');
const shareBtn = document.getElementById('share');
const uploadInput = document.getElementById('uploadInput');
const plusBtn = document.querySelector('.nav-button.plus');
const uploadStatus = document.getElementById('upload-status');

let API_BASE;

let videos = [];
let currentPlaying = null;
let preloadedVideos = new Set();

const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.8
};

const lazyOptions = {
    root: null,
    rootMargin: '50% 0px',
    threshold: 0
};

const intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting) {
            currentPlaying = video;
            if (video.src) {
                video.muted = true;
                video.play().catch(() => {});
            }
            updateActiveVideo(video);
        } else {
            if (video !== currentPlaying) {
                video.pause();
            }
        }
    });
}, observerOptions);

const lazyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const video = entry.target;
        const wrapper = video.closest('.video-item');
        const index = Array.from(feed.children).indexOf(wrapper);
        if (entry.isIntersecting && !video.src) {
            video.src = videos[index]?.url;
            preloadedVideos.add(index);
        } else if (!entry.isIntersecting && preloadedVideos.has(index) && Math.abs(index - getCurrentIndex()) > 3) {
            video.src = '';
            preloadedVideos.delete(index);
        }
    });
}, lazyOptions);

function getCurrentIndex() {
    if (!currentPlaying) return 0;
    const wrapper = currentPlaying.closest('.video-item');
    return Array.from(feed.children).indexOf(wrapper);
}

function updateActiveVideo(activeVideo) {
    document.querySelectorAll('.video-item video').forEach(v => {
        if (v !== activeVideo) {
            v.pause();
            v.currentTime = 0;
        }
    });
}

async function fetchVideos() {
    try {
        console.log('Fetching videos from API...');
        const response = await fetch(`${API_BASE}/listVideos`);
        videos = await response.json();
        console.log('Fetched', videos.length, 'videos successfully');

        // Only render videos if we don't already have video items
        if (feed.querySelectorAll('.video-item').length === 0) {
            renderVideos();
            feed.removeChild(loadingContainer);
        } else {
            console.log('Videos already rendered, skipping render');
        }
    } catch (e) {
        console.error('Failed to fetch videos:', e);
        // Only show error if no videos are loaded yet
        if (videos.length === 0) {
            feed.innerHTML = '<div class="error-message">Failed to load videos. Please check your connection.</div>';
            feed.removeChild(loadingContainer);
        }
    }
}

function renderVideos() {
    console.log('Rendering', videos.length, 'videos');
    videos.forEach((videoData, index) => {
        console.log('Rendering video:', videoData.name, videoData.url);

        const videoItem = document.createElement('div');
        videoItem.className = 'video-item';
        videoItem.innerHTML = `
            <video preload="metadata" muted controls></video>
            <div class="video-overlay" style="display: none;">Video unavailable — Retry</div>
        `;
        feed.appendChild(videoItem);

        const video = videoItem.querySelector('video');
        // Set src immediately for debugging
        video.src = videoData.url;
        console.log('Set video src to:', videoData.url);

        video.addEventListener('loadeddata', () => {
            console.log('Video loaded:', videoData.name);
        });

        video.addEventListener('error', (e) => {
            console.error('Video error for', videoData.name, e);
            showError(videoItem);
        });

        video.addEventListener('click', () => togglePlayPause(video));
        const overlay = videoItem.querySelector('.video-overlay');
        overlay.addEventListener('click', () => retryVideo(video, videoData.url));
        intersectionObserver.observe(video);
        lazyObserver.observe(video);
    });
}

function showError(videoItem) {
    const overlay = videoItem.querySelector('.video-overlay');
    overlay.style.display = 'flex';
}

function retryVideo(video, url) {
    video.src = url;
    video.load();
    const overlay = video.closest('.video-item').querySelector('.video-overlay');
    overlay.style.display = 'none';
}

function togglePlayPause(video) {
    if (video.paused) {
        video.muted = false;
        video.play();
    } else {
        video.pause();
        video.muted = true;
    }
}

function initInfiniteScroll() {
    // Infinite scroll disabled - only fetch videos from Azure
}

function initKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        if (!currentPlaying) return;
        if (e.key === 'ArrowDown') {
            feed.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
        } else if (e.key === 'ArrowUp') {
            feed.scrollBy({ top: -window.innerHeight, behavior: 'smooth' });
        } else if (e.key === ' ') {
            e.preventDefault();
            togglePlayPause(currentPlaying);
        }
    });
}

function initSidebar() {
    likeBtn.addEventListener('click', () => updateCount('like'));
    commentBtn.addEventListener('click', () => updateCount('comment'));
    shareBtn.addEventListener('click', () => updateCount('share'));
}

function updateCount(type) {
    const btn = document.getElementById(type);
    const span = btn.querySelector('span');
    span.textContent = parseInt(span.textContent) + 1;
}

async function uploadVideo(file) {
    const formData = new FormData();
    formData.append('video', file);

    uploadStatus.textContent = 'Uploading video...';
    uploadStatus.style.display = 'block';

    try {
        const response = await fetch(`${API_BASE}/uploadVideo`, {
            method: 'POST',
            body: formData
        });
        if (response.ok) {
            uploadStatus.textContent = 'Video uploaded successfully! Refresh to see it.';
        } else {
            uploadStatus.textContent = 'Upload failed';
        }
    } catch (e) {
        console.error('Upload error:', e);
        uploadStatus.textContent = 'Upload failed';
    }

    setTimeout(() => {
        uploadStatus.style.display = 'none';
    }, 3000);
}

function initUpload() {
    plusBtn.addEventListener('click', () => {
        uploadInput.click();
    });

    uploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            uploadVideo(file);
        }
    });
}

// Start
function init() {
    API_BASE = process.env.API_BASE;
    fetchVideos();
    initInfiniteScroll();
    initKeyboardControls();
    initSidebar();
    initUpload();
}

if (window.envLoaded) {
    init();
} else {
    window.addEventListener('load', () => {
        // Wait a bit for env load
        setTimeout(init, 100);
    });
}
