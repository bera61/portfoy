/* ============================================
   PORTFOLIO APP - Main JavaScript
   ============================================ */

// ==================== DATA ====================

const DEFAULT_PROJECTS = [
    {
        name: "E-Ticaret Platformu",
        description: "Full-stack e-ticaret web uygulaması. Kullanıcı kimlik doğrulama, ürün yönetimi, sepet sistemi ve ödeme entegrasyonu içerir.",
        technologies: ["React", "Node.js", "MongoDB", "Stripe"],
        icon: "🛒",
        github: "#",
        live: "#"
    },
    {
        name: "Gerçek Zamanlı Chat Uygulaması",
        description: "WebSocket tabanlı anlık mesajlaşma uygulaması. Grup sohbetleri, dosya paylaşımı ve çevrimiçi durum gösterimi.",
        technologies: ["Vue.js", "Socket.io", "Express", "Redis"],
        icon: "💬",
        github: "#",
        live: "#"
    },
    {
        name: "Yapay Zeka Görüntü Sınıflandırıcı",
        description: "Derin öğrenme modeli ile görüntü sınıflandırma. Transfer learning kullanarak eğitilmiş CNN modeli.",
        technologies: ["Python", "TensorFlow", "Flask", "Docker"],
        icon: "🤖",
        github: "#"
    },
    {
        name: "Proje Yönetim Aracı",
        description: "Kanban board tabanlı proje yönetim uygulaması. Sürükle-bırak, görev atama ve ilerleme takibi özellikleri.",
        technologies: ["Next.js", "TypeScript", "PostgreSQL", "Prisma"],
        icon: "📋",
        github: "#",
        live: "#"
    },
    {
        name: "IoT Dashboard",
        description: "Sensör verilerini gerçek zamanlı izleme ve görselleştirme platformu. Grafik ve alarm sistemi.",
        technologies: ["React", "D3.js", "MQTT", "InfluxDB"],
        icon: "📡",
        github: "#"
    },
    {
        name: "Mobil Fitness Uygulaması",
        description: "Egzersiz takibi, beslenme planı ve ilerleme grafikleri sunan cross-platform mobil uygulama.",
        technologies: ["React Native", "Firebase", "Redux", "Charts"],
        icon: "💪",
        github: "#",
        live: "#"
    }
];

// ==================== APP STATE ====================

const App = {
    currentSection: 'hero',
    isLoggedIn: false,
    selectedCategory: null,
    typingTexts: [
        'Bilgisayar Mühendisi',
        'Video Editör',
        'Full-Stack Developer',
        'Content Creator'
    ],
    typingIndex: 0,
    typingCharIndex: 0,
    typingDirection: 'forward',
};

// ==================== FIREBASE HELPERS ====================

// Default placeholder items logic
async function fetchFromFirebase(path, defaultVal) {
    if (!window.FirebaseDB || !window.FirebaseDB.db) return defaultVal;

    try {
        const dbRef = window.FirebaseDB.api.ref(window.FirebaseDB.db);
        const snapshot = await window.FirebaseDB.api.get(window.FirebaseDB.api.child(dbRef, path));
        if (snapshot.exists()) {
            const data = snapshot.val();
            // Firebase arrays might be stored as objects, convert them if needed
            if (path !== 'settings' && !Array.isArray(data) && typeof data === 'object') {
                return Object.values(data);
            }
            return data;
        } else {
            return defaultVal;
        }
    } catch (error) {
        console.error("Firebase fetch error:", error);
        return defaultVal;
    }
}

async function saveToFirebase(path, val) {
    if (!window.FirebaseDB || !window.FirebaseDB.db) return;
    try {
        const dbRef = window.FirebaseDB.api.ref(window.FirebaseDB.db, path);
        await window.FirebaseDB.api.set(dbRef, val);
    } catch (error) {
        console.error("Firebase save error:", error);
    }
}

// Global cached variables to enable synchronous rendering across app functions quickly
App.data = {
    categories: [],
    videos: [],
    projects: [],
    settings: null
};

function getCategories() { return App.data.categories; }
async function setCategories(cats) {
    App.data.categories = cats || [];
    await saveToFirebase('categories', App.data.categories);
}

function getVideos() { return App.data.videos; }
async function setVideos(vids) {
    App.data.videos = vids || [];
    await saveToFirebase('videos', App.data.videos);
}

function getProjects() { return App.data.projects; }
async function setProjects(projs) {
    App.data.projects = projs || [];
    await saveToFirebase('projects', App.data.projects);
}

// ==================== INDEXED DB FOR LOCAL VIDEOS ====================
const VideoDB = {
    dbName: 'PortfolioVideoDB',
    dbVersion: 1,
    storeName: 'videos',

    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            request.onerror = (e) => reject("IndexedDB error: " + e.target.errorCode);
            request.onsuccess = (e) => resolve(e.target.result);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
        });
    },

    async saveVideoBlob(id, fileBlob) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([this.storeName], 'readwrite');
            const store = tx.objectStore(this.storeName);
            const request = store.put(fileBlob, id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject("Error saving video");
        });
    },

    async getVideoBlobUrl(id) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([this.storeName], 'readonly');
            const store = tx.objectStore(this.storeName);
            const request = store.get(id);
            request.onsuccess = (e) => {
                if (e.target.result) {
                    resolve(URL.createObjectURL(e.target.result));
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject("Error reading video");
        });
    },

    async deleteVideoBlob(id) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([this.storeName], 'readwrite');
            const store = tx.objectStore(this.storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject("Error deleting video");
        });
    }
};

function getSiteSettings() {
    return App.data.settings || {
        name: 'İsim',
        surname: 'Soyisim',
        bio: 'Bilgisayar Mühendisliği ve Video Editörlüğü alanlarında çalışan bir profesyonel. Yazılım geliştirme ve görsel hikaye anlatıcılığı tutkumu birleştirerek, teknoloji ile yaratıcılığın kesiştiği noktada projeler üretiyorum.',
        bioEn: 'A professional working in Computer Engineering and Video Editing. Combining my passion for software development and visual storytelling, I create projects at the intersection of technology and creativity.',
        aboutText: 'Buraya kendiniz hakkında daha detaylı bir şeyler yazabilirsiniz.',
        aboutTextEn: 'You can write something more detailed about yourself here.',
        instagram: '',
        linkedin: '',
        github: '',
        cvData: '',
        cvName: ''
    };
}

async function saveSiteSettings(settings) {
    App.data.settings = settings;
    await saveToFirebase('settings', settings);
}

function getAdminPassword() {
    return localStorage.getItem('portfolio_admin_pw');
}

function setAdminPassword(pw) {
    localStorage.setItem('portfolio_admin_pw', pw);
}

// ==================== INIT ====================

document.addEventListener('DOMContentLoaded', async () => {
    // Await Firebase initial load
    App.data.categories = await fetchFromFirebase('categories', []);
    App.data.videos = await fetchFromFirebase('videos', []);

    // Fallback seed projects if empty for demonstration
    let projs = await fetchFromFirebase('projects', null);
    if (!projs || projs.length === 0) {
        projs = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
        projs.forEach((p, index) => {
            if (!p.id) p.id = 'default_' + index + '_' + Date.now();
        });
        await saveToFirebase('projects', projs);
    }
    App.data.projects = projs;

    // Load Settings
    App.data.settings = await fetchFromFirebase('settings', null);

    updateHeroStats();
    initParticles();
    initNavigation();
    initTypingEffect();
    initCountUp();
    renderProjects();
    renderVideoCategories();
    initAdmin();
    applySiteSettings();
    initHeroAnimation();
});

// ==================== HERO IMAGE SEQUENCE ANIMATION ====================

function initHeroAnimation() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const scene = document.getElementById('heroScene');
    const totalFrames = 80;
    const images = [];
    let loadedCount = 0;
    let currentFrame = 0;
    let targetFrame = 40;
    let introComplete = false;
    let introFrame = 0;
    let animating = true;

    // Preload all images
    for (let i = 0; i < totalFrames; i++) {
        const img = new Image();
        const num = String(i).padStart(3, '0');
        img.src = `hero/Yeni klasör/Lego_guy_moves_desk_environment_delpmaspu__${num}.jpg`;
        img.onload = () => {
            loadedCount++;
            // Set canvas size from first loaded image
            if (loadedCount === 1) {
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
            }
            // Start animation once enough frames loaded
            if (loadedCount === totalFrames) {
                startIntroAnimation();
            }
        };
        images[i] = img;
    }

    function drawFrame(frameIndex) {
        const img = images[Math.round(frameIndex)];
        if (!img || !img.complete) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    function startIntroAnimation() {
        // Cinematic intro: play frames 0 → 40
        introFrame = 0;
        currentFrame = 0;
        drawFrame(0);

        function introStep() {
            if (introFrame < 40) {
                introFrame += 0.2; // Speed of intro (slower for cinematic feel)
                currentFrame = introFrame;
                drawFrame(Math.round(currentFrame));
                requestAnimationFrame(introStep);
            } else {
                introComplete = true;
                currentFrame = 40;
                targetFrame = 40;
                startLerpLoop();
            }
        }
        requestAnimationFrame(introStep);
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function startLerpLoop() {
        function loop() {
            if (!animating) return;
            const diff = Math.abs(currentFrame - targetFrame);
            if (diff > 0.2) {
                currentFrame = lerp(currentFrame, targetFrame, 0.015);
            } else {
                currentFrame = targetFrame;
            }
            drawFrame(Math.round(currentFrame));
            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
    }

    // Hover interactions on path cards
    const pathCS = document.getElementById('pathCS');
    const pathVideo = document.getElementById('pathVideo');

    if (pathCS) {
        pathCS.addEventListener('mouseenter', () => {
            if (!introComplete) return;
            targetFrame = 0;
            scene.classList.remove('glow-video');
            scene.classList.add('glow-cs');
        });
        pathCS.addEventListener('mouseleave', () => {
            if (!introComplete) return;
            targetFrame = 40;
            scene.classList.remove('glow-cs');
        });
    }

    if (pathVideo) {
        pathVideo.addEventListener('mouseenter', () => {
            if (!introComplete) return;
            targetFrame = 79;
            scene.classList.remove('glow-cs');
            scene.classList.add('glow-video');
        });
        pathVideo.addEventListener('mouseleave', () => {
            if (!introComplete) return;
            targetFrame = 40;
            scene.classList.remove('glow-video');
        });
    }
}

// ==================== PARTICLES ====================

function initParticles() {
    const container = document.getElementById('bgParticles');
    const count = 40;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.classList.add('particle');
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (8 + Math.random() * 15) + 's';
        p.style.animationDelay = Math.random() * 10 + 's';
        p.style.width = p.style.height = (1 + Math.random() * 3) + 'px';
        const colors = [
            'rgba(108,99,255,0.4)',
            'rgba(255,107,107,0.3)',
            'rgba(0,212,170,0.3)',
            'rgba(255,255,255,0.15)'
        ];
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        container.appendChild(p);
    }
}

// ==================== NAVIGATION ====================

function initNavigation() {
    // Nav links
    document.querySelectorAll('.nav-link, .mobile-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            navigateTo(section);
            closeMobileMenu();
        });
    });

    // Logo click
    document.getElementById('navLogo').addEventListener('click', () => navigateTo('hero'));

    // Path cards
    document.getElementById('pathCS').addEventListener('click', () => navigateTo('cs'));
    document.getElementById('pathVideo').addEventListener('click', () => navigateTo('video'));

    // Back buttons
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => navigateTo(btn.dataset.section));
    });

    // Mobile menu
    document.getElementById('mobileMenuBtn').addEventListener('click', toggleMobileMenu);
}

function navigateTo(section) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => {
        s.classList.remove('active', 'fade-in');
    });

    // Update nav
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-link[data-section="${section}"]`);
    if (activeNav) activeNav.classList.add('active');

    // Handle Admin Section Special Routing
    if (section === 'admin') {
        const targetId = App.isLoggedIn ? 'adminDashboard' : 'adminLogin';
        const modalTarget = document.getElementById(targetId);
        if (modalTarget) modalTarget.classList.add('active', 'fade-in');
    } else {
        // Show target
        const targetId = 'section' + section.charAt(0).toUpperCase() + section.slice(1);
        const target = document.getElementById(targetId);
        if (!target) {
            // Try alternate id patterns
            const altMap = { hero: 'sectionHero', cs: 'sectionCS', video: 'sectionVideo' };
            const altTarget = document.getElementById(altMap[section]);
            if (altTarget) {
                altTarget.classList.add('active', 'fade-in');
            }
        } else {
            target.classList.add('active', 'fade-in');
        }
    }

    App.currentSection = section;
    window.scrollTo(0, 0);

    // Refresh data on certain sections
    if (section === 'video') {
        renderVideoCategories();
    }
    if (section === 'admin') {
        refreshAdminData();
    }
}

function toggleMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('mobileMenu');
    btn.classList.toggle('active');
    menu.classList.toggle('show');
}

function closeMobileMenu() {
    document.getElementById('mobileMenuBtn').classList.remove('active');
    document.getElementById('mobileMenu').classList.remove('show');
}

// ==================== TYPING EFFECT ====================

function initTypingEffect() {
    const el = document.getElementById('heroTitle');
    typeLoop(el);
}

function typeLoop(el) {
    const text = App.typingTexts[App.typingIndex];

    if (App.typingDirection === 'forward') {
        App.typingCharIndex++;
        el.textContent = text.substring(0, App.typingCharIndex);
        if (App.typingCharIndex === text.length) {
            App.typingDirection = 'pause';
            setTimeout(() => {
                App.typingDirection = 'backward';
                typeLoop(el);
            }, 2000);
            return;
        }
        setTimeout(() => typeLoop(el), 60 + Math.random() * 40);
    } else if (App.typingDirection === 'backward') {
        App.typingCharIndex--;
        el.textContent = text.substring(0, App.typingCharIndex);
        if (App.typingCharIndex === 0) {
            App.typingDirection = 'forward';
            App.typingIndex = (App.typingIndex + 1) % App.typingTexts.length;
            setTimeout(() => typeLoop(el), 400);
            return;
        }
        setTimeout(() => typeLoop(el), 30 + Math.random() * 20);
    }
}

// ==================== COUNT UP ANIMATION ====================

function initCountUp() {
    const stats = document.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.count);
                animateCount(el, 0, target, 1500);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    stats.forEach(s => observer.observe(s));
}

function animateCount(el, start, end, duration) {
    const startTime = performance.now();
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(start + (end - start) * eased) + '+';
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function updateHeroStats() {
    const projects = getProjects() || [];
    const videos = getVideos() || [];
    const techs = new Set();
    projects.forEach(p => {
        if (p.technologies) {
            p.technologies.forEach(t => techs.add(t.toLowerCase().trim()));
        }
    });

    const statProjects = document.getElementById('statProjectsCount');
    const statTechs = document.getElementById('statTechsCount');
    const statVideos = document.getElementById('statVideosCount');

    if (statProjects) statProjects.dataset.count = projects.length;
    if (statTechs) statTechs.dataset.count = techs.size;
    if (statVideos) statVideos.dataset.count = videos.length;

    // // if already animated (has +), just update text
    if (statProjects && statProjects.textContent && statProjects.textContent.includes('+')) {
        statProjects.textContent = projects.length + '+';
    }
    if (statTechs && statTechs.textContent && statTechs.textContent.includes('+')) {
        statTechs.textContent = techs.size + '+';
    }
    if (statVideos && statVideos.textContent && statVideos.textContent.includes('+')) {
        statVideos.textContent = videos.length + '+';
    }
}

// ==================== CS PROJECTS ====================

function renderProjects() {
    const grid = document.getElementById('projectsGrid');
    const currentProjects = getProjects();
    grid.innerHTML = currentProjects.map((project, i) => `
        <div class="project-card" style="animation-delay: ${0.1 + i * 0.1}s">
            <div class="project-header">
                <span class="project-icon">${project.icon}</span>
                <div class="project-links">
                    ${project.github ? `<a href="${project.github}" class="project-link" title="GitHub" target="_blank">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    </a>` : ''}
                    ${project.live ? `<a href="${project.live}" class="project-link" title="Demo" target="_blank">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
                    </a>` : ''}
                </div>
            </div>
            <h3 class="project-name">${project.name}</h3>
            <p class="project-description">${project.description}</p>
            <div class="project-tech">
                ${project.technologies.map(t => `<span class="tech-badge">${t}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

// ==================== VIDEO PORTFOLIO ====================

function renderVideoCategories() {
    const categories = getCategories();
    const categoryList = document.getElementById('categoryList');
    const emptyState = document.getElementById('videoEmptyState');

    if (categories.length === 0) {
        categoryList.innerHTML = `
            <div style="padding: 20px 16px; color: var(--text-muted); font-size: 0.88rem;">
                Henüz kategori eklenmemiş. Admin panelinden kategori ekleyebilirsiniz.
            </div>
        `;
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    const videos = getVideos();
    categoryList.innerHTML = categories.map(cat => {
        const count = videos.filter(v => v.categoryId === cat.id).length;
        return `
            <div class="category-item ${App.selectedCategory === cat.id ? 'active' : ''}" 
                 data-category-id="${cat.id}" onclick="selectCategory('${cat.id}')">
                <span class="category-icon">${cat.icon || '📁'}</span>
                <span class="category-name">${cat.name}</span>
                <span class="category-count">${count}</span>
            </div>
        `;
    }).join('');

    // If a category is selected, show its videos
    if (App.selectedCategory) {
        renderCategoryVideos(App.selectedCategory);
    }
}

function selectCategory(categoryId) {
    App.selectedCategory = categoryId;

    // Update active state
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.toggle('active', item.dataset.categoryId === categoryId);
    });

    renderCategoryVideos(categoryId);
}

function renderCategoryVideos(categoryId) {
    const categories = getCategories();
    const category = categories.find(c => c.id === categoryId);
    const videos = getVideos().filter(v => v.categoryId === categoryId);

    const titleEl = document.getElementById('currentCategoryTitle');
    const countEl = document.getElementById('videoCount');
    const grid = document.getElementById('videosGrid');

    if (category) {
        titleEl.textContent = category.name;
        countEl.textContent = `${videos.length} video`;
    }

    if (videos.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="60" height="60">
                    <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
                <p>Bu kategoride henüz video yok</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = videos.map((video, i) => {
        const thumbnail = video.thumbnail || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" style="background:%232a2a2a"><text x="50%" y="50%" fill="%23666" font-size="24" dominant-baseline="middle" text-anchor="middle">Yerel Video</text></svg>';
        return `
            <div class="video-card" style="animation-delay: ${0.05 + i * 0.05}s"
                 onclick="openVideoModal('${video.id}')">
                <div class="video-thumbnail">
                    <img src="${thumbnail}" style="object-fit: cover; width: 100%; height: 100%; display: block;" alt="${video.title}" onerror="this.style.display='none'">
                    <div class="video-play-overlay">
                        <div class="play-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                        </div>
                    </div>
                </div>
                <div class="video-info">
                    <h4 class="video-title">${video.title}</h4>
                    <p class="video-desc">${video.description || ''}</p>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== VIDEO MODAL ====================

async function openVideoModal(videoId) {
    const video = getVideos().find(v => v.id === videoId);
    if (!video) return;

    const modal = document.getElementById('videoModal');
    const container = document.getElementById('modalVideoContainer');

    // Show loading state
    container.innerHTML = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:white;">Video Yükleniyor...</div>`;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    try {
        const objectUrl = await VideoDB.getVideoBlobUrl(videoId);
        if (objectUrl) {
            container.innerHTML = `<video src="${objectUrl}" controls autoplay style="width:100%; height:100%; max-height: 90vh; object-fit: contain; border-radius: var(--radius-lg); background: transparent;"></video>`;
        } else {
            container.innerHTML = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:white;">Video dosyası aygıtta bulunamadı. Silinmiş olabilir.</div>`;
        }
    } catch (err) {
        console.error(err);
        container.innerHTML = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--danger);">Hata: ${err}</div>`;
    }
}

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const container = document.getElementById('modalVideoContainer');
    const vidEl = container.querySelector('video');
    if (vidEl && vidEl.src && vidEl.src.startsWith('blob:')) {
        setTimeout(() => URL.revokeObjectURL(vidEl.src), 100);
    }

    modal.classList.remove('show');
    container.innerHTML = '';
    document.body.style.overflow = '';
}

document.getElementById('modalClose').addEventListener('click', closeVideoModal);
document.getElementById('modalOverlay').addEventListener('click', closeVideoModal);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeVideoModal();
});

// ==================== VIDEO URL HELPERS ====================

function getEmbedUrl(url) {
    if (!url) return null;

    // YouTube
    let match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;

    // Vimeo
    match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (match) return `https://player.vimeo.com/video/${match[1]}`;

    // Direct embed (already an embed URL)
    if (url.includes('embed')) return url;

    return null;
}

function getYouTubeThumbnail(url) {
    if (!url) return '';
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match) return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
    return '';
}

// ==================== ADMIN ====================

function initAdmin() {
    const hasPassword = !!getAdminPassword();
    document.getElementById('firstTimeSetup').style.display = hasPassword ? 'none' : 'block';

    // Login form
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const pw = document.getElementById('adminPassword').value;
        const stored = getAdminPassword();

        if (!stored) {
            document.getElementById('loginError').textContent = 'Önce bir şifre oluşturun.';
            return;
        }

        if (pw === stored) {
            App.isLoggedIn = true;
            document.getElementById('adminLogin').style.display = 'none';
            document.getElementById('adminDashboard').style.display = 'block';
            refreshAdminData();
            showToast('✅', 'Giriş başarılı!');
        } else {
            document.getElementById('loginError').textContent = 'Yanlış şifre!';
        }
    });

    // Setup password
    document.getElementById('setupPasswordBtn').addEventListener('click', () => {
        document.getElementById('setupModal').classList.add('show');
    });

    document.getElementById('cancelSetup').addEventListener('click', () => {
        document.getElementById('setupModal').classList.remove('show');
    });

    document.getElementById('setupForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const pw = document.getElementById('newPassword').value;
        const confirm = document.getElementById('confirmPassword').value;
        const errorEl = document.getElementById('setupError');

        if (pw.length < 3) {
            errorEl.textContent = 'Şifre en az 3 karakter olmalı.';
            return;
        }
        if (pw !== confirm) {
            errorEl.textContent = 'Şifreler eşleşmiyor!';
            return;
        }

        setAdminPassword(pw);
        document.getElementById('setupModal').classList.remove('show');
        document.getElementById('firstTimeSetup').style.display = 'none';
        showToast('🔐', 'Şifre oluşturuldu! Şimdi giriş yapabilirsiniz.');
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        App.isLoggedIn = false;
        document.getElementById('adminDashboard').style.display = 'none';
        document.getElementById('adminLogin').style.display = 'flex';
        document.getElementById('adminPassword').value = '';
        showToast('👋', 'Çıkış yapıldı.');
    });

    // Admin tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('tabContent' + capitalize(tab.dataset.tab)).classList.add('active');
        });
    });

    // Add Category
    document.getElementById('addCategoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('categoryName').value.trim();
        const desc = document.getElementById('categoryDesc').value.trim();
        const icon = document.getElementById('categoryIcon').value.trim() || '📁';
        const btn = document.querySelector('#addCategoryForm button[type="submit"]');

        if (!name) return showToast('⚠️', 'Kategori adı gerekli!');

        const categories = getCategories();
        categories.push({
            id: generateId(),
            name,
            description: desc,
            icon,
            createdAt: Date.now()
        });

        btn.disabled = true;
        btn.textContent = 'Ekleniyor...';

        await setCategories(categories);

        document.getElementById('categoryName').value = '';
        document.getElementById('categoryDesc').value = '';
        document.getElementById('categoryIcon').value = '';

        refreshAdminData();
        showToast('✅', `"${name}" kategorisi eklendi!`);
        btn.disabled = false;
        btn.textContent = 'Kategori Ekle';
    });

    // Add Video (Local File Upload via IndexedDB)
    document.getElementById('addVideoForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('addVideoBtn');
        const categoryId = document.getElementById('videoCategory').value;
        const title = document.getElementById('videoTitle').value.trim();
        const desc = document.getElementById('videoDesc').value.trim();
        const fileInput = document.getElementById('videoFile');
        const file = fileInput.files[0];
        const thumbInput = document.getElementById('videoThumbnail');
        const thumbFile = thumbInput && thumbInput.files ? thumbInput.files[0] : null;

        if (!categoryId) return showToast('⚠️', 'Bir kategori seçin!');
        if (!title) return showToast('⚠️', 'Video başlığı gerekli!');
        if (!file) return showToast('⚠️', 'Video dosyası seçmelisiniz!');

        // Check size (optional, prevent massive blocks freezing the browser completely, e.g. 500MB)
        if (file.size > 500 * 1024 * 1024) {
            return showToast('⚠️', 'Dosya çok büyük (Maks 500MB)!');
        }

        btn.disabled = true;
        btn.textContent = 'Yükleniyor... (Lütfen bekleyin)';

        const saveVideoData = async (thumbDataURL) => {
            try {
                const videoId = generateId();
                // Save blob to indexedDB
                await VideoDB.saveVideoBlob(videoId, file);

                const videos = getVideos();
                videos.push({
                    id: videoId,
                    categoryId,
                    title,
                    description: desc,
                    thumbnail: thumbDataURL || '',
                    createdAt: Date.now()
                });
                await setVideos(videos);

                document.getElementById('videoTitle').value = '';
                document.getElementById('videoDesc').value = '';
                fileInput.value = '';
                if (thumbInput) thumbInput.value = '';

                refreshAdminData();
                updateHeroStats();
                showToast('✅', `"${title}" videosu yerel hafızaya eklendi!`);
            } catch (err) {
                console.error(err);
                showToast('❌', 'Video kaydedilirken hata oluştu!');
            } finally {
                btn.disabled = false;
                btn.textContent = '+ Video Yükle';
            }
        };

        if (thumbFile) {
            if (thumbFile.size > 2 * 1024 * 1024) {
                showToast('⚠️', "Kapak görseli 2MB'dan küçük olmalıdır.");
                btn.disabled = false;
                btn.textContent = '+ Video Yükle';
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                saveVideoData(ev.target.result);
            };
            reader.readAsDataURL(thumbFile);
        } else {
            saveVideoData(null);
        }
    });

    // Add Project (CS Portfolio)
    document.getElementById('addProjectForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('projectName').value.trim();
        const desc = document.getElementById('projectDesc').value.trim();
        const icon = document.getElementById('projectIcon').value.trim();
        const techStr = document.getElementById('projectTech').value.trim();
        const github = document.getElementById('projectGithub').value.trim();
        const live = document.getElementById('projectLive').value.trim();
        const btn = document.querySelector('#addProjectForm button[type="submit"]');

        if (!name || !desc || !techStr) return showToast('⚠️', 'Gerekli alanları doldurun!');

        btn.disabled = true;
        btn.textContent = 'Ekleniyor...';

        const techs = techStr.split(',').map(t => t.trim()).filter(Boolean);

        const projects = getProjects();
        projects.push({
            id: generateId(),
            name,
            description: desc,
            icon: icon || '💻',
            technologies: techs,
            github: github || '#',
            live: live || '#',
            createdAt: Date.now()
        });
        await setProjects(projects);

        document.getElementById('projectName').value = '';
        document.getElementById('projectDesc').value = '';
        document.getElementById('projectIcon').value = '';
        document.getElementById('projectTech').value = '';
        document.getElementById('projectGithub').value = '';
        document.getElementById('projectLive').value = '';

        refreshAdminData();
        updateHeroStats();
        // Since we touched projects, we should also re-render the public grid
        renderProjects();
        showToast('✅', `"${name}" projesi eklendi!`);
        btn.disabled = false;
        btn.textContent = 'Proje Ekle';
    });

    // Settings form
    document.getElementById('settingsForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = document.getElementById('saveSettingsBtn');
        btn.disabled = true;
        btn.textContent = 'Kaydediliyor...';

        const name = document.getElementById('settingName').value.trim();
        const surname = document.getElementById('settingSurname').value.trim();
        const bio = document.getElementById('settingBio').value.trim();
        const bioEnEl = document.getElementById('settingBioEn');
        const bioEn = bioEnEl ? bioEnEl.value.trim() : '';
        const aboutText = document.getElementById('settingAboutText').value.trim();
        const aboutTextEnEl = document.getElementById('settingAboutTextEn');
        const aboutTextEn = aboutTextEnEl ? aboutTextEnEl.value.trim() : '';
        const instagram = document.getElementById('settingInstagram').value.trim();
        const linkedin = document.getElementById('settingLinkedin').value.trim();
        const github = document.getElementById('settingGithub').value.trim();
        const newPw = document.getElementById('settingPassword').value;
        const cvFileInput = document.getElementById('settingCvFile');
        const cvFile = cvFileInput && cvFileInput.files ? cvFileInput.files[0] : null;

        const processSettings = async (cvData, cvName) => {
            const settings = getSiteSettings();
            if (name !== '') settings.name = name;
            if (surname !== '') settings.surname = surname;
            if (bio !== '') settings.bio = bio;
            if (bioEn !== '') settings.bioEn = bioEn;
            settings.aboutText = aboutText;
            settings.aboutTextEn = aboutTextEn;
            settings.instagram = instagram;
            settings.linkedin = linkedin;
            settings.github = github;

            if (cvData !== undefined) {
                settings.cvData = cvData;
                settings.cvName = cvName;
            }

            await saveSiteSettings(settings);

            if (newPw && newPw.length >= 3) {
                setAdminPassword(newPw);
            }

            applySiteSettings();

            document.getElementById('settingPassword').value = '';
            if (cvFileInput) cvFileInput.value = '';

            refreshAdminData();
            showToast('💾', 'Ayarlar kydedildi!');

            btn.disabled = false;
            btn.textContent = '💾 Kaydet';
        };

        if (cvFile) {
            if (cvFile.size > 5 * 1024 * 1024) {
                showToast('⚠️', "CV dosyası 5MB'dan küçük olmalıdır.");
                btn.disabled = false;
                btn.textContent = '💾 Kaydet';
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                processSettings(ev.target.result, cvFile.name);
            };
            reader.readAsDataURL(cvFile);
        } else {
            processSettings(undefined, undefined);
        }
    });
}

function refreshAdminData() {
    if (!App.isLoggedIn) return;

    const categories = getCategories();
    const videos = getVideos();
    const projects = getProjects();

    // Category list in admin
    const adminCatList = document.getElementById('adminCategoryList');
    if (categories.length === 0) {
        adminCatList.innerHTML = '<p style="color:var(--text-muted);padding:16px;">Henüz kategori eklenmemiş.</p>';
    } else {
        adminCatList.innerHTML = categories.map(cat => {
            const catVideoCount = videos.filter(v => v.categoryId === cat.id).length;
            return `
                <div class="admin-list-item">
                    <div class="admin-item-info">
                        <span class="admin-item-icon">${cat.icon}</span>
                        <div class="admin-item-details">
                            <h4>${cat.name}</h4>
                            <p>${cat.description || 'Açıklama yok'} • ${catVideoCount} video</p>
                        </div>
                    </div>
                    <div class="admin-item-actions">
                        <button class="btn btn-danger btn-sm" onclick="deleteCategory('${cat.id}')">Sil</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Video list in admin
    const adminVidList = document.getElementById('adminVideoList');
    if (videos.length === 0) {
        adminVidList.innerHTML = '<p style="color:var(--text-muted);padding:16px;">Henüz video eklenmemiş.</p>';
    } else {
        adminVidList.innerHTML = videos.map(vid => {
            const cat = categories.find(c => c.id === vid.categoryId);
            return `
                <div class="admin-list-item">
                    <div class="admin-item-info">
                        <span class="admin-item-icon">🎥</span>
                        <div class="admin-item-details">
                            <h4>${vid.title}</h4>
                            <p>${cat ? cat.name : 'Kategori silinmiş'} • Yerel Video (${vid.id})</p>
                        </div>
                    </div>
                    <div class="admin-item-actions">
                        <button class="btn btn-primary btn-sm" onclick="editVideo('${vid.id}')">Düzenle</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteVideo('${vid.id}')">Sil</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Project list in admin
    const adminProjList = document.getElementById('adminProjectList');
    if (projects.length === 0) {
        adminProjList.innerHTML = '<p style="color:var(--text-muted);padding:16px;">Henüz proje eklenmemiş.</p>';
    } else {
        adminProjList.innerHTML = projects.map(proj => {
            return `
                <div class="admin-list-item">
                    <div class="admin-item-info">
                        <span class="admin-item-icon">${proj.icon}</span>
                        <div class="admin-item-details">
                            <h4>${proj.name}</h4>
                            <p>${proj.technologies.join(', ')}</p>
                        </div>
                    </div>
                    <div class="admin-item-actions">
                        <button type="button" class="btn btn-danger btn-sm" onclick="event.preventDefault(); event.stopPropagation(); deleteProject('${proj.id}')">Sil</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Update video category dropdown
    const select = document.getElementById('videoCategory');
    select.innerHTML = '<option value="">Kategori seçin...</option>' +
        categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');

    // Update settings fields
    const settings = getSiteSettings();
    document.getElementById('settingName').value = settings.name || '';
    document.getElementById('settingSurname').value = settings.surname || '';
    document.getElementById('settingBio').value = settings.bio || '';
    if (document.getElementById('settingBioEn')) document.getElementById('settingBioEn').value = settings.bioEn || '';
    document.getElementById('settingAboutText').value = settings.aboutText || '';
    if (document.getElementById('settingAboutTextEn')) document.getElementById('settingAboutTextEn').value = settings.aboutTextEn || '';
    document.getElementById('settingInstagram').value = settings.instagram || '';
    document.getElementById('settingLinkedin').value = settings.linkedin || '';
    document.getElementById('settingGithub').value = settings.github || '';

    const currentCvInfo = document.getElementById('currentCvInfo');
    if (currentCvInfo) {
        if (settings.cvData) {
            currentCvInfo.innerHTML = `Mevcut CV: <strong>${settings.cvName || 'Yüklü'}</strong> <a href="#" id="removeCvBtn" style="color:var(--danger); margin-left:10px;">Kaldır</a>`;
            document.getElementById('removeCvBtn').addEventListener('click', async (e) => {
                e.preventDefault();
                const updatedSettings = getSiteSettings();
                updatedSettings.cvData = '';
                updatedSettings.cvName = '';
                await saveSiteSettings(updatedSettings);
                applySiteSettings();
                refreshAdminData();
                showToast('🗑️', 'CV kaldırıldı');
            });
        } else {
            currentCvInfo.textContent = 'Şu an yüklü bir CV bulunmuyor.';
        }
    }
}

async function deleteCategory(id) {
    if (!(await askConfirm('Bu kategoriyi ve altındaki tüm videoları silmek istediğinize emin misiniz?'))) return;

    let categories = getCategories();
    categories = categories.filter(c => c.id !== id);
    await setCategories(categories);

    // Also delete associated videos
    let videos = getVideos();
    videos = videos.filter(v => v.categoryId !== id);
    await setVideos(videos);

    if (App.selectedCategory === id) {
        App.selectedCategory = null;
    }

    refreshAdminData();
    updateHeroStats();
    showToast('🗑️', 'Kategori silindi.');
}

async function deleteVideo(id) {
    if (!(await askConfirm('Bu videoyu silmek istediğinize emin misiniz?'))) return;

    let videos = getVideos();
    videos = videos.filter(v => v.id !== id);
    await setVideos(videos);

    // Attempt deleting from IndexedDB
    try {
        await VideoDB.deleteVideoBlob(id);
    } catch (err) {
        console.error("IndexedDB delete failed", err);
    }

    refreshAdminData();
    updateHeroStats();
    showToast('🗑️', 'Video silindi.');
}

window.deleteProject = async function (id) {
    try {
        console.log("Attempting to delete project ID:", id);

        if (!(await askConfirm('Bu projeyi silmek istediğinize emin misiniz?'))) return;

        let projects = getProjects();
        console.log("Projects BEFORE delete:", projects);

        // Since we explicitly seeded IDs, we can just filter by explicit string ID match.
        const originalLength = projects.length;
        projects = projects.filter(p => String(p.id) !== String(id));

        console.log("Projects AFTER delete filter:", projects);
        if (projects.length === originalLength) {
            console.warn("Delete filter failed! Could not find project ID in array:", id);
            alert("Projeyi listede bulamıyor. Sayfayı yenileyip tekrar deneyin.");
            return;
        }

        await setProjects(projects);

        refreshAdminData();
        updateHeroStats();
        renderProjects();
        showToast('🗑️', 'Proje silindi.');
    } catch (err) {
        console.error("Delete Project Error:", err);
        alert("Proje silinirken hata oluştu: " + err.message);
    }
}

window.editVideo = function (id) {
    const video = getVideos().find(v => v.id === id);
    if (!video) return;

    const modal = document.getElementById('editVideoModal');
    const categories = getCategories();
    const select = document.getElementById('editVideoCategory');

    select.innerHTML = '<option value="">Kategori seçin...</option>' +
        categories.map(c => `<option value="${c.id}" ${c.id === video.categoryId ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('');

    document.getElementById('editVideoId').value = video.id;
    document.getElementById('editVideoTitle').value = video.title;
    document.getElementById('editVideoDesc').value = video.description || '';

    modal.classList.add('show');
}

document.getElementById('cancelEditVideoBtn').addEventListener('click', () => {
    document.getElementById('editVideoModal').classList.remove('show');
});

document.getElementById('editVideoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editVideoId').value;
    const categoryId = document.getElementById('editVideoCategory').value;
    const title = document.getElementById('editVideoTitle').value.trim();
    const desc = document.getElementById('editVideoDesc').value.trim();

    if (!categoryId || !title) return showToast('⚠️', 'Gerekli alanları doldurun!');

    let videos = getVideos();
    const index = videos.findIndex(v => v.id === id);
    if (index !== -1) {
        videos[index].categoryId = categoryId;
        videos[index].title = title;
        videos[index].description = desc;
        await setVideos(videos);
        refreshAdminData();
        renderVideoCategories(); // auto update actual video grid
        showToast('✅', 'Video güncellendi!');
    }

    document.getElementById('editVideoModal').classList.remove('show');
});

// ==================== SITE SETTINGS ====================

function applySiteSettings() {
    const settings = getSiteSettings();

    // Texts
    const nameFirst = document.querySelector('.name-first');
    const nameLast = document.querySelector('.name-last');
    const heroDesc = document.getElementById('heroDescription');
    const aboutTextContent = document.getElementById('aboutTextContent');

    if (nameFirst) nameFirst.textContent = settings.name;
    if (nameLast) nameLast.textContent = settings.surname;
    if (heroDesc) heroDesc.textContent = settings.bio;
    if (aboutTextContent) aboutTextContent.textContent = settings.aboutText;

    // CV Download Button
    const downloadCvBtn = document.getElementById('downloadCvBtn');
    if (downloadCvBtn) {
        if (settings.cvData) {
            downloadCvBtn.href = settings.cvData;
            downloadCvBtn.download = settings.cvName || 'CV.pdf';
            downloadCvBtn.style.display = 'inline-flex';
        } else {
            downloadCvBtn.style.display = 'none';
        }
    }

    // Social Links
    const footerInstagram = document.getElementById('footerInstagram');
    const footerLinkedin = document.getElementById('footerLinkedin');
    const footerGithub = document.getElementById('footerGithub');

    if (footerInstagram) {
        footerInstagram.href = settings.instagram || '#';
        footerInstagram.style.display = settings.instagram ? 'inline-flex' : 'none';
    }
    if (footerLinkedin) {
        footerLinkedin.href = settings.linkedin || '#';
        footerLinkedin.style.display = settings.linkedin ? 'inline-flex' : 'none';
    }
    if (footerGithub) {
        footerGithub.href = settings.github || '#';
        footerGithub.style.display = settings.github ? 'inline-flex' : 'none';
    }

    // Call language refresh if available
    if (typeof applyTranslations === 'function') {
        applyTranslations();
    }
}

function askConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('deleteConfirmModal');
        const textEl = document.getElementById('deleteConfirmText');
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        const cancelBtn = document.getElementById('cancelDeleteBtn');

        textEl.textContent = message;
        modal.classList.add('show');

        const cleanup = () => {
            modal.classList.remove('show');
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
        };

        const onConfirm = () => { cleanup(); resolve(true); };
        const onCancel = () => { cleanup(); resolve(false); };

        confirmBtn.addEventListener('click', onConfirm);
        cancelBtn.addEventListener('click', onCancel);
    });
}

// ==================== UTILITIES ====================

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showToast(icon, message) {
    const toast = document.getElementById('toast');
    document.getElementById('toastIcon').textContent = icon;
    document.getElementById('toastMessage').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}
