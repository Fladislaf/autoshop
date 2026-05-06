

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('statusForm');
    const input = document.getElementById('orderIdInput');
    const btn = document.getElementById('checkBtn');
    const resultBlock = document.getElementById('resultBlock');

    if (!form) return;

    let isSearching = false;


    async function findOrder(shortId) {
        const orders = await API.getOrders();
        return orders.find(o => o.id.toLowerCase().startsWith(shortId.toLowerCase()));
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        

        if (isSearching) return; 
        
        const shortId = input.value.trim().toLowerCase();
        if (!shortId) return;

        isSearching = true;


        btn.disabled = true;
        btn.textContent = 'Поиск...';
        resultBlock.style.display = 'none';


        const existingError = document.getElementById('orderNotFoundError');
        if (existingError) existingError.style.display = 'none';


        const order = await findOrder(shortId);


        btn.disabled = false;
        btn.textContent = 'Проверить';
        isSearching = false;

        if (!order) {

            let errorBox = document.getElementById('orderNotFoundError');
            if (!errorBox) {
                errorBox = document.createElement('div');
                errorBox.id = 'orderNotFoundError';
                errorBox.style = 'margin-top: 20px; padding: 15px; background: #f8d7da; color: #721c24; border-radius: 6px; border: 1px solid #f5c6cb;';
                form.after(errorBox);
            }
            errorBox.innerHTML = `Заказ с номером <strong>#${shortId.toUpperCase()}</strong> не найден. <br>Пожалуйста, проверьте правильность ввода.`;
            errorBox.style.display = 'block';
            return;
        }


        

        document.getElementById('resOrderId').textContent = order.id.split('-')[0].toUpperCase();
        

        const dateObj = new Date(order.created_at);
        document.getElementById('resOrderDate').textContent = dateObj.toLocaleDateString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });


        document.getElementById('resOrderTotal').textContent = order.total_price.toLocaleString();


        const trackingBlock = document.getElementById('trackingBlock');
        if (trackingBlock) {
            if (order.delivery_type === 'transport' && order.tracking_code) {
                document.getElementById('resTrackingCode').textContent = order.tracking_code;
                trackingBlock.style.display = 'block';
            } else {
                trackingBlock.style.display = 'none';
            }
        }


        const dbStatus = (order.status || 'Ожидает').trim(); 
        
        const statusMap = {
            'Ожидает': { text: 'Новый (Ожидает обработки)', class: 'status-new' },
            'В обработке': { text: 'Собирается на складе', class: 'status-processing' },
            'Готов к выдаче': { text: 'Готов к выдаче (Ждет вас)', class: 'status-ready' },
            'Отправлен': { text: 'Отправлен покупателю', class: 'status-sent' },
            'Выполнен': { text: 'Выполнен (Получен)', class: 'status-completed' },
            'Отменен': { text: 'Отменен', class: 'status-cancelled' }
        };

        const statusObj = statusMap[dbStatus] || { text: dbStatus, class: 'status-completed' };
        
        const statusBadge = document.getElementById('resOrderStatus');
        statusBadge.textContent = statusObj.text;
        statusBadge.className = `status-badge ${statusObj.class}`;


        resultBlock.style.display = 'block';
    });


    const urlParams = new URLSearchParams(window.location.search);
    const orderIdFromUrl = urlParams.get('id');
    
    if (orderIdFromUrl && orderIdFromUrl.trim() !== '') {
        input.value = orderIdFromUrl.trim();
        setTimeout(() => {
            btn.click();
        }, 100);
    }
});