// --- Nexus Trading Platform - Live Volume Profile & Order Flow Module (Full Profile + Top 4 White Whale Orders) ---

class VolumeProfileModule {
    constructor() {
        this.profileData = new Map();
        this.initProfileOverlay();
        this.startLiveSimulation();
    }

    // 1. UI Overlay එක සැකසීම
    initProfileOverlay() {
        const container = document.getElementById('chartContainer');
        if (!container) {
            setTimeout(() => this.initProfileOverlay(), 300);
            return;
        }

        let profileOverlay = document.getElementById('volumeProfileOverlay');
        if (!profileOverlay) {
            profileOverlay = document.createElement('div');
            profileOverlay.id = 'volumeProfileOverlay';
            profileOverlay.style.cssText = 'position: absolute; top: 0; right: 75px; width: 150px; height: 100%; pointer-events: none; z-index: 24; overflow: hidden;';
            if (getComputedStyle(container).position === 'static') {
                container.style.position = 'relative';
            }
            container.appendChild(profileOverlay);
        }

        this.bindChartEvents();
    }

    bindChartEvents() {
        if (!window.chart || !window.candlestickSeries) {
            setTimeout(() => this.bindChartEvents(), 500);
            return;
        }

        window.chart.timeScale().subscribeVisibleTimeRangeChange(() => {
            this.renderProfile();
        });

        window.chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
            this.renderProfile();
        });

        window.addEventListener('resize', () => {
            this.renderProfile();
        });

        setTimeout(() => {
            this.generateInitialProfile();
            this.renderProfile();
        }, 1000);
    }

    getCurrentMarketPrice() {
        try {
            if (window.candlestickSeries) {
                const data = window.candlestickSeries.data ? window.candlestickSeries.data() : null;
                if (data && data.length > 0) {
                    return data[data.length - 1].close;
                }
            }
        } catch (e) {}
        return 4100.00;
    }

    addVolumeTick(price, buyVol, sellVol) {
        const roundedPrice = Math.round(price * 10) / 10;
        
        if (!this.profileData.has(roundedPrice)) {
            this.profileData.set(roundedPrice, { buyVolume: 0, sellVolume: 0 });
        }

        const level = this.profileData.get(roundedPrice);
        level.buyVolume += buyVol;
        level.sellVolume += sellVol;

        this.renderProfile();
    }

    generateInitialProfile() {
        const currentPrice = this.getCurrentMarketPrice();
        for (let i = -15; i <= 15; i++) {
            const p = Math.round((currentPrice + (i * 1.0)) * 10) / 10;
            const bVol = Math.floor(Math.random() * 80) + 10;
            const sVol = Math.floor(Math.random() * 80) + 10;
            this.addVolumeTick(p, bVol, sVol);
        }
    }

    startLiveSimulation() {
        setInterval(() => {
            const currentPrice = this.getCurrentMarketPrice();
            if (!currentPrice) return;

            const randomOffset = (Math.random() - 0.5) * 6;
            const activePrice = Math.round((currentPrice + randomOffset) * 10) / 10;
            
            const isBuy = Math.random() > 0.45;
            const bVol = isBuy ? Math.floor(Math.random() * 60) + 10 : 5;
            const sVol = !isBuy ? Math.floor(Math.random() * 60) + 10 : 5;

            this.addVolumeTick(activePrice, bVol, sVol);
        }, 800);
    }

    // 2. සියලුම බාර්ස් පෙන්වමින්, Top 4 ලොකුම ඔර්ඩර්ස් පමණක් සුදු පාටින් ඉස්මතු කර Render කිරීම
    renderProfile() {
        const profileOverlay = document.getElementById('volumeProfileOverlay');
        const container = document.getElementById('chartContainer');
        
        if (!profileOverlay || !container || !window.candlestickSeries) return;

        profileOverlay.innerHTML = '';

        // සියලුම ලෙවල්ස් එකතු කර මැක්ස් වොলিউම් එක සෙවීම
        const entries = [];
        let maxTotalVol = 1;

        this.profileData.forEach((data, price) => {
            const totalVol = data.buyVolume + data.sellVolume;
            entries.push({ price, data, totalVol });
            if (totalVol > maxTotalVol) maxTotalVol = totalVol;
        });

        // වොলিউම් එක අනුව සෝට් කර වැඩිම ලෙවල් 4 හඳුනා ගැනීම
        const sortedEntries = [...entries].sort((a, b) => b.totalVol - a.totalVol);
        const top4Prices = new Set(sortedEntries.slice(0, 4).map(item => item.price));

        const maxWidth = 100;

        entries.forEach(({ price, data, totalVol }) => {
            const yCoord = window.candlestickSeries.priceToCoordinate(price);
            if (yCoord === null) return;

            const totalWidth = Math.max(8, Math.round((totalVol / maxTotalVol) * maxWidth));
            const isTop4 = top4Prices.has(price);

            const rowEl = document.createElement('div');

            if (isTop4) {
                // ලොකුම ඔර්ඩර්ස් 4 සඳහා සම්පූර්ණයෙන්ම සුදු පාටින් සහ ග්ලෝ හෝ බෝඩර් එකක් සමඟ
                rowEl.style.cssText = `
                    position: absolute; right: 0px; top: ${yCoord - 4}px; width: ${totalWidth}px; height: 8px;
                    background: #ffffff; border-radius: 2px; overflow: visible;
                    pointer-events: none; box-shadow: 0 0 10px rgba(255,255,255,0.9); z-index: 5;
                `;

                // වොলিউම් අගය ලේබලය
                const labelEl = document.createElement('span');
                labelEl.innerText = totalVol;
                labelEl.style.cssText = `
                    position: absolute; right: ${totalWidth + 6}px; top: -3px;
                    color: #ffffff; font-size: 10px; font-weight: bold; font-family: monospace;
                    background: rgba(0, 0, 0, 0.85); padding: 0 4px; border-radius: 3px;
                    white-space: nowrap; pointer-events: none; border: 1px solid rgba(255,255,255,0.5);
                `;
                rowEl.appendChild(labelEl);

            } else {
                // සාමාන්‍ය බාර්ස් (කොළ සහ රතු වෙන් වූ හැඩයෙන්)
                const buyRatio = data.buyVolume / totalVol;
                const greenWidth = Math.round(totalWidth * buyRatio);
                const redWidth = totalWidth - greenWidth;

                rowEl.style.cssText = `
                    position: absolute; right: 0px; top: ${yCoord - 3}px; width: ${totalWidth}px; height: 6px;
                    display: flex; flex-direction: row-reverse; border-radius: 2px; overflow: hidden;
                    pointer-events: none; box-shadow: 0 1px 2px rgba(0,0,0,0.5);
                `;

                if (redWidth > 0) {
                    const redBar = document.createElement('div');
                    redBar.style.cssText = `width: ${redWidth}px; height: 100%; background: #ef5350; opacity: 0.9;`;
                    rowEl.appendChild(redBar);
                }
                if (greenWidth > 0) {
                    const greenBar = document.createElement('div');
                    greenBar.style.cssText = `width: ${greenWidth}px; height: 100%; background: #26a69a; opacity: 0.9;`;
                    rowEl.appendChild(greenBar);
                }
            }

            profileOverlay.appendChild(rowEl);
        });
    }
}

// Safe Initialization
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.nexusVolumeProfile = new VolumeProfileModule();
} else {
    window.addEventListener('DOMContentLoaded', () => {
        window.nexusVolumeProfile = new VolumeProfileModule();
    });
}