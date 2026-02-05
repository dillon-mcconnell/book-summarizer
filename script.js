// Check if API key exists on page load
window.onload = function() {
    const apiKey = localStorage.getItem('claude_api_key');
    if (apiKey) {
        document.getElementById('api-key-section').style.display = 'none';
        document.getElementById('app-section').style.display = 'block';
    }
};

// Save API Key
function saveApiKey() {
    const apiKey = document.getElementById('api-key-input').value.trim();
    if (apiKey) {
        localStorage.setItem('claude_api_key', apiKey);
        document.getElementById('api-key-section').style.display = 'none';
        document.getElementById('app-section').style.display = 'block';
        alert('API Key saved successfully!');
    } else {
        alert('Please enter a valid API key');
    }
}

// Clear API Key
function clearApiKey() {
    if (confirm('Are you sure you want to clear your API key?')) {
        localStorage.removeItem('claude_api_key');
        localStorage.removeItem('selected_book');
        document.getElementById('api-key-section').style.display = 'block';
        document.getElementById('app-section').style.display = 'none';
        document.getElementById('api-key-input').value = '';
    }
}

// Book search with debouncing
let searchTimeout;
let selectedBook = null;

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('book-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim();
            
            if (query.length < 3) {
                document.getElementById('book-results').style.display = 'none';
                return;
            }
            
            searchTimeout = setTimeout(() => searchBooks(query), 500);
        });
    }
});

// Search books using Google Books API
async function searchBooks(query) {
    try {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`);
        const data = await response.json();
        
        if (data.items) {
            displayBookResults(data.items);
        }
    } catch (error) {
        console.error('Error searching books:', error);
    }
}

// Display book search results
function displayBookResults(books) {
    const resultsDiv = document.getElementById('book-results');
    resultsDiv.innerHTML = '';
    
    books.forEach(book => {
        const volumeInfo = book.volumeInfo;
        const div = document.createElement('div');
        div.className = 'book-result-item';
        div.innerHTML = `
            <strong>${volumeInfo.title}</strong><br>
            <small>${volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Unknown Author'}</small>
        `;
        div.onclick = () => selectBook(volumeInfo);
        resultsDiv.appendChild(div);
    });
    
    resultsDiv.style.display = 'block';
}

// Select a book from search results
function selectBook(book) {
    selectedBook = {
        title: book.title,
        authors: book.authors || ['Unknown Author'],
        description: book.description || 'No description available'
    };
    
    localStorage.setItem('selected_book', JSON.stringify(selectedBook));
    
    document.getElementById('selected-book').innerHTML = `
        <h3>${selectedBook.title}</h3>
        <p>by ${selectedBook.authors.join(', ')}</p>
    `;
    document.getElementById('selected-book').style.display = 'block';
    document.getElementById('book-results').style.display = 'none';
    document.getElementById('book-search').value = selectedBook.title;
}

// Get summary using Claude API
async function getSummary() {
    const chapterNumber = document.getElementById('chapter-number').value;
    
    // Load selected book from localStorage if not in memory
    if (!selectedBook) {
        const stored = localStorage.getItem('selected_book');
        if (stored) {
            selectedBook = JSON.parse(stored);
        }
    }
    
    if (!selectedBook) {
        alert('Please select a book first');
        return;
    }
    
    if (!chapterNumber || chapterNumber < 1) {
        alert('Please enter a valid chapter number');
        return;
    }
    
    const apiKey = localStorage.getItem('claude_api_key');
    if (!apiKey) {
        alert('API key not found. Please set it up first.');
        return;
    }
    
    // Show loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('summary-result').innerHTML = '';
    
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4000,
                messages: [{
                    role: 'user',
                    content: `Please provide a comprehensive summary of "${selectedBook.title}" by ${selectedBook.authors.join(', ')} up to and including chapter ${chapterNumber}. 

Include:
1. A brief overview of what has happened so far
2. Key plot points and developments
3. Important character developments
4. Major themes introduced

Please be thorough but concise, and avoid spoilers beyond chapter ${chapterNumber}.`
                }]
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        const summary = data.content[0].text;
        
        // Display summary
        document.getElementById('summary-result').innerHTML = `
            <h3>Summary: ${selectedBook.title} (Chapters 1-${chapterNumber})</h3>
            <p>${summary.replace(/\n/g, '<br><br>')}</p>
        `;
        
    } catch (error) {
        document.getElementById('summary-result').innerHTML = `
            <p style="color: red;">Error: ${error.message}</p>
            <p>Please check your API key and try again.</p>
        `;
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}
