// --- Nexus Trading Platform - Safe Right-Edge ABS Engine (Avoiding Price Scale) ---

class AbsorptionModule {
    constructor() {
        this.absorptionZones = [];
        this.initAbsorptionOverlay();
    }

    initAbsorptionOverlay() {
        const container = document.getElementById('chartContainer');
        if (!container) {
            setTimeout(() => this.initAbsorptionOverlay(), 300);
            return;
        }

        let absOverlay = document.getElementById('absorptionZonesOverlay');
        if (!absOverlay) {
            absOverlay = document.createElement('div');
            absOverlay.id = 'absorptionZonesOverlay';
            absOverlay.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 25; overflow: hidden;';
            if (getComputedStyle(container).position === 'static') {
                container.style.position = 'relative';
            }
            container.appendChild(absOverlay);
        }

        this.bindChartEvents();
    }

    bindChartEvents() {
        if (!window.chart || !window.candlestickSeries) {
            setTimeout(() => this.bindChartEvents(), 500);
            return;
        }

        window.chart.timeScale().subscribeVisibleTimeRangeChange(() => this.renderZones());
        window.chart.timeScale().subscribeVisibleLogicalRangeChange(() => this.renderZones());
        window.addEventListener('resize', () => this.renderZones());

        this.startScanner();
    }

    startScanner() {
        this.detectAndDraw();
        
        setInterval(() => {
            this.detectAndDraw();
        }, 1500);
    }

    detectAndDraw() {
        try {
            const series = window.candlestickSeries;
            if (!series || typeof series.data !== 'function') return;

            const data = series.data();
            if (!data || data.length < 50) return;

            const currentActiveSymbol = (window.currentSymbol || 'PAXGUSDT').toUpperCase();
            let rawZones = [];

            const checkStartIndex = Math.max(0, data.length - 100);
            const checkEndIndex = data.length - 2;

            let totalRangesSum = 0;
            for (let i = checkStartIndex; i <= checkEndIndex; i++) {
                totalRangesSum += (data[i].high - data[i].low);
            }
            const avgRange = totalRangesSum / (checkEndIndex - checkStartIndex + 1);

            const minRequiredSize = avgRange * 1.1;

            for (let i = checkStartIndex; i <= checkEndIndex; i++) {
                const c = data[i];
                const body = Math.abs(c.close - c.open);
                const totalRange = c.high - c.low;

                if (totalRange === 0 || totalRange < minRequiredSize) continue;

                const isBullishAbs = (c.close <= c.open) && ((c.low - Math.min(c.open, c.close)) > (body * 0.25) || totalRange > (body * 2.0));
                const isBearishAbs = (c.close >= c.open) && ((c.high - Math.max(c.open, c.close)) > (body * 0.25) || totalRange > (body * 2.0));

                if (isBearishAbs) {
                    rawZones.push({
                        id: `${c.time}-${i}`,
                        timeIndex: i,
                        symbol: currentActiveSymbol,
                        high: parseFloat(c.high),
                        low: parseFloat(c.low),
                        size: totalRange,
                        type: 'ABS SELL'
                    });
                } else if (isBullishAbs) {
                    rawZones.push({
                        id: `${c.time}-${i}`,
                        timeIndex: i,
                        symbol: currentActiveSymbol,
                        high: parseFloat(c.high),
                        low: parseFloat(c.low),
                        size: totalRange,
                        type: 'ABS BUY'
                    });
                }
            }

            rawZones.sort((a, b) => b.size - a.size);
            
            let filteredZones = [];
            rawZones.forEach(zone => {
                const tooClose = filteredZones.some(existing => Math.abs(existing.high - zone.high) < (zone.size * 1.5));
                if (!tooClose && filteredZones.length < 3) {
                    filteredZones.push(zone);
                }
            });

            this.absorptionZones = filteredZones;
            this.renderZones();
        } catch (e) {
            console.error("ABS Safe Right Edge detection error:", e);
        }
    }

    renderZones() {
        const absOverlay = document.getElementById('absorptionZonesOverlay');
        const container = document.getElementById('chartContainer');
        const series = window.candlestickSeries;
        
        if (!absOverlay || !container || !window.chart || !series) return;

        absOverlay.innerHTML = '';
        const currentActiveSymbol = (window.currentSymbol || 'PAXGUSDT').toUpperCase();
        const activeZones = this.absorptionZones.filter(zone => zone.symbol === currentActiveSymbol);
        const currentMarketPrice = this.getCurrentMarketPrice();

        const timeScale = window.chart.timeScale();

        activeZones.forEach(zone => {
            let isMitigated = false;
            if (currentMarketPrice !== null) {
                if (zone.type === 'ABS SELL' && currentMarketPrice > zone.high) {
                    isMitigated = true;
                } else if (zone.type === 'ABS BUY' && currentMarketPrice < zone.low) {
                    isMitigated = true;
                }
            }

            let yHighCoord = null;
            let yLowCoord = null;
            let xLeftCoord = null;

            try {
                if (typeof series.priceToCoordinate === 'function') {
                    yHighCoord = series.priceToCoordinate(zone.high);
                    yLowCoord = series.priceToCoordinate(zone.low);
                }
                if (typeof timeScale.logicalToCoordinate === 'function') {
                    xLeftCoord = timeScale.logicalToCoordinate(zone.timeIndex);
                }
            } catch (err) {}

            if (yHighCoord === null || yLowCoord === null) return;

            const leftPos = (xLeftCoord !== null && !isNaN(xLeftCoord)) ? xLeftCoord : 50;
            const top = Math.min(yHighCoord, yLowCoord);
            const height = Math.max(4, Math.abs(yHighCoord - yLowCoord));

            const isBuy = zone.type === 'ABS BUY';
            const baseColor = isBuy ? '40, 167, 69' : '240, 185, 11';

            const bgColor = isMitigated ? 'rgba(128, 128, 128, 0.04)' : 'rgba(' + baseColor + ', 0.15)';
            const borderColor = isMitigated ? 'rgba(128, 128, 128, 0.2)' : 'rgba(' + baseColor + ', 0.9)';
            const textColor = isMitigated ? '#888888' : (isBuy ? '#28a745' : '#f0b90b');
            const borderColCss = isMitigated ? 'rgba(128, 128, 128, 0.2)' : 'rgba(' + baseColor + ', 0.4)';

            const boxEl = document.createElement('div');
            boxEl.style.cssText = 'position: absolute; left: ' + leftPos + 'px; right: 120px; top: ' + top + 'px; height: ' + height + 'px; background: ' + bgColor + '; border: 1px dashed ' + borderColor + '; pointer-events: none; box-sizing: border-box; z-index: 25;';

            const textBadge = document.createElement('div');
            textBadge.style.cssText = 'position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-family: -apple-system, sans-serif; font-size: 10px; font-weight: bold; color: ' + textColor + '; background: rgba(30, 34, 45, 0.95); padding: 1px 5px; border-radius: 3px; border: 1px solid ' + borderColCss + ';';
            textBadge.innerText = zone.high.toFixed(2) + ' / ' + zone.low.toFixed(2);
            boxEl.appendChild(textBadge);

            absOverlay.appendChild(boxEl);

            const labelEl = document.createElement('div');
            labelEl.style.cssText = 'position: absolute; left: ' + (leftPos + 5) + 'px; top: ' + (top - 18) + 'px; font-family: -apple-system, sans-serif; font-size: 10px; font-weight: bold; color: ' + textColor + '; background: rgba(20, 24, 33, 0.95); padding: 1px 5px; border-radius: 3px; box-shadow: 0 2px 4px rgba(0,0,0,0.5); z-index: 26;';
            const arrowSymbol = isBuy ? '▲' : '▼';
            labelEl.innerHTML = '<span style="color: ' + textColor + '; margin-right: 2px;">' + arrowSymbol + '</span> ' + (isMitigated ? zone.type + ' (MITIGATED)' : zone.type);

            absOverlay.appendChild(labelEl);
        });
    }

    getCurrentMarketPrice() {
        try {
            if (window.candlestickSeries && typeof window.candlestickSeries.data === 'function') {
                const data = window.candlestickSeries.data();
                if (data && data.length > 0) {
                    return data[data.length - 1].close;
                }
            }
        } catch (e) {}
        return null;
    }
}

// Global Initialization
if (!window.nexusAbsorption) {
    window.nexusAbsorption = new AbsorptionModule();
} else {
    window.nexusAbsorption.detectAndDraw();
}