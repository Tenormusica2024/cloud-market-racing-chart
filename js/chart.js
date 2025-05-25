// Cloud Market Racing Chart - Main Logic
// Author: Your Name
// Version: 1.0

// Global variables
let currentIndex = 0;
let animationInterval;
let isPlaying = false;
let animationSpeed = 600;

// Initialize chart when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeChart();
});

// Initialize all chart components
function initializeChart() {
    createParticles();
    createGridLines();
    updateChart(0);
    updateRanking();
    setupEventListeners();
    
    console.log(`Chart initialized with ${cloudMarketData.length} data points`);
    console.log(`Timespan: ${marketInsights.timespan}`);
}

// Create floating particles background effect
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = window.innerWidth < 768 ? 20 : 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (3 + Math.random() * 3) + 's';
        particlesContainer.appendChild(particle);
    }
}

// Create percentage grid lines
function createGridLines() {
    const gridLines = document.getElementById('gridLines');
    const percentages = [0, 10, 20, 30, 40];
    
    percentages.forEach(percent => {
        const line = document.createElement('div');
        line.className = 'grid-line';
        line.style.left = `${(percent / 40) * 100}%`;
        
        const label = document.createElement('div');
        label.className = 'grid-label';
        label.textContent = `${percent}%`;
        line.appendChild(label);
        
        gridLines.appendChild(line);
    });
}

// Update chart with data for specific time index
function updateChart(index) {
    const data = cloudMarketData[index];
    if (!data) return;
    
    document.getElementById('dateDisplay').textContent = data.displayDate;
    
    // Sort companies by market share
    const sortedData = Object.entries(data)
        .filter(([key]) => !['year', 'month', 'displayDate'].includes(key))
        .sort(([,a], [,b]) => b - a);
    
    const container = document.getElementById('barsContainer');
    
    sortedData.forEach(([company, share], index) => {
        let barItem = document.getElementById(`bar-${company}`);
        
        // Create bar element if it doesn't exist
        if (!barItem) {
            barItem = document.createElement('div');
            barItem.className = 'bar-item';
            barItem.id = `bar-${company}`;
            
            barItem.innerHTML = `
                <div class="company-name">${company}</div>
                <div class="bar-track">
                    <div class="bar-fill" id="fill-${company}"></div>
                </div>
            `;
            
            container.appendChild(barItem);
        }
        
        // Update bar styling and position
        const fill = document.getElementById(`fill-${company}`);
        fill.style.background = companyColors[company];
        fill.style.width = `${Math.max(3, (share / 40) * 100)}%`;
        fill.textContent = `${share}%`;
        
        // Animate position change
        barItem.style.top = `${index * 58}px`;
        barItem.style.zIndex = sortedData.length - index;
    });
}

// Update final rankings display
function updateRanking() {
    const currentData = cloudMarketData[cloudMarketData.length - 1];
    const sortedData = Object.entries(currentData)
        .filter(([key]) => !['year', 'month', 'displayDate'].includes(key))
        .sort(([,a], [,b]) => b - a);
    
    const grid = document.getElementById('rankingGrid');
    grid.innerHTML = '';
    
    sortedData.forEach(([company, share], index) => {
        const card = document.createElement('div');
        card.className = 'rank-card';
        card.innerHTML = `
            <div class="rank-number">#${index + 1}</div>
            <div class="rank-company">${company}</div>
            <div class="rank-percent">${share}%</div>
        `;
        grid.appendChild(card);
    });
}

// Animation control functions
function startAnimation() {
    if (isPlaying) return;
    
    isPlaying = true;
    animationInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % cloudMarketData.length;
        updateChart(currentIndex);
        
        // Brief pause when reaching the end
        if (currentIndex === 0) {
            setTimeout(() => {}, 300);
        }
    }, animationSpeed);
    
    updateButtonStates();
}

function pauseAnimation() {
    isPlaying = false;
    clearInterval(animationInterval);
    updateButtonStates();
}

function resetAnimation() {
    pauseAnimation();
    currentIndex = 0;
    updateChart(0);
}

// Update button visual states
function updateButtonStates() {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.style.opacity = isPlaying && btn.textContent.includes('Play') ? '0.6' : '1';
    });
}

// Setup all event listeners
function setupEventListeners() {
    // Speed control slider
    const speedSlider = document.getElementById('speedSlider');
    const speedDisplay = document.getElementById('speedDisplay');
    
    speedSlider.addEventListener('input', function(e) {
        animationSpeed = parseInt(e.target.value);
        speedDisplay.textContent = `${(animationSpeed / 1000).toFixed(1)}s`;
        
        // Restart animation with new speed if playing
        if (isPlaying) {
            pauseAnimation();
            startAnimation();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                isPlaying ? pauseAnimation() : startAnimation();
                break;
            case 'KeyR':
                resetAnimation();
                break;
            case 'ArrowRight':
                if (!isPlaying) {
                    currentIndex = (currentIndex + 1) % cloudMarketData.length;
                    updateChart(currentIndex);
                }
                break;
            case 'ArrowLeft':
                if (!isPlaying) {
                    currentIndex = (currentIndex - 1 + cloudMarketData.length) % cloudMarketData.length;
                    updateChart(currentIndex);
                }
                break;
        }
    });
    
    // Touch/swipe support for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', function(e) {
        if (!e.changedTouches[0]) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchStartX - touchEndX;
        const diffY = Math.abs(touchStartY - touchEndY);
        
        // Only respond to horizontal swipes
        if (Math.abs(diffX) > 50 && diffY < 100 && !isPlaying) {
            if (diffX > 0) {
                // Left swipe - next
                currentIndex = (currentIndex + 1) % cloudMarketData.length;
            } else {
                // Right swipe - previous
                currentIndex = (currentIndex - 1 + cloudMarketData.length) % cloudMarketData.length;
            }
            updateChart(currentIndex);
        }
    });
    
    // Window resize handler
    window.addEventListener('resize', function() {
        // Recreate particles for new screen size
        const particlesContainer = document.getElementById('particles');
        particlesContainer.innerHTML = '';
        createParticles();
    });
}

// Utility functions
function formatDate(year, month) {
    return `${year}年${month}月`;
}

function getMarketShareChange(company, fromIndex, toIndex) {
    const fromData = cloudMarketData[fromIndex];
    const toData = cloudMarketData[toIndex];
    return toData[company] - fromData[company];
}

// Export functions for global access
window.startAnimation = startAnimation;
window.pauseAnimation = pauseAnimation;
window.resetAnimation = resetAnimation;

// Development helper functions (remove in production)
if (process?.env?.NODE_ENV === 'development') {
    window.debugChart = {
        data: cloudMarketData,
        insights: marketInsights,
        currentIndex: () => currentIndex,
        jumpTo: (index) => {
            currentIndex = Math.max(0, Math.min(index, cloudMarketData.length - 1));
            updateChart(currentIndex);
        }
    };
}
