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

// Get summary using Claude API with CORS proxy
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
        // Using CORS proxy
        const corsProxy = 'https://corsproxy.io/?';
        const apiUrl = corsProxy + encodeURIComponent('https://api.anthropic.com/v1/messages');
        
        const response = await fetch(apiUrl, {
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
                    content: `Please provide a comprehensive summary of the book "${bookTitle}" by ${bookAuthor}, covering everything from the beginning up to and including chapter ${chapterNumber}.

Please include:

1. **Story So Far**: A detailed overview of what has happened up to chapter ${chapterNumber}
2. **Key Plot Points**: Major events and developments in chronological order
3. **Character Development**: Important changes or revelations about main characters
4. **Major Themes**: Key themes that have been introduced or developed

Please be thorough and detailed, but do not include any spoilers beyond chapter ${chapterNumber}.`
                }]
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error?.message || `API error: ${response.status}`;
            } catch {
                errorMessage = `API error: ${response.status} - ${errorText}`;
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        // Extract text from response
        let summary = '';
        for (const block of data.content) {
            if (block.type === 'text') {
                summary += block.text;
            }
        }
        
        if (!summary) {
            throw new Error('No summary text received from API');
        }
        
        // Display summary
        const summaryDiv = document.getElementById('summary-result');
        summaryDiv.innerHTML = `
            <h3>${bookTitle} by ${bookAuthor}</h3>
            <p><strong>Summary through Chapter ${chapterNumber}</strong></p>
            <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;">
            <div>${summary.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</div>
        `;
        summaryDiv.classList.add('show');
        
    } catch (error) {
        console.error('Full error:', error);
        const summaryDiv = document.getElementById('summary-result');
        summaryDiv.innerHTML = `
            <div class="error">
                <strong>Error:</strong> ${error.message}
                <br><br>
                <strong>Troubleshooting:</strong>
                <ul style="text-align: left; margin-top: 10px;">
                    <li>Verify your API key is correct (starts with "sk-ant-")</li>
                    <li>Check that you have credits in your Anthropic account</li>
                    <li>Make sure your API key has the necessary permissions</li>
                    <li>The CORS proxy might be temporarily down - try again in a few minutes</li>
                </ul>
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
