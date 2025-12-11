const feed = document.getElementById('feed');
const loadingContainer = feed.querySelector('.loading-container');
const likeBtn = document.getElementById('like');
const commentBtn = document.getElementById('comment');
const shareBtn = document.getElementById('share');

const sampleVideos = [
    { "name": "video-1764077443079.mp4", "url": "https://anuvideostore.blob.core.windows.net/videos/video-1764077443079.mp4" },
    { "name": "video-1765474051382.mp4", "url": "https://anuvideostore.blob.core.windows.net/videos/video-1765474051382.mp4" },
    { "name": "video-1765476301896.mp4", "url": "https://anuvideostore.blob.core.windows.net/videos/video-1765476301896.mp4" },
    { "name": "video-1765476622528.mp4", "url": "https://anuvideostore.blob.core.windows.net/videos/video-1765476622528.mp4" },
    { "name": "video-1765477276846.mp4", "url": "https://anuvideostore.blob.core.windows.net/videos/video-1765477276846.mp4" }
];

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
        const response = await fetch('http://localhost:7071/api/listVideos');
        videos = await response.json();
    } catch (e) {
        videos = sampleVideos;
    }
    renderVideos();
    feed.removeChild(loadingContainer);
}

function renderVideos() {
    videos.forEach((videoData, index) => {
        const videoItem = document.createElement('div');
        videoItem.className = 'video-item';
        videoItem.innerHTML = `
            <video preload="metadata" muted></video>
            <div class="video-overlay" style="display: none;">Video unavailable — Retry</div>
        `;
        feed.appendChild(videoItem);
        const video = videoItem.querySelector('video');
        video.addEventListener('click', () => togglePlayPause(video));
        video.addEventListener('error', () => showError(videoItem));
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
    feed.addEventListener('scroll', () => {
        const scrollTop = feed.scrollTop;
        const scrollHeight = feed.scrollHeight;
        const clientHeight = feed.clientHeight;
        if (scrollTop + clientHeight >= scrollHeight - clientHeight / 2) {
            loadMoreVideos();
        }
    });
}

function loadMoreVideos() {
    const oldLength = videos.length;
    videos = videos.concat(sampleVideos); // Reuse for demo
    for (let i = 0; i < sampleVideos.length; i++) {
        const videoData = sampleVideos[i];
        const videoItem = document.createElement('div');
        videoItem.className = 'video-item';
        videoItem.innerHTML = `
            <video preload="metadata" muted></video>
            <div class="video-overlay" style="display: none;">Video unavailable — Retry</div>
        `;
        feed.appendChild(videoItem);
        const video = videoItem.querySelector('video');
        video.addEventListener('click', () => togglePlayPause(video));
        video.addEventListener('error', () => showError(videoItem));
        const overlay = videoItem.querySelector('.video-overlay');
        overlay.addEventListener('click', () => retryVideo(video, videoData.url));
        intersectionObserver.observe(video);
        lazyObserver.observe(video);
    }
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

// Start
fetchVideos();
initInfiniteScroll();
initKeyboardControls();
initSidebar();
