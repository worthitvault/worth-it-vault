// Search Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Search page loaded');
    
    // Global variables
    let allProducts = [];
    let postMappings = [];
    let currentResults = [];
    let currentRelated = [];
    let currentFilter = 'all';
    let currentView = 'grid';
    
    // DOM Elements
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearch');
    const filterChips = document.querySelectorAll('.filter-chip');
    const postPills = document.querySelectorAll('.post-pill');
    const examplePosts = document.querySelectorAll('.example-post');
    const suggestionPills = document.querySelectorAll('.suggestion-pill');
    const resultsHeader = document.getElementById('resultsHeader');
    const searchResults = document.getElementById('searchResults');
    const relatedSection = document.getElementById('relatedSection');
    const relatedGrid = document.getElementById('relatedProductsGrid');
    const rotateBtn = document.getElementById('rotateRelatedBtn');
    const gridViewBtn = document.getElementById('gridViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    const noResultsModal = document.getElementById('noResultsModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const searchTermDisplay = document.getElementById('searchTermDisplay');
    
    // Load data
    Promise.all([
        fetch('products.json').then(res => res.json()),
        fetch('post-numbers.json').then(res => res.json())
    ])
    .then(([productsData, postData]) => {
        allProducts = productsData.products;
        postMappings = postData.post_mappings;
        console.log('Data loaded:', { products: allProducts.length, posts: postMappings.length });
        
        // Set up event listeners after data loads
        setupEventListeners();
    })
    .catch(error => {
        console.error('Error loading data:', error);
        searchResults.innerHTML = '<div class="loading">Failed to load product data</div>';
    });
    
    // Setup event listeners
    function setupEventListeners() {
        // Search input
        searchInput.addEventListener('input', handleSearch);
        
        // Clear button
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchInput.focus();
            clearBtn.style.display = 'none';
            resetToPrompt();
        });
        
        // Show/hide clear button
        searchInput.addEventListener('keyup', function() {
            clearBtn.style.display = this.value ? 'block' : 'none';
        });
        
        // Filter chips
        filterChips.forEach(chip => {
            chip.addEventListener('click', function() {
                filterChips.forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.dataset.filter;
                if (searchInput.value) handleSearch();
            });
        });
        
        // Post number pills
        postPills.forEach(pill => {
            pill.addEventListener('click', (e) => {
                e.preventDefault();
                const postNum = pill.dataset.post;
                searchInput.value = postNum;
                clearBtn.style.display = 'block';
                performPostSearch(postNum);
            });
        });
        
        // Example posts
        examplePosts.forEach(post => {
            post.addEventListener('click', () => {
                const postNum = post.textContent;
                searchInput.value = postNum;
                clearBtn.style.display = 'block';
                performPostSearch(postNum);
            });
        });
        
        // Suggestion pills in modal
        suggestionPills.forEach(pill => {
            pill.addEventListener('click', function() {
                if (this.dataset.post) {
                    searchInput.value = this.dataset.post;
                    performPostSearch(this.dataset.post);
                } else if (this.dataset.category) {
                    searchInput.value = this.dataset.category;
                    currentFilter = 'category';
                    filterChips.forEach(c => {
                        c.classList.toggle('active', c.dataset.filter === 'category');
                    });
                    handleSearch();
                }
                noResultsModal.classList.remove('show');
            });
        });
        
        // View toggle
        gridViewBtn.addEventListener('click', () => {
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
            currentView = 'grid';
            if (currentResults.length > 0) {
                renderResults(currentResults);
            }
        });
        
        listViewBtn.addEventListener('click', () => {
            listViewBtn.classList.add('active');
            gridViewBtn.classList.remove('active');
            currentView = 'list';
            if (currentResults.length > 0) {
                renderResults(currentResults);
            }
        });
        
        // Rotate related products
        rotateBtn.addEventListener('click', () => {
            if (currentRelated.length > 0) {
                const shuffled = shuffleArray([...currentRelated]);
                renderRelatedProducts(shuffled);
            }
        });
        
        // Close modal
        closeModalBtn.addEventListener('click', () => {
            noResultsModal.classList.remove('show');
        });
        
        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target === noResultsModal) {
                noResultsModal.classList.remove('show');
            }
        });
        
        // Footer post links
        document.querySelectorAll('.footer-column a[data-post]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const postNum = link.dataset.post;
                searchInput.value = postNum.split(' ')[0].replace('#', '');
                clearBtn.style.display = 'block';
                performPostSearch(searchInput.value);
                
                // Scroll to search
                document.querySelector('.search-hero').scrollIntoView({ behavior: 'smooth' });
            });
        });
    }
    
    // Handle search input
    function handleSearch() {
        const query = searchInput.value.trim().toLowerCase();
        
        if (!query) {
            resetToPrompt();
            return;
        }
        
        // Check if it's a post number search
        if (query.match(/^\d+$/) || query.includes('post')) {
            const postNum = query.replace('post', '').trim();
            performPostSearch(postNum);
            return;
        }
        
        // Perform filtered search based on current filter
        let results = [];
        
        switch(currentFilter) {
            case 'post':
                results = searchByPostNumber(query);
                break;
            case 'category':
                results = searchByCategory(query);
                break;
            case 'product':
                results = searchByProductName(query);
                break;
            default: // 'all'
                results = searchAll(query);
        }
        
        displayResults(results, query);
    }
    
    // Search by post number
    function searchByPostNumber(query) {
        const postNum = query.replace(/\D/g, '');
        const mapping = postMappings.find(m => m.post_number === postNum);
        
        if (!mapping) return [];
        
        return allProducts.filter(product => 
            mapping.product_ids.includes(product.id)
        );
    }
    
    // Search by category
    function searchByCategory(query) {
        return allProducts.filter(product => 
            product.category.toLowerCase().includes(query.toLowerCase())
        );
    }
    
    // Search by product name
    function searchByProductName(query) {
        return allProducts.filter(product => 
            product.title.toLowerCase().includes(query.toLowerCase())
        );
    }
    
    // Search all fields
    function searchAll(query) {
        const results = [];
        
        // Check post numbers
        if (query.match(/^\d+$/)) {
            const postResults = searchByPostNumber(query);
            results.push(...postResults);
        }
        
        // Check categories
        const categoryResults = allProducts.filter(product => 
            product.category.toLowerCase().includes(query.toLowerCase()) &&
            !results.includes(product)
        );
        results.push(...categoryResults);
        
        // Check product names
        const nameResults = allProducts.filter(product => 
            product.title.toLowerCase().includes(query.toLowerCase()) &&
            !results.includes(product)
        );
        results.push(...nameResults);
        
        return results;
    }
    
    // Perform dedicated post number search
    function performPostSearch(postNum) {
        const mapping = postMappings.find(m => m.post_number === postNum);
        
        if (!mapping) {
            showNoResults(`Post #${postNum}`);
            return;
        }
        
        const results = allProducts.filter(product => 
            mapping.product_ids.includes(product.id)
        );
        
        displayResults(results, `Post #${postNum}`, mapping);
    }
    
    // Display results
    function displayResults(results, query, mapping = null) {
        currentResults = results;
        
        if (results.length === 0) {
            showNoResults(query);
            return;
        }
        
        // Show results header
        resultsHeader.style.display = 'flex';
        document.getElementById('resultsTitle').textContent = 
            mapping ? mapping.post_title : `Search Results for "${query}"`;
        document.getElementById('resultsCount').textContent = 
            `${results.length} product${results.length > 1 ? 's' : ''}`;
        
        // Render results
        renderResults(results);
        
        // Generate and show related products
        generateRelatedProducts(results, mapping);
        relatedSection.style.display = 'block';
    }
    
    // Render results in current view mode
    function renderResults(products) {
        searchResults.className = `search-results ${currentView}-view`;
        
        searchResults.innerHTML = products.map(product => `
            <div class="product-card" data-category="${product.category.toLowerCase()}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.title}" loading="lazy">
                </div>
                <div class="product-content">
                    <span class="product-category">${product.category}</span>
                    <h3 class="product-title">${product.title}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-footer">
                        <span class="product-price">${product.price || 'Check price'}</span>
                        <a href="${product.affiliate_link}" target="_blank" rel="nofollow" class="product-link">
                            <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // Generate related products (same category, random selection)
    function generateRelatedProducts(results, mapping) {
        if (results.length === 0) return;
        
        // Get primary category from results or mapping
        const primaryCategory = mapping ? mapping.primary_category : results[0].category.toLowerCase();
        
        // Find all products in same category (excluding current results)
        const categoryProducts = allProducts.filter(product => 
            product.category.toLowerCase() === primaryCategory &&
            !results.some(r => r.id === product.id)
        );
        
        // Shuffle and take 4 random products
        const shuffled = shuffleArray(categoryProducts);
        currentRelated = shuffled.slice(0, 4);
        
        renderRelatedProducts(currentRelated);
    }
    
    // Render related products
    function renderRelatedProducts(products) {
        if (products.length === 0) {
            relatedGrid.innerHTML = '<div class="loading">No related products</div>';
            return;
        }
        
        relatedGrid.innerHTML = products.map(product => `
            <div class="product-card small">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.title}" loading="lazy">
                </div>
                <div class="product-content">
                    <span class="product-category">${product.category}</span>
                    <h4 class="product-title">${product.title}</h4>
                    <a href="${product.affiliate_link}" target="_blank" rel="nofollow" class="product-link">
                        View <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        `).join('');
    }
    
    // Show no results modal
    function showNoResults(query) {
        searchTermDisplay.textContent = query;
        noResultsModal.classList.add('show');
        
        // Hide results
        resultsHeader.style.display = 'none';
        searchResults.innerHTML = `
            <div class="search-prompt">
                <div class="prompt-icon">
                    <i class="fas fa-search"></i>
                </div>
                <h3>No matches found</h3>
                <p>Try a different post number or browse categories</p>
            </div>
        `;
        relatedSection.style.display = 'none';
    }
    
    // Reset to initial prompt
    function resetToPrompt() {
        resultsHeader.style.display = 'none';
        relatedSection.style.display = 'none';
        searchResults.innerHTML = `
            <div class="search-prompt">
                <div class="prompt-icon">
                    <i class="fas fa-arrow-up"></i>
                </div>
                <h3>Enter a post number to begin</h3>
                <p>Try searching: <span class="example-post">4</span>, <span class="example-post">7</span>, <span class="example-post">12</span>, <span class="example-post">31</span></p>
            </div>
        `;
        
        // Re-attach example post listeners
        document.querySelectorAll('.example-post').forEach(post => {
            post.addEventListener('click', () => {
                const postNum = post.textContent;
                searchInput.value = postNum;
                clearBtn.style.display = 'block';
                performPostSearch(postNum);
            });
        });
    }
    
    // Shuffle array helper
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
});