// PUT YOUR CLOUDFLARE WORKER URL HERE
const WORKER_URL = 'https://book-summary-api.dillonmcconnell23.workers.dev'; // CHANGE THIS!

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

// Get summary
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
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                bookTitle,
                bookAuthor,
                chapterNumber,
                apiKey
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message || 'Unknown error occurred');
        }
        
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
        console.error('Error:', error);
        const summaryDiv = document.getElementById('summary-result');
        summaryDiv.innerHTML = `
            <div class="error">
                <strong>Error:</strong> ${error.message}
                <br><br>
                Please check:
                <ul style="text-align: left; margin-top: 10px;">
                    <li>Your OpenAI API key is correct</li>
                    <li>You have credits in your OpenAI account</li>
                    <li>The Cloudflare Worker URL is correct in the code</li>
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
