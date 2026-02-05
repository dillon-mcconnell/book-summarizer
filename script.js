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
        document.getElementById('api-key-section').style.display = 'block';
        document.getElementById('app-section').style.display = 'none';
        document.getElementById('api-key-input').value = '';
        document.getElementById('book-title').value = '';
        document.getElementById('book-author').value = '';
        document.getElementById('chapter-number').value = '';
        document.getElementById('summary-result').innerHTML = '';
    }
}

// Get summary using Claude API
async function getSummary() {
    const bookTitle = document.getElementById('book-title').value.trim();
    const bookAuthor = document.getElementById('book-author').value.trim();
    const chapterNumber = document.getElementById('chapter-number').value;
    
    // Validation
    if (!bookTitle) {
        alert('Please enter a book title');
        return;
    }
    
    if (!bookAuthor) {
        alert('Please enter the author name');
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
    document.getElementById('summary-result').classList.remove('show');
    
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
                    content: `Please provide a comprehensive summary of "${bookTitle}" by ${bookAuthor}, covering everything up to and including chapter ${chapterNumber}.

Please structure your response as follows:

1. **Story So Far**: A detailed overview of what has happened up to chapter ${chapterNumber}
2. **Key Plot Points**: Major events and developments
3. **Character Development**: Important changes or revelations about main characters
4. **Themes**: Major themes that have been introduced or developed

Please be thorough but concise. Do not include any spoilers beyond chapter ${chapterNumber}.`
                }]
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }
        
        const data = await response.json();
        const summary = data.content[0].text;
        
        // Display summary
        const summaryDiv = document.getElementById('summary-result');
        summaryDiv.innerHTML = `
            <h3>${bookTitle} by ${bookAuthor}</h3>
            <p><strong>Summary through Chapter ${chapterNumber}</strong></p>
            <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;">
            <div>${summary.replace(/\n/g, '<br><br>')}</div>
        `;
        summaryDiv.classList.add('show');
        
    } catch (error) {
        const summaryDiv = document.getElementById('summary-result');
        summaryDiv.innerHTML = `
            <div class="error">
                <strong>Error:</strong> ${error.message}
                <br><br>
                Please check your API key and make sure you have credits in your Anthropic account.
            </div>
        `;
        summaryDiv.classList.add('show');
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// Allow Enter key to submit
document.addEventListener('DOMContentLoaded', function() {
    const inputs = ['book-title', 'book-author', 'chapter-number'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    getSummary();
                }
            });
        }
    });
});
