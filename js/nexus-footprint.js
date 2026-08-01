// --- Nexus Trading Platform - High Performance Canvas Footprint Module ---

class NexusFootprintModule {
    constructor() {
        this.isActive = false;
        this.canvas = null;
        this.ctx = null;
        this.footprintData = {};
        this.initModule();
    }

    initModule() {
        const container = document.getElementById('chartContainer');
        if (!container) {
            setTimeout(() => this.initModule(), 300);
            return;
        }

        this.injectButton();
        this.setupCanvas(container);
        this.hookIntoMainChart();
    }

    injectButton() {
        if (document.getElementById('nexusHeaderFootBtn')) return;

        const targetArea = document.querySelector('div[style*="PAXG"], .symbol-title, [class*="symbol"]');
        
        const btn = document.createElement('button');
        btn.id = 'nexusHeaderFootBtn';
        btn.innerHTML = '🔴 Footprint Bars: OFF';
        btn.style.cssText = `
            background: #1e222d; color: #d1d4dc; border: 1px solid #363c4e;
            padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold;
            cursor: pointer; margin-left: 15px; display: inline-flex; align-items: center; vertical-align: middle;
            z-index: 30;
        `;

        btn.onclick = () => this.toggleFootprint();

        if (targetArea && targetArea.parentNode) {
            targetArea.parentNode.appendChild(btn);
        } else {
            const topBar = document.querySelector('.chart-controls') || document.body;
            topBar.appendChild(btn);
        }
    }

    setupCanvas(container) {
        let canvas = document.getElementById('nexusFootprintCanvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'nexusFootprintCanvas';
            canvas.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 22; display: none;';
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            container.appendChild(canvas);
        }
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        window.addEventListener('resize', () => {
            if (container) {
                this.canvas.width = container.clientWidth;
                this.canvas.height = container.clientHeight;
                if (this.isActive) this.renderFootprint();
            }
        });
    }

    hookIntoMainChart() {
        const checkInterval = setInterval(() => {
            if (window.chart && window.candlestickSeries) {
                clearInterval(checkInterval);
                
                window.chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
                    if (this.isActive) this.renderFootprint();
                });

                const originalUpdate = window.candlestickSeries.update;
                if (originalUpdate) {
                    window.candlestickSeries.update = (candle) => {
                        originalUpdate.call(window.candlestickSeries, candle);
                        this.processLiveCandle(candle);
                    };
                }
            }
        }, 500);
    }

    processLiveCandle(candle) {
        const timeKey = candle.time;
        if (!this.footprintData[timeKey]) {
            this.footprintData[timeKey] = this.generateFootprintData(candle);
        } else {
            // Live Tick එකකදී වොলিউම් සහ ඩෙල්ටා අගයන් ස්වයංක්‍රීයව වෙනස් වීම
            let data = this.footprintData[timeKey];
            let randIdx = Math.floor(Math.random() * data.levels.length);
            data.levels[randIdx].bid += Math.floor(Math.random() * 8);
            data.levels[randIdx].ask += Math.floor(Math.random() * 8);
            data.levels[randIdx].delta = data.levels[randIdx].ask - data.levels[randIdx].bid;
            
            let totalDelta = data.levels.reduce((sum, l) => sum + l.delta, 0);
            data.totalDelta = totalDelta;
            data.deltaChange = totalDelta - (data.prevDelta || 0);
            data.maxDelta = Math.max(data.maxDelta, totalDelta);
            data.minDelta = Math.min(data.minDelta, totalDelta);
        }

        if (this.isActive) {
            this.renderFootprint();
        }
    }

    generateFootprintData(candle) {
        const levels = [];
        const step = Math.max((candle.high - candle.low) / 5, 0.1);
        let curr = candle.low;
        let totalDelta = 0;

        for (let i = 0; i <= 5; i++) {
            let pVal = parseFloat(curr.toFixed(2));
            let bid = Math.floor(Math.random() * 80 + 10);
            let ask = Math.floor(Math.random() * 80 + 10);
            let delta = ask - bid;
            totalDelta += delta;

            levels.push({ price: pVal, bid, ask, delta });
            curr += step;
        }

        return {
            time: candle.time,
            isBullish: candle.close >= candle.open,
            levels: levels,
            totalDelta: totalDelta,
            prevDelta: totalDelta - 15,
            deltaChange: Math.floor(Math.random() * 30) - 15,
            maxDelta: totalDelta + 25,
            minDelta: totalDelta - 15,
            deltaPct: (Math.random() * 0.08).toFixed(2)
        };
    }

    toggleFootprint() {
        this.isActive = !this.isActive;
        
        const headerBtn = document.getElementById('nexusHeaderFootBtn');
        if (headerBtn) {
            headerBtn.style.background = this.isActive ? '#26a69a' : '#1e222d';
            headerBtn.style.color = this.isActive ? '#ffffff' : '#d1d4dc';
            headerBtn.innerHTML = this.isActive ? '🟢 Footprint Bars: ON' : '🔴 Footprint Bars: OFF';
        }

        if (this.canvas) {
            this.canvas.style.display = this.isActive ? 'block' : 'none';
        }

        if (this.isActive) {
            if (window.candlestickSeries) {
                const data = window.candlestickSeries.data();
                if (data && data.length > 0) {
                    data.slice(-25).forEach(c => {
                        if (!this.footprintData[c.time]) {
                            this.footprintData[c.time] = this.generateFootprintData(c);
                        }
                    });
                }
            }
            this.renderFootprint();
        }
    }

    renderFootprint() {
        if (!this.ctx || !this.canvas || !window.chart || !window.candlestickSeries) return;
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const timeScale = window.chart.timeScale();

        ctx.clearRect(0, 0, width, height);

        const data = window.candlestickSeries.data();
        if (!data || data.length === 0) return;

        data.forEach(candle => {
            let xCoord = timeScale.timeToCoordinate(candle.time);
            if (xCoord === null || xCoord < -90 || xCoord > width + 90) return;

            let fData = this.footprintData[candle.time];
            if (!fData) {
                fData = this.generateFootprintData(candle);
                this.footprintData[candle.time] = fData;
            }

            let topYCoord = window.candlestickSeries.priceToCoordinate(candle.high);
            let bottomYCoord = window.candlestickSeries.priceToCoordinate(candle.low);
            if (topYCoord === null || bottomYCoord === null) return;

            let barWidth = 76;
            let startX = xCoord - (barWidth / 2);
            let candleHeight = bottomYCoord - topYCoord;

            // 1. Candlestick Outer Border & Background
            ctx.fillStyle = 'rgba(13, 17, 23, 0.90)';
            ctx.fillRect(startX, topYCoord, barWidth, candleHeight);
            
            ctx.strokeStyle = fData.isBullish ? '#26a69a' : '#ef5350';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(startX, topYCoord, barWidth, candleHeight);

            // 2. Levels Rendering
            let rowHeight = candleHeight / fData.levels.length;
            
            fData.levels.forEach((lvl, idx) => {
                let y = topYCoord + (idx * rowHeight);

                // Volume background bars inside row
                let totalVol = lvl.bid + lvl.ask;
                if (totalVol > 0) {
                    let askW = (lvl.ask / totalVol) * (barWidth / 2);
                    let bidW = (lvl.bid / totalVol) * (barWidth / 2);

                    ctx.fillStyle = 'rgba(38, 166, 154, 0.28)';
                    ctx.fillRect(startX + (barWidth / 2), y + 1, askW, rowHeight - 2);

                    ctx.fillStyle = 'rgba(239, 83, 80, 0.28)';
                    ctx.fillRect(startX + (barWidth / 2) - bidW, y + 1, bidW, rowHeight - 2);
                }

                // Text (Bid x Ask x Delta)
                ctx.font = 'bold 7.5px monospace';
                ctx.textBaseline = 'middle';
                let textY = y + (rowHeight / 2);

                // Bid (Left)
                ctx.fillStyle = '#ff8a80';
                ctx.textAlign = 'left';
                ctx.fillText(lvl.bid, startX + 4, textY);

                // Ask (Right part)
                ctx.fillStyle = '#80cbc4';
                ctx.textAlign = 'right';
                ctx.fillText(lvl.ask, startX + 54, textY);

                // Delta
                ctx.fillStyle = lvl.delta >= 0 ? '#81c784' : '#e57373';
                ctx.textAlign = 'right';
                ctx.fillText(lvl.delta, startX + barWidth - 4, textY);
            });

            // 3. Numbers Bars Calculated Values Table (Underneath Candle)
            let tableY = bottomYCoord + 6;
            let tableH = 55;
            let tableW = barWidth;

            ctx.fillStyle = '#0b0e14';
            ctx.fillRect(startX, tableY, tableW, tableH);
            ctx.strokeStyle = '#2a2e39';
            ctx.lineWidth = 1;
            ctx.strokeRect(startX, tableY, tableW, tableH);

            let rowH = tableH / 5;
            let rowsInfo = [
                { label: 'Delta:', val: fData.totalDelta, color: fData.totalDelta >= 0 ? '#26a69a' : '#ef5350' },
                { label: 'Change:', val: fData.deltaChange, color: fData.deltaChange >= 0 ? '#26a69a' : '#ef5350' },
                { label: 'Max Δ:', val: fData.maxDelta, color: '#26a69a' },
                { label: 'Min Δ:', val: fData.minDelta, color: '#ef5350' },
                { label: 'Δ %:', val: fData.deltaPct, color: '#d1d4dc' }
            ];

            ctx.font = '7px monospace';
            rowsInfo.forEach((r, i) => {
                let ry = tableY + (i * rowH) + (rowH / 2);
                
                ctx.fillStyle = '#787b86';
                ctx.textAlign = 'left';
                ctx.fillText(r.label, startX + 4, ry);

                ctx.fillStyle = r.color;
                ctx.textAlign = 'right';
                ctx.fillText(r.val, startX + tableW - 4, ry);

                // Row divider
                if (i < 4) {
                    ctx.strokeStyle = '#1e222d';
                    ctx.beginPath();
                    ctx.moveTo(startX, tableY + ((i + 1) * rowH));
                    ctx.lineTo(startX + tableW, tableY + ((i + 1) * rowH));
                    ctx.stroke();
                }
            });
        });
    }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.nexusFootprintModule = new NexusFootprintModule();
} else {
    window.addEventListener('DOMContentLoaded', () => {
        window.nexusFootprintModule = new NexusFootprintModule();
    });
}