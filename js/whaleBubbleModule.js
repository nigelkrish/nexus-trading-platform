// --- Nexus Trading Platform - Whale Bubble Orders Module (Dynamic Timeframe & Range Sync) ---

class WhaleBubbleModule {
    constructor() {
        this.isEnabled = false;
        this.bubblesData = [];
        this.initModule();
    }

    initModule() {
        const container = document.getElementById('chartContainer');
        if (!container) {
            setTimeout(() => this.initModule(), 300);
            return;
        }

        // 1. බුබුළු පෙන්වන Overlay එක සැකසීම
        let bubbleOverlay = document.getElementById('whaleBubbleOverlay');
        if (!bubbleOverlay) {
            bubbleOverlay = document.createElement('div');
            bubbleOverlay.id = 'whaleBubbleOverlay';
            bubbleOverlay.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 25; overflow: hidden; display: none;';
            if (getComputedStyle(container).position === 'static') {
                container.style.position = 'relative';
            }
            container.appendChild(bubbleOverlay);
        }

        // 2. ON/OFF ටොගල් බටන් එක සැකසීම
        let toggleBtn = document.getElementById('whaleToggleBtn');
        if (!toggleBtn) {
            toggleBtn = document.createElement('button');
            toggleBtn.id = 'whaleToggleBtn';
            toggleBtn.innerText = '🐳 Whale Bubbles: OFF';
            toggleBtn.style.cssText = `
                position: absolute; top: 15px; left: 15px; z-index: 30;
                background: #1e222d; color: #9598a1; border: 1px solid #363c4e;
                padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;
                cursor: pointer; transition: all 0.2s ease;
            `;
            toggleBtn.onclick = () => this.toggleModule();
            container.appendChild(toggleBtn);
        }

        this.bindChartEvents();
    }

    toggleModule() {
        this.isEnabled = !this.isEnabled;
        const btn = document.getElementById('whaleToggleBtn');
        const overlay = document.getElementById('whaleBubbleOverlay');

        if (this.isEnabled) {
            btn.innerText = '🐳 Whale Bubbles: ON';
            btn.style.background = '#26a69a';
            btn.style.color = '#ffffff';
            btn.style.borderColor = '#26a69a';
            overlay.style.display = 'block';
            
            this.generateDynamicBubbles();
            this.renderBubbles();
        } else {
            btn.innerText = '🐳 Whale Bubbles: OFF';
            btn.style.background = '#1e222d';
            btn.style.color = '#9598a1';
            btn.style.borderColor = '#363c4e';
            overlay.style.display = 'none';
        }
    }

    // ටයිම් ෆ්‍රේම් එක මාරු කරන විට හෝ සූම්/පෑන් කරන විට ඊට අදාළව බුබුළු අලුතින් සකස් වීම
    bindChartEvents() {
        if (!window.chart || !window.candlestickSeries) {
            setTimeout(() => this.bindChartEvents(), 500);
            return;
        }

        window.chart.timeScale().subscribeVisibleTimeRangeChange(() => {
            if (this.isEnabled) {
                this.generateDynamicBubbles();
                this.renderBubbles();
            }
        });

        window.chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
            if (this.isEnabled) {
                this.renderBubbles();
            }
        });

        window.addEventListener('resize', () => {
            if (this.isEnabled) this.renderBubbles();
        });
    }

    // දැනට තිරය මත පෙනෙන (Visible) කෑන්ඩ්ල්ස් පරාසය ඇතුළත බුබුළු පිහිටුවීම
    generateDynamicBubbles() {
        try {
            if (window.candlestickSeries && typeof window.candlestickSeries.data === 'function') {
                const data = window.candlestickSeries.data();
                if (data && data.length > 5) {
                    // දෘශ්‍යමාන පරාසයෙන් (Visible range) කෑන්ඩ්ල්ස් කිහිපයක් තෝරාගැනීම
                    const visibleRange = window.chart.timeScale().getVisibleLogicalRange();
                    let startIndex = 0;
                    let endIndex = data.length - 1;

                    if (visibleRange) {
                        startIndex = Math.max(0, Math.floor(visibleRange.from));
                        endIndex = Math.min(data.length - 1, Math.ceil(visibleRange.to));
                    }

                    const span = Math.max(1, endIndex - startIndex);
                    const idx1 = Math.min(endIndex, startIndex + Math.floor(span * 0.25));
                    const idx2 = Math.min(endIndex, startIndex + Math.floor(span * 0.55));
                    const idx3 = Math.min(endIndex, startIndex + Math.floor(span * 0.80));

                    const p1 = data[idx1];
                    const p2 = data[idx2];
                    const p3 = data[idx3];

                    if (p1 && p2 && p3) {
                        this.bubblesData = [
                            { time: p1.time, price: p1.high + 1.5, volume: '1.9k', rawVal: 1900, type: 'buy' },
                            { time: p2.time, price: p2.low - 2.0, volume: '1.8k', rawVal: 1800, type: 'sell' },
                            { time: p3.time, price: p3.high + 2.5, volume: '2.1k', rawVal: 2100, type: 'buy' }
                        ];
                        return;
                    }
                }
            }
        } catch (e) {}

        // Fallback අගයන්
        try {
            const logicalRange = window.chart.timeScale().getVisibleLogicalRange();
            if (logicalRange) {
                const midTime = Math.round((logicalRange.from + logicalRange.to) / 2);
                this.bubblesData = [
                    { time: midTime - 5, price: 4105.0, volume: '1.9k', rawVal: 1900, type: 'buy' },
                    { time: midTime + 5, price: 4098.0, volume: '1.8k', rawVal: 1800, type: 'sell' }
                ];
            }
        } catch (e) {}
    }

    renderBubbles() {
        const overlay = document.getElementById('whaleBubbleOverlay');
        if (!overlay || !window.chart || !window.candlestickSeries) return;

        overlay.innerHTML = '';
        if (!this.isEnabled) return;

        if (!this.bubblesData || this.bubblesData.length === 0) {
            this.generateDynamicBubbles();
        }

        const timeScale = window.chart.timeScale();

        this.bubblesData.forEach(item => {
            const xCoord = timeScale.timeToCoordinate(item.time);
            const yCoord = window.candlestickSeries.priceToCoordinate(item.price);

            if (xCoord === null || yCoord === null) return;

            const containerWidth = overlay.clientWidth;
            if (xCoord < -50 || xCoord > containerWidth + 50) return;

            const size = Math.round(45 + (item.rawVal / 100));
            const bgColor = item.type === 'buy' ? 'rgba(38, 166, 154, 0.85)' : 'rgba(239, 83, 80, 0.85)';
            const borderColor = item.type === 'buy' ? '#4db6ac' : '#e57373';

            const bubbleEl = document.createElement('div');
            bubbleEl.style.cssText = `
                position: absolute;
                left: ${xCoord - (size/2)}px;
                top: ${yCoord - (size/2)}px;
                width: ${size}px;
                height: ${size}px;
                background: ${bgColor};
                border: 2px solid ${borderColor};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #ffffff;
                font-size: 13px;
                font-weight: bold;
                font-family: monospace;
                box-shadow: 0 0 15px ${borderColor};
                pointer-events: none;
            `;
            bubbleEl.innerText = item.volume;

            overlay.appendChild(bubbleEl);
        });
    }
}

// Safe Initialization
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.nexusWhaleBubbles = new WhaleBubbleModule();
} else {
    window.addEventListener('DOMContentLoaded', () => {
        window.nexusWhaleBubbles = new WhaleBubbleModule();
    });
}