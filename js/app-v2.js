// Shooting Calculator V2.0 - С учетом маржинальности
class ShootingCalculatorV2 {
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
            // Используем встроенные данные из window.PRICES_DATA_V2
            if (window.PRICES_DATA_V2) {
                this.pricesData = window.PRICES_DATA_V2;
                console.log('✅ Прайс-лист V2.0 загружен успешно с данными маржинальности!');
            } else {
                throw new Error('Данные прайс-листа V2 не найдены');
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
        document.getElementById('closePortfolioModal').addEventListener('click', () => this.closeModal('portfolioModal'));

        // Proposal actions
        document.getElementById('copyToClipboardBtn').addEventListener('click', () => this.copyProposalToClipboard());
        document.getElementById('printProposalBtn').addEventListener('click', () => window.print());

        // Click outside modal to close
        ['historyModal', 'proposalModal', 'portfolioModal'].forEach(modalId => {
            document.getElementById(modalId).addEventListener('click', (e) => {
                if (e.target.id === modalId) this.closeModal(modalId);
            });
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
            description: this.pricesData.postproduction.description
        });
        grid.appendChild(postCard);

        // Additional services
        const addCard = this.createCategoryCard({
            id: 'additional',
            name: this.pricesData.additional_services.name,
            icon: this.pricesData.additional_services.icon,
            description: 'Ассистенты, оборудование'
        });
        grid.appendChild(addCard);

        // Studio rent
        const studioCard = this.createCategoryCard({
            id: 'studio',
            name: this.pricesData.studio_rent.name,
            icon: this.pricesData.studio_rent.icon,
            description: this.pricesData.studio_rent.description
        });
        grid.appendChild(studioCard);
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
            this.addPortfolioButton(servicesContent, this.pricesData.postproduction.portfolio, 'Постпродакшн');
        } else if (categoryId === 'additional') {
            title.textContent = this.pricesData.additional_services.name;
            servicesContent.innerHTML = this.renderAdditionalServices();
        } else if (categoryId === 'studio') {
            title.textContent = this.pricesData.studio_rent.name;
            servicesContent.innerHTML = this.renderStudioRent();
            this.addPortfolioButton(servicesContent, this.pricesData.studio_rent.portfolio, 'Студия');
        } else {
            const category = this.pricesData.categories.find(c => c.id === categoryId);
            title.textContent = category.name;
            servicesContent.innerHTML = this.renderCategoryServices(category);
            if (category.portfolio) {
                this.addPortfolioButton(servicesContent, category.portfolio, category.name);
            }
        }
    }

    addPortfolioButton(container, portfolio, categoryName) {
        if (!portfolio || portfolio.length === 0) return;

        const button = document.createElement('button');
        button.className = 'portfolio-button';
        button.innerHTML = '📸 Посмотреть портфолио';
        button.onclick = () => this.showPortfolio(portfolio, categoryName);

        const existingButton = container.querySelector('.portfolio-button');
        if (existingButton) {
            existingButton.remove();
        }

        container.insertBefore(button, container.firstChild);
    }

    renderCategoryServices(category) {
        let html = '';

        // Sprint packages with subcategories
        if (category.subcategories) {
            category.subcategories.forEach(sub => {
                html += `<h3 style="margin: 1.5rem 0 1rem; font-size: 1.1rem; color: var(--primary-color);">${sub.name}</h3>`;
                sub.packages.forEach(pkg => {
                    html += this.createServiceItemV2(pkg, category.id);
                });
            });
        }

        // Regular services
        if (category.services) {
            category.services.forEach(service => {
                html += this.createServiceItemV2(service, category.id);
            });
        }

        // Items (predmet, shoes, etc)
        if (category.items) {
            category.items.forEach(item => {
                html += this.createServiceItemV2({
                    ...item,
                    name: item.category || item.type,
                    id: category.id + '_' + (item.category || item.type).replace(/\s/g, '_')
                }, category.id);
            });
        }

        return html;
    }

    renderPostproduction() {
        let html = '';
        this.pricesData.postproduction.services.forEach(category => {
            html += `<h3 style="margin: 1.5rem 0 1rem; font-size: 1.1rem; color: var(--primary-color);">${category.category}</h3>`;
            category.items.forEach(item => {
                html += this.createServiceItemV2({
                    ...item,
                    id: `post_${category.category}_${item.name}`.replace(/\s/g, '_')
                }, 'postproduction');
            });
        });
        return html;
    }

    renderAdditionalServices() {
        let html = '';
        this.pricesData.additional_services.services.forEach(service => {
            html += this.createServiceItemV2({
                ...service,
                id: `add_${service.name}`.replace(/\s/g, '_')
            }, 'additional');
        });
        return html;
    }

    renderStudioRent() {
        let html = '';
        this.pricesData.studio_rent.studios.forEach(studio => {
            html += this.createServiceItemV2({
                ...studio,
                id: `studio_${studio.name}`.replace(/\s/g, '_')
            }, 'studio');
        });
        return html;
    }

    createServiceItemV2(service, categoryId) {
        const unitText = service.unit ? `/${service.unit}` : '';
        const isInCart = this.cart.some(item => item.id === service.id);

        // Создаем бейджи
        const badges = this.createServiceBadges(service);

        // Создаем блок себестоимости
        const costBreakdownHtml = service.costBreakdown ?
            `<div class="cost-breakdown" data-margin="${this.getMarginLevel(service.marginPercent)}">
                <div class="cost-breakdown-title">Себестоимость:</div>
                <div class="cost-breakdown-value">${service.costBreakdown}</div>
            </div>` : '';

        return `
            <div class="service-item">
                <div class="service-header">
                    <div class="service-name">${service.name}</div>
                    <div class="service-price">${this.formatPrice(service.price)}${unitText}</div>
                </div>
                ${service.description ? `<div class="service-description">${service.description}</div>` : ''}
                ${badges}
                ${costBreakdownHtml}
                ${service.notes ? `<div class="service-description" style="color: #dc2626; font-weight: 600; margin-top: 8px;">⚠️ ${service.notes}</div>` : ''}
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

    createServiceBadges(service) {
        let badgesHtml = '<div class="service-badges">';

        // Бейдж ретуши
        if (service.includesRetouch) {
            badgesHtml += '<span class="badge badge-retouch">🎨 С ретушью</span>';
        } else if (service.includesRetouch === false && (service.marginPercent !== undefined)) {
            badgesHtml += '<span class="badge badge-no-retouch">📸 Без ретуши</span>';
        }

        // Бейдж нулевой маржи
        if (service.zeroMargin) {
            badgesHtml += '<span class="badge badge-zero-margin">⚠️ 0% маржа</span>';
        }

        // Бейдж маржинальности
        if (service.marginPercent !== undefined) {
            const marginLevel = this.getMarginLevel(service.marginPercent);
            badgesHtml += `<span class="badge badge-margin margin-${marginLevel}">📊 ${service.marginPercent}% маржа</span>`;
        }

        badgesHtml += '</div>';
        return badgesHtml;
    }

    getMarginLevel(marginPercent) {
        if (marginPercent >= 70) return 'high';
        if (marginPercent >= 40) return 'medium';
        if (marginPercent >= 20) return 'low';
        return 'zero';
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
        this.updateMarginDashboard();
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

    updateCartQuantity(serviceId, delta) {
        const item = this.cart.find(i => i.id === serviceId);
        if (!item) return;

        item.quantity = Math.max(1, item.quantity + delta);

        this.renderCart();
        this.updateMarginDashboard();
        this.saveCartToStorage();
    }

    removeFromCart(serviceId) {
        this.cart = this.cart.filter(item => item.id !== serviceId);
        this.renderCart();
        this.updateMarginDashboard();
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

            // Добавляем бейджи для элементов корзины
            const badges = this.createServiceBadges(item);

            html += `
                <div class="cart-item">
                    <div class="cart-item-header">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">${this.formatPrice(total)}</div>
                    </div>
                    <div class="cart-item-details">
                        ${this.formatPrice(item.price)}${unitText} × ${item.quantity}
                    </div>
                    ${badges}
                    <div class="cart-item-footer">
                        <div class="cart-quantity-control">
                            <button class="cart-qty-btn" onclick="app.updateCartQuantity('${item.id}', -1)">−</button>
                            <span class="cart-qty-value">${item.quantity}</span>
                            <button class="cart-qty-btn" onclick="app.updateCartQuantity('${item.id}', 1)">+</button>
                        </div>
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
        } else {
            discount = discountAmount;
        }

        const total = Math.max(0, subtotal - discount);

        document.getElementById('discountValue').textContent = `-${this.formatPrice(discount)}`;
        document.getElementById('totalAmount').textContent = this.formatPrice(total);
    }

    updateMarginDashboard() {
        const dashboard = document.getElementById('marginDashboard');

        if (this.cart.length === 0) {
            dashboard.style.display = 'none';
            return;
        }

        dashboard.style.display = 'block';

        // Рассчитываем итоговые значения
        let totalPrice = 0;
        let totalCost = 0;
        let hasZeroMargin = false;

        this.cart.forEach(item => {
            const itemPrice = (item.price || 0) * (item.quantity || 1);
            const itemCost = (item.cost || 0) * (item.quantity || 1);

            totalPrice += itemPrice;
            totalCost += itemCost;

            if (item.zeroMargin) {
                hasZeroMargin = true;
            }
        });

        const totalMargin = totalPrice - totalCost;
        const marginPercent = totalPrice > 0 ? Math.round((totalMargin / totalPrice) * 100) : 0;

        // Обновляем значения
        document.getElementById('totalClientPrice').textContent = this.formatPrice(totalPrice);
        document.getElementById('totalCost').textContent = this.formatPrice(totalCost);
        document.getElementById('totalMargin').textContent = `${this.formatPrice(totalMargin)} (${marginPercent}%)`;

        // Обновляем прогресс-бар
        const progressFill = document.getElementById('marginProgressFill');
        const progressLabel = document.getElementById('marginProgressLabel');
        const marginLevel = this.getMarginLevel(marginPercent);

        progressFill.style.width = `${Math.min(marginPercent, 100)}%`;
        progressFill.setAttribute('data-margin', marginLevel);
        progressLabel.textContent = `${marginPercent}%`;

        // Показываем/скрываем предупреждение
        const alert = document.getElementById('zeroMarginAlert');
        alert.style.display = hasZeroMargin ? 'flex' : 'none';

        // Добавляем список услуг в панель маржинальности
        this.updateMarginServicesList();
    }

    updateMarginServicesList() {
        // Проверяем есть ли контейнер, если нет - создаем
        let servicesListContainer = document.getElementById('marginServicesList');

        if (!servicesListContainer) {
            // Создаем контейнер после легенды
            const legend = document.querySelector('.margin-legend');
            servicesListContainer = document.createElement('div');
            servicesListContainer.id = 'marginServicesList';
            servicesListContainer.className = 'margin-services-list';
            legend.parentNode.insertBefore(servicesListContainer, legend.nextSibling);
        }

        // Генерируем список услуг
        let html = '<div class="margin-services-header">📋 Услуги в проекте:</div>';
        html += '<div class="margin-services-items">';

        this.cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            const itemMargin = ((item.marginPercent || 0)).toFixed(0);
            const marginClass = this.getMarginLevel(item.marginPercent || 0);

            html += `
                <div class="margin-service-row">
                    <div class="margin-service-name">
                        ${item.name}
                        <span class="margin-service-qty">× ${item.quantity}</span>
                    </div>
                    <div class="margin-service-values">
                        <span class="margin-service-price">${this.formatPrice(itemTotal)}</span>
                        <span class="margin-service-margin margin-${marginClass}">${itemMargin}%</span>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        servicesListContainer.innerHTML = html;
    }

    updateDiscount(type, value) {
        if (type === 'percent') {
            document.getElementById('discountAmount').value = '';
        } else {
            document.getElementById('discountPercent').value = '';
        }
        this.updateTotals();
    }

    showCategories() {
        document.querySelector('.categories-section').style.display = 'block';
        document.querySelector('.services-section').style.display = 'none';
    }

    clearCart() {
        if (this.cart.length === 0) return;

        if (confirm('Очистить корзину?')) {
            this.cart = [];
            this.renderCart();
            this.updateMarginDashboard();
            this.saveCartToStorage();
        }
    }

    showPortfolio(portfolio, categoryName) {
        const modal = document.getElementById('portfolioModal');
        const title = document.getElementById('portfolioModalTitle');
        const content = document.getElementById('portfolioContent');

        title.textContent = `Портфолио: ${categoryName}`;

        let html = '';
        portfolio.forEach(item => {
            const icon = item.type === 'youtube' ? '🎥' :
                        item.type === 'yandex_disk' ? '💾' : '🌐';

            html += `
                <div class="portfolio-item">
                    <div class="portfolio-icon">${icon}</div>
                    <h4 class="portfolio-title">${item.title}</h4>
                    <p class="portfolio-type">${item.type.replace('_', ' ')}</p>
                    <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="portfolio-link-btn">
                        Открыть ↗
                    </a>
                </div>
            `;
        });

        content.innerHTML = html;
        modal.style.display = 'flex';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    saveCalculation() {
        if (this.cart.length === 0) {
            alert('Корзина пуста!');
            return;
        }

        const clientName = document.getElementById('clientName').value || 'Без имени';
        const calculation = {
            id: Date.now(),
            date: new Date().toISOString(),
            clientName: clientName,
            clientPhone: document.getElementById('clientPhone').value,
            projectName: document.getElementById('projectName').value,
            items: this.cart,
            discount: {
                percent: document.getElementById('discountPercent').value,
                amount: document.getElementById('discountAmount').value
            },
            notes: document.getElementById('notes').value,
            totals: this.calculateTotals()
        };

        const history = this.getHistory();
        history.unshift(calculation);

        // Ограничиваем до 50 записей
        if (history.length > 50) {
            history.pop();
        }

        localStorage.setItem('calculation_history_v2', JSON.stringify(history));
        alert(`✅ Расчет сохранен для клиента: ${clientName}`);
    }

    calculateTotals() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const totalCost = this.cart.reduce((sum, item) => sum + ((item.cost || 0) * item.quantity), 0);

        const discountPercent = parseFloat(document.getElementById('discountPercent').value) || 0;
        const discountAmount = parseFloat(document.getElementById('discountAmount').value) || 0;

        let discount = 0;
        if (discountPercent > 0) {
            discount = subtotal * (discountPercent / 100);
        } else {
            discount = discountAmount;
        }

        const total = Math.max(0, subtotal - discount);
        const totalMargin = total - totalCost;
        const marginPercent = total > 0 ? Math.round((totalMargin / total) * 100) : 0;

        return {
            subtotal,
            discount,
            total,
            totalCost,
            totalMargin,
            marginPercent
        };
    }

    getHistory() {
        const stored = localStorage.getItem('calculation_history_v2');
        return stored ? JSON.parse(stored) : [];
    }

    showHistory() {
        const history = this.getHistory();
        const content = document.getElementById('historyContent');

        if (history.length === 0) {
            content.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">История пуста</p>';
        } else {
            let html = '';
            history.forEach(calc => {
                const date = new Date(calc.date).toLocaleString('ru-RU');
                html += `
                    <div class="history-item" style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <strong>${calc.clientName}</strong>
                            <span style="color: #6b7280; font-size: 0.9rem;">${date}</span>
                        </div>
                        ${calc.projectName ? `<div style="color: #6b7280; margin-bottom: 8px;">${calc.projectName}</div>` : ''}
                        <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                            <span>Итого:</span>
                            <strong style="color: #2563eb;">${this.formatPrice(calc.totals.total)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 0.9rem;">
                            <span style="color: #6b7280;">Маржа:</span>
                            <span style="color: #059669; font-weight: 600;">${this.formatPrice(calc.totals.totalMargin)} (${calc.totals.marginPercent}%)</span>
                        </div>
                        <button onclick="app.loadCalculation(${calc.id})" style="width: 100%; margin-top: 12px; padding: 8px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer;">Загрузить</button>
                    </div>
                `;
            });
            content.innerHTML = html;
        }

        document.getElementById('historyModal').style.display = 'flex';
    }

    loadCalculation(calcId) {
        const history = this.getHistory();
        const calc = history.find(c => c.id === calcId);

        if (!calc) return;

        // Загружаем данные
        document.getElementById('clientName').value = calc.clientName || '';
        document.getElementById('clientPhone').value = calc.clientPhone || '';
        document.getElementById('projectName').value = calc.projectName || '';
        document.getElementById('notes').value = calc.notes || '';
        document.getElementById('discountPercent').value = calc.discount?.percent || '';
        document.getElementById('discountAmount').value = calc.discount?.amount || '';

        this.cart = calc.items;
        this.renderCart();
        this.updateMarginDashboard();
        this.closeModal('historyModal');

        alert('✅ Расчет загружен!');
    }

    generateProposal() {
        if (this.cart.length === 0) {
            alert('Корзина пуста!');
            return;
        }

        const clientName = document.getElementById('clientName').value || 'Уважаемый клиент';
        const projectName = document.getElementById('projectName').value || 'Ваш проект';
        const totals = this.calculateTotals();

        let html = `
            <div style="max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif;">
                <div style="text-align: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 3px solid #2563eb;">
                    <h1 style="color: #2563eb; margin: 0;">Коммерческое предложение</h1>
                    <p style="color: #6b7280; margin-top: 0.5rem;">${new Date().toLocaleDateString('ru-RU')}</p>
                </div>

                <div style="margin-bottom: 2rem;">
                    <h2 style="color: #111827; font-size: 1.3rem;">Клиент: ${clientName}</h2>
                    <h3 style="color: #6b7280; font-size: 1.1rem; font-weight: normal;">Проект: ${projectName}</h3>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem;">
                    <thead>
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Услуга</th>
                            <th style="padding: 12px; text-align: center; border: 1px solid #e5e7eb;">Кол-во</th>
                            <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">Цена</th>
                            <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">Сумма</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        this.cart.forEach(item => {
            const total = item.price * item.quantity;
            const unitText = item.unit ? `/${item.unit}` : '';

            html += `
                <tr>
                    <td style="padding: 12px; border: 1px solid #e5e7eb;">
                        ${item.name}
                        ${item.includesRetouch ? '<span style="color: #2563eb; font-size: 0.8rem;"> (с ретушью)</span>' : ''}
                    </td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e5e7eb;">${item.quantity}</td>
                    <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">${this.formatPrice(item.price)}${unitText}</td>
                    <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; font-weight: 600;">${this.formatPrice(total)}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;"><strong>Подытог:</strong></td>
                            <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; font-weight: 600;">${this.formatPrice(totals.subtotal)}</td>
                        </tr>
        `;

        if (totals.discount > 0) {
            html += `
                        <tr style="background: #fef3c7;">
                            <td colspan="3" style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;"><strong>Скидка:</strong></td>
                            <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #f59e0b; font-weight: 600;">-${this.formatPrice(totals.discount)}</td>
                        </tr>
            `;
        }

        html += `
                        <tr style="background: #dbeafe;">
                            <td colspan="3" style="padding: 16px; text-align: right; border: 1px solid #e5e7eb; font-size: 1.2rem;"><strong>ИТОГО:</strong></td>
                            <td style="padding: 16px; text-align: right; border: 1px solid #e5e7eb; color: #2563eb; font-size: 1.3rem; font-weight: 700;">${this.formatPrice(totals.total)}</td>
                        </tr>
                    </tfoot>
                </table>
        `;

        const notes = document.getElementById('notes').value;
        if (notes) {
            html += `
                <div style="background: #f9fafb; padding: 1rem; border-left: 4px solid #2563eb; margin-bottom: 2rem;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #111827;">Примечания:</h4>
                    <p style="margin: 0; color: #6b7280; white-space: pre-wrap;">${notes}</p>
                </div>
            `;
        }

        html += `
                <div style="text-align: center; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 0.9rem;">
                    <p>Создано с помощью Конструктора Съемки 2.0</p>
                    <p style="margin-top: 0.5rem;">С уважением, команда производства</p>
                </div>
            </div>
        `;

        document.getElementById('proposalContent').innerHTML = html;
        document.getElementById('proposalModal').style.display = 'flex';
    }

    copyProposalToClipboard() {
        const content = document.getElementById('proposalContent').innerText;
        navigator.clipboard.writeText(content).then(() => {
            alert('✅ КП скопировано в буфер обмена!');
        }).catch(err => {
            console.error('Ошибка копирования:', err);
            alert('❌ Не удалось скопировать');
        });
    }

    printCalculation() {
        window.print();
    }

    saveCartToStorage() {
        localStorage.setItem('cart_v2', JSON.stringify(this.cart));
    }

    loadCartFromStorage() {
        const stored = localStorage.getItem('cart_v2');
        if (stored) {
            try {
                this.cart = JSON.parse(stored);
                this.renderCart();
                this.updateMarginDashboard();
            } catch (e) {
                console.error('Ошибка загрузки корзины:', e);
            }
        }
    }

    formatPrice(value) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }
}

// Инициализация приложения
const app = new ShootingCalculatorV2();
