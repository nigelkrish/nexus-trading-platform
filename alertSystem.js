// --- Nexus Trading Platform - Modular Alert System with Custom Sounds & Dark Modal (alertSystem.js) ---

class AlertSystem {
    constructor() {
        this.alerts = [];
        this.draggingAlertId = null;
        this.hoveredAlertId = null;
        this.initDragAndHoverListeners();
        this.initPopupUI();
    }

    initPopupUI() {
        if (document.getElementById('tradingViewAlertPopupModal')) return;

        const modal = document.createElement('div');
        modal.id = 'tradingViewAlertPopupModal';
        modal.style.cssText = `
            display: none; position: fixed; z-index: 99999; left: 0; top: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(3px);
            justify-content: center; align-items: center;
        `;

        modal.innerHTML = `
            <div style="background: #1e222d; border: 1px solid #2a2e39; border-radius: 12px; width: 380px; padding: 24px; box-shadow: 0 16px 40px rgba(0,0,0,0.8); color: #d1d4dc; font-family: -apple-system, sans-serif; text-align: center;">
                <div style="font-size: 36px; margin-bottom: 12px;">🔔</div>
                <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #fff;">Alert Triggered!</h3>
                <p id="popupAlertDesc" style="font-size: 14px; color: #9598a1; margin-bottom: 24px; line-height: 1.5;"></p>
                <button id="popupAlertOkBtn" style="background: #26a69a; border: none; color: #fff; padding: 10px 24px; border-radius: 6px; font-weight: bold; cursor: pointer; width: 100%;">OK</button>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('popupAlertOkBtn').onclick = () => {
            modal.style.display = 'none';
        };
    }

    // තෝරාගත් ශබ්දය අනුව විවිධ Tone වාදනය කිරීම (Web Audio API)
    playAlertSound(soundType) {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            let freq = 880;
            let duration = 0.3;

            if (soundType === 'chime') {
                freq = 1200;
                oscillator.type = 'triangle';
                duration = 0.4;
            } else if (soundType === 'bell') {
                freq = 1500;
                oscillator.type = 'sine';
                duration = 0.2;
            } else if (soundType === 'siren') {
                freq = 600;
                oscillator.type = 'sawtooth';
                duration = 0.5;
            } else {
                // Default Beep
                freq = 880;
                oscillator.type = 'sine';
                duration = 0.3;
            }

            oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + duration);
        } catch (e) {
            console.log('Audio playback prevented:', e);
        }
    }

    initDragAndHoverListeners() {
        const container = document.getElementById('chartContainer');
        if (!container) return;

        let tagOverlay = document.getElementById('alertTagsOverlay');
        if (!tagOverlay) {
            tagOverlay = document.createElement('div');
            tagOverlay.id = 'alertTagsOverlay';
            tagOverlay.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 50; overflow: hidden;';
            container.style.position = 'relative';
            container.appendChild(tagOverlay);
        }

        container.addEventListener('mousedown', (e) => {
            if (!window.candlestickSeries || !window.chart) return;
            const rect = container.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const clickedPrice = window.candlestickSeries.coordinateToPrice(y);

            if (clickedPrice !== null) {
                const targetAlert = this.alerts.find(a => !a.triggered && Math.abs(a.price - clickedPrice) / clickedPrice < 0.003);
                if (targetAlert) {
                    this.draggingAlertId = targetAlert.id;
                    document.body.style.cursor = 'ns-resize';
                }
            }
        });

        container.addEventListener('mousemove', (e) => {
            if (!window.candlestickSeries || !window.chart) return;
            const rect = container.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const currentMousePrice = window.candlestickSeries.coordinateToPrice(y);

            if (this.draggingAlertId !== null && currentMousePrice !== null) {
                const alert = this.alerts.find(a => a.id === this.draggingAlertId);
                if (alert) {
                    alert.price = currentMousePrice;
                    this.updateVisualLine(alert);
                    this.renderAlertsPanel();
                    this.updateTagsOverlay();
                }
                return;
            }

            if (currentMousePrice !== null) {
                const hovered = this.alerts.find(a => !a.triggered && Math.abs(a.price - currentMousePrice) / currentMousePrice < 0.003);
                const oldHover = this.hoveredAlertId;
                this.hoveredAlertId = hovered ? hovered.id : null;
                container.style.cursor = hovered ? 'ns-resize' : 'default';

                if (oldHover !== this.hoveredAlertId) {
                    this.updateTagsOverlay();
                }
            }
        });

        window.addEventListener('mouseup', () => {
            if (this.draggingAlertId !== null) {
                this.draggingAlertId = null;
                document.body.style.cursor = 'default';
                this.updateTagsOverlay();
            }
        });

        if (window.chart) {
            window.chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
                this.updateTagsOverlay();
            });
        }
    }

    updateTagsOverlay() {
        const tagOverlay = document.getElementById('alertTagsOverlay');
        const container = document.getElementById('chartContainer');
        if (!tagOverlay || !container || !window.candlestickSeries) return;

        tagOverlay.innerHTML = '';
        const containerHeight = container.clientHeight;

        this.alerts.forEach(alert => {
            if (alert.triggered) return;
            if (this.hoveredAlertId !== alert.id && this.draggingAlertId !== alert.id) return;

            const yCoord = window.candlestickSeries.priceToCoordinate(alert.price);
            if (yCoord === null || yCoord < 0 || yCoord > containerHeight) return;

            const tagEl = document.createElement('div');
            tagEl.style.cssText = `
                position: absolute; left: 50%; transform: translateX(-50%); top: ${yCoord - 12}px;
                background: #1e222d; border: 1px solid #26a69a; border-radius: 4px; padding: 3px 10px;
                display: flex; align-items: center; gap: 10px; font-family: -apple-system, sans-serif;
                font-size: 12px; color: #26a69a; pointer-events: auto; cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.6); white-space: nowrap;
            `;

            tagEl.innerHTML = `
                <span>${alert.symbol} Crossing ${alert.price.toFixed(2)}</span>
                <span id="delBtn_${alert.id}" title="Delete Alert" style="cursor: pointer; color: #ef5350; font-size: 13px; padding: 2px 4px;">🗑️</span>
            `;

            setTimeout(() => {
                const deleteBtn = document.getElementById(`delBtn_${alert.id}`);
                if (deleteBtn) {
                    deleteBtn.onclick = (e) => {
                        e.stopPropagation();
                        this.removeAlert(alert.id);
                    };
                }
            }, 0);

            tagOverlay.appendChild(tagEl);
        });
    }

    checkAlerts(currentPrice, symbol, previousPrice = null) {
        this.alerts.forEach((alert) => {
            if (alert.symbol === symbol && !alert.triggered) {
                let triggered = false;
                const prev = previousPrice !== null ? previousPrice : currentPrice;

                if (alert.condition === 'ABOVE') {
                    if ((prev <= alert.price && currentPrice >= alert.price) || currentPrice >= alert.price) {
                        triggered = true;
                    }
                } else if (alert.condition === 'BELOW') {
                    if ((prev >= alert.price && currentPrice <= alert.price) || currentPrice <= alert.price) {
                        triggered = true;
                    }
                }

                if (triggered) {
                    alert.triggered = true;
                    this.removeVisualLine(alert);
                    this.triggerNotification(alert);
                    this.renderAlertsPanel();
                    this.updateTagsOverlay();
                }
            }
        });
    }

    addAlert(symbol, price, condition, sound = 'beep') {
        const parsedPrice = parseFloat(price);
        const alertId = Date.now();

        let priceLine = null;
        if (window.candlestickSeries) {
            priceLine = window.candlestickSeries.createPriceLine({
                price: parsedPrice,
                color: '#26a69a',
                lineWidth: 2,
                lineStyle: 1,
                axisLabelVisible: true,
                title: '',
            });
        }

        const newAlert = {
            id: alertId,
            symbol: symbol,
            price: parsedPrice,
            condition: condition,
            sound: sound,
            triggered: false,
            priceLine: priceLine
        };

        this.alerts.push(newAlert);
        this.renderAlertsPanel();
        this.updateTagsOverlay();
    }

    updateVisualLine(alertObj) {
        if (alertObj.priceLine && window.candlestickSeries) {
            try {
                window.candlestickSeries.removePriceLine(alertObj.priceLine);
            } catch (e) {}
        }
        if (window.candlestickSeries && !alertObj.triggered) {
            alertObj.priceLine = window.candlestickSeries.createPriceLine({
                price: alertObj.price,
                color: '#26a69a',
                lineWidth: 2,
                lineStyle: 1,
                axisLabelVisible: true,
                title: '',
            });
        }
    }

    removeVisualLine(alertObj) {
        if (alertObj.priceLine && window.candlestickSeries) {
            try {
                window.candlestickSeries.removePriceLine(alertObj.priceLine);
                alertObj.priceLine = null;
            } catch (e) {}
        }
    }

    removeAlert(id) {
        const index = this.alerts.findIndex(a => a.id === id);
        if (index !== -1) {
            this.removeVisualLine(this.alerts[index]);
            this.alerts.splice(index, 1);
            this.hoveredAlertId = null;
            this.renderAlertsPanel();
            this.updateTagsOverlay();
        }
    }

    renderAlertsPanel() {
        const container = document.getElementById('activeAlertsContainer');
        if (!container) return;

        container.innerHTML = '';
        this.alerts.forEach(alert => {
            const item = document.createElement('div');
            item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: #1e222d; padding: 6px 10px; margin-bottom: 5px; border-radius: 4px; font-size: 12px; color: #d1d4dc; border-left: 3px solid ' + (alert.triggered ? '#ef5350' : '#26a69a') + ';';
            item.innerHTML = `
                <span>${alert.symbol} - <b>${alert.price.toFixed(2)}</b> (${alert.condition}) [🎶 ${alert.sound}] ${alert.triggered ? '✅ (Triggered)' : ''}</span>
                <button style="background: #ef5350; border: none; color: white; padding: 2px 6px; border-radius: 3px; cursor: pointer;" onclick="window.nexusAlerts.removeAlert(${alert.id})">❌</button>
            `;
            container.appendChild(item);
        });
    }

    triggerNotification(alert) {
        this.playAlertSound(alert.sound);
        const modal = document.getElementById('tradingViewAlertPopupModal');
        const desc = document.getElementById('popupAlertDesc');
        if (modal && desc) {
            desc.innerHTML = `<b>${alert.symbol}</b> මිල සීමාව ඉක්මවා ඇත!<br>ඉලක්කය: <b>${alert.price.toFixed(2)}</b> (${alert.condition})`;
            modal.style.display = 'flex';
        }
    }
}

window.nexusAlerts = new AlertSystem();