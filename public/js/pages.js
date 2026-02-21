const searchInput = document.getElementById('liveSearchInput');
const searchDropdown = document.getElementById('searchDropdown');
const resultList = document.getElementById('searchResultList');

if (searchInput && searchDropdown && resultList) {
    let pagefindInstance = null;
    
    searchInput.addEventListener('input', async (e) => {
        const query = e.target.value.trim();
        resultList.innerHTML = ''; // Clear immediately
        
        if (query.length > 2) {
            try {
                // Lazy load Pagefind
                if (!pagefindInstance) {
                    pagefindInstance = await import('/pagefind/pagefind.js');
                }
                
                // Pagefind search dengan options lengkap
                const search = await pagefindInstance.search(query, { 
                    limit: 5,
                    languages: ['en'] // Sesuaikan bahasa
                });
                
                if (search.results && search.results.length > 0) {
                    searchDropdown.classList.remove('d-none');
                    
                    for (const result of search.results) {
                        const data = await result.data();
                        const title = data.meta?.title || data.title || data.url.split('/').pop() || 'No title';
                        const excerpt = data.excerpt ? data.excerpt.slice(0, 100) + '...' : '';
                        
                        const li = document.createElement('li');
                        li.className = 'px-3 py-2 border-bottom border-light';
                        li.innerHTML = `
                            <a href="${data.url}" class="d-block text-decoration-none text-dark small lh-sm hover-result">
                                <div class="fw-bold">${title}</div>
                                ${excerpt ? `<div class="text-muted mt-1 small">${excerpt}</div>` : ''}
                            </a>
                        `;
                        resultList.appendChild(li);
                    }
                } else {
                    resultList.innerHTML = '<li class="px-3 py-2 text-muted small text-center">Tidak ada hasil untuk "' + query + '"</li>';
                    searchDropdown.classList.remove('d-none');
                }
            } catch (error) {
                console.error('Pagefind error:', error);
                resultList.innerHTML = '<li class="px-3 py-2 text-danger small text-center">Search unavailable</li>';
                searchDropdown.classList.remove('d-none');
            }
        } else {
            searchDropdown.classList.add('d-none');
        }
    });

    // Close dropdown - fix contains() check
    document.addEventListener('click', (e) => {
        if (searchInput !== e.target && !searchInput?.contains(e.target) && 
            searchDropdown !== e.target && !searchDropdown?.contains(e.target)) {
            searchDropdown.classList.add('d-none');
        }
    });

    // Keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchDropdown.classList.add('d-none');
            searchInput.blur();
        }
    });
}
