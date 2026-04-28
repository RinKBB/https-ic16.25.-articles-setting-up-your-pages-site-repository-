// ═══════════════════════════════════════════════════════════════
// ЛАЙТБОКС — ПОЛНОЭКРАННЫЙ ПРОСМОТР ФОТО
// ═══════════════════════════════════════════════════════════════

const lbOverlay    = document.getElementById('lb-overlay');
const lbImg        = document.getElementById('lb-img');
const lbImgWrap    = document.getElementById('lb-img-wrap');
const lbCounter    = document.getElementById('lb-counter');
const lbCaption    = document.getElementById('lb-caption');
const lbPrev       = document.getElementById('lb-prev');
const lbNext       = document.getElementById('lb-next');
const lbClose      = document.getElementById('lb-close');
const lbDownload   = document.getElementById('lb-download');
const lbHeart      = document.getElementById('lb-heart');
const lbShare      = document.getElementById('lb-share');
const lbZoomBtn    = document.getElementById('lb-zoom');
const lbFullscreen = document.getElementById('lb-fullscreen');

let lbIndex   = 0;
let lbCards   = [];
let lbZoomed  = false;

// Собрать все карточки
function getLbCards() {
    return Array.from(document.querySelectorAll('.photo-grid .photo-card'));
}

// Открыть лайтбокс на карточке с индексом
function lbOpen(idx) {
    if (lbOverlay.classList.contains('lb-active')) return; // Уже открыт
    
    lbCards  = getLbCards();
    lbIndex  = Math.max(0, Math.min(idx, lbCards.length - 1));
    lbZoomed = false;
    
    lbImg.classList.remove('lb-zoomed');
    lbOverlay.classList.add('lb-active');
    document.body.style.overflow = 'hidden';
    
    lbRender();
}

// Закрыть лайтбокс
function lbClose_() {
    lbOverlay.classList.remove('lb-active');
    document.body.style.overflow = '';
    lbImg.src = '';
    
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
    }
}

// Отрисовать текущее фото
function lbRender() {
    const card  = lbCards[lbIndex];
    if (!card) return;
    
    const img   = card.querySelector('img');
    const total = lbCards.length;

    // Плавная смена изображения
    lbImg.classList.add('lb-fading');
    setTimeout(() => {
        lbImg.src = img.src;
        lbImg.alt = img.alt;
        lbImg.classList.remove('lb-fading');
    }, 150);

    // Счётчик
    lbCounter.textContent = `${lbIndex + 1} / ${total}`;

    // Подпись
    const name = img.alt || img.src.split('/').pop().split('?')[0];
    lbCaption.textContent = name;

    // Стрелки
    lbPrev.disabled = lbIndex === 0;
    lbNext.disabled = lbIndex === total - 1;

    // Сброс зума при смене
    lbZoomed = false;
    lbImg.classList.remove('lb-zoomed');
    lbImg.style.transform = '';
    lbImg.style.width     = '';
    lbImg.style.height    = '';
    lbZoomBtn.querySelector('i').className = 'fa-solid fa-magnifying-glass';
}

// Навигация
function lbGo(delta) {
    const next = lbIndex + delta;
    if (next < 0 || next >= lbCards.length) return;
    lbIndex = next;
    lbRender();
}

// ════════════════════════════════════════════════
// СОБЫТИЯ КНОПОК
// ════════════════════════════════════════════════

// Закрыть
lbClose.addEventListener('click', lbClose_);

// Клик по фону
lbOverlay.addEventListener('click', (e) => {
    if (e.target === lbOverlay || e.target === lbImgWrap) {
        lbClose_();
    }
});

// Стрелки
lbPrev.addEventListener('click', () => lbGo(-1));
lbNext.addEventListener('click', () => lbGo(+1));

// Клавиатура
document.addEventListener('keydown', (e) => {
    if (!lbOverlay.classList.contains('lb-active')) return;
    if (e.key === 'Escape')      lbClose_();
    if (e.key === 'ArrowLeft')   lbGo(-1);
    if (e.key === 'ArrowRight')  lbGo(+1);
});

// Свайп
let touchStartX = 0;
lbOverlay.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
}, { passive: true });
lbOverlay.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) lbGo(dx < 0 ? 1 : -1);
}, { passive: true });

// Скачать
lbDownload.addEventListener('click', async () => {
    const url = lbImg.src;
    try {
        const res  = await fetch(url);
        const blob = await res.blob();
        const oUrl = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = oUrl;
        a.download = lbCaption.textContent || `photo_${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(oUrl);
    } catch {
        const a = document.createElement('a');
        a.href     = url;
        a.download = lbCaption.textContent || `photo_${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
});

// Поделиться
lbShare.addEventListener('click', async () => {
    const url = lbImg.src;
    try {
        await navigator.clipboard.writeText(url);
        const origIcon = lbShare.querySelector('i').className;
        lbShare.querySelector('i').className = 'fa-solid fa-check';
        setTimeout(() => {
            lbShare.querySelector('i').className = origIcon;
        }, 1500);
    } catch {
        prompt('Скопируйте ссылку:', url);
    }
});

// Зум
function toggleZoom() {
    lbZoomed = !lbZoomed;
    if (lbZoomed) {
        lbImg.classList.add('lb-zoomed');
        lbImg.style.width  = '150%';
        lbImg.style.height = 'auto';
        lbZoomBtn.querySelector('i').className = 'fa-solid fa-magnifying-glass-minus';
    } else {
        lbImg.classList.remove('lb-zoomed');
        lbImg.style.width  = '';
        lbImg.style.height = '';
        lbZoomBtn.querySelector('i').className = 'fa-solid fa-magnifying-glass';
    }
}

lbImg.addEventListener('click', () => toggleZoom());
lbZoomBtn.addEventListener('click', () => toggleZoom());

// Полный экран
lbFullscreen.addEventListener('click', async () => {
    if (!document.fullscreenElement) {
        await lbOverlay.requestFullscreen().catch(() => {});
    } else {
        await document.exitFullscreen().catch(() => {});
    }
});

// ════════════════════════════════════════════════
// ИНИЦИАЛИЗАЦИЯ — ПРИВЯЗКА ЛАЙТБОКСА К КАРТОЧКАМ
// ════════════════════════════════════════════════

function attachLightboxToCard(card) {
    const idx = () => getLbCards().indexOf(card);

    // Клик по фото
    card.querySelector('img').addEventListener('click', (e) => {
        e.stopPropagation();
        lbOpen(idx());
    });

    // Клик по лупе
    const zoom = card.querySelector('.fa-magnifying-glass');
    if (zoom) {
        zoom.addEventListener('click', (e) => {
            e.stopPropagation();
            lbOpen(idx());
        });
    }
}

// Инициализируем для всех существующих карточек
document.querySelectorAll('.photo-grid .photo-card').forEach(attachLightboxToCard);

// Экспортируем функции для использования в других скриптах
window.lbOpen = lbOpen;
window.attachLightboxToCard = attachLightboxToCard;
