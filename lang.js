const translations = {
    tr: {
        pageTitle: "Portföy | Bilgisayar Mühendisi & Video Editör",
        navHome: "Ana Sayfa",
        navAbout: "Hakkımda",
        navCS: "Bilgisayar Müh.",
        navVideo: "Video Editörlüğü",
        navAdmin: "⚙️",
        heroGreeting: "Merhaba, ben",
        heroPathCSTitle: "Bilgisayar Mühendisliği",
        heroPathCSDesc: "Yazılım projeleri, kullandığım teknolojiler ve geliştirme deneyimlerim",
        heroPathVideoTitle: "Video Editörlüğü",
        heroPathVideoDesc: "Profesyonel video prodüksiyon, motion graphics ve görsel efekt çalışmalarım",
        statProjects: "Proje",
        statTech: "Teknoloji",
        statVideo: "Video",
        aboutTitle: "Hakkımda",
        aboutSubtitle: "Hikayem, yeteneklerim ve vizyonum",
        btnBack: "Geri",
        btnDownloadCV: "CV'mi İndir",
        csTitle: "Bilgisayar Mühendisliği",
        csSubtitle: "Geliştirdiğim projeler ve kullandığım teknolojiler",
        videoTitle: "Video Editörlüğü",
        videoSubtitle: "Profesyonel video prodüksiyon çalışmalarım",
        catTitle: "Kategoriler",
        catSelect: "Bir kategori seçin",
        catEmpty: "Sol taraftan bir kategori seçerek başlayın",
        adminLoginTitle: "Admin Girişi",
        adminLoginDesc: "Devam etmek için şifrenizi girin",
        adminBtnLogin: "Giriş Yap",
        adminFirstTime: "İlk kez mi giriş yapıyorsunuz?",
        adminBtnSetup: "Şifre Oluştur",
        adminSetupTitle: "Şifre Oluştur",
        adminSetupDesc: "Admin paneliniz için bir şifre belirleyin",
        adminBtnCancel: "İptal",
        adminBtnCreate: "Oluştur",
        footerCopyright: "Tüm Hakları Saklıdır.",
        defaultBio: "Bilgisayar Mühendisliği ve Video Editörlüğü alanlarında çalışan bir profesyonel.\n                Yazılım geliştirme ve görsel hikaye anlatıcılığı tutkumu birleştirerek,\n                teknoloji ile yaratıcılığın kesiştiği noktada projeler üretiyorum.",
        defaultBioClean: "Bilgisayar Mühendisliği ve Video Editörlüğü alanlarında çalışan bir profesyonel. Yazılım geliştirme ve görsel hikaye anlatıcılığı tutkumu birleştirerek, teknoloji ile yaratıcılığın kesiştiği noktada projeler üretiyorum.",
        defaultAbout: "Buraya kendiniz hakkında daha detaylı bir şeyler yazabilirsiniz."
    },
    en: {
        pageTitle: "Portfolio | Computer Engineer & Video Editor",
        navHome: "Home",
        navAbout: "About Me",
        navCS: "Computer Eng.",
        navVideo: "Video Editing",
        navAdmin: "⚙️",
        heroGreeting: "Hi, I am",
        heroPathCSTitle: "Computer Engineering",
        heroPathCSDesc: "Software projects, technologies I use, and development experiences",
        heroPathVideoTitle: "Video Editing",
        heroPathVideoDesc: "Professional video production, motion graphics, and visual effects works",
        statProjects: "Projects",
        statTech: "Technologies",
        statVideo: "Videos",
        aboutTitle: "About Me",
        aboutSubtitle: "My story, skills, and vision",
        btnBack: "Back",
        btnDownloadCV: "Download CV",
        csTitle: "Computer Engineering",
        csSubtitle: "Projects I developed and technologies I use",
        videoTitle: "Video Editing",
        videoSubtitle: "My professional video production works",
        catTitle: "Categories",
        catSelect: "Select a category",
        catEmpty: "Start by selecting a category from the left",
        adminLoginTitle: "Admin Login",
        adminLoginDesc: "Enter your password to continue",
        adminBtnLogin: "Login",
        adminFirstTime: "First time logging in?",
        adminBtnSetup: "Create Password",
        adminSetupTitle: "Create Password",
        adminSetupDesc: "Set a password for your admin panel",
        adminBtnCancel: "Cancel",
        adminBtnCreate: "Create",
        footerCopyright: "All Rights Reserved.",
        defaultBio: "A professional working in Computer Engineering and Video Editing. Combining my passion for software development and visual storytelling, I create projects at the intersection of technology and creativity.",
        defaultBioClean: "A professional working in Computer Engineering and Video Editing. Combining my passion for software development and visual storytelling, I create projects at the intersection of technology and creativity.",
        defaultAbout: "You can write something more detailed about yourself here."
    }
};

let currentLang = localStorage.getItem('portfolio_lang') || 'tr';

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('portfolio_lang', lang);
    applyTranslations();
    updateLanguageButtons();

    if (window.App) {
        if (lang === 'en') {
            window.App.typingTexts = [
                'Computer Engineer',
                'Video Editor',
                'Full-Stack Developer',
                'Content Creator'
            ];
        } else {
            window.App.typingTexts = [
                'Bilgisayar Mühendisi',
                'Video Editör',
                'Full-Stack Developer',
                'Content Creator'
            ];
        }

        const el = document.getElementById('heroTitle');
        if (el) {
            el.textContent = '';
            window.App.typingCharIndex = 0;
            window.App.typingDirection = 'forward';
        }
    }
}

function normalizeSpaces(str) {
    return str.replace(/\s+/g, ' ').trim();
}

function applyTranslations() {
    const dict = translations[currentLang];

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            if (el.tagName === 'INPUT' && el.type === 'placeholder') {
                el.placeholder = dict[key];
            } else if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') {
                // If it contains an SVG, we only want to replace the text nodes or specifically wrap text in a span.
                // In our implementation, we used innerHTML for plain spans, and for buttons we wrapped the text in <span data-i18n>
                el.innerHTML = dict[key];
            }
        }
    });

    const settings = typeof getSiteSettings === 'function' ? getSiteSettings() : null;

    const heroDesc = document.getElementById('heroDescription');
    if (heroDesc) {
        if (settings) {
            heroDesc.textContent = currentLang === 'en' ? (settings.bioEn || settings.bio) : settings.bio;
        } else {
            const currentBio = normalizeSpaces(heroDesc.textContent);
            if (currentBio === translations['tr'].defaultBioClean || currentBio === translations['en'].defaultBioClean) {
                heroDesc.textContent = dict.defaultBioClean;
            }
        }
    }

    const aboutText = document.getElementById('aboutTextContent');
    if (aboutText) {
        if (settings) {
            aboutText.textContent = currentLang === 'en' ? (settings.aboutTextEn || settings.aboutText) : settings.aboutText;
        } else {
            const currentAbout = normalizeSpaces(aboutText.textContent);
            if (currentAbout === translations['tr'].defaultAbout || currentAbout === translations['en'].defaultAbout) {
                aboutText.textContent = dict.defaultAbout;
            }
        }
    }
}

function updateLanguageButtons() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-lang') === currentLang) {
            btn.classList.add('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        applyTranslations();
        updateLanguageButtons();
    }, 150);

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = e.currentTarget.getAttribute('data-lang');
            if (lang) {
                setLanguage(lang);
            }
        });
    });
});
