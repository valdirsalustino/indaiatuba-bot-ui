// src/utils/mediaUtils.js

export function inferContentTypeFromUrl(mediaUrl) {
    if (!mediaUrl) return 'text';
    const url = mediaUrl.toLowerCase();
    const cleanUrl = decodeURIComponent(url.split('?')[0]);

    const imageRegex = /\.(jpg|jpeg|png|gif|webp)($|[;\s%])/;
    const videoRegex = /\.(mp4|mov|avi|webm)($|[;\s%])/;
    const audioRegex = /\.(mp3|wav|ogg|opus)($|[;\s%])/;

    if (imageRegex.test(cleanUrl)) return 'image';
    if (videoRegex.test(cleanUrl)) return 'video';
    if (audioRegex.test(cleanUrl)) return 'audio';
    return 'document';
}

export function getMediaDownloadUrl(item) {
    if (!item) return '';
    return item.download_url || item.media_url || '';
}

export function getMediaFilename(item) {
    if (!item) return 'arquivo';
    if (item.filename) return item.filename;

    const rawText = item.caption || item.text || '';
    if (typeof rawText === 'string' && rawText.toLowerCase().startsWith('orientações:')) {
        const extracted = rawText.split(':')[1]?.trim();
        if (extracted) return extracted;
    }

    if (item.media_url) {
        try {
            const cleanPath = decodeURIComponent(item.media_url.split('?')[0]);
            const parts = cleanPath.split('/').filter(Boolean);
            const lastPart = parts[parts.length - 1];
            if (lastPart) return lastPart;
        } catch {
            // Fallback below
        }
    }

    const fallbacks = {
        image: 'imagem.jpg',
        video: 'video.mp4',
        audio: 'audio.ogg',
        document: 'documento.pdf',
    };
    return fallbacks[item.content_type] || 'arquivo';
}

export function getMediaTypeMeta(contentType) {
    switch (contentType) {
        case 'image':
            return {
                label: 'Imagem',
                buttonLabel: 'Baixar Imagem',
                badgeClass: 'bg-purple-100 text-purple-800',
            };
        case 'video':
            return {
                label: 'Vídeo',
                buttonLabel: 'Baixar Vídeo',
                badgeClass: 'bg-amber-100 text-amber-800',
            };
        case 'audio':
            return {
                label: 'Áudio',
                buttonLabel: 'Baixar Áudio',
                badgeClass: 'bg-sky-100 text-sky-800',
            };
        case 'document':
        default:
            return {
                label: 'Documento',
                buttonLabel: 'Baixar Documento',
                badgeClass: 'bg-blue-100 text-blue-800',
            };
    }
}
