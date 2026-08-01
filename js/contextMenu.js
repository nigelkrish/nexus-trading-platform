// --- Nexus Trading Platform - Dark Modern TradingView Context Menu (contextMenu.js) ---

class ChartContextMenu {
    constructor() {
        this.selectedPrice = null;
        this.initMenuUI();
        this.initAlertModalUI();
    }

    initMenuUI() {
        if (document.getElementById('tradingViewContextMenu')) return;

        const menu = document.createElement('div');
        menu.id = 'tradingViewContextMenu';
        menu.style.cssText = `
            display: none; position: absolute; z-index: 10000;
            background: #1e222d; border: 1px solid #2a2e39; border-radius: 6px;
            padding: 6px 0; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
            width: 260px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 13px; color: #d1d4dc; user-select: none;
        `;

        menu.innerHTML = `
            <div class="ctx-item" id="ctxResetChart"><span>🔄 Reset chart view</span><span class="ctx-shortcut">Alt + R</span></div>
            <div class="ctx-divider"></div>
            <div class="ctx-item" id="ctxCopyPrice"><span>📋 Copy price <span id="ctxPriceVal">0.00</span></span></div>
            <div class="ctx-divider"></div>
            <div class="ctx-item ctx-highlight" id="ctxAddAlert">
                <span>⏰ Add alert on <span id="ctxSymbolText">PAXGUSDT</span> at <span id="ctxAlertPriceVal">0.00</span></span>
            </div>
            <div class="ctx-item" id="ctxSellLimit"><span>🔽 Sell limit @ <span id="ctxSellPriceVal">0.00</span></span></div>
            <div class="ctx-item" id="ctxBuyStop"><span>🔼 Buy stop @ <span id="ctxBuyPriceVal">0.00</span></span></div>
        `;

        const styleTag = document.createElement('style');
        styleTag.innerHTML = `
            #tradingViewContextMenu .ctx-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 14px; cursor: pointer; }
            #tradingViewContextMenu .ctx-item:hover { background: #2a2e39; color: #ffffff; }
            #tradingViewContextMenu .ctx-highlight:hover { background: #26a69a !important; color: #ffffff; }
            #tradingViewContextMenu .ctx-shortcut { color: #787b86; font-size: 11px; }
            #tradingViewContextMenu .ctx-divider { height: 1px; background: #2a2e39; margin: 4px 0; }
        `;
        document.head.appendChild(styleTag);
        document.body.appendChild(menu);

        document.addEventListener('click', () => { menu.style.display = 'none'; });

        document.getElementById('ctxResetChart').addEventListener('click', () => {
            if (window.chart) window.chart.timeScale().fitContent();
            menu.style.display = 'none';
        });

        document.getElementById('ctxCopyPrice').addEventListener('click', () => {
            navigator.clipboard.writeText(this.selectedPrice.toFixed(2));
            menu.style.display = 'none';
        });

        document.getElementById('ctxAddAlert').addEventListener('click', () => {
            this.showCreateAlertModal(this.selectedPrice, window.currentSymbol);
            menu.style.display = 'none';
        });
    }

    initAlertModalUI() {
        if (document.getElementById('tradingViewAlertModal')) return;

        const modal = document.createElement('div');
        modal.id = 'tradingViewAlertModal';
        modal.style.cssText = `
            display: none; position: fixed; z-index: 20000; left: 0; top: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(3px);
            justify-content: center; align-items: center;
        `;

        modal.innerHTML = `
            <div style="background: #1e222d; border: 1px solid #2a2e39; border-radius: 12px; width: 440px; padding: 24px; box-shadow: 0 16px 40px rgba(0,0,0,0.8); color: #d1d4dc; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                
                <!-- Modal Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 16px; font-weight: bold; color: #fff;">Create alert on</span>
                        <span style="background: #2a2e39; padding: 4px 8px; border-radius: 4px; color: #f0b90b; font-weight: bold; font-size: 13px;" id="modalSymbolTitle">XAUUSD</span>
                    </div>
                    <button id="modalCloseBtn" style="background: none; border: none; color: #9598a1; font-size: 18px; cursor: pointer;">✕</button>
                </div>

                <!-- Condition Section -->
                <div style="background: #131722; border: 1px solid #2a2e39; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                    <div style="display: flex; gap: 10px; margin-bottom: 12px;">
                        <div style="flex: 1;">
                            <label style="font-size: 11px; color: #787b86; display: block; margin-bottom: 4px;">Condition</label>
                            <select id="modalConditionField" style="width: 100%; background: #1e222d; border: 1px solid #2a2e39; color: #fff; padding: 8px; border-radius: 6px; font-size: 13px;">
                                <option value="Price">Price</option>
                            </select>
                        </div>
                        <div style="flex: 1;">
                            <label style="font-size: 11px; color: #787b86; display: block; margin-bottom: 4px;">Method</label>
                            <select id="modalConditionOperator" style="width: 100%; background: #1e222d; border: 1px solid #2a2e39; color: #fff; padding: 8px; border-radius: 6px; font-size: 13px;">
                                <option value="Crossing">Crossing</option>
                                <option value="Above">Crossing Above</option>
                                <option value="Below">Crossing Below</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <div style="flex: 1;">
                            <select style="width: 100%; background: #1e222d; border: 1px solid #2a2e39; color: #fff; padding: 8px; border-radius: 6px; font-size: 13px;">
                                <option value="Value">Value</option>
                            </select>
                        </div>
                        <div style="flex: 1;">
                            <input type="number" id="modalPriceInput" step="0.01" style="width: 100%; background: #1e222d; border: 1px solid #2a2e39; color: #26a69a; padding: 8px; border-radius: 6px; font-weight: bold; font-size: 14px; box-sizing: border-box;">
                        </div>
                    </div>
                </div>

                <!-- Settings Options (Trigger, Sound) -->
                <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; font-size: 13px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #9598a1;">Trigger</span>
                        <select id="modalTriggerType" style="background: #131722; border: 1px solid #2a2e39; color: #fff; padding: 6px 12px; border-radius: 6px;">
                            <option value="Once">Once only</option>
                            <option value="EveryTime">Every time</option>
                        </select>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #9598a1;">Alert Sound</span>
                        <select id="modalSoundSelect" style="background: #131722; border: 1px solid #2a2e39; color: #fff; padding: 6px 12px; border-radius: 6px;">
                            <option value="beep">Beep (Default)</option>
                            <option value="chime">Chime (Soft)</option>
                            <option value="bell">Bell (Sharp)</option>
                            <option value="siren">Siren (Alert)</option>
                        </select>
                    </div>
                </div>

                <!-- Footer Buttons -->
                <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #2a2e39; padding-top: 16px;">
                    <button id="modalCancelBtn" style="background: #2a2e39; border: none; color: #fff; padding: 8px 18px; border-radius: 6px; cursor: pointer; font-weight: 500;">Cancel</button>
                    <button id="modalCreateBtn" style="background: #26a69a; border: none; color: #fff; padding: 8px 24px; border-radius: 6px; font-weight: bold; cursor: pointer;">Create</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('modalCloseBtn').onclick = () => { modal.style.display = 'none'; };
        document.getElementById('modalCancelBtn').onclick = () => { modal.style.display = 'none'; };

        document.getElementById('modalCreateBtn').onclick = () => {
            const price = parseFloat(document.getElementById('modalPriceInput').value);
            const op = document.getElementById('modalConditionOperator').value;
            const sound = document.getElementById('modalSoundSelect').value;
            const condition = (op === 'Below') ? 'BELOW' : 'ABOVE';

            if (window.nexusAlerts && window.currentSymbol) {
                window.nexusAlerts.addAlert(window.currentSymbol, price, condition, sound);
            }
            modal.style.display = 'none';
        };
    }

    show(x, y, price, symbol) {
        this.selectedPrice = price;
        const menu = document.getElementById('tradingViewContextMenu');
        
        document.getElementById('ctxPriceVal').innerText = price.toFixed(2);
        document.getElementById('ctxAlertPriceVal').innerText = price.toFixed(2);
        document.getElementById('ctxSellPriceVal').innerText = price.toFixed(2);
        document.getElementById('ctxBuyPriceVal').innerText = price.toFixed(2);
        
        if (symbol) {
            document.getElementById('ctxSymbolText').innerText = symbol;
        }

        menu.style.display = 'block';
        menu.style.left = `${Math.min(x, window.innerWidth - 260)}px`;
        menu.style.top = `${Math.min(y, window.innerHeight - 200)}px`;
    }

    showCreateAlertModal(price, symbol) {
        const modal = document.getElementById('tradingViewAlertModal');
        document.getElementById('modalSymbolTitle').innerText = symbol || 'XAUUSD';
        document.getElementById('modalPriceInput').value = price.toFixed(2);
        modal.style.display = 'flex';
    }
}

window.chartContextMenu = new ChartContextMenu();