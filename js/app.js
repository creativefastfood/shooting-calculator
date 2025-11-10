// Shooting Calculator Application
class ShootingCalculator {
    constructor() {
        this.pricesData = null;
        this.cart = [];
        this.currentCategory = null;
        this.init();
    }

    async init() {
        await this.loadPrices();
        this.setupEventListeners();
        this.renderCategories();
        this.loadCartFromStorage();
    }

    async loadPrices() {
        try {
            // Используем встроенные данные из window.PRICES_DATA
            if (window.PRICES_DATA) {
                this.pricesData = window.PRICES_DATA;
                console.log('Прайс-лист загружен успешно!');
            } else {
                throw new Error('Данные прайс-листа не найдены');
            }
        } catch (error) {
            console.error('Ошибка загрузки цен:', error);
            alert('Не удалось загрузить прайс-лист. Обновите страницу.');
        }
    }

    setupEventListeners() {
        // Header buttons
        document.getElementById('clearBtn').addEventListener('click', () => this.clearCart());
        document.getElementById('historyBtn').addEventListener('click', () => this.showHistory());
        document.getElementById('printBtn').addEventListener('click', () => this.printCalculation());

        // Back button
        document.getElementById('backBtn').addEventListener('click', () => this.showCategories());

        // Cart actions
        document.getElementById('saveCalculationBtn').addEventListener('click', () => this.saveCalculation());
        document.getElementById('generateProposalBtn').addEventListener('click', () => this.generateProposal());

        // Discount inputs
        document.getElementById('discountPercent').addEventListener('input', (e) => this.updateDiscount('percent', e.target.value));
        document.getElementById('discountAmount').addEventListener('input', (e) => this.updateDiscount('amount', e.target.value));

        // Modal close buttons
        document.getElementById('closeHistoryModal').addEventListener('click', () => this.closeModal('historyModal'));
        document.getElementById('closeProposalModal').addEventListener('click', () => this.closeModal('proposalModal'));

        // Proposal actions
        document.getElementById('copyToClipboardBtn').addEventListener('click', () => this.copyProposalToClipboard());
        document.getElementById('printProposalBtn').addEventListener('click', () => window.print());

        // Click outside modal to close
        document.getElementById('historyModal').addEventListener('click', (e) => {
            if (e.target.id === 'historyModal') this.closeModal('historyModal');
        });
        document.getElementById('proposalModal').addEventListener('click', (e) => {
            if (e.target.id === 'proposalModal') this.closeModal('proposalModal');
        });
    }

    renderCategories() {
        const grid = document.getElementById('categoriesGrid');
        grid.innerHTML = '';

        // Main categories
        this.pricesData.categories.forEach(category => {
            const card = this.createCategoryCard(category);
            grid.appendChild(card);
        });

        // Postproduction
        const postCard = this.createCategoryCard({
            id: 'postproduction',
            name: this.pricesData.postproduction.name,
            icon: this.pricesData.postproduction.icon,
            description: 'Ретушь, инфографика, видеомонтаж'
        });
        grid.appendChild(postCard);

        // Additional services
        const addCard = this.createCategoryCard({
            id: 'additional',
            name: this.pricesData.additional_services.name,
            icon: '⭐',
            description: 'Модели, ассистенты, оборудование'
        });
        grid.appendChild(addCard);
    }

    createCategoryCard(category) {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.innerHTML = `
            <div class="category-icon">${category.icon || '📁'}</div>
            <div class="category-name">${category.name}</div>
            <div class="category-description">${category.description || ''}</div>
        `;
        card.addEventListener('click', () => this.showCategory(category.id));
        return card;
    }

    showCategory(categoryId) {
        this.currentCategory = categoryId;
        document.querySelector('.categories-section').style.display = 'none';
        document.querySelector('.services-section').style.display = 'block';

        const servicesContent = document.getElementById('servicesContent');
        const title = document.getElementById('serviceSectionTitle');

        if (categoryId === 'postproduction') {
            title.textContent = this.pricesData.postproduction.name;
            servicesContent.innerHTML = this.renderPostproduction();
        } else if (categoryId === 'additional') {
            title.textContent = this.pricesData.additional_services.name;
            servicesContent.innerHTML = this.renderAdditionalServices();
        } else {
            const category = this.pricesData.categories.find(c => c.id === categoryId);
            title.textContent = category.name;
            servicesContent.innerHTML = this.renderCategoryServices(category);
        }
    }

    renderCategoryServices(category) {
        let html = '';

        // Sprint packages
        if (category.subcategories) {
            category.subcategories.forEach(sub => {
                html += `<h3 style="margin: 1.5rem 0 1rem; font-size: 1.1rem; color: var(--primary-color);">${sub.name}</h3>`;
                sub.packages.forEach(pkg => {
                    html += this.createServiceItem({
                        name: pkg.name,
                        price: pkg.price,
                        description: pkg.description + (pkg.suitable ? ` • ${pkg.suitable}` : ''),
                        id: pkg.id
                    });
                });
            });
        }

        // Hourly services
        if (category.services) {
            category.services.forEach(service => {
                html += this.createServiceItem({
                    name: service.name,
                    price: service.price,
                    description: service.description || '',
                    unit: service.unit || 'услуга',
                    id: category.id + '_' + service.id
                });
            });
        }

        // Subject photo items
        if (category.items) {
            category.items.forEach(item => {
                html += this.createServiceItem({
                    name: item.category || item.type,
                    price: item.price || item.price,
                    description: item.description || '',
                    id: category.id + '_' + (item.category || item.type).replace(/\s/g, '_')
                });
            });
        }

        // Mannequin services
        if (category.id === 'mannequin') {
            category.services.forEach(service => {
                html += `<h3 style="margin: 1.5rem 0 1rem; font-size: 1rem;">${service.type}</h3>`;
                service.variants.forEach(variant => {
                    html += this.createServiceItem({
                        name: `${service.type} - ${variant.method}`,
                        price: variant.price,
                        description: variant.description || '',
                        id: `mannequin_${service.type}_${variant.method}`.replace(/\s/g, '_')
                    });
                });
            });
        }

        // Textile packages
        if (category.packages) {
            category.packages.forEach(pkg => {
                html += `<h3 style="margin: 1.5rem 0 1rem; font-size: 1.1rem; color: var(--primary-color);">${pkg.category}</h3>`;
                pkg.tariffs.forEach(tariff => {
                    html += this.createServiceItem({
                        name: tariff.name,
                        price: tariff.price,
                        id: `${category.id}_${pkg.category}_${tariff.name}`.replace(/\s/g, '_')
                    });
                });
            });
        }

        // Model shoot services
        if (category.id === 'model_shoot') {
            category.services.forEach(service => {
                html += this.createServiceItem({
                    name: service.type,
                    price: service.price,
                    description: service.description || '',
                    unit: service.unit || 'услуга',
                    id: `model_${service.type}`.replace(/\s/g, '_')
                });
            });
        }

        // Studio rent
        if (category.studios) {
            category.studios.forEach(studio => {
                html += `<h3 style="margin: 1.5rem 0 1rem; font-size: 1.1rem; color: var(--primary-color);">${studio.name}</h3>`;
                html += this.createServiceItem({
                    name: `${studio.name} - Будни (час)`,
                    price: studio.weekday_hour,
                    unit: 'час',
                    id: `studio_${studio.name}_weekday_hour`.replace(/\s/g, '_')
                });
                html += this.createServiceItem({
                    name: `${studio.name} - Выходные (час)`,
                    price: studio.weekend_hour,
                    unit: 'час',
                    id: `studio_${studio.name}_weekend_hour`.replace(/\s/g, '_')
                });
                html += this.createServiceItem({
                    name: `${studio.name} - Будни (смена 6ч)`,
                    price: studio.weekday_shift,
                    description: studio.description,
                    id: `studio_${studio.name}_weekday_shift`.replace(/\s/g, '_')
                });
                html += this.createServiceItem({
                    name: `${studio.name} - Выходные (смена 6ч)`,
                    price: studio.weekend_shift,
                    description: studio.description,
                    id: `studio_${studio.name}_weekend_shift`.replace(/\s/g, '_')
                });
            });
        }

        return html;
    }

    renderPostproduction() {
        let html = '';
        this.pricesData.postproduction.services.forEach(category => {
            html += `<h3 style="margin: 1.5rem 0 1rem; font-size: 1.1rem; color: var(--primary-color);">${category.category}</h3>`;
            category.items.forEach(item => {
                html += this.createServiceItem({
                    name: item.name,
                    price: item.price,
                    id: `post_${category.category}_${item.name}`.replace(/\s/g, '_')
                });
            });
        });
        return html;
    }

    renderAdditionalServices() {
        let html = '';
        this.pricesData.additional_services.services.forEach(service => {
            html += this.createServiceItem({
                name: service.name,
                price: service.price,
                unit: service.unit || 'услуга',
                id: `add_${service.name}`.replace(/\s/g, '_')
            });
        });
        return html;
    }

    createServiceItem(service) {
        const unitText = service.unit ? `/${service.unit}` : '';
        const isInCart = this.cart.some(item => item.id === service.id);

        return `
            <div class="service-item">
                <div class="service-header">
                    <div class="service-name">${service.name}</div>
                    <div class="service-price">${this.formatPrice(service.price)}${unitText}</div>
                </div>
                ${service.description ? `<div class="service-description">${service.description}</div>` : ''}
                <div class="service-actions">
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="app.changeQuantity('${service.id}', -1)">−</button>
                        <span class="quantity-value" id="qty_${service.id}">1</span>
                        <button class="quantity-btn" onclick="app.changeQuantity('${service.id}', 1)">+</button>
                    </div>
                    <button class="add-to-cart-btn ${isInCart ? 'added' : ''}" onclick="app.addToCart(${JSON.stringify(service).replace(/"/g, '&quot;')})">
                        ${isInCart ? '✓ Добавлено' : '+ Добавить'}
                    </button>
                </div>
            </div>
        `;
    }

    changeQuantity(serviceId, delta) {
        const qtyElement = document.getElementById(`qty_${serviceId}`);
        if (!qtyElement) return;

        let currentQty = parseInt(qtyElement.textContent);
        currentQty = Math.max(1, currentQty + delta);
        qtyElement.textContent = currentQty;
    }

    addToCart(service) {
        const qtyElement = document.getElementById(`qty_${service.id}`);
        const quantity = qtyElement ? parseInt(qtyElement.textContent) : 1;

        // Check if already in cart
        const existingIndex = this.cart.findIndex(item => item.id === service.id);

        if (existingIndex !== -1) {
            // Update quantity
            this.cart[existingIndex].quantity += quantity;
        } else {
            // Add new item
            this.cart.push({
                ...service,
                quantity: quantity
            });
        }

        this.renderCart();
        this.saveCartToStorage();

        // Update button state
        const button = event.target;
        button.classList.add('added');
        button.textContent = '✓ Добавлено';
        setTimeout(() => {
            button.classList.remove('added');
            button.textContent = '+ Добавить';
        }, 1500);

        // Reset quantity to 1
        if (qtyElement) qtyElement.textContent = '1';
    }

    removeFromCart(serviceId) {
        this.cart = this.cart.filter(item => item.id !== serviceId);
        this.renderCart();
        this.saveCartToStorage();
    }

    renderCart() {
        const cartItems = document.getElementById('cartItems');
        const cartFooter = document.getElementById('cartFooter');

        if (this.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <div class="empty-icon">🛒</div>
                    <p>Выберите услуги из категорий</p>
                </div>
            `;
            cartFooter.style.display = 'none';
            return;
        }

        let html = '';
        this.cart.forEach(item => {
            const total = item.price * item.quantity;
            const unitText = item.unit ? `/${item.unit}` : '';

            html += `
                <div class="cart-item">
                    <div class="cart-item-header">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">${this.formatPrice(total)}</div>
                    </div>
                    <div class="cart-item-details">
                        ${this.formatPrice(item.price)}${unitText} × ${item.quantity}
                    </div>
                    <div class="cart-item-footer">
                        <button class="remove-btn" onclick="app.removeFromCart('${item.id}')">Удалить</button>
                    </div>
                </div>
            `;
        });

        cartItems.innerHTML = html;
        cartFooter.style.display = 'block';
        this.updateTotals();
    }

    updateTotals() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        document.getElementById('subtotal').textContent = this.formatPrice(subtotal);

        const discountPercent = parseFloat(document.getElementById('discountPercent').value) || 0;
        const discountAmount = parseFloat(document.getElementById('discountAmount').value) || 0;

        let discount = 0;
        if (discountPercent > 0) {
            discount = subtotal * (discountPercent / 100);
        } else if (discountAmount > 0) {
            discount = discountAmount;
        }

        document.getElementById('discountValue').textContent = `-${this.formatPrice(discount)}`;

        const total = Math.max(0, subtotal - discount);
        document.getElementById('totalAmount').textContent = this.formatPrice(total);
    }

    updateDiscount(type, value) {
        if (type === 'percent') {
            document.getElementById('discountAmount').value = '';
        } else {
            document.getElementById('discountPercent').value = '';
        }
        this.updateTotals();
    }

    clearCart() {
        if (this.cart.length === 0) return;

        if (confirm('Очистить все выбранные услуги?')) {
            this.cart = [];
            this.renderCart();
            this.saveCartToStorage();
        }
    }

    showCategories() {
        document.querySelector('.categories-section').style.display = 'block';
        document.querySelector('.services-section').style.display = 'none';
        this.currentCategory = null;
    }

    saveCalculation() {
        if (this.cart.length === 0) {
            alert('Корзина пуста!');
            return;
        }

        const clientName = document.getElementById('clientName').value || 'Без имени';
        const clientPhone = document.getElementById('clientPhone').value;
        const projectName = document.getElementById('projectName').value;
        const notes = document.getElementById('notes').value;

        const calculation = {
            id: Date.now(),
            date: new Date().toISOString(),
            clientName,
            clientPhone,
            projectName,
            cart: [...this.cart],
            notes,
            subtotal: this.calculateSubtotal(),
            discount: this.calculateDiscount(),
            total: this.calculateTotal()
        };

        // Save to localStorage
        const history = JSON.parse(localStorage.getItem('calculationHistory') || '[]');
        history.unshift(calculation);
        // Keep only last 50 calculations
        if (history.length > 50) history.pop();
        localStorage.setItem('calculationHistory', JSON.stringify(history));

        alert('Расчет сохранен!');
    }

    showHistory() {
        const history = JSON.parse(localStorage.getItem('calculationHistory') || '[]');
        const content = document.getElementById('historyContent');

        if (history.length === 0) {
            content.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">История пуста</p>';
        } else {
            let html = '';
            history.forEach(calc => {
                const date = new Date(calc.date).toLocaleString('ru-RU');
                html += `
                    <div class="history-item" onclick="app.loadCalculation(${calc.id})">
                        <div class="history-item-header">
                            <div class="history-item-title">${calc.clientName}${calc.projectName ? ` - ${calc.projectName}` : ''}</div>
                            <div class="history-item-date">${date}</div>
                        </div>
                        <div class="history-item-details">
                            ${calc.cart.length} услуг • Итого: ${this.formatPrice(calc.total)}
                        </div>
                    </div>
                `;
            });
            content.innerHTML = html;
        }

        document.getElementById('historyModal').style.display = 'flex';
    }

    loadCalculation(id) {
        const history = JSON.parse(localStorage.getItem('calculationHistory') || '[]');
        const calc = history.find(c => c.id === id);

        if (!calc) return;

        this.cart = [...calc.cart];
        document.getElementById('clientName').value = calc.clientName || '';
        document.getElementById('clientPhone').value = calc.clientPhone || '';
        document.getElementById('projectName').value = calc.projectName || '';
        document.getElementById('notes').value = calc.notes || '';

        this.renderCart();
        this.closeModal('historyModal');
        this.showCategories();
    }

    generateProposal() {
        if (this.cart.length === 0) {
            alert('Корзина пуста!');
            return;
        }

        const clientName = document.getElementById('clientName').value || 'Клиент';
        const projectName = document.getElementById('projectName').value || 'Проект';
        const notes = document.getElementById('notes').value;

        let html = `
            <h1>Коммерческое предложение</h1>
            <p><strong>Клиент:</strong> ${clientName}</p>
            <p><strong>Проект:</strong> ${projectName}</p>
            <p><strong>Дата:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>

            <h2>Состав услуг</h2>
            <table>
                <thead>
                    <tr>
                        <th>Наименование</th>
                        <th>Цена</th>
                        <th>Кол-во</th>
                        <th>Сумма</th>
                    </tr>
                </thead>
                <tbody>
        `;

        this.cart.forEach(item => {
            const total = item.price * item.quantity;
            html += `
                <tr>
                    <td>${item.name}</td>
                    <td>${this.formatPrice(item.price)}</td>
                    <td>${item.quantity}</td>
                    <td>${this.formatPrice(total)}</td>
                </tr>
            `;
        });

        const subtotal = this.calculateSubtotal();
        const discount = this.calculateDiscount();
        const total = this.calculateTotal();

        html += `
                </tbody>
            </table>

            <div style="margin-top: 1.5rem; text-align: right;">
                <p><strong>Подытог:</strong> ${this.formatPrice(subtotal)}</p>
                ${discount > 0 ? `<p style="color: var(--danger-color);"><strong>Скидка:</strong> -${this.formatPrice(discount)}</p>` : ''}
                <p style="font-size: 1.25rem; color: var(--primary-color);"><strong>Итого:</strong> ${this.formatPrice(total)}</p>
            </div>
        `;

        if (notes) {
            html += `
                <h2>Комментарии</h2>
                <p>${notes.replace(/\n/g, '<br>')}</p>
            `;
        }

        document.getElementById('proposalContent').innerHTML = html;
        document.getElementById('proposalModal').style.display = 'flex';
    }

    copyProposalToClipboard() {
        const content = document.getElementById('proposalContent');
        const text = content.innerText;

        navigator.clipboard.writeText(text).then(() => {
            alert('Коммерческое предложение скопировано в буфер обмена!');
        }).catch(err => {
            console.error('Ошибка копирования:', err);
        });
    }

    printCalculation() {
        if (this.cart.length === 0) {
            alert('Корзина пуста!');
            return;
        }
        this.generateProposal();
        setTimeout(() => window.print(), 300);
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    calculateSubtotal() {
        return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    calculateDiscount() {
        const subtotal = this.calculateSubtotal();
        const discountPercent = parseFloat(document.getElementById('discountPercent').value) || 0;
        const discountAmount = parseFloat(document.getElementById('discountAmount').value) || 0;

        if (discountPercent > 0) {
            return subtotal * (discountPercent / 100);
        }
        return discountAmount;
    }

    calculateTotal() {
        const subtotal = this.calculateSubtotal();
        const discount = this.calculateDiscount();
        return Math.max(0, subtotal - discount);
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }

    saveCartToStorage() {
        localStorage.setItem('currentCart', JSON.stringify(this.cart));
    }

    loadCartFromStorage() {
        const saved = localStorage.getItem('currentCart');
        if (saved) {
            this.cart = JSON.parse(saved);
            this.renderCart();
        }
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ShootingCalculator();
});
