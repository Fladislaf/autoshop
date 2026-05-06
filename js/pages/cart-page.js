

async function initCartPage() {

    const cart = Cart.getCart();
    const cartList = document.querySelector('.cart-list');
    const cartLayout = document.querySelector('.cart-layout');
    
    if (!cartList) return;


    if (cart.length === 0) {
        if (cartLayout) {
            cartLayout.innerHTML = `
                <div style="text-align: center; padding: 50px 0; grid-column: 1/-1; margin: 0 auto;">
                    <h2 style="font-size: 20px;">Ваша корзина пуста</h2>
                    <p style="margin: 20px 0; color: #666;">Самое время добавить в неё что-нибудь!</p>
                    <a href="zapchasti.html" class="btn-primary" style="display: inline-block; padding: 12px 25px; text-decoration: none;">Перейти в каталог</a>
                </div>
            `;
        }
        return; 
    }


    cartList.innerHTML = '<div style="padding: 40px 20px; text-align: center; color: #7f8c8d; font-size: 16px;">⏳ Сверяем наличие товаров на складе...</div>';

    const availableItems = [];
    const unavailableItems = [];


    await Promise.all(cart.map(async (item) => {
        let dbProduct = null;
        try {
            if (item.type === 'tire') dbProduct = await API.getTireById(item.id);
            else if (item.type === 'wheel') dbProduct = await API.getWheelById(item.id);
            else dbProduct = await API.getProductById(item.id); 


            if (dbProduct && dbProduct.in_stock) {
                availableItems.push(item);
            } else {
                unavailableItems.push(item);
            }
        } catch (e) {
            unavailableItems.push(item);
        }
    }));


    window.unavailableIdsForCart = unavailableItems.map(i => i.id);


    renderCartItems(availableItems, unavailableItems, cartList);


    updateCartSummary(availableItems);


    const submitBtn = document.querySelector('.checkout-form button[type="submit"]');
    if (submitBtn) {
        if (unavailableItems.length > 0) {
            submitBtn.disabled = true;
            submitBtn.style.background = '#95a5a6';
            submitBtn.textContent = 'Удалите раскупленные товары';
        } else if (availableItems.length === 0) {
            submitBtn.disabled = true;
        } else {
            submitBtn.disabled = false;
            submitBtn.style.background = '';
            submitBtn.textContent = 'Оформить заказ';
        }
    }
}

function renderCartItems(availableItems, unavailableItems, cartList) {
    let html = '';


    if (availableItems.length > 0) {
        html += availableItems.map(item => {
            const imageUrl = item.image || 'img/no-photo.png';
            let productLink = `product.html?id=${item.id}`;
            if (item.type === 'tire') productLink += '&type=tire';
            if (item.type === 'wheel') productLink += '&type=wheel';

            return `
                <div class="cart-item">
                    <div class="cart-item__content">
                        <a href="${productLink}" target="_blank" style="display: block; text-decoration: none;">
                            <img src="${imageUrl}" alt="${item.name}" class="cart-item__img" style="transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                        </a>
                        <div class="cart-item__info">
                            <a href="${productLink}" target="_blank" style="text-decoration: none; color: inherit;">
                                <h3 class="cart-item__title" style="transition: color 0.2s;" onmouseover="this.style.color='#00a4d6'" onmouseout="this.style.color='inherit'">${item.name}</h3>
                            </a>
                            <div class="cart-item__price-row">
                                <span class="cart-item__price">${item.price.toLocaleString()} ₽</span>
                            </div>
                            <div class="cart-item__stock">На складе: <strong style="color: #27ae60;">Есть в наличии</strong></div>
                        </div>
                    </div>
                    <button class="cart-item__remove" type="button" onclick="Cart.remove('${item.id}')">
                        <span class="remove-desktop">&times;</span>
                        <span class="remove-mobile">🗑️ Удалить</span>
                    </button>
                </div>
            `;
        }).join('');
    }


    if (unavailableItems.length > 0) {
        html += `
            <div style="margin-top: 30px; border: 2px dashed #e74c3c; border-radius: 8px; padding: 20px; background: #fdfaf9;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                    <h3 style="color: #c0392b; margin: 0; display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 20px;">⚠️</span> Этих товаров уже нет в наличии
                    </h3>
                    <button type="button" onclick="removeUnavailableItems()" style="padding: 8px 15px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 13px;">Удалить все недоступные</button>
                </div>
        `;

        html += unavailableItems.map(item => {
            const imageUrl = item.image || 'img/no-photo.png';
            let productLink = `product.html?id=${item.id}`;
            if (item.type === 'tire') productLink += '&type=tire';
            if (item.type === 'wheel') productLink += '&type=wheel';

            return `
                <div class="cart-item" style="opacity: 0.6; box-shadow: none; border-bottom: 1px solid #eee; margin-bottom: 0; padding-bottom: 15px;">
                    <div class="cart-item__content">
                        <a href="${productLink}" target="_blank" style="display: block; text-decoration: none;">
                            <img src="${imageUrl}" alt="${item.name}" class="cart-item__img" style="filter: grayscale(100%); border-radius: 4px;">
                        </a>
                        <div class="cart-item__info">
                            <a href="${productLink}" target="_blank" style="text-decoration: none; color: inherit;">
                                <h3 class="cart-item__title" style="text-decoration: line-through; color: #7f8c8d;">${item.name}</h3>
                            </a>
                            <div class="cart-item__price-row">
                                <span class="cart-item__price" style="color: #bdc3c7;">${item.price.toLocaleString()} ₽</span>
                            </div>
                            <div class="cart-item__stock" style="color: #e74c3c; font-size: 13px;"><strong>Раскуплено</strong> (кто-то успел забрать этот товар)</div>
                        </div>
                    </div>
                    <button class="cart-item__remove" type="button" onclick="Cart.remove('${item.id}')" style="background: #ecf0f1; color: #7f8c8d;">
                        <span class="remove-desktop">&times;</span>
                    </button>
                </div>
            `;
        }).join('');
        
        html += `</div>`;
    }

    cartList.innerHTML = html;
}

function updateCartSummary(cart) {

    const totalCount = cart.length;
    const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);


    const summaryRow = document.querySelector('.cart-summary__row');
    const totalDisplay = document.querySelector('.cart-summary__total-price');


    const getWord = (n) => {
        if (n % 10 === 1 && n % 100 !== 11) return 'товар';
        if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'товара';
        return 'товаров';
    };

    if (summaryRow) {
        summaryRow.innerHTML = `
            <span>${totalCount} ${getWord(totalCount)}</span>
            <span>${totalPrice.toLocaleString()} ₽</span>
        `;
    }

    if (totalDisplay) {
        totalDisplay.textContent = `${totalPrice.toLocaleString()} ₽`;
    }
}




const checkoutForm = document.querySelector('.checkout-form');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();


        const cart = Cart.getCart();
        if (cart.length === 0) {
            alert('Ваша корзина пуста!');
            return;
        }

        const submitBtn = checkoutForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Оформляем...';


        const privacyCheckbox = document.querySelector('.form-checkbox');
        if (privacyCheckbox && !privacyCheckbox.checked) {
            alert('Пожалуйста, подтвердите согласие на обработку персональных данных (поставьте галочку внизу формы).');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            return;
        }


        const deliveryType = document.querySelector('input[name="delivery"]:checked').value; 
        
        const fullName = document.getElementById('input-name').value.trim();
        const city = document.getElementById('input-city').value.trim();
        const phone = document.getElementById('input-phone').value.trim();
        const email = document.getElementById('input-email').value.trim();
        const comment = document.getElementById('input-comment').value.trim();


        if (!fullName || !phone || !email) {
            alert('Пожалуйста, заполните все обязательные поля (Ф.И.О., Телефон, E-mail).');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            return;
        }


        if (deliveryType === 'transport' && !city) {
            alert('Пожалуйста, укажите город для транспортной компании!');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            return;
        }


        const totalPrice = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);


        const orderData = {
            delivery_type: deliveryType,
            full_name: fullName,
            city: deliveryType === 'transport' ? city : null, 
            phone: phone,
            email: email,
            comment: comment || null,
            total_price: totalPrice
        };


        const response = await API.createOrder(orderData, cart);

        if (response.success) {

            const shortId = response.orderId.split('-')[0];
            

            Cart.clear(); 
            
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;


            window.location.href = `status.html?id=${shortId}`; 
        } else {
            alert('Произошла ошибка при оформлении заказа. Попробуйте позже.');
            console.error(response.error);
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });
}


window.removeUnavailableItems = function() {
    if (!window.unavailableIdsForCart || window.unavailableIdsForCart.length === 0) return;
    
    let cart = Cart.getCart();
    

    cart = cart.filter(item => !window.unavailableIdsForCart.includes(item.id));
    
    Cart.saveCart(cart);
    initCartPage();
};


document.addEventListener('DOMContentLoaded', initCartPage);