// --- Nexus Trading Platform - Live Volume Profile & Order Flow Module with Settings Panel ---

class VolumeProfileModule {
    constructor() {
        this.profileData = new Map();
        
        // Settings State
        this.settings = {
            showWhiteWhales: true,
            maxWidth: 120,
            opacity: 0.9
        };

        this.initProfileOverlay();
        this.initSettingsPanel();
        this.startLiveSimulation();
    }

    // 1. UI Overlay එක සහ Setting Button එක සැකසීම
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
            profileOverlay.style.cssText = 'position: absolute; top: 0; right: 75px; width: 160px; height: 100%; pointer-events: none; z-index: 24; overflow: hidden;';
            if (getComputedStyle(container).position === 'static') {
                container.style.position = 'relative';
            }
            container.appendChild(profileOverlay);
        }

        this.bindChartEvents();
    }

    // 2. Settings Panel UI එක සහ බටන් එක නිර්මාණය කිරීම
    initSettingsPanel() {
        const container = document.getElementById('chartContainer');
        if (!container) return;

        // Settings Gear Icon Button (ചාට් එකේ ඉහළ දකුණු කෙළවරට වන්නට)
        let settingsBtn = document.getElementById('vpSettingsBtn');
        if (!settingsBtn) {
            settingsBtn = document.createElement('button');
            settingsBtn.id = 'vpSettingsBtn';
            settingsBtn.innerHTML = '⚙️';
            settingsBtn.title = 'Volume Profile Settings';
            settingsBtn.style.cssText = `
                position: absolute; top: 10px; right: 15px; z-index: 26;
                background: rgba(19, 23, 34, 0.85); border: 1px solid #2a2e39;
                color: #d1d4dc; width: 30px; height: 30px; border-radius: 4px;
                cursor: pointer; display: flex; align-items: center; justify-content: center;
                font-size: 14px; transition: background 0.2s;
            `;
            settingsBtn.onmouseover = () => settingsBtn.style.background = '#2a2e39';
            settingsBtn.onmouseout = () => settingsBtn.style.background = 'rgba(19, 23, 34, 0.85)';
            container.appendChild(settingsBtn);
        }

        // Settings Dropdown Panel
        let settingsPanel = document.getElementById('vpSettingsPanel');
        if (!settingsPanel) {
            settingsPanel = document.createElement('div');
            settingsPanel.id = 'vpSettingsPanel';
            settingsPanel.style.cssText = `
                position: absolute; top: 48px; right: 15px; z-index: 27;
                background: #1e222d; border: 1px solid #2a2e39; border-radius: 6px;
                padding: 12px; width: 220px; color: #d1d4dc; font-family: sans-serif;
                font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: none;
            `;
            
            settingsPanel.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #2a2e39; padding-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <span>Profile Settings</span>
                    <span id="vpCloseSettings" style="cursor: pointer; font-size: 14px; color: #ef5350;">✕</span>
                </div>
                <div style="margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
                    <label for="vpToggleWhales">White Whales (Top 4)</label>
                    <input type="checkbox" id="vpToggleWhales" ${this.settings.showWhiteWhales ? 'checked' : ''} style="cursor: pointer;">
                </div>
                <div style="margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>Max Width</span>
                        <span id="vpWidthVal">${this.settings.maxWidth}px</span>
                    </div>
                    <input type="range" id="vpWidthRange" min="80" max="200" value="${this.settings.maxWidth}" style="width: 100%; cursor: pointer;">
                </div>
                <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>Opacity</span>
                        <span id="vpOpacityVal">${this.settings.opacity}</span>
                    </div>
                    <input type="range" id="vpOpacityRange" min="0.4" max="1.0" step="0.1" value="${this.settings.opacity}" style="width: 100%; cursor: pointer;">
                </div>
            `;
            container.appendChild(settingsPanel);

            // Event Listeners for Settings Controls
            settingsBtn.onclick = (e) => {
                e.stopPropagation();
                settingsPanel.style.display = settingsPanel.style.display === 'block' ? 'none' : 'block';
            };

            document.getElementById('vpCloseSettings').onclick = () => {
                settingsPanel.style.display = 'none';
            };

            document.getElementById('vpToggleWhales').onchange = (e) => {
                this.settings.showWhiteWhales = e.target.checked;
                this.renderProfile();
            };

            document.getElementById('vpWidthRange').oninput = (e) => {
                this.settings.maxWidth = parseInt(e.target.value);
                document.getElementById('vpWidthVal').innerText = this.settings.maxWidth + 'px';
                this.renderProfile();
            };

            document.getElementById('vpOpacityRange').oninput = (e) => {
                this.settings.opacity = parseFloat(e.target.value);
                document.getElementById('vpOpacityVal').innerText = this.settings.opacity;
                this.renderProfile();
            };

            // Close panel when clicking outside
            document.addEventListener('click', (e) => {
                if (!settingsPanel.contains(e.target) && e.target !== settingsBtn) {
                    settingsPanel.style.display = 'none';
                }
            });
        }
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

    // 3. සැකසුම්වලට අනුව Profile එක Render කිරීම
    renderProfile() {
        const profileOverlay = document.getElementById('volumeProfileOverlay');
        const container = document.getElementById('chartContainer');
        
        if (!profileOverlay || !container || !window.candlestickSeries) return;

        profileOverlay.innerHTML = '';

        const entries = [];
        let maxTotalVol = 1;

        this.profileData.forEach((data, price) => {
            const totalVol = data.buyVolume + data.sellVolume;
            entries.push({ price, data, totalVol });
            if (totalVol > maxTotalVol) maxTotalVol = totalVol;
        });

        const sortedEntries = [...entries].sort((a, b) => b.totalVol - a.totalVol);
        const top4Prices = new Set(sortedEntries.slice(0, 4).map(item => item.price));

        const maxWidth = this.settings.maxWidth;

        entries.forEach(({ price, data, totalVol }) => {
            const yCoord = window.candlestickSeries.priceToCoordinate(price);
            if (yCoord === null) return;

            const totalWidth = Math.max(8, Math.round((totalVol / maxTotalVol) * maxWidth));
            const isTop4 = this.settings.showWhiteWhales && top4Prices.has(price);

            const rowEl = document.createElement('div');

            if (isTop4) {
                rowEl.style.cssText = `
                    position: absolute; right: 0px; top: ${yCoord - 4}px; width: ${totalWidth}px; height: 8px;
                    background: #ffffff; border-radius: 2px; overflow: visible;
                    pointer-events: none; box-shadow: 0 0 10px rgba(255,255,255,0.9); z-index: 5;
                    opacity: ${this.settings.opacity};
                `;

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
                const buyRatio = data.buyVolume / totalVol;
                const greenWidth = Math.round(totalWidth * buyRatio);
                const redWidth = totalWidth - greenWidth;

                rowEl.style.cssText = `
                    position: absolute; right: 0px; top: ${yCoord - 3}px; width: ${totalWidth}px; height: 6px;
                    display: flex; flex-direction: row-reverse; border-radius: 2px; overflow: hidden;
                    pointer-events: none; box-shadow: 0 1px 2px rgba(0,0,0,0.5);
                    opacity: ${this.settings.opacity};
                `;

                if (redWidth > 0) {
                    const redBar = document.createElement('div');
                    redBar.style.cssText = `width: ${redWidth}px; height: 100%; background: #ef5350;`;
                    rowEl.appendChild(redBar);
                }
                if (greenWidth > 0) {
                    const greenBar = document.createElement('div');
                    greenBar.style.cssText = `width: ${greenWidth}px; height: 100%; background: #26a69a;`;
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