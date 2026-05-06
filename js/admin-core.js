

const AdminApp = {


    async init() {

        const isAuthenticated = await API.checkAuth();

        if (!isAuthenticated) {

            document.getElementById('login-screen').style.display = 'flex';
            document.getElementById('admin-layout').style.display = 'none';
            return;
        }


        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-layout').style.display = 'flex';

        this.bindNavigation();
        this.bindMobileMenu();
        this.loadPage('orders');
    },


    async handleLogin(event) {
        event.preventDefault();

        const btn = document.getElementById('login-btn');
        const errorDiv = document.getElementById('login-error');
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;

        btn.disabled = true;
        btn.textContent = 'Проверка...';
        errorDiv.style.display = 'none';


        const response = await API.login(email, pass);

        if (response.success) {

            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';
            this.init();
        } else {

            errorDiv.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Войти';
        }
    },


    async handleLogout(event) {
        if (event) event.preventDefault();

        if (confirm('Вы точно хотите выйти из панели управления?')) {
            await API.logout();
            window.location.reload();
        }
    },


    bindMobileMenu() {
        const btn = document.getElementById('mobileMenuBtn');
        const sidebar = document.querySelector('.admin-sidebar');
        const overlay = document.getElementById('adminOverlay');

        if (btn && sidebar && overlay) {

            btn.addEventListener('click', () => {
                sidebar.classList.add('is-open');
                overlay.classList.add('is-visible');
            });


            overlay.addEventListener('click', () => {
                sidebar.classList.remove('is-open');
                overlay.classList.remove('is-visible');
            });
        }
    },


    bindNavigation() {
        const links = document.querySelectorAll('.admin-nav__link[data-page]');
        const sidebar = document.querySelector('.admin-sidebar');
        const overlay = document.getElementById('adminOverlay');

        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();

                links.forEach(l => l.classList.remove('is-active'));
                e.target.classList.add('is-active');

                const page = e.target.getAttribute('data-page');
                const title = e.target.textContent.replace(/[^\а-яА-Яa-zA-Z\s]/g, '').trim();
                document.getElementById('admin-page-title').textContent = title;


                if (sidebar.classList.contains('is-open')) {
                    sidebar.classList.remove('is-open');
                    overlay.classList.remove('is-visible');
                }

                this.loadPage(page);
            });
        });
    },




    async loadPage(page) {
        const contentDiv = document.getElementById('admin-content');
        contentDiv.innerHTML = '<div style="padding: 20px; color: #666;">Загрузка данных...</div>';

        if (page === 'orders') {
            await this.renderOrders();
        } else if (page === 'dicts') {
            await this.renderDicts();
        } else if (page === 'parts') {
            await this.renderParts();
        } else if (page === 'wheels') {
            await this.renderWheels();
        } else if (page === 'guide') {

            this.renderGuide();
        }
    },








    async renderOrders() {
        const contentDiv = document.getElementById('admin-content');
        contentDiv.innerHTML = '<div style="padding: 20px;">Загрузка заказов...</div>';

        const orders = await API.getOrders();

        AdminApp.currentOrders = orders;

        let html = `
            <div class="admin-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0;">📦 Управление заказами <span style="color: #bdc3c7; font-size: 14px; font-weight: normal;">(${orders.length})</span></h2>
                </div>

                <input type="text" onkeyup="AdminApp.filterTable(this, 'tbody-orders')" placeholder="🔍 Быстрый поиск по ID, имени, телефону, email..." style="width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; background: #f9f9f9;">

                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="border-bottom: 2px solid #eee;">
                            <th style="padding: 12px; color: #666;">ID / Дата</th>
                            <th style="padding: 12px; color: #666;">Клиент / Контакты</th>
                            <th style="padding: 12px; color: #666;">Доставка</th>
                            <th style="padding: 12px; color: #666;">Сумма</th>
                            <th style="padding: 12px; color: #666;">Статус</th>
                            <th style="padding: 12px; color: #666; text-align: center;">Действия</th>
                        </tr>
                    </thead>
                    <tbody id="tbody-orders">
                        ${orders.map(order => {
            const date = new Date(order.created_at);
            const dateStr = date.toLocaleDateString('ru-RU') + ', ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            const shortId = order.id ? order.id.split('-')[0].toUpperCase() : 'Н/Д';

            let statusColor = '#f39c12';
            if (order.status === 'Выполнен') statusColor = '#27ae60';
            if (order.status === 'Отменен') statusColor = '#e74c3c';
            if (order.status === 'Отправлен') statusColor = '#3498db';
            if (order.status === 'Готов к выдаче') statusColor = '#9b59b6';

            const clientName = order.customer_name || order.name || order.full_name || '—';
            const clientPhone = order.customer_phone || order.phone || '—';
            const clientEmail = order.customer_email || order.email || 'Нет email';

            const hasComment = order.comment && order.comment !== '—' && order.comment.trim() !== '';
            const commentIcon = hasComment ? `<span title="Есть комментарий (см. Детали)" style="margin-left: 5px; cursor: help; font-size: 16px;">💬</span>` : '';

            let deliveryHtml = order.delivery_type === 'pickup'
                ? `<span style="color: #27ae60; font-weight: bold;">📦 Самовывоз</span>`
                : `<span style="color: #e67e22; font-weight: bold;">🚚 Доставка ТК</span>${order.city ? `<br><span style="font-size: 13px; color: #7f8c8d;">г. ${order.city}</span>` : ''}`;

            return `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 12px;">
                                        <strong style="font-size: 16px;">#${shortId}</strong><br>
                                        <span style="color: #888; font-size: 13px;">${dateStr}</span>
                                    </td>
                                    <td style="padding: 12px;">
                                        <strong>${clientName}</strong>${commentIcon}<br>
                                        ${clientPhone}<br>
                                        <span style="color: #00a4d6; font-size: 13px;">${clientEmail}</span>
                                    </td>
                                    <td style="padding: 12px; vertical-align: top;">
                                        ${deliveryHtml}
                                    </td>
                                    <td style="padding: 12px; font-size: 16px;"><strong>${(order.total_price || order.total || 0).toLocaleString()} ₽</strong></td>
                                    <td style="padding: 12px;">
                                        <select onchange="AdminApp.handleStatusChange('${order.id}', this.value)" style="padding: 8px; border-radius: 4px; border: 2px solid ${statusColor}; color: ${statusColor}; font-weight: bold; background: #fff; cursor: pointer; outline: none;">
                                            <option value="Ожидает" ${order.status === 'Ожидает' ? 'selected' : ''}>⏳ Ожидает</option>
                                            <option value="В обработке" ${order.status === 'В обработке' ? 'selected' : ''}>⚙️ В обработке</option>
                                            <option value="Готов к выдаче" ${order.status === 'Готов к выдаче' ? 'selected' : ''}>🏪 Готов к выдаче</option>
                                            <option value="Отправлен" ${order.status === 'Отправлен' ? 'selected' : ''}>🚚 Отправлен</option>
                                            <option value="Выполнен" ${order.status === 'Выполнен' ? 'selected' : ''}>✅ Выполнен</option>
                                            <option value="Отменен" ${order.status === 'Отменен' ? 'selected' : ''}>❌ Отменен</option>
                                        </select>
                                    </td>
                                    <td style="padding: 12px;">
                                        <div style="display: flex; gap: 8px; justify-content: center;">
                                            <button onclick="AdminApp.showOrderDetails('${order.id}')" style="padding: 8px 12px; background: #34495e; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: bold;">📄 Детали</button>
                                            <button onclick="AdminApp.handleDeleteOrder('${order.id}')" style="padding: 8px 12px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: bold;" title="Удалить заказ">✖</button>
                                        </div>
                                    </td>
                                </tr>
                            `;
        }).join('')}
                        ${orders.length === 0 ? '<tr><td colspan="6" style="padding: 20px; text-align: center; color: #888;">Заказов пока нет</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        `;
        contentDiv.innerHTML = html;
    },


    async handleStatusChange(id, newStatus) {
        const success = await API.updateOrderStatus(id, newStatus);
        if (success) {
            this.renderOrders();
        } else {
            alert('Ошибка при обновлении статуса.');
        }
    },


    async handleDeleteOrder(id) {
        if (!confirm('ВНИМАНИЕ! Вы точно хотите удалить этот заказ? Это действие нельзя отменить.')) return;
        const success = await API.deleteOrder(id);
        if (success) {
            this.renderOrders();
        } else {
            alert('Ошибка при удалении заказа.');
        }
    },








    async showOrderDetails(orderId) {

        const order = AdminApp.currentOrders.find(o => o.id === orderId);
        if (!order) return alert('Ошибка: заказ не найден в памяти!');

        const shortId = order.id.split('-')[0].toUpperCase();

        const oldModal = document.getElementById('order-modal');
        if (oldModal) oldModal.remove();

        const clientName = order.customer_name || order.name || order.full_name || '—';
        const address = order.delivery_address || order.address || '';
        const comment = order.comment || order.notes || 'Нет комментария';


        const modalHtml = `
            <div id="order-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 9999; display: flex; justify-content: center; align-items: center; padding: 20px; box-sizing: border-box;">
                <div style="background: #fff; border-radius: 8px; width: 100%; max-width: 800px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid #eee;">
                        <h3 style="margin: 0; font-size: 20px;">📄 Детали заказа #${shortId}</h3>
                        <button onclick="document.getElementById('order-modal').remove()" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #888;">&times;</button>
                    </div>
                    
                    <div style="padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px;">
                        
                        <!-- ВЕРХНИЙ БЛОК: Инфа и Доставка -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border: 1px solid #eee; display: flex; flex-direction: column;">
                                <h4 style="margin: 0 0 10px 0; color: #2c3e50;">👤 Клиент</h4>
                                <p style="margin: 0 0 5px 0; font-size: 15px;"><strong>Имя:</strong> ${clientName}</p>
                                <p style="margin: 0 0 5px 0; font-size: 15px;"><strong>Телефон:</strong> ${order.phone || '—'}</p>
                                <p style="margin: 0 0 15px 0; font-size: 15px;"><strong>Email:</strong> ${order.email || '—'}</p>

                                <h4 style="margin: 0 0 10px 0; color: #2c3e50;">💬 Комментарий покупателя</h4>
                                <div style="font-size: 14px; color: #333; background: #fff; padding: 15px; border: 1px solid #dcdde1; border-radius: 6px; min-height: 100px; max-height: 250px; overflow-y: auto; overflow-x: hidden; white-space: pre-wrap; word-break: break-all; overflow-wrap: break-word; line-height: 1.5; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); width: 100%; box-sizing: border-box;">${comment}</div>
                            </div>

                            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border: 1px solid #eee;">
                                <h4 style="margin: 0 0 10px 0; color: #2c3e50;">🚚 Доставка</h4>
                                <p style="margin: 0 0 5px 0;"><strong>Тип:</strong> ${order.delivery_type === 'pickup' ? 'Самовывоз' : 'Транспортная компания'}</p>
                                ${order.city ? `<p style="margin: 0 0 5px 0;"><strong>Город:</strong> ${order.city}</p>` : ''}
                                ${address ? `<p style="margin: 0 0 5px 0;"><strong>Адрес:</strong> ${address}</p>` : ''}

                                ${order.delivery_type === 'transport' ? `
                                    <hr style="border: 0; border-top: 1px solid #ddd; margin: 12px 0;">
                                    <h4 style="margin: 0 0 8px 0; color: #2c3e50;">Трек-номер ТК</h4>
                                    <div style="display: flex; gap: 8px;">
                                        <input type="text" id="modal-track-${order.id}" value="${order.tracking_code || ''}" placeholder="Номер для отслеживания" style="flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                                        <button onclick="AdminApp.saveTrackingFromModal('${order.id}')" style="padding: 8px 15px; background: #e67e22; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Сохранить</button>
                                    </div>
                                ` : ''}
                            </div>
                        </div>

                        <!-- НИЖНИЙ БЛОК: Состав заказа (таблица) -->
                        <div>
                            <h4 style="margin: 0 0 10px 0; color: #2c3e50;">📦 Состав заказа</h4>
                            <div id="order-modal-items">
                                <div style="text-align: center; color: #888; padding: 20px;">Загрузка товаров...</div>
                            </div>
                        </div>

                    </div>
                    
                    <div style="padding: 15px 20px; border-top: 1px solid #eee; text-align: right; background: #f9f9f9; border-radius: 0 0 8px 8px;">
                        <button onclick="document.getElementById('order-modal').remove()" style="padding: 10px 20px; background: #34495e; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Закрыть</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);


        const items = await API.getOrderItems(orderId);
        const contentDiv = document.getElementById('order-modal-items');

        if (!items || items.length === 0) {
            contentDiv.innerHTML = '<div style="color: #e74c3c; text-align: center; padding: 20px 0; border: 1px dashed #ccc; border-radius: 4px;">Товары не найдены в БД.</div>';
            return;
        }

        let totalSum = 0;
        let tableHtml = `
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr style="border-bottom: 2px solid #ddd;">
                        <th style="padding: 10px; color: #666;">Наименование товара</th>
                        <th style="padding: 10px; color: #666; text-align: right;">Цена</th>
                    </tr>
                </thead>
                <tbody>
        `;

        items.forEach(item => {
            const price = item.price || item.unit_price || 0;
            totalSum += price;
            const name = item.product_name || item.name || item.title || ('Товар (ID: ' + (item.product_id || item.part_id || item.id) + ')');

            let productLink = '#';
            if (item.part_id) productLink = `product.html?id=${item.part_id}`;
            else if (item.tire_id) productLink = `product.html?id=${item.tire_id}&type=tire`;
            else if (item.wheel_id) productLink = `product.html?id=${item.wheel_id}&type=wheel`;

            const itemSku = item.sku || item.parts?.sku || item.tires?.sku || item.wheels?.sku || 'Без артикула';
            const nameDisplay = productLink !== '#'
                ? `<a href="${productLink}" target="_blank" style="color: #00a4d6; text-decoration: none; font-weight: bold;">${name} 🔗</a>`
                : `<strong>${name}</strong>`;

            tableHtml += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px;">
                        <div style="margin-bottom: 4px;">${nameDisplay}</div>
                        <span style="background: #f1f2f6; color: #576574; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-family: monospace;">SKU: ${itemSku}</span>
                    </td>
                    <td style="padding: 10px; text-align: right; font-weight: bold; vertical-align: top;">${price.toLocaleString()} ₽</td>
                </tr>
            `;
        });

        tableHtml += `
                </tbody>
            </table>
            <div style="margin-top: 15px; text-align: right; font-size: 16px;">
                Итого к оплате: <strong style="font-size: 22px; color: #27ae60;">${totalSum.toLocaleString()} ₽</strong>
            </div>
        `;

        contentDiv.innerHTML = tableHtml;
    },


    async saveTrackingFromModal(orderId) {
        const input = document.getElementById(`modal-track-${orderId}`);
        const trackingCode = input.value.trim();
        const btn = input.nextElementSibling;

        const oldText = btn.textContent;
        btn.disabled = true;
        btn.textContent = '⏳';

        const success = await API.updateOrderTracking(orderId, trackingCode);

        btn.disabled = false;
        btn.textContent = oldText;

        if (success) {

            const order = AdminApp.currentOrders.find(o => o.id === orderId);
            if (order) order.tracking_code = trackingCode;

            input.style.borderColor = '#27ae60';
            input.style.backgroundColor = '#e8f8f5';
            setTimeout(() => {
                input.style.borderColor = '#ccc';
                input.style.backgroundColor = '#fff';
            }, 1500);
        } else {
            alert('Ошибка при сохранении трек-номера.');
        }
    },


    async changeOrderStatus(orderId, newStatus) {
        const success = await API.updateOrderStatus(orderId, newStatus);
        if (success) {
            alert('Статус заказа успешно обновлен!');
        } else {
            alert('Ошибка при обновлении статуса.');
            this.loadPage('orders');
        }
    },




    async renderDicts() {
        const contentDiv = document.getElementById('admin-content');
        contentDiv.innerHTML = '<div style="padding: 20px;">Загрузка справочников...</div>';

        try {

            const [categories, brands, models, gens, engines] = await Promise.all([
                API.getCategories(),
                API.getBrands(),
                API.getAllModels(),
                API.getAllGenerations(),
                API.getAllEngines()
            ]);

            let html = `<div style="display: flex; flex-direction: column; gap: 20px;">`;


            html += this.buildDictCard('Категории запчастей', 'cat', categories,
                ['Название', 'Действия'],
                (c) => `<td style="padding: 12px;"><strong>${c.name}</strong></td>
                        <td style="padding: 12px;"><button onclick="AdminApp.handleDeleteCategory('${c.id}')" style="color: #e74c3c; background:none; border:none; cursor:pointer; font-weight:bold;">🗑️ Удал.</button></td>`
            );

            html += this.buildDictCard('Марки авто', 'brand', brands,
                ['Название', 'Действия'],
                (b) => `<td style="padding: 12px;"><strong>${b.name}</strong></td>
                        <td style="padding: 12px;"><button onclick="AdminApp.handleDeleteBrand('${b.id}')" style="color: #e74c3c; background:none; border:none; cursor:pointer; font-weight:bold;">🗑️ Удал.</button></td>`
            );

            html += this.buildDictCard('Модели авто', 'model', models,
                ['Модель', 'Привязка к Марке', 'Действия'],
                (m) => `<td style="padding: 12px;"><strong>${m.name}</strong></td>
                        <td style="padding: 12px;">${m.brands?.name || '—'}</td>
                        <td style="padding: 12px;"><button onclick="AdminApp.handleDeleteModel('${m.id}')" style="color: #e74c3c; background:none; border:none; cursor:pointer; font-weight:bold;">🗑️ Удал.</button></td>`
            );

            html += this.buildDictCard('Поколения', 'gen', gens,
                ['Поколение (Годы)', 'Привязка к Модели', 'Действия'],
                (g) => `<td style="padding: 12px;"><strong>${g.name}</strong> <span style="color:#888; font-size:13px;">(${g.years || ''})</span></td>
                        <td style="padding: 12px;">${g.models?.brands?.name || ''} ${g.models?.name || '—'}</td>
                        <td style="padding: 12px;"><button onclick="AdminApp.handleDeleteGen('${g.id}')" style="color: #e74c3c; background:none; border:none; cursor:pointer; font-weight:bold;">🗑️ Удал.</button></td>`
            );

            html += this.buildDictCard('Двигатели', 'engine', engines,
                ['Двигатель', 'Объем / Топливо', 'Действия'],
                (e) => `<td style="padding: 12px;"><strong>${e.name}</strong></td>
                        <td style="padding: 12px;">${e.volume ? e.volume + ' л.' : '—'} / ${e.fuel_type || '—'}</td>
                        <td style="padding: 12px;"><button onclick="AdminApp.handleDeleteEngine('${e.id}')" style="color: #e74c3c; background:none; border:none; cursor:pointer; font-weight:bold;">🗑️ Удал.</button></td>`
            );

            html += `</div>`;
            contentDiv.innerHTML = html;
        } catch (error) {
            console.error(error);
            contentDiv.innerHTML = '<div style="padding: 20px; color: red;">Ошибка загрузки справочников.</div>';
        }
    },




    buildDictCard(title, idPrefix, dataArray, columns, rowRenderer) {
        return `
            <div class="admin-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none;" onclick="AdminApp.toggleSection('${idPrefix}-container', '${idPrefix}-arrow')">
                        <span id="${idPrefix}-arrow" style="font-size: 16px; transition: transform 0.3s; transform: rotate(0deg); color: #7f8c8d;">▼</span>
                        <h2 style="margin: 0; font-size: 20px;">${title} <span style="color: #bdc3c7; font-size: 14px; font-weight: normal;">(${dataArray.length})</span></h2>
                    </div>
                    <button onclick="AdminApp.showDictModal('${idPrefix}')" style="padding: 8px 15px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 14px; white-space: nowrap;">+ Добавить</button>
                </div>
                
                <div id="${idPrefix}-container" style="display: block;">
                    <input type="text" onkeyup="AdminApp.filterTable(this, 'tbody-${idPrefix}')" placeholder="🔍 Быстрый поиск..." style="width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; background: #f9f9f9;">
                    
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="border-bottom: 2px solid #eee;">
                                ${columns.map(c => `<th style="padding: 12px; color: #666;">${c}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody id="tbody-${idPrefix}">
                            ${dataArray.map(item => `<tr style="border-bottom: 1px solid #eee;">${rowRenderer(item)}</tr>`).join('')}
                            ${dataArray.length === 0 ? `<tr><td colspan="${columns.length}" style="padding: 15px; text-align: center; color: #888;">Нет данных</td></tr>` : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },


    filterTable(input, tbodyId) {
        const filter = input.value.toLowerCase();
        const tbody = document.getElementById(tbodyId);
        const rows = tbody.getElementsByTagName('tr');

        for (let i = 0; i < rows.length; i++) {
            const text = rows[i].textContent.toLowerCase();

            if (text.indexOf(filter) > -1) {
                rows[i].style.display = "";
            } else {
                rows[i].style.display = "none";
            }
        }
    },


    async showDictModal(type) {

        const oldModal = document.getElementById('dict-modal');
        if (oldModal) oldModal.remove();


        const modalHtml = `
            <div id="dict-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; justify-content: center; align-items: center; padding: 20px; box-sizing: border-box;">
                <div style="background: #fff; border-radius: 8px; width: 100%; max-width: 500px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 id="dict-modal-title" style="margin: 0; font-size: 20px;">Добавление</h3>
                        <button onclick="document.getElementById('dict-modal').remove()" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #888;">&times;</button>
                    </div>
                    <form id="dict-modal-form" onsubmit="AdminApp.handleDictSubmit(event, '${type}')" style="display: flex; flex-direction: column; gap: 15px;">
                        <div id="dict-modal-content">Загрузка полей...</div>
                        
                        <div style="text-align: right; margin-top: 10px; border-top: 1px solid #eee; padding-top: 15px;">
                            <button type="button" onclick="document.getElementById('dict-modal').remove()" style="padding: 10px 15px; background: #ecf0f1; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; font-weight: bold; color: #333;">Отмена</button>
                            <button type="submit" id="dict-btn-save" style="padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Сохранить в базу</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const contentDiv = document.getElementById('dict-modal-content');
        const titleEl = document.getElementById('dict-modal-title');


        if (type === 'cat') {
            titleEl.textContent = '➕ Новая категория';
            contentDiv.innerHTML = `
                <label style="font-weight: bold;">Название категории *</label>
                <input type="text" id="dict-name" required placeholder="Например: Трансмиссия" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
            `;
        } else if (type === 'brand') {
            titleEl.textContent = '➕ Новая марка авто';
            contentDiv.innerHTML = `
                <label style="font-weight: bold;">Название марки *</label>
                <input type="text" id="dict-name" required placeholder="Например: Toyota" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
            `;
        } else if (type === 'model') {
            titleEl.textContent = '➕ Новая модель';
            const brands = await API.getBrands();
            contentDiv.innerHTML = `
                <label style="font-weight: bold;">Выберите марку *</label>
                <select id="dict-parent-id" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; margin-bottom: 15px;">
                    <option value="">-- Марка --</option>
                    ${brands.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
                </select>
                <label style="font-weight: bold;">Название модели *</label>
                <input type="text" id="dict-name" required placeholder="Например: Camry" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
            `;
        } else if (type === 'gen') {
            titleEl.textContent = '➕ Новое поколение';
            const brands = await API.getBrands();
            contentDiv.innerHTML = `
                <label style="font-weight: bold;">Марка *</label>
                <select onchange="AdminApp.loadModalModels(this.value)" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; margin-bottom: 15px;">
                    <option value="">-- Выберите марку --</option>
                    ${brands.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
                </select>
                <label style="font-weight: bold;">Модель *</label>
                <select id="dict-parent-id" disabled required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; margin-bottom: 15px; background: #f9f9f9;">
                    <option value="">Сначала выберите марку</option>
                </select>
                <label style="font-weight: bold;">Поколение (Название/Кузов) *</label>
                <input type="text" id="dict-name" required placeholder="Например: XV40" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; margin-bottom: 15px;">
                <label style="font-weight: bold;">Годы выпуска (опционально)</label>
                <input type="text" id="dict-years" placeholder="Например: 2006-2011" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
            `;
        } else if (type === 'engine') {
            titleEl.textContent = '➕ Новый двигатель';
            contentDiv.innerHTML = `
                <label style="font-weight: bold;">Маркировка двигателя *</label>
                <input type="text" id="dict-name" required placeholder="Например: 2GR-FE" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; margin-bottom: 15px;">
                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <label style="font-weight: bold;">Объем (л) *</label>
                        <input type="number" step="0.1" id="dict-vol" required placeholder="Напр: 3.5" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                    </div>
                    <div style="flex: 1;">
                        <label style="font-weight: bold;">Топливо</label>
                        <select id="dict-fuel" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                            <option value="Бензин">Бензин</option>
                            <option value="Дизель">Дизель</option>
                            <option value="Гибрид">Гибрид</option>
                            <option value="Электро">Электро</option>
                        </select>
                    </div>
                </div>
            `;
        }
    },


    async loadModalModels(brandId) {
        const select = document.getElementById('dict-parent-id');
        if (!brandId) {
            select.innerHTML = '<option value="">Сначала выберите марку</option>';
            select.disabled = true; select.style.background = '#f9f9f9';
            return;
        }
        select.innerHTML = '<option value="">Загрузка моделей...</option>';
        const models = await API.getModelsByBrand(brandId);
        select.innerHTML = '<option value="">-- Выберите модель --</option>' + models.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        select.disabled = false; select.style.background = '#fff';
    },


    async handleDictSubmit(event, type) {
        event.preventDefault();
        const btn = document.getElementById('dict-btn-save');
        btn.disabled = true; btn.textContent = 'Сохранение...';

        try {
            const name = document.getElementById('dict-name')?.value.trim();
            let success = false;

            if (type === 'cat') {
                success = await API.addCategory(name);
            } else if (type === 'brand') {
                success = await API.addBrand(name);
            } else if (type === 'model') {
                const brandId = document.getElementById('dict-parent-id').value;
                success = await API.addModelToDb({ name: name, brand_id: brandId });
            } else if (type === 'gen') {
                const modelId = document.getElementById('dict-parent-id').value;
                const years = document.getElementById('dict-years').value.trim() || null;
                success = await API.addGenerationToDb({ name: name, model_id: modelId, years: years });
            } else if (type === 'engine') {
                const volume = parseFloat(document.getElementById('dict-vol').value) || null;
                const fuel = document.getElementById('dict-fuel').value;
                success = await API.addEngineToDb({ name: name, volume: volume, fuel_type: fuel });
            }

            if (success) {
                document.getElementById('dict-modal').remove();
                this.renderDicts();
            } else {
                throw new Error('Ошибка записи в БД');
            }
        } catch (err) {
            console.error(err);
            alert('Произошла ошибка при сохранении!');
            btn.disabled = false; btn.textContent = 'Сохранить в базу';
        }
    },


    async handleDeleteCategory(id) { if (confirm('Точно удалить категорию?')) { await API.deleteCategory(id); this.renderDicts(); } },
    async handleDeleteBrand(id) { if (confirm('Точно удалить марку?')) { await API.deleteBrand(id); this.renderDicts(); } },
    async handleDeleteModel(id) { if (confirm('Точно удалить модель?')) { await API.deleteModel(id); this.renderDicts(); } },
    async handleDeleteGen(id) { if (confirm('Точно удалить поколение?')) { await API.deleteGeneration(id); this.renderDicts(); } },
    async handleDeleteEngine(id) { if (confirm('Точно удалить двигатель?')) { await API.deleteEngine(id); this.renderDicts(); } },




    async renderParts() {
        const contentDiv = document.getElementById('admin-content');
        const parts = await API.getPartsList();

        let html = `
            <div class="admin-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0;">📦 Список запчастей</h2>
                    <button onclick="AdminApp.showAddPartForm()" style="padding: 10px 20px; background: #00a4d6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">+ Добавить запчасть</button>
                </div>

                <input type="text" onkeyup="AdminApp.filterTable(this, 'tbody-parts')" placeholder="🔍 Быстрый поиск по названию, артикулу, категории..." style="width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; background: #f9f9f9;">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="border-bottom: 2px solid #eee;">
                            <th style="padding: 12px; color: #666;">Артикул / Название</th>
                            <th style="padding: 12px; color: #666;">Категория</th>
                            <th style="padding: 12px; color: #666;">Цена</th>
                            <th style="padding: 12px; color: #666;">Наличие</th>
                            <th style="padding: 12px; color: #666;">Действия</th>
                        </tr>
                    </thead>
                    <tbody id="tbody-parts">
                        ${parts.map(part => `
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 12px;">
                                    <strong>${part.sku || '—'}</strong><br>
                                    ${part.name}
                                </td>
                                <td style="padding: 12px;">${part.categories?.name || 'Без категории'}</td>
                                <td style="padding: 12px;"><strong>${part.price.toLocaleString()} ₽</strong></td>
                                <td style="padding: 12px;">
                                    ${part.in_stock ? '<span style="color: #27ae60;">● В наличии</span>' : '<span style="color: #e74c3c;">● Нет в наличии</span>'}
                                </td>
                                <td style="padding: 12px;">
                                    <button onclick="AdminApp.showEditPartForm('${part.id}')" style="background: none; border: none; cursor: pointer; color: #f39c12; margin-right: 15px; font-weight: bold;">✏️ Изменить</button>
                                    <button onclick="AdminApp.handleDeletePart('${part.id}')" style="background: none; border: none; cursor: pointer; color: #e74c3c;">🗑️ Удалить</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        contentDiv.innerHTML = html;
    },

    async handleDeletePart(id) {
        if (!confirm('Вы уверены, что хотите удалить этот товар?')) return;
        const success = await API.deletePart(id);
        if (success) this.renderParts();
        else alert('Ошибка при удалении товара.');
    },




    applicabilityRows: 0,

    async showAddPartForm() {
        const contentDiv = document.getElementById('admin-content');
        contentDiv.innerHTML = '<div style="padding: 20px;">Загрузка формы...</div>';

        const categories = await API.getCategories();
        this.applicabilityRows = 0;

        let html = `
            <div class="admin-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0;">➕ Добавление новой запчасти</h2>
                    <button onclick="AdminApp.renderParts()" style="padding: 8px 15px; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer;">← Назад к списку</button>
                </div>

                <form id="add-part-form" onsubmit="AdminApp.handlePartSubmit(event)" style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                    
                    <div>
                        <h3 style="margin-bottom: 15px; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px;">Основная информация</h3>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Название детали *</label>
                            <input type="text" id="part-name" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                        </div>

                        <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                            <div style="flex: 1;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Цена (₽) *</label>
                                <input type="number" id="part-price" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                            <div style="flex: 1;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Состояние *</label>
                                <select id="part-condition" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                                    <option value="contract">Контрактная</option>
                                    <option value="used">Б/У</option>
                                    <option value="new">Новая</option>
                                </select>
                            </div>
                        </div>

                        <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                            <div style="flex: 1;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Категория *</label>
                                <select id="part-category" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                                    <option value="">-- Выберите --</option>
                                    ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                </select>
                            </div>
                            <div style="flex: 1;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Артикул (SKU)</label>
                                <input type="text" id="part-sku" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                        </div>

                        <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                            <div style="flex: 1;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Производитель</label>
                                <input type="text" id="part-manufacturer" placeholder="Например: Toyota" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                            <div style="flex: 1;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">OEM Номер</label>
                                <input type="text" id="part-oem" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                            <div style="flex: 1;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Год (детали)</label>
                                <input type="number" id="part-year" placeholder="YYYY" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Кол-во в комплекте (лот)</label>
                            <input type="number" id="part-pieces" value="1" min="1" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; max-width: 200px;">
                        </div>

                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Фотографии</label>
                            <input type="file" id="part-images-input" multiple accept="image/*" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; background: #fff;">
                            <small style="color: #888;">Вы можете выделить сразу несколько фотографий.</small>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Описание</label>
                            <textarea id="part-desc" rows="4" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;"></textarea>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: flex; align-items: center; gap: 10px; font-weight: bold; cursor: pointer;">
                                <input type="checkbox" id="part-instock" checked style="width: 20px; height: 20px;">
                                Товар есть в наличии на складе
                            </label>
                        </div>
                    </div>

                    <div>
                        <h3 style="margin-bottom: 15px; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px;">Применимость к авто</h3>
                        <p style="font-size: 13px; color: #7f8c8d; margin-bottom: 15px;">Добавьте один или несколько автомобилей, к которым подходит эта деталь.</p>
                        
                        <div id="applicability-container"></div>
                        
                        <button type="button" onclick="AdminApp.addCarRow()" style="margin-top: 10px; padding: 10px 15px; background: #ecf0f1; border: 1px dashed #bdc3c7; border-radius: 4px; cursor: pointer; width: 100%; font-weight: bold; color: #2c3e50;">+ Добавить еще один автомобиль</button>
                    </div>

                    <div style="grid-column: 1 / -1; text-align: right; border-top: 1px solid #eee; padding-top: 20px;">
                        <button type="submit" id="btn-save-part" style="padding: 12px 30px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold;">Сохранить деталь в базу</button>
                    </div>

                </form>
            </div>
        `;
        contentDiv.innerHTML = html;
        this.addCarRow();
    },


    async addCarRow() {
        const container = document.getElementById('applicability-container');
        const rowId = this.applicabilityRows++;
        const brands = await API.getBrands();

        const rowHtml = `
            <div class="car-row" id="row-${rowId}" style="border: 1px solid #e0e0e0; padding: 15px; margin-bottom: 15px; border-radius: 6px; background: #fdfdfd; position: relative;">
                <button type="button" onclick="this.parentElement.remove()" style="position: absolute; right: 10px; top: 5px; background: #ffebee; border: none; color: #c0392b; cursor: pointer; border-radius: 50%; width: 24px; height: 24px; font-weight: bold;">✕</button>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
                    <div>
                        <label style="display: block; font-size: 12px; margin-bottom: 4px;">Марка *</label>
                        <select onchange="AdminApp.loadRowModels(${rowId}, this.value)" class="row-make" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                            <option value="">-- Выберите --</option>
                            ${brands.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; margin-bottom: 4px;">Модель *</label>
                        <select onchange="AdminApp.loadRowGens(${rowId}, this.value)" class="row-model" disabled required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; background: #f9f9f9;">
                            <option value="">Сначала выберите марку</option>
                        </select>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; font-size: 12px; margin-bottom: 4px;">Поколение *</label>
                        <select onchange="AdminApp.loadRowEngines(${rowId}, this.value)" class="row-gen" disabled required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; background: #f9f9f9;">
                            <option value="">Сначала выберите модель</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; margin-bottom: 4px;">Двигатель (опц.)</label>
                        <select class="row-engine" disabled style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; background: #f9f9f9;">
                            <option value="">Сначала выберите поколение</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', rowHtml);
    },


    async loadRowModels(rowId, makeId) {
        const row = document.getElementById(`row-${rowId}`);
        const modelSelect = row.querySelector('.row-model');
        const genSelect = row.querySelector('.row-gen');
        const engineSelect = row.querySelector('.row-engine');

        genSelect.innerHTML = '<option value="">Сначала выберите модель</option>'; genSelect.disabled = true; genSelect.style.background = '#f9f9f9';
        engineSelect.innerHTML = '<option value="">Сначала выберите поколение</option>'; engineSelect.disabled = true; engineSelect.style.background = '#f9f9f9';

        if (!makeId) {
            modelSelect.innerHTML = '<option value="">Сначала выберите марку</option>';
            modelSelect.disabled = true;
            modelSelect.style.background = '#f9f9f9';
            return;
        }

        modelSelect.innerHTML = '<option value="">Загрузка...</option>';
        const models = await API.getModelsByBrand(makeId);
        modelSelect.innerHTML = '<option value="">-- Выберите модель --</option>' + models.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        modelSelect.disabled = false;
        modelSelect.style.background = '#fff';
    },


    async loadRowGens(rowId, modelId) {
        const row = document.getElementById(`row-${rowId}`);
        const genSelect = row.querySelector('.row-gen');
        const engineSelect = row.querySelector('.row-engine');

        engineSelect.innerHTML = '<option value="">Сначала выберите поколение</option>'; engineSelect.disabled = true; engineSelect.style.background = '#f9f9f9';

        if (!modelId) {
            genSelect.innerHTML = '<option value="">Сначала выберите модель</option>';
            genSelect.disabled = true;
            genSelect.style.background = '#f9f9f9';
            return;
        }

        genSelect.innerHTML = '<option value="">Загрузка...</option>';
        const gens = await API.getGenerationsByModel(modelId);
        genSelect.innerHTML = '<option value="">-- Выберите поколение --</option>' + gens.map(g => `<option value="${g.id}">${g.name} (${g.years || ''})</option>`).join('');
        genSelect.disabled = false;
        genSelect.style.background = '#fff';
    },


    async loadRowEngines(rowId, genId) {
        const row = document.getElementById(`row-${rowId}`);
        const engineSelect = row.querySelector('.row-engine');

        if (!genId) {
            engineSelect.innerHTML = '<option value="">Сначала выберите поколение</option>';
            engineSelect.disabled = true;
            engineSelect.style.background = '#f9f9f9';
            return;
        }

        engineSelect.innerHTML = '<option value="">Загрузка...</option>';
        const engines = await API.getEnginesByGen(genId);
        engineSelect.innerHTML = '<option value="">-- Любой двигатель --</option>' + engines.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
        engineSelect.disabled = false;
        engineSelect.style.background = '#fff';
    },


    async handlePartSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const btn = document.getElementById('btn-save-part');
        btn.disabled = true;
        btn.textContent = 'Сохранение...';

        try {

            const imageFiles = document.getElementById('part-images-input').files;
            const imageUrls = [];
            if (imageFiles.length > 0 && typeof API.uploadImage === 'function') {
                for (const file of imageFiles) {
                    const url = await API.uploadImage(file);
                    if (url) imageUrls.push(url);
                }
            }


            const partData = {
                name: document.getElementById('part-name').value.trim(),
                price: parseInt(document.getElementById('part-price').value),
                condition: document.getElementById('part-condition').value,
                category_id: document.getElementById('part-category').value,
                sku: document.getElementById('part-sku').value.trim() || null,
                description: document.getElementById('part-desc').value.trim() || null,
                in_stock: document.getElementById('part-instock').checked,
                manufacturer: document.getElementById('part-manufacturer').value.trim() || null,
                oem_number: document.getElementById('part-oem').value.trim() || null,
                manufacture_year: parseInt(document.getElementById('part-year').value) || null,
                pieces_in_set: parseInt(document.getElementById('part-pieces').value) || 1,
                images: imageUrls.length > 0 ? imageUrls : null
            };


            const newPart = await API.addPart(partData);

            if (newPart) {

                const rows = [];
                document.querySelectorAll('.car-row').forEach(row => {
                    const genId = row.querySelector('.row-gen').value;
                    const engineId = row.querySelector('.row-engine').value;


                    if (genId) {
                        rows.push({
                            genId: genId,
                            engineId: engineId || null
                        });
                    }
                });


                if (rows.length > 0 && typeof API.addMultipleApplicabilities === 'function') {
                    await API.addMultipleApplicabilities(newPart.id, rows);
                }

                alert('Запчасть успешно сохранена!');
                this.renderParts();
            } else {
                throw new Error('Ошибка создания записи в БД.');
            }
        } catch (error) {
            console.error(error);
            alert('Произошла ошибка при сохранении товара.');
            btn.disabled = false;
            btn.textContent = 'Сохранить деталь в базу';
        }
    },




    async showEditPartForm(partId) {
        const contentDiv = document.getElementById('admin-content');
        contentDiv.innerHTML = '<div style="padding: 20px;">Загрузка данных товара...</div>';


        const part = await API.getPartById(partId);
        if (!part) return alert('Ошибка: не удалось загрузить данные товара!');

        const categories = await API.getCategories();
        this.applicabilityRows = 0;

        let html = `
            <div class="admin-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0;">✏️ Редактирование запчасти</h2>
                    <button onclick="AdminApp.renderParts()" style="padding: 8px 15px; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer;">← Назад к списку</button>
                </div>

                <form id="edit-part-form" onsubmit="AdminApp.handleEditPartSubmit(event, '${part.id}')" style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                    
                    <div>
                        <div style="margin-bottom: 15px;">
                            <label style="font-weight: bold;">Название детали *</label>
                            <input type="text" id="edit-part-name" value="${part.name}" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                        </div>

                        <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                            <div style="flex: 1;">
                                <label style="font-weight: bold;">Цена (₽) *</label>
                                <input type="number" id="edit-part-price" value="${part.price}" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                            <div style="flex: 1;">
                                <label style="font-weight: bold;">Состояние *</label>
                                <select id="edit-part-condition" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                                    <option value="contract" ${part.condition === 'contract' ? 'selected' : ''}>Контрактная</option>
                                    <option value="used" ${part.condition === 'used' ? 'selected' : ''}>Б/У</option>
                                    <option value="new" ${part.condition === 'new' ? 'selected' : ''}>Новая</option>
                                </select>
                            </div>
                        </div>

                        <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                            <div style="flex: 1;">
                                <label style="font-weight: bold;">Категория *</label>
                                <select id="edit-part-category" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                                    ${categories.map(c => `<option value="${c.id}" ${part.category_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                                </select>
                            </div>
                            <div style="flex: 1;">
                                <label style="font-weight: bold;">Артикул (SKU)</label>
                                <input type="text" id="edit-part-sku" value="${part.sku || ''}" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                        </div>

                        <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                            <div style="flex: 1;">
                                <label style="font-weight: bold;">Производитель</label>
                                <input type="text" id="edit-part-manuf" value="${part.manufacturer || ''}" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                            <div style="flex: 1;">
                                <label style="font-weight: bold;">OEM Номер</label>
                                <input type="text" id="edit-part-oem" value="${part.oem_number || ''}" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                            <div style="flex: 1;">
                                <label style="font-weight: bold;">Год</label>
                                <input type="number" id="edit-part-year" value="${part.manufacture_year || ''}" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <label style="font-weight: bold;">Кол-во в комплекте (лот)</label>
                            <input type="number" id="edit-part-pieces" value="${part.pieces_in_set || 1}" min="1" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; max-width: 200px;">
                        </div>

                        <div style="margin-bottom: 15px;">
                            <label style="font-weight: bold;">Обновить фотографии</label>
                            <input type="file" id="edit-part-images" multiple accept="image/*" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; background: #fff;">
                            <small style="color: #e67e22; font-weight: bold;">Внимание: Если вы выберете новые фото, они полностью заменят старые. Если оставить пустым — старые сохранятся.</small>
                            ${part.images && part.images.length > 0 ? `<div style="margin-top: 5px; font-size: 13px;">Текущих фото: ${part.images.length} шт.</div>` : ''}
                        </div>

                        <div style="margin-bottom: 15px;">
                            <label style="font-weight: bold;">Описание</label>
                            <textarea id="edit-part-desc" rows="4" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">${part.description || ''}</textarea>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: flex; align-items: center; gap: 10px; font-weight: bold; cursor: pointer;">
                                <input type="checkbox" id="edit-part-instock" ${part.in_stock ? 'checked' : ''} style="width: 20px; height: 20px;">
                                Товар есть в наличии на складе
                            </label>
                        </div>
                    </div>

                    <div>
                        <h3 style="margin-bottom: 15px; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px;">Применимость к авто</h3>
                        <div id="applicability-container"></div>
                        <button type="button" onclick="AdminApp.addCarRow()" style="margin-top: 10px; padding: 10px 15px; background: #ecf0f1; border: 1px dashed #bdc3c7; border-radius: 4px; cursor: pointer; width: 100%; font-weight: bold; color: #2c3e50;">+ Добавить еще один автомобиль</button>
                    </div>

                    <div style="grid-column: 1 / -1; text-align: right; border-top: 1px solid #eee; padding-top: 20px;">
                        <button type="submit" id="btn-update-part" style="padding: 12px 30px; background: #f39c12; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold;">💾 Сохранить изменения</button>
                    </div>
                </form>
            </div>
        `;
        contentDiv.innerHTML = html;


        if (part.part_applicability && part.part_applicability.length > 0) {
            for (const app of part.part_applicability) {
                const brandId = app.generations?.models?.brand_id;
                const modelId = app.generations?.model_id;
                const genId = app.generation_id;
                const engineId = app.engine_id;
                await this.addPreFilledCarRow(brandId, modelId, genId, engineId);
            }
        } else {
            this.addCarRow();
        }
    },


    async addPreFilledCarRow(brandId, modelId, genId, engineId) {
        const container = document.getElementById('applicability-container');
        const rowId = this.applicabilityRows++;

        const brands = await API.getBrands();
        const models = brandId ? await API.getModelsByBrand(brandId) : [];
        const gens = modelId ? await API.getGenerationsByModel(modelId) : [];
        const engines = genId ? await API.getEnginesByGen(genId) : [];

        const rowHtml = `
            <div class="car-row" id="row-${rowId}" style="border: 1px solid #e0e0e0; padding: 15px; margin-bottom: 15px; border-radius: 6px; background: #fff; position: relative;">
                <button type="button" onclick="this.parentElement.remove()" style="position: absolute; right: 10px; top: 10px; background: #ffebee; border: none; color: #c0392b; cursor: pointer; border-radius: 50%; width: 24px; height: 24px; font-weight: bold;">✕</button>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
                    <div>
                        <label style="display: block; font-size: 12px; margin-bottom: 4px;">Марка *</label>
                        <select onchange="AdminApp.loadRowModels(${rowId}, this.value)" class="row-make" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                            <option value="">-- Выберите --</option>
                            ${brands.map(b => `<option value="${b.id}" ${b.id === brandId ? 'selected' : ''}>${b.name}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; margin-bottom: 4px;">Модель *</label>
                        <select onchange="AdminApp.loadRowGens(${rowId}, this.value)" class="row-model" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                            <option value="">-- Выберите --</option>
                            ${models.map(m => `<option value="${m.id}" ${m.id === modelId ? 'selected' : ''}>${m.name}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; font-size: 12px; margin-bottom: 4px;">Поколение *</label>
                        <select onchange="AdminApp.loadRowEngines(${rowId}, this.value)" class="row-gen" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                            <option value="">-- Выберите --</option>
                            ${gens.map(g => `<option value="${g.id}" ${g.id === genId ? 'selected' : ''}>${g.name}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; margin-bottom: 4px;">Двигатель (опц.)</label>
                        <select class="row-engine" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                            <option value="">-- Любой --</option>
                            ${engines.map(e => `<option value="${e.id}" ${e.id === engineId ? 'selected' : ''}>${e.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', rowHtml);
    },


    async handleEditPartSubmit(event, partId) {
        event.preventDefault();
        const btn = document.getElementById('btn-update-part');
        btn.disabled = true;
        btn.textContent = 'Сохранение...';

        try {

            const imageFiles = document.getElementById('edit-part-images').files;
            let finalImages = null;

            if (imageFiles.length > 0) {
                const newImageUrls = [];
                for (const file of imageFiles) {
                    const url = await API.uploadImage(file);
                    if (url) newImageUrls.push(url);
                }
                finalImages = newImageUrls;
            } else {

                const oldPart = await API.getPartById(partId);
                finalImages = oldPart.images;
            }


            const partData = {
                name: document.getElementById('edit-part-name').value.trim(),
                price: parseInt(document.getElementById('edit-part-price').value),
                condition: document.getElementById('edit-part-condition').value,
                category_id: document.getElementById('edit-part-category').value,
                sku: document.getElementById('edit-part-sku').value.trim() || null,
                description: document.getElementById('edit-part-desc').value.trim() || null,
                in_stock: document.getElementById('edit-part-instock').checked,
                manufacturer: document.getElementById('edit-part-manuf').value.trim() || null,
                oem_number: document.getElementById('edit-part-oem').value.trim() || null,
                manufacture_year: parseInt(document.getElementById('edit-part-year').value) || null,
                pieces_in_set: parseInt(document.getElementById('edit-part-pieces').value) || 1,
                images: finalImages
            };


            const updated = await API.updatePart(partId, partData);

            if (updated) {

                const rows = [];
                document.querySelectorAll('.car-row').forEach(row => {
                    const genId = row.querySelector('.row-gen').value;
                    const engineId = row.querySelector('.row-engine').value;
                    if (genId) rows.push({ genId, engineId: engineId || null });
                });


                await API.clearPartApplicabilities(partId);
                if (rows.length > 0) {
                    await API.addMultipleApplicabilities(partId, rows);
                }

                alert('Изменения успешно сохранены!');
                this.renderParts();
            } else {
                throw new Error('Ошибка обновления в БД');
            }
        } catch (error) {
            console.error(error);
            alert('Произошла ошибка при сохранении.');
            btn.disabled = false;
            btn.textContent = '💾 Сохранить изменения';
        }
    },




    async renderWheels() {
        const contentDiv = document.getElementById('admin-content');
        contentDiv.innerHTML = '<div style="padding: 20px;">Загрузка данных...</div>';

        const tires = await API.getTiresList();
        const wheels = await API.getWheelsList();

        let html = `
            <div style="display: grid; grid-template-columns: 1fr; gap: 30px;">
                
                <!-- ТАБЛИЦА ШИН -->
                <div class="admin-card">
                    <!-- Шапка карточки -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                        <div style="display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none;" onclick="AdminApp.toggleSection('tires-container', 'tires-arrow')">
                            <span id="tires-arrow" style="font-size: 16px; transition: transform 0.3s; transform: rotate(0deg); color: #7f8c8d;">▼</span>
                            <h2 style="margin: 0; font-size: 20px;">🛞 Список шин <span style="color: #bdc3c7; font-size: 14px; font-weight: normal;">(${tires.length})</span></h2>
                        </div>
                        <button onclick="AdminApp.showAddTireForm()" style="padding: 8px 15px; background: #00a4d6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 14px; white-space: nowrap;">+ Добавить</button>
                    </div>
                    
                    <!-- Сворачиваемый контейнер -->
                    <div id="tires-container" style="display: block;">
                    <input type="text" onkeyup="AdminApp.filterTable(this, 'tbody-tires')" placeholder="🔍 Быстрый поиск шин по названию, ширине, радиусу..." style="width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; background: #f9f9f9;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr style="border-bottom: 2px solid #eee;">
                                    <th style="padding: 12px; color: #666;">Артикул / Название</th>
                                    <th style="padding: 12px; color: #666;">Параметры</th>
                                    <th style="padding: 12px; color: #666;">Цена</th>
                                    <th style="padding: 12px; color: #666;">Наличие</th>
                                    <th style="padding: 12px; color: #666;">Действия</th>
                                </tr>
                            </thead>
                            <tbody id="tbody-tires">
                                ${tires.map(tire => `
                                    <tr style="border-bottom: 1px solid #eee;">
                                        <td style="padding: 12px;"><strong>${tire.sku || '—'}</strong><br>${tire.name}</td>
                                        <td style="padding: 12px;">${tire.tire_width}/${tire.tire_profile} R${tire.tire_diameter} ${tire.tire_season ? '(' + tire.tire_season + ')' : ''}</td>
                                        <td style="padding: 12px;"><strong>${tire.price.toLocaleString()} ₽</strong></td>
                                        <td style="padding: 12px;">
                                            ${tire.in_stock ? '<span style="color: #27ae60;">● В наличии</span>' : '<span style="color: #e74c3c;">● Нет в наличии</span>'}
                                        </td>
                                        <td style="padding: 12px;">
                                            <button onclick="AdminApp.showEditTireForm('${tire.id}')" style="background: none; border: none; cursor: pointer; color: #f39c12; margin-right: 15px; font-weight: bold;">✏️ Изменить</button>
                                            <button onclick="AdminApp.handleDeleteTire('${tire.id}')" style="background: none; border: none; cursor: pointer; color: #e74c3c;">🗑️ Удалить</button>
                                        </td>
                                    </tr>
                                `).join('')}
                                ${tires.length === 0 ? '<tr><td colspan="5" style="padding: 15px; text-align: center; color: #888;">Шин пока нет</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- ТАБЛИЦА ДИСКОВ -->
                <div class="admin-card">
                    <!-- Шапка карточки -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                        <div style="display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none;" onclick="AdminApp.toggleSection('wheels-container', 'wheels-arrow')">
                            <span id="wheels-arrow" style="font-size: 16px; transition: transform 0.3s; transform: rotate(0deg); color: #7f8c8d;">▼</span>
                            <h2 style="margin: 0; font-size: 20px;">💿 Список дисков <span style="color: #bdc3c7; font-size: 14px; font-weight: normal;">(${wheels.length})</span></h2>
                        </div>
                        <button onclick="AdminApp.showAddWheelForm()" style="padding: 8px 15px; background: #00a4d6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 14px; white-space: nowrap;">+ Добавить</button>
                    </div>
                    
                    <!-- Сворачиваемый контейнер -->
                    <div id="wheels-container" style="display: block;">
                    <input type="text" onkeyup="AdminApp.filterTable(this, 'tbody-wheels')" placeholder="🔍 Быстрый поиск дисков по параметрам, сверловке, названию..." style="width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; background: #f9f9f9;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr style="border-bottom: 2px solid #eee;">
                                    <th style="padding: 12px; color: #666;">Артикул / Название</th>
                                    <th style="padding: 12px; color: #666;">Параметры</th>
                                    <th style="padding: 12px; color: #666;">Цена</th>
                                    <th style="padding: 12px; color: #666;">Наличие</th>
                                    <th style="padding: 12px; color: #666;">Действия</th>
                                </tr>
                            </thead>
                            <tbody id="tbody-wheels">
                                ${wheels.map(wheel => `
                                    <tr style="border-bottom: 1px solid #eee;">
                                        <td style="padding: 12px;"><strong>${wheel.sku || '—'}</strong><br>${wheel.name}</td>
                                        <td style="padding: 12px;">R${wheel.wheel_diameter}, ${wheel.wheel_width}J, PCD ${wheel.wheel_bolt_pattern}, ET${wheel.wheel_offset_et}</td>
                                        <td style="padding: 12px;"><strong>${wheel.price.toLocaleString()} ₽</strong></td>
                                        <td style="padding: 12px;">
                                            ${wheel.in_stock ? '<span style="color: #27ae60;">● В наличии</span>' : '<span style="color: #e74c3c;">● Нет в наличии</span>'}
                                        </td>
                                        <td style="padding: 12px;">
                                            <button onclick="AdminApp.showEditWheelForm('${wheel.id}')" style="background: none; border: none; cursor: pointer; color: #f39c12; margin-right: 15px; font-weight: bold;">✏️ Изменить</button>
                                            <button onclick="AdminApp.handleDeleteWheel('${wheel.id}')" style="background: none; border: none; cursor: pointer; color: #e74c3c;">🗑️ Удалить</button>
                                        </td>
                                    </tr>
                                `).join('')}
                                ${wheels.length === 0 ? '<tr><td colspan="5" style="padding: 15px; text-align: center; color: #888;">Дисков пока нет</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        `;
        contentDiv.innerHTML = html;
    },


    toggleSection(containerId, arrowId) {
        const container = document.getElementById(containerId);
        const arrow = document.getElementById(arrowId);

        if (container.style.display === 'none') {
            container.style.display = 'block';
            arrow.style.transform = 'rotate(0deg)';
        } else {
            container.style.display = 'none';
            arrow.style.transform = 'rotate(-90deg)';
        }
    },


    async handleDeleteTire(id) {
        if (!confirm('Точно удалить эту шину?')) return;
        const success = await API.deleteTire(id);
        if (success) this.renderWheels();
        else alert('Ошибка при удалении шины.');
    },

    async handleDeleteWheel(id) {
        if (!confirm('Точно удалить этот диск?')) return;
        const success = await API.deleteWheel(id);
        if (success) this.renderWheels();
        else alert('Ошибка при удалении диска.');
    },




    showAddTireForm() {
        const contentDiv = document.getElementById('admin-content');
        let html = `
            <div class="admin-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0;">➕ Добавление новой шины</h2>
                    <button onclick="AdminApp.renderWheels()" style="padding: 8px 15px; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer;">← Назад</button>
                </div>

                <form id="add-tire-form" onsubmit="AdminApp.handleTireSubmit(event)" style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                    
                    <div>
                        <h3 style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Основная информация</h3>
                        
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Название (модель) *</label>
                        <input type="text" id="tire-name" required style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 4px;">

                        <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                            <div style="flex: 1;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Цена (₽) *</label>
                                <input type="number" id="tire-price" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                            <div style="flex: 1;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Состояние *</label>
                                <select id="tire-condition" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                                    <option value="new">Новая</option>
                                    <option value="used">Б/У</option>
                                    <option value="contract">Контрактная</option>
                                </select>
                            </div>
                        </div>

                        <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                            <div style="flex: 1;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Производитель</label>
                                <input type="text" id="tire-manuf" placeholder="Например: Michelin" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                            <div style="flex: 1;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Артикул</label>
                                <input type="text" id="tire-sku" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                        </div>

                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Фотографии</label>
                        <input type="file" id="tire-images" multiple accept="image/*" style="width: 100%; padding: 10px; margin-bottom: 15px; background: #fff; border: 1px solid #ccc; border-radius: 4px;">

                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Описание</label>
                        <textarea id="tire-desc" rows="3" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 4px;"></textarea>
                    </div>

                    <div>
                        <h3 style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Характеристики шины</h3>

                        <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                            <div style="flex: 1;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Ширина *</label>
                                <input type="number" id="tire-width" placeholder="Напр: 225" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                            <div style="flex: 1;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Профиль *</label>
                                <input type="number" id="tire-profile" placeholder="Напр: 55" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                            <div style="flex: 1;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Диаметр (R) *</label>
                                <input type="text" id="tire-dia" placeholder="Напр: 17" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                        </div>

                        <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                            <div style="flex: 1;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Сезонность</label>
                                <select id="tire-season" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                                    <option value="Летние">Летние</option>
                                    <option value="Зимние (шипованные)">Зимние (шипы)</option>
                                    <option value="Зимние (нешипованные)">Зимние (липучка)</option>
                                    <option value="Всесезонные">Всесезонные</option>
                                </select>
                            </div>
                            <div style="flex: 1;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Кол-во в комплекте</label>
                                <input type="number" id="tire-pieces" value="4" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                        </div>
                    </div>

                    <div style="grid-column: 1 / -1; text-align: right; border-top: 1px solid #eee; padding-top: 20px;">
                        <button type="submit" id="btn-save-tire" style="padding: 12px 30px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold;">Сохранить шину в базу</button>
                    </div>
                </form>
            </div>
        `;
        contentDiv.innerHTML = html;
    },

    async handleTireSubmit(event) {
        event.preventDefault();
        const btn = document.getElementById('btn-save-tire');
        btn.disabled = true;
        btn.textContent = 'Сохранение...';

        try {

            const imageFiles = document.getElementById('tire-images').files;
            const imageUrls = [];
            if (imageFiles.length > 0 && typeof API.uploadImage === 'function') {
                for (const file of imageFiles) {
                    const url = await API.uploadImage(file);
                    if (url) imageUrls.push(url);
                }
            }


            const tireData = {
                name: document.getElementById('tire-name').value.trim(),
                price: parseInt(document.getElementById('tire-price').value),
                condition: document.getElementById('tire-condition').value,
                sku: document.getElementById('tire-sku').value.trim() || null,
                manufacturer: document.getElementById('tire-manuf').value.trim() || null,
                description: document.getElementById('tire-desc').value.trim() || null,
                tire_width: parseInt(document.getElementById('tire-width').value) || null,
                tire_profile: parseInt(document.getElementById('tire-profile').value) || null,
                tire_diameter: document.getElementById('tire-dia').value.trim() || null,
                tire_season: document.getElementById('tire-season').value,
                pieces_in_set: parseInt(document.getElementById('tire-pieces').value) || 1,
                images: imageUrls.length > 0 ? imageUrls : null,
                in_stock: true
            };

            const newTire = await API.addTire(tireData);
            if (newTire) {
                alert('Шина успешно добавлена!');
                this.renderWheels();
            } else {
                throw new Error('Ошибка БД');
            }
        } catch (error) {
            console.error(error);
            alert('Произошла ошибка при сохранении шины.');
            btn.disabled = false;
            btn.textContent = 'Сохранить шину в базу';
        }
    },




    showAddWheelForm() {
        const contentDiv = document.getElementById('admin-content');
        let html = `
            <div class="admin-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0;">➕ Добавление нового диска</h2>
                    <button onclick="AdminApp.renderWheels()" style="padding: 8px 15px; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer;">← Назад</button>
                </div>

                <form id="add-wheel-form" onsubmit="AdminApp.handleWheelSubmit(event)" style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                    
                    <div>
                        <h3 style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Основная информация</h3>
                        
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Название (модель) *</label>
                        <input type="text" id="wheel-name" required style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 4px;">

                        <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                            <div style="flex: 1;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Цена (₽) *</label>
                                <input type="number" id="wheel-price" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                            <div style="flex: 1;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Состояние *</label>
                                <select id="wheel-condition" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                                    <option value="new">Новые</option>
                                    <option value="used">Б/У</option>
                                    <option value="contract">Контрактные</option>
                                </select>
                            </div>
                        </div>

                        <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                            <div style="flex: 1;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Производитель</label>
                                <input type="text" id="wheel-manuf" placeholder="Напр: K&K" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                            <div style="flex: 1;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Артикул</label>
                                <input type="text" id="wheel-sku" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                        </div>

                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Фотографии</label>
                        <input type="file" id="wheel-images" multiple accept="image/*" style="width: 100%; padding: 10px; margin-bottom: 15px; background: #fff; border: 1px solid #ccc; border-radius: 4px;">

                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">Описание</label>
                        <textarea id="wheel-desc" rows="3" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 4px;"></textarea>
                    </div>

                    <div>
                        <h3 style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Характеристики диска</h3>

                        <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                            <div style="flex: 1;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Диаметр (R) *</label>
                                <input type="text" id="wheel-dia" placeholder="Напр: 17" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                            <div style="flex: 1;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Ширина (J)</label>
                                <input type="number" step="0.5" id="wheel-width" placeholder="Напр: 7.5" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                        </div>

                        <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                            <div style="flex: 1;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Сверловка (PCD) *</label>
                                <input type="text" id="wheel-pcd" placeholder="Напр: 5x114.3" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                            <div style="flex: 1;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Вылет (ET)</label>
                                <input type="number" step="1" id="wheel-et" placeholder="Напр: 45" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                            <div style="flex: 1;">
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">ЦО (DIA)</label>
                                <input type="number" step="0.1" id="wheel-dia-cb" placeholder="Напр: 60.1" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Кол-во в комплекте</label>
                            <input type="number" id="wheel-pieces" value="4" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                        </div>
                    </div>

                    <div style="grid-column: 1 / -1; text-align: right; border-top: 1px solid #eee; padding-top: 20px;">
                        <button type="submit" id="btn-save-wheel" style="padding: 12px 30px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold;">Сохранить диск в базу</button>
                    </div>
                </form>
            </div>
        `;
        contentDiv.innerHTML = html;
    },

    async handleWheelSubmit(event) {
        event.preventDefault();
        const btn = document.getElementById('btn-save-wheel');
        btn.disabled = true;
        btn.textContent = 'Сохранение...';

        try {

            const imageFiles = document.getElementById('wheel-images').files;
            const imageUrls = [];
            if (imageFiles.length > 0 && typeof API.uploadImage === 'function') {
                for (const file of imageFiles) {
                    const url = await API.uploadImage(file);
                    if (url) imageUrls.push(url);
                }
            }


            const wheelData = {
                name: document.getElementById('wheel-name').value.trim(),
                price: parseInt(document.getElementById('wheel-price').value),
                condition: document.getElementById('wheel-condition').value,
                sku: document.getElementById('wheel-sku').value.trim() || null,
                manufacturer: document.getElementById('wheel-manuf').value.trim() || null,
                description: document.getElementById('wheel-desc').value.trim() || null,

                wheel_diameter: document.getElementById('wheel-dia').value.trim() || null,
                wheel_width: parseFloat(document.getElementById('wheel-width').value) || null,
                wheel_bolt_pattern: document.getElementById('wheel-pcd').value.trim() || null,
                wheel_offset_et: parseFloat(document.getElementById('wheel-et').value) || null,
                wheel_cb_dia: parseFloat(document.getElementById('wheel-dia-cb').value) || null,

                pieces_in_set: parseInt(document.getElementById('wheel-pieces').value) || 1,
                images: imageUrls.length > 0 ? imageUrls : null,
                in_stock: true
            };

            const newWheel = await API.addWheel(wheelData);
            if (newWheel) {
                alert('Диск успешно добавлен!');
                this.renderWheels();
            } else {
                throw new Error('Ошибка БД');
            }
        } catch (error) {
            console.error(error);
            alert('Произошла ошибка при сохранении диска.');
            btn.disabled = false;
            btn.textContent = 'Сохранить диск в базу';
        }
    },




    async showEditTireForm(id) {
        const contentDiv = document.getElementById('admin-content');
        const tire = await API.getTireById(id);
        if (!tire) return alert('Ошибка загрузки данных');

        contentDiv.innerHTML = `
            <div class="admin-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2>✏️ Редактирование шины</h2>
                    <button onclick="AdminApp.renderWheels()" style="padding: 8px 15px; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer;">← Назад</button>
                </div>
                <form onsubmit="AdminApp.handleEditTireSubmit(event, '${tire.id}')" style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                    <div>
                        <label>Название *</label>
                        <input type="text" id="edit-tire-name" value="${tire.name}" required style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 4px;">
                        
                        <div style="display: flex; gap: 15px;">
                            <div style="flex: 1;"><label>Цена (₽)</label><input type="number" id="edit-tire-price" value="${tire.price}" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;"></div>
                            <div style="flex: 1;"><label>Состояние</label>
                                <select id="edit-tire-cond" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                                    <option value="new" ${tire.condition === 'new' ? 'selected' : ''}>Новая</option>
                                    <option value="used" ${tire.condition === 'used' ? 'selected' : ''}>Б/У</option>
                                    <option value="contract" ${tire.condition === 'contract' ? 'selected' : ''}>Контрактная</option>
                                </select>
                            </div>
                        </div>
                        <label style="display: block; margin-top: 15px;">Новые фото (оставьте пустым, чтобы не менять)</label>
                        <input type="file" id="edit-tire-images" multiple accept="image/*" style="width: 100%; padding: 10px; background: #fff; border: 1px solid #ccc; border-radius: 4px;">
                    </div>
                    <div>
                        <h3>Параметры</h3>
                        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                            <input type="number" id="edit-tire-w" value="${tire.tire_width || ''}" placeholder="Ширина" style="flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            <input type="number" id="edit-tire-p" value="${tire.tire_profile || ''}" placeholder="Профиль" style="flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            <input type="text" id="edit-tire-d" value="${tire.tire_diameter || ''}" placeholder="R" style="flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                        </div>
                        <label>Сезонность</label>
                        <select id="edit-tire-season" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 4px;">
                            <option value="Летние" ${tire.tire_season === 'Летние' ? 'selected' : ''}>Летние</option>
                            <option value="Зимние" ${tire.tire_season === 'Зимние' ? 'selected' : ''}>Зимние</option>
                            <option value="Всесезонные" ${tire.tire_season === 'Всесезонные' ? 'selected' : ''}>Всесезонные</option>
                        </select>
                        
                        <!-- НОВАЯ ГАЛОЧКА -->
                        <div style="margin-top: 20px;">
                            <label style="display: flex; align-items: center; gap: 10px; font-weight: bold; cursor: pointer;">
                                <input type="checkbox" id="edit-tire-instock" ${tire.in_stock ? 'checked' : ''} style="width: 20px; height: 20px;">
                                Товар есть в наличии на складе
                            </label>
                        </div>
                    </div>
                    <div style="grid-column: 1/-1; text-align: right;"><button type="submit" style="padding: 12px 30px; background: #f39c12; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Сохранить изменения</button></div>
                </form>
            </div>
        `;
    },

    async handleEditTireSubmit(event, id) {
        event.preventDefault();
        const files = document.getElementById('edit-tire-images').files;
        let images = null;

        if (files.length > 0) {
            images = [];
            for (const f of files) {
                const url = await API.uploadImage(f);
                if (url) images.push(url);
            }
        }

        const data = {
            name: document.getElementById('edit-tire-name').value,
            price: parseInt(document.getElementById('edit-tire-price').value),
            condition: document.getElementById('edit-tire-cond').value,
            tire_width: parseInt(document.getElementById('edit-tire-w').value),
            tire_profile: parseInt(document.getElementById('edit-tire-p').value),
            tire_diameter: document.getElementById('edit-tire-d').value,
            tire_season: document.getElementById('edit-tire-season').value,
            in_stock: document.getElementById('edit-tire-instock').checked
        };
        if (images) data.images = images;

        if (await API.updateTire(id, data)) {
            alert('Обновлено!');
            this.renderWheels();
        }
    },




    async showEditWheelForm(id) {
        const contentDiv = document.getElementById('admin-content');
        const wheel = await API.getWheelById(id);
        if (!wheel) return alert('Ошибка загрузки данных');

        contentDiv.innerHTML = `
            <div class="admin-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2>✏️ Редактирование диска</h2>
                    <button onclick="AdminApp.renderWheels()" style="padding: 8px 15px; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer;">← Назад</button>
                </div>
                <form onsubmit="AdminApp.handleEditWheelSubmit(event, '${wheel.id}')" style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                    <div>
                        <label>Название *</label>
                        <input type="text" id="edit-wheel-name" value="${wheel.name}" required style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 4px;">
                        <label>Цена (₽)</label>
                        <input type="number" id="edit-wheel-price" value="${wheel.price}" required style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 4px;">
                        <label>Новые фото (оставьте пустым, чтобы не менять)</label>
                        <input type="file" id="edit-wheel-images" multiple accept="image/*" style="width: 100%; padding: 10px; background: #fff; border: 1px solid #ccc; border-radius: 4px;">
                    </div>
                    <div>
                        <h3>Параметры</h3>
                        <div style="margin-bottom: 10px;">
                            <label>Диаметр (R)</label>
                            <input type="text" id="edit-wheel-dia" value="${wheel.wheel_diameter || ''}" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label>Сверловка (PCD)</label>
                            <input type="text" id="edit-wheel-pcd" value="${wheel.wheel_bolt_pattern || ''}" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                        </div>
                        
                        <!-- НОВАЯ ГАЛОЧКА -->
                        <div style="margin-top: 20px;">
                            <label style="display: flex; align-items: center; gap: 10px; font-weight: bold; cursor: pointer;">
                                <input type="checkbox" id="edit-wheel-instock" ${wheel.in_stock ? 'checked' : ''} style="width: 20px; height: 20px;">
                                Товар есть в наличии на складе
                            </label>
                        </div>
                    </div>
                    <div style="grid-column: 1/-1; text-align: right;"><button type="submit" style="padding: 12px 30px; background: #f39c12; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Сохранить изменения</button></div>
                </form>
            </div>
        `;
    },

    async handleEditWheelSubmit(event, id) {
        event.preventDefault();
        const files = document.getElementById('edit-wheel-images').files;
        let images = null;

        if (files.length > 0) {
            images = [];
            for (const f of files) {
                const url = await API.uploadImage(f);
                if (url) images.push(url);
            }
        }

        const data = {
            name: document.getElementById('edit-wheel-name').value,
            price: parseInt(document.getElementById('edit-wheel-price').value),
            wheel_diameter: document.getElementById('edit-wheel-dia').value,
            wheel_bolt_pattern: document.getElementById('edit-wheel-pcd').value,
            in_stock: document.getElementById('edit-wheel-instock').checked
        };
        if (images) data.images = images;

        if (await API.updateWheel(id, data)) {
            alert('Обновлено!');
            this.renderWheels();
        }
    },



    renderGuide() {
        const container = document.getElementById('admin-content');

        container.innerHTML = `
            <div class="admin-card" style="max-width: 900px; margin: 0 auto; line-height: 1.6; font-size: 15px;">
                <h2 style="color: #2c3e50; border-bottom: 2px solid #00a4d6; padding-bottom: 10px; margin-top: 0;">📖 Руководство менеджера по работе с каталогом и заказами</h2>
                <p style="color: #555; font-size: 16px;">Добро пожаловать в панель управления интернет-магазином!</p>
                
                <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; border-left: 4px solid #00a4d6; margin-bottom: 25px;">
                    <strong>Главное правило системы:</strong> Мы всегда движемся от «общего» к «частному». Нельзя добавить в каталог запчасть для автомобиля, которого еще нет в базе. Сначала мы создаем фундамент (марки, модели, категории), а затем добавляем к нему конкретные товары.
                </div>

                <p style="color: #555; margin-bottom: 30px;">Вся работа делится на 4 логических блока.</p>

                <!-- БЛОК 1 -->
                <h3 style="color: #2980b9; margin-top: 25px; display: flex; align-items: center; gap: 8px;">
                    <span>📚</span> Блок 1: Справочники (Базовые настройки)
                </h3>
                <p style="color: #555;">В этот раздел вы будете заходить реже всего. Здесь формируется основа каталога. Если появилась запчасть из автомобиля, которого раньше никогда не было, начинать нужно отсюда.</p>
                <ol style="color: #444; padding-left: 20px;">
                    <li style="margin-bottom: 15px;">
                        <strong>Добавление автомобиля (Строгая последовательность):</strong>
                        <ul style="list-style-type: circle; margin-top: 5px; color: #555;">
                            <li><em>Шаг 1. Марка:</em> Зайдите в раздел «Марки» и проверьте, есть ли нужная (например, Toyota). Если нет — добавьте.</li>
                            <li><em>Шаг 2. Модель:</em> Зайдите в «Модели». Выберите марку из списка и напишите название модели (например, Camry).</li>
                            <li><em>Шаг 3. Поколение:</em> Зайдите в «Поколения». Выберите созданную модель и укажите данные кузова (например, XV40, 2006-2011).</li>
                        </ul>
                    </li>
                    <li style="margin-bottom: 15px;">
                        <strong>Категории товаров:</strong> Здесь хранятся названия разделов каталога (например, Кузовные детали, Оптика, Подвеска). Если нужной категории нет, добавьте ее.
                    </li>
                    <li style="margin-bottom: 15px;">
                        <strong>Двигатели:</strong> Справочник моторов (например, 1JZ-GTE). Добавляйте сюда новые маркировки по мере их поступления.
                    </li>
                </ol>

                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">

                <!-- БЛОК 2 -->
                <h3 style="color: #27ae60; display: flex; align-items: center; gap: 8px;">
                    <span>🛞</span> Блок 2: Добавление независимых товаров (Шины и Диски)
                </h3>
                <p style="color: #555;">Шины и диски — это универсальные товары. Они не привязываются к конкретной марке автомобиля, поэтому добавлять их очень просто.</p>
                <ul style="color: #444; padding-left: 20px;">
                    <li style="margin-bottom: 8px;">Откройте раздел «Шины и Диски» и нажмите кнопку добавления.</li>
                    <li style="margin-bottom: 8px;">Заполните параметры: Название, Цена, Артикул, радиус, ширина, профиль или сверловка.</li>
                    <li style="margin-bottom: 8px;"><strong>Количество в комплекте:</strong> Если вы продаете 4 диска единым набором, ставьте цифру 4. Если это шина на запаску — ставьте 1.</li>
                    <li style="margin-bottom: 8px;">Загрузите фотографии и нажмите «Сохранить». Товар сразу появится на сайте.</li>
                </ul>

                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">

                <!-- БЛОК 3 -->
                <h3 style="color: #e67e22; display: flex; align-items: center; gap: 8px;">
                    <span>⚙️</span> Блок 3: Добавление Автозапчастей
                </h3>
                <p style="color: #555;">Это самый частый процесс. Так как одна и та же фара может подходить к разным поколениям авто, форма разделена на две части.</p>
                <ul style="color: #444; padding-left: 20px;">
                    <li style="margin-bottom: 10px;">
                        <strong>Шаг 1: Основные данные детали.</strong> Заполните Категорию, Название товара, Цену и Артикул. Загрузите фото.
                    </li>
                    <li style="margin-bottom: 10px;">
                        <strong>Шаг 2: Привязка к автомобилю (Применяемость).</strong> В этой же форме нажмите кнопку добавления машины.
                        <ul style="list-style-type: circle; margin-top: 5px; color: #555;">
                            <li>Выберите Марку → Модель → Поколение.</li>
                            <li><em>Внимание:</em> если деталь кузовная (дверь, бампер), поле двигателя можно оставить пустым. Если это генератор или стартер — желательно указать двигатель.</li>
                            <li>Если деталь подходит на разные кузова, просто нажмите кнопку добавления машины еще раз и добавьте второй кузов!</li>
                        </ul>
                    </li>
                </ul>

                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">

                <!-- БЛОК 4 -->
                <h3 style="color: #8e44ad; display: flex; align-items: center; gap: 8px;">
                    <span>📦</span> Блок 4: Обработка заказов
                </h3>
                <p style="color: #555;">В этом разделе вы видите все покупки клиентов.</p>
                <ul style="color: #444; padding-left: 20px;">
                    <li style="margin-bottom: 8px;">Новые заказы по умолчанию имеют статус <strong>Ожидает</strong>.</li>
                    <li style="margin-bottom: 8px;">Внутри заказа вы увидите контакты клиента, способ доставки (Самовывоз/Доставка ТК) и комментарий. <em>Если комментарий длинный, он будет скроллиться внутри своего блока.</em></li>
                    <li style="margin-bottom: 8px;">После передачи артикулов кладовщику на сборку, переведите статус в <strong>В обработке</strong>.</li>
                    <li style="margin-bottom: 8px;">После отправки ТК или выдачи на кассе, измените статус на <strong>Отправлен</strong> или <strong>Выполнен</strong>.</li>
                </ul>

                <div style="background: #fdf2e9; padding: 15px; border-radius: 8px; border-left: 4px solid #e67e22; margin-top: 30px;">
                    <h4 style="margin-top: 0; color: #d35400;">📌 Памятка менеджера (Частые ошибки)</h4>
                    <ul style="margin-bottom: 0; color: #555; padding-left: 20px;">
                        <li style="margin-bottom: 8px;"><strong>Артикул (SKU) — это идентификатор товарной позиции.</strong> Никогда не оставляйте это поле пустым. Базе данных для работы достаточно внутренних кодов, но живой кладовщик без артикула деталь на складе не найдет.</li>
                        <li style="margin-bottom: 8px;"><strong>Удаление товаров:</strong> Старайтесь не удалять товары из базы без крайней необходимости. Лучше просто снимите галочку «В наличии» (или статус видимости), чтобы скрыть товар с витрины, но сохранить историю.</li>
                        <li><strong>Удаление заказов:</strong> При нажатии на красный крестик в заказах заказ удаляется безвозвратно. <em>Важно:</em> вместе с заказом из базы каскадно удаляются все товары, которые он заказывал!</li>
                    </ul>
                </div>
            </div>
        `;
    }
};


document.addEventListener('DOMContentLoaded', () => AdminApp.init());