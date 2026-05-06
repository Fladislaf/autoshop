document.addEventListener('error', function(event) {
        if (event.target.tagName && event.target.tagName.toLowerCase() === 'img') {
            if (event.target.dataset.fallbackApplied) return;
            event.target.dataset.fallbackApplied = true;
            event.target.src = 'https://placehold.jp/dedede/888888/800x600.png?text=Нет+фото';
        }
    }, true); 

const UI = {

    getBadgeStyle(condition) {
        switch(condition) {
            case 'new': return { text: 'Новая', color: '#00a4d6', bg: '#e6f6fb' };
            case 'contract': return { text: 'Контрактная', color: '#27ae60', bg: '#eafaf1' };
            case 'used': return { text: 'Б/У', color: '#f39c12', bg: '#fef5e7' };
            default: return { text: '—', color: '#777', bg: '#eee' };
        }
    }
};