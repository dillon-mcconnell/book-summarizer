// Check if API key exists on page load
window.onload = function() {
    const apiKey = localStorage.getItem('openai_api_key');
    if (apiKey) {
        document.getElementById('api-key-section').style.display = 'none';
        document.getElementById('app-section').style.display = 'block';
    }
};

// Save API Key
function saveApiKey() {
    const apiKey = document.getElementById('api-key-input').value.trim();
    if (apiKey) {
        localStorage.setItem('openai_api_key', apiKey);
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
        localStorage.removeItem('openai_api_key');
        document.getElementById('api-key-section').style.display = 'block';
        document.getElementById('app-section').style.display = 'none';
        document.getElementById('api-key-input').value = '';
        document.getElementById('book-title').value = '';
        document.getElementById('book-author').value = '';
        document.getElementById('chapter-number').value = '';
        document.getElementById('summary-result').innerHTML = '';
    }
}

// Get summary using OpenAI API
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
    
    const apiKey = localStorage.getItem('openai_api_key');
    if (!apiKey) {
        alert('API key not found. Please set it up first.');
        return;
    }
    
    // Show loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('summary-result').innerHTML = '';
    document.getElementById('summary-result').classList.remove('show');
    
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{
                    role: 'user',
                    content: `Please provide a comprehensive summary of the book "${bookTitle}" by ${bookAuthor}, covering everything from the beginning up to and including chapter ${chapterNumber}.

Please structure your response with these sections:

1. **Story So Far**: A detailed overview of what has happened up to chapter ${chapterNumber}
2. **Key Plot Points**: Major events and developments in chronological order
3. **Character Development**: Important changes or revelations about main characters
4. **Major Themes**: Key themes that have been introduced or developed

Please be thorough and detailed, but do not include any spoilers beyond chapter ${chapterNumber}.`
                }],
                max_tokens: 2000,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }
        
        const data = await response.json();
        const summary = data.choices[0].message.content;
        
        // Display summary
        const summaryDiv = document.getElementById('summary-result');
        summaryDiv.innerHTML = `
            <h3>${bookTitle} by ${bookAuthor}</h3>
            <p><strong>Summary through Chapter ${chapterNumber}</strong></p>
            <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;">
            <div>${summary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</div>
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
                    <li>Verify your API key is correct (starts with "sk-")</li>
                    <li>Check that you have credits in your OpenAI account</li>
                    <li>Visit <a href="https://platform.openai.com/usage" target="_blank">platform.openai.com/usage</a> to check your balance</li>
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
