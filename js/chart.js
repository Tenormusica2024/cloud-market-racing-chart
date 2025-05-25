// パーティクル作成を無効化
function createParticles() {
    // パーティクルを完全に無効化して軽量化
    return;
}

// アニメーション速度を最適化
let animationSpeed = 800; // デフォルトを800msに高速化

// バーのアニメーションを軽量化
function updateChart(index) {
    const data = cloudMarketData[index];
    if (!data) return;
    
    // DOM操作を最小限に
    const dateDisplay = document.getElementById('dateDisplay');
    if (dateDisplay.textContent !== data.displayDate) {
        dateDisplay.textContent = data.displayDate;
    }
    
    // ソート処理の最適化
    const sortedData = Object.entries(data)
        .filter(([key]) => !['year', 'month', 'displayDate'].includes(key))
        .sort(([,a], [,b]) => b - a);
    
    const container = document.getElementById('barsContainer');
    
    // 既存要素の再利用でDOM操作を削減
    sortedData.forEach(([company, share], index) => {
        let barItem = document.getElementById(`bar-${company}`);
        
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
        
        const fill = document.getElementById(`fill-${company}`);
        const newWidth = `${Math.max(3, (share / 40) * 100)}%`;
        
        // 値が変更された場合のみ更新
        if (fill.style.width !== newWidth) {
            fill.style.background = companyColors[company];
            fill.style.width = newWidth;
            fill.textContent = `${share}%`;
        }
        
        // 位置更新
        const newTop = `${index * 58}px`;
        if (barItem.style.top !== newTop) {
            barItem.style.top = newTop;
            barItem.style.zIndex = sortedData.length - index;
        }
    });
}

// アニメーション間隔の最適化
function startAnimation() {
    if (isPlaying) return;
    
    isPlaying = true;
    animationInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % cloudMarketData.length;
        updateChart(currentIndex);
    }, animationSpeed);
    
    updateButtonStates();
}

// リサイズイベントの最適化
let resizeTimeout;
window.addEventListener('resize', function() {
    // デバウンス処理で処理回数を削減
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // リサイズ時の処理を最小限に
        updateChart(currentIndex);
    }, 250);
});
