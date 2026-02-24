// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, fetching products...');
    
    // Load products from JSON
    fetch('products.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Products loaded:', data);
            if (data && data.products && data.products.length > 0) {
                renderFeatured(data.products[0]); // First product as featured
                renderAllProducts(data.products);
                setupFilters(data.products);
                setupCategoryLinks(data.products);
            } else {
                showError('No products found in JSON');
            }
        })
        .catch(error => {
            console.error('Error loading products:', error);
            showError('Failed to load products. Please check console.');
        });

    // Render featured product
    function renderFeatured(product) {
        const featuredDiv = document.getElementById('featured-product');
        if (!featuredDiv) {
            console.error('Featured container not found');
            return;
        }

        const imageHtml = product.image 
            ? `<img src="${product.image}" alt="${product.title}" loading="lazy">`
            : `<div style="width:100%; height:100%; background:#333; display:flex; align-items:center; justify-content:center; color:#999;">No image</div>`;

        const statsHtml = product.rating ? `
            <div class="featured-stats">
                <div class="stat-item">
                    <span class="stat-number">${product.rating}</span>
                    <span class="stat-label">Rating</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${product.reviews || '1k+'}</span>
                    <span class="stat-label">Reviews</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${product.price || '$$$'}</span>
                    <span class="stat-label">Price</span>
                </div>
            </div>
        ` : '';

        featuredDiv.innerHTML = `
            <div class="featured-image">
                ${imageHtml}
            </div>
            <div class="featured-info">
                <span class="featured-badge">${product.category || 'Featured'}</span>
                <h3 class="featured-title">${product.title}</h3>
                <p class="featured-description">${product.description || 'No description available'}</p>
                ${statsHtml}
                <a href="${product.affiliate_link || '#'}" target="_blank" rel="nofollow" class="btn btn-primary" style="width: fit-content;">
                    Check Price <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        `;
    }

    // Render all products in grid
    function renderAllProducts(products) {
        const grid = document.getElementById('products-grid');
        if (!grid) {
            console.error('Products grid not found');
            return;
        }

        if (products.length === 0) {
            grid.innerHTML = '<div class="loading">No products available</div>';
            return;
        }

        grid.innerHTML = products.map(product => `
            <div class="product-card" data-category="${product.category?.toLowerCase() || 'other'}">
                <div class="product-image">
                    ${product.image 
                        ? `<img src="${product.image}" alt="${product.title}" loading="lazy">`
                        : `<div style="width:100%; height:100%; background:#333; display:flex; align-items:center; justify-content:center; color:#999;">No image</div>`
                    }
                </div>
                <div class="product-content">
                    <span class="product-category">${product.category || 'Uncategorized'}</span>
                    <h3 class="product-title">${product.title}</h3>
                    <p class="product-description">${product.description || 'No description'}</p>
                    <div class="product-footer">
                        <span class="product-price">${product.price || 'Check price'}</span>
                        <a href="${product.affiliate_link || '#'}" target="_blank" rel="nofollow" class="product-link">
                            <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
        
        console.log('Products rendered:', products.length);
    }

    // Setup category filters
    function setupFilters(products) {
        const filterBtns = document.querySelectorAll('.filter-btn');
        if (!filterBtns.length) {
            console.warn('Filter buttons not found');
            return;
        }
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Update active state
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                const filter = this.dataset.filter;
                const cards = document.querySelectorAll('.product-card');
                
                cards.forEach(card => {
                    if (filter === 'all') {
                        card.style.display = 'flex';
                    } else {
                        const category = card.dataset.category;
                        card.style.display = category === filter ? 'flex' : 'none';
                    }
                });
            });
        });
    }

    // Setup category links in footer
    function setupCategoryLinks(products) {
        document.querySelectorAll('.footer-column a[data-filter]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const filter = link.dataset.filter;
                
                // Scroll to products section
                document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
                
                // Trigger filter
                const filterBtn = document.querySelector(`.filter-btn[data-filter="${filter}"]`);
                if (filterBtn) {
                    filterBtn.click();
                }
            });
        });
    }

    // Error handler
    function showError(message) {
        console.error(message);
        const elements = ['featured-product', 'products-grid'];
        elements.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.innerHTML = `<div class="loading">${message}</div>`;
            }
        });
    }

    // Mobile menu functionality
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileBtn && mobileMenu) {
        mobileBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            mobileBtn.innerHTML = mobileMenu.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
        
        // Close mobile menu when clicking a link
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                mobileBtn.innerHTML = '<i class="fas fa-bars"></i>';
            });
        });
    }

    // Back to top button
    const backBtn = document.getElementById('backToTop');
    if (backBtn) {
        window.addEventListener('scroll', () => {
            backBtn.classList.toggle('visible', window.scrollY > 300);
        });
        
        backBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Smooth scroll for nav links
    document.querySelectorAll('nav a, .mobile-menu a, .btn[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
});