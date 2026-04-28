// ═══════════════════════════════════════════════════════════════
// ЛАЙТБОКС — ВЫНЕСЕН НАРУЖУ
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

let lbIndex  = 0;
let lbCards  = [];
let lbZoomed = false;

function getLbCards() {
    return Array.from(document.querySelectorAll('.photo-grid .photo-card'));
}

function lbOpen(idx) {
    lbCards  = getLbCards();
    lbIndex  = Math.max(0, Math.min(idx, lbCards.length - 1));
    lbZoomed = false;
    lbImg.classList.remove('lb-zoomed');
    lbOverlay.classList.add('lb-active');
    document.body.style.overflow = 'hidden';
    lbRender();
}

function lbClose_() {
    lbOverlay.classList.remove('lb-active');
    document.body.style.overflow = '';
    lbImg.src = '';
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
    }
}

function lbRender() {
    const card = lbCards[lbIndex];
    if (!card) return;
    
    const img = card.querySelector('img');
    const total = lbCards.length;

    lbImg.classList.add('lb-fading');
    setTimeout(() => {
        lbImg.src = img.src;
        lbImg.alt = img.alt;
        lbImg.classList.remove('lb-fading');
    }, 150);

    lbCounter.textContent = `${lbIndex + 1} / ${total}`;
    
    const name = img.alt || img.src.split('/').pop().split('?')[0];
    lbCaption.textContent = name;

    lbPrev.disabled = lbIndex === 0;
    lbNext.disabled = lbIndex === total - 1;

    lbZoomed = false;
    lbImg.classList.remove('lb-zoomed');
    lbImg.style.transform = '';
    lbImg.style.width = '';
    lbImg.style.height = '';
    lbZoomBtn.querySelector('i').className = 'fa-solid fa-magnifying-glass';
}

function lbGo(delta) {
    const next = lbIndex + delta;
    if (next < 0 || next >= lbCards.length) return;
    lbIndex = next;
    lbRender();
}

function toggleZoom() {
    lbZoomed = !lbZoomed;
    if (lbZoomed) {
        lbImg.classList.add('lb-zoomed');
        lbImg.style.width = '150%';
        lbImg.style.height = 'auto';
        lbZoomBtn.querySelector('i').className = 'fa-solid fa-magnifying-glass-minus';
        lbImgWrap.style.overflow = 'auto';
    } else {
        lbImg.classList.remove('lb-zoomed');
        lbImg.style.width = '';
        lbImg.style.height = '';
        lbZoomBtn.querySelector('i').className = 'fa-solid fa-magnifying-glass';
        lbImgWrap.style.overflow = 'hidden';
    }
}

function attachLightboxToCard(card) {
    const idx = () => getLbCards().indexOf(card);

    card.querySelector('img').addEventListener('click', (e) => {
        e.stopPropagation();
        lbOpen(idx());
    });

    const zoom = card.querySelector('.fa-magnifying-glass');
    if (zoom) {
        zoom.addEventListener('click', (e) => {
            e.stopPropagation();
            lbOpen(idx());
        });
    }
}

// Кнопки лайтбокса
lbClose.addEventListener('click', lbClose_);
lbOverlay.addEventListener('click', (e) => {
    if (e.target === lbOverlay || e.target === lbImgWrap) lbClose_();
});

lbPrev.addEventListener('click', () => lbGo(-1));
lbNext.addEventListener('click', () => lbGo(+1));

document.addEventListener('keydown', (e) => {
    if (!lbOverlay.classList.contains('lb-active')) return;
    if (e.key === 'Escape') lbClose_();
    if (e.key === 'ArrowLeft') lbGo(-1);
    if (e.key === 'ArrowRight') lbGo(+1);
});

let touchStartX = 0;
lbOverlay.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
}, { passive: true });
lbOverlay.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) lbGo(dx < 0 ? 1 : -1);
}, { passive: true });

lbDownload.addEventListener('click', async () => {
    const url = lbImg.src;
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        const oUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = oUrl;
        a.download = lbCaption.textContent || `photo_${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(oUrl);
    } catch {
        const a = document.createElement('a');
        a.href = url;
        a.download = lbCaption.textContent || `photo_${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
});

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

lbImg.addEventListener('click', () => toggleZoom());
lbZoomBtn.addEventListener('click', () => toggleZoom());

lbFullscreen.addEventListener('click', async () => {
    if (!document.fullscreenElement) {
        await lbOverlay.requestFullscreen().catch(() => {});
        lbFullscreen.querySelector('i').className = 'fa-solid fa-compress';
    } else {
        await document.exitFullscreen().catch(() => {});
        lbFullscreen.querySelector('i').className = 'fa-solid fa-expand';
    }
});

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        lbFullscreen.querySelector('i').className = 'fa-solid fa-expand';
    }
});

// ═══════════════════════════════════════════════════════════════
// ИНИЦИАЛИЗАЦИЯ ГАЛЕРЕИ
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    const photoGrid       = document.querySelector('.photo-grid');
    const fileInput       = document.getElementById('image-upload');
    const uploadBtn       = document.getElementById('upload-btn');
    const downloadAllBtn  = document.getElementById('download-all-btn');
    const favoritesBtn    = document.getElementById('favorites-btn');
    const favoritesPanel  = document.getElementById('favorites-panel');
    const closeFavBtn     = document.getElementById('close-favorites-btn');
    const favoritesGrid   = document.getElementById('favorites-grid');
    const favCountBadge   = document.getElementById('fav-count');

    const STORAGE_KEY = 'grand_palace_photos';
    const FAVORITES_KEY = 'grand_palace_favorites';

    // ИЗБРАННОЕ
    function loadFavoriteIds() {
        try {
            return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []);
        } catch { 
            return new Set(); 
        }
    }

    function saveFavoriteIds(set) {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify([...set]));
    }

    let favorites = loadFavoriteIds();

    function updateFavBadge() {
        const count = favorites.size;
        if (count > 0) {
            favCountBadge.textContent = count;
            favCountBadge.style.display = 'inline-flex';
        } else {
            favCountBadge.style.display = 'none';
        }
    }

    function applyHeartState(card) {
        const id = card.dataset.id;
        const heartBtn = card.querySelector('.heart-btn');
        if (!heartBtn) return;

        if (favorites.has(id)) {
            heartBtn.className = 'fa-solid fa-heart heart-btn favorited';
        } else {
            heartBtn.className = 'fa-regular fa-heart heart-btn';
        }
    }

    function toggleFavorite(card) {
        const id = card.dataset.id;
        if (!id) return;

        if (favorites.has(id)) {
            favorites.delete(id);
        } else {
            favorites.add(id);
        }
        saveFavoriteIds(favorites);
        applyHeartState(card);
        updateFavBadge();

        if (favoritesPanel.classList.contains('open')) {
            renderFavoritesPanel();
        }

        const heartBtn = card.querySelector('.heart-btn');
        if (heartBtn) {
            heartBtn.classList.remove('heart-pulse');
            void heartBtn.offsetWidth;
            heartBtn.classList.add('heart-pulse');
        }
    }

    function renderFavoritesPanel() {
        favoritesGrid.innerHTML = '';

        if (favorites.size === 0) {
            favoritesGrid.innerHTML = '<p class="no-favorites-msg">Вы ещё не добавили фото в избранное.<br>Нажмите ❤️ на любой карточке.</p>';
            return;
        }

        const allCards = Array.from(document.querySelectorAll('.photo-grid .photo-card'));
        const favCards = allCards.filter(c => favorites.has(c.dataset.id));

        if (favCards.length === 0) {
            favoritesGrid.innerHTML = '<p class="no-favorites-msg">Избранные фото не найдены.</p>';
            return;
        }

        favCards.forEach(card => {
            const img = card.querySelector('img');
            const clone = document.createElement('div');
            clone.className = 'fav-card';

            clone.innerHTML = `
                <img src="${img.src}" alt="${img.alt}" class="fav-img-click">
                <button class="fav-remove-btn" data-id="${card.dataset.id}" title="Убрать из избранного">
                    <i class="fa-solid fa-heart-crack"></i>
                </button>
            `;

            clone.querySelector('.fav-img-click').addEventListener('click', () => {
                const allCards = getLbCards();
                const index = allCards.indexOf(card);
                if (index !== -1) lbOpen(index);
            });

            clone.querySelector('.fav-remove-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const id = card.dataset.id;
                favorites.delete(id);
                saveFavoriteIds(favorites);
                applyHeartState(card);
                updateFavBadge();
                clone.style.transition = 'opacity 0.3s, transform 0.3s';
                clone.style.opacity = '0';
                clone.style.transform = 'scale(0.85)';
                setTimeout(() => renderFavoritesPanel(), 300);
            });

            favoritesGrid.appendChild(clone);
        });
    }

    favoritesBtn.addEventListener('click', () => {
        const isOpen = favoritesPanel.classList.toggle('open');
        if (isOpen) {
            renderFavoritesPanel();
            favoritesBtn.classList.add('active-filter');
        } else {
            favoritesBtn.classList.remove('active-filter');
        }
    });

    closeFavBtn.addEventListener('click', () => {
        favoritesPanel.classList.remove('open');
        favoritesBtn.classList.remove('active-filter');
    });

    // СОБЫТИЯ КАРТОЧЕК
    function attachCardEvents(card) {
        card.addEventListener('click', (e) => {
            if (e.target.tagName.toLowerCase() === 'i') return;
            document.querySelectorAll('.photo-card').forEach(c => c.classList.remove('active-card'));
            card.classList.add('active-card');
        });

        const heartBtn = card.querySelector('.heart-btn');
        if (heartBtn) {
            heartBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(card);
            });
        }

        const downloadIcon = card.querySelector('.single-download-btn');
        if (downloadIcon) {
            downloadIcon.addEventListener('click', async (e) => {
                e.stopPropagation();
                const originalClass = downloadIcon.className;
                downloadIcon.className = 'fa-solid fa-spinner fa-spin single-download-btn';
                const img = card.querySelector('img');
                const url = img.src;
                try {
                    const response = await fetch(url);
                    const blob = await response.blob();
                    const objectUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = objectUrl;
                    a.download = `photo_${new Date().getTime()}.jpg`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(objectUrl);
                } catch (err) {
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `photo_${new Date().getTime()}.jpg`;
                    a.target = '_blank';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                } finally {
                    downloadIcon.className = originalClass;
                }
            });
        }

        const deleteIcon = card.querySelector('.single-delete-btn');
        if (deleteIcon) {
            deleteIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                if (card.dataset.id && favorites.has(card.dataset.id)) {
                    favorites.delete(card.dataset.id);
                    saveFavoriteIds(favorites);
                    updateFavBadge();
                }
                card.style.transition = 'opacity 0.3s, transform 0.3s';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.85)';
                setTimeout(() => {
                    card.remove();
                    savePhotosToStorage();
                    if (favoritesPanel.classList.contains('open')) renderFavoritesPanel();
                }, 300);
            });
        }

        applyHeartState(card);
    }

    document.querySelectorAll('.photo-card').forEach(card => {
        attachCardEvents(card);
        attachLightboxToCard(card);
    });
    updateFavBadge();

    // СОХРАНЕНИЕ В localStorage
    function savePhotosToStorage() {
        const cards = Array.from(photoGrid.querySelectorAll('.photo-card[data-user-photo]'));
        const photos = cards.map(card => ({
            id: card.dataset.id,
            src: card.querySelector('img').src,
            alt: card.querySelector('img').alt,
        }));
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
        } catch (e) {
            console.warn('Не удалось сохранить фото в localStorage:', e);
        }
    }

    function loadPhotosFromStorage() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return;
            const photos = JSON.parse(stored);
            photos.reverse().forEach(photo => {
                addPhotoToGrid(photo.src, photo.alt, false, photo.id);
            });
        } catch (e) {
            console.warn('Ошибка загрузки фото из localStorage:', e);
        }
    }

    loadPhotosFromStorage();

    // ЗАГРУЗКА НОВЫХ ФОТО
    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (!files.length) return;
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    addPhotoToGrid(event.target.result, file.name, true);
                };
                reader.readAsDataURL(file);
            }
        });
        fileInput.value = '';
    });

    function addPhotoToGrid(src, altText = 'Загруженное фото', save = true, existingId = null) {
        const id = existingId || `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const card = document.createElement('div');
        card.className = 'photo-card';
        card.setAttribute('data-user-photo', '1');
        card.setAttribute('data-id', id);

        card.innerHTML = `
            <img src="${src}" alt="${altText}">
            <div class="overlay-icons">
                <i class="fa-solid fa-magnifying-glass"></i>
                <i class="fa-regular fa-heart heart-btn" title="В избранное"></i>
                <i class="fa-solid fa-download single-download-btn" title="Скачать фото"></i>
                <i class="fa-solid fa-trash single-delete-btn" title="Удалить фото"></i>
            </div>
        `;

        photoGrid.prepend(card);
        attachCardEvents(card);
        attachLightboxToCard(card);

        document.querySelectorAll('.photo-card').forEach(c => c.classList.remove('active-card'));
        card.classList.add('active-card');

        if (save) savePhotosToStorage();
    }

    // СКАЧАТЬ ВСЁ ZIP
    downloadAllBtn.addEventListener('click', async () => {
        const zip = new JSZip();
        const images = Array.from(document.querySelectorAll('.photo-card img'));

        if (images.length === 0) { 
            alert('Нет фотографий для скачивания'); 
            return; 
        }

        const originalText = downloadAllBtn.innerHTML;
        downloadAllBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Архивация...';
        downloadAllBtn.disabled = true;
        downloadAllBtn.style.opacity = '0.7';
        downloadAllBtn.style.cursor = 'wait';

        try {
            await Promise.all(images.map(async (img, index) => {
                try {
                    const response = await fetch(img.src);
                    const blob = await response.blob();
                    let ext = 'jpg';
                    if (blob.type === 'image/png') ext = 'png';
                    if (blob.type === 'image/webp') ext = 'webp';
                    zip.file(`gallery_photo_${index + 1}.${ext}`, blob);
                } catch(e) {
                    console.warn(`Не удалось добавить фото ${index + 1}:`, e);
                }
            }));

            if (Object.keys(zip.files).length === 0) {
                alert('Не удалось скачать демо-фотографии из-за защиты (CORS).\nВы всё ещё можете загружать и скачивать СВОИ фотографии.');
                return;
            }

            const content = await zip.generateAsync({ type: 'blob' });
            const zipUrl = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = zipUrl;
            a.download = 'Grand_Palace_Archive.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(zipUrl);

        } catch (error) {
            console.error('Ошибка при создании архива:', error);
            alert('Произошла ошибка при скачивании архива.');
        } finally {
            downloadAllBtn.innerHTML = originalText;
            downloadAllBtn.disabled = false;
            downloadAllBtn.style.opacity = '1';
            downloadAllBtn.style.cursor = 'pointer';
        }
    });

});
