// --- Nexus Trading Platform - TradingView Style Chart Settings Module ---

class ChartSettingsModal {
    constructor() {
        this.modalElement = null;
        this.currentTab = 'symbol';
        this.init();
    }

    init() {
        this.createModalHTML();
        this.attachEventListeners();
    }

    createModalHTML() {
        if (document.getElementById('tvChartSettingsModal')) return;

        const modalHTML = `
        <div id="tvChartSettingsModal" class="nexus-modal-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; justify-content: center; align-items: center;">
            <div class="tv-settings-container" style="background: #1e222d; width: 750px; height: 520px; border-radius: 8px; border: 1px solid #2a2e39; display: flex; flex-direction: column; color: #d1d4dc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                
                <!-- Modal Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid #2a2e39;">
                    <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #fff;">Settings</h3>
                    <button id="tvCloseSettings" style="background: none; border: none; color: #9598a1; font-size: 20px; cursor: pointer; padding: 0;">&times;</button>
                </div>

                <!-- Modal Body Layout -->
                <div style="display: flex; flex: 1; overflow: hidden;">
                    
                    <!-- Left Sidebar Tabs -->
                    <div style="width: 200px; border-right: 1px solid #2a2e39; padding: 10px 0; background: #131722;">
                        <button class="tv-tab-btn active" data-target="tab-symbol" style="width: 100%; text-align: left; padding: 10px 20px; background: #2a2e39; border: none; color: #fff; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 10px;">📊 Symbol</button>
                        <button class="tv-tab-btn" data-target="tab-status" style="width: 100%; text-align: left; padding: 10px 20px; background: none; border: none; color: #9598a1; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 10px;">📑 Status line</button>
                        <button class="tv-tab-btn" data-target="tab-scales" style="width: 100%; text-align: left; padding: 10px 20px; background: none; border: none; color: #9598a1; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 10px;">📐 Scales and lines</button>
                        <button class="tv-tab-btn" data-target="tab-canvas" style="width: 100%; text-align: left; padding: 10px 20px; background: none; border: none; color: #9598a1; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 10px;">🎨 Canvas</button>
                        <button class="tv-tab-btn" data-target="tab-trading" style="width: 100%; text-align: left; padding: 10px 20px; background: none; border: none; color: #9598a1; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 10px;">🛒 Trading</button>
                        <button class="tv-tab-btn" data-target="tab-alerts" style="width: 100%; text-align: left; padding: 10px 20px; background: none; border: none; color: #9598a1; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 10px;">⏰ Alerts</button>
                        <button class="tv-tab-btn" data-target="tab-events" style="width: 100%; text-align: left; padding: 10px 20px; background: none; border: none; color: #9598a1; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 10px;">📅 Events</button>
                    </div>

                    <!-- Right Content Panels -->
                    <div style="flex: 1; padding: 20px; overflow-y: auto;">
                        
                        <!-- 1. Symbol Tab -->
                        <div id="tab-symbol" class="tv-tab-pane" style="display: block;">
                            <div style="font-size: 11px; color: #9598a1; font-weight: bold; margin-bottom: 15px; letter-spacing: 0.5px;">CANDLES</div>
                            
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                                <label style="font-size: 13px; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="tvBodyToggle" checked style="accent-color: #2962ff;"> Body
                                </label>
                                <div style="display: flex; gap: 8px;">
                                    <input type="color" id="tvUpColor" value="#26a69a" style="border: none; width: 28px; height: 22px; cursor: pointer; background: none;">
                                    <input type="color" id="tvDownColor" value="#ef5350" style="border: none; width: 28px; height: 22px; cursor: pointer; background: none;">
                                </div>
                            </div>

                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                                <label style="font-size: 13px; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="tvBordersToggle" checked style="accent-color: #2962ff;"> Borders
                                </label>
                                <div style="display: flex; gap: 8px;">
                                    <input type="color" id="tvBorderUpColor" value="#26a69a" style="border: none; width: 28px; height: 22px; cursor: pointer; background: none;">
                                    <input type="color" id="tvBorderDownColor" value="#ef5350" style="border: none; width: 28px; height: 22px; cursor: pointer; background: none;">
                                </div>
                            </div>

                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px;">
                                <label style="font-size: 13px; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="tvWickToggle" checked style="accent-color: #2962ff;"> Wick
                                </label>
                                <div style="display: flex; gap: 8px;">
                                    <input type="color" id="tvWickUpColor" value="#26a69a" style="border: none; width: 28px; height: 22px; cursor: pointer; background: none;">
                                    <input type="color" id="tvWickDownColor" value="#ef5350" style="border: none; width: 28px; height: 22px; cursor: pointer; background: none;">
                                </div>
                            </div>

                            <div style="font-size: 11px; color: #9598a1; font-weight: bold; margin-bottom: 15px; letter-spacing: 0.5px;">DATA MODIFICATION</div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <span style="font-size: 13px;">Timezone</span>
                                <select id="tvTimezoneSelect" style="background: #131722; color: #d1d4dc; border: 1px solid #2a2e39; padding: 6px 10px; border-radius: 4px; width: 180px;">
                                    <option value="Asia/Colombo">(UTC+5:30) Colombo</option>
                                    <option value="Etc/UTC">UTC</option>
                                    <option value="America/New_York">(UTC-5) New York</option>
                                </select>
                            </div>
                        </div>

                        <!-- 2. Status Line Tab -->
                        <div id="tab-status" class="tv-tab-pane" style="display: none;">
                            <div style="font-size: 11px; color: #9598a1; font-weight: bold; margin-bottom: 15px;">LOGO & TITLE</div>
                            <label style="font-size: 13px; display: flex; align-items: center; gap: 8px; margin-bottom: 12px; cursor: pointer;">
                                <input type="checkbox" checked style="accent-color: #2962ff;"> Symbol Name
                            </label>
                            <label style="font-size: 13px; display: flex; align-items: center; gap: 8px; margin-bottom: 12px; cursor: pointer;">
                                <input type="checkbox" checked style="accent-color: #2962ff;"> Open market status
                            </label>
                            <label style="font-size: 13px; display: flex; align-items: center; gap: 8px; margin-bottom: 12px; cursor: pointer;">
                                <input type="checkbox" checked style="accent-color: #2962ff;"> OHLC values
                            </label>
                        </div>

                        <!-- 3. Scales and Lines Tab -->
                        <div id="tab-scales" class="tv-tab-pane" style="display: none;">
                            <div style="font-size: 11px; color: #9598a1; font-weight: bold; margin-bottom: 15px;">GRID LINES</div>
                            <label style="font-size: 13px; display: flex; align-items: center; gap: 8px; margin-bottom: 12px; cursor: pointer;">
                                <input type="checkbox" id="tvGridVert" checked style="accent-color: #2962ff;"> Vertical Grid Lines
                            </label>
                            <label style="font-size: 13px; display: flex; align-items: center; gap: 8px; margin-bottom: 12px; cursor: pointer;">
                                <input type="checkbox" id="tvGridHorz" checked style="accent-color: #2962ff;"> Horizontal Grid Lines
                            </label>
                        </div>

                        <!-- 4. Canvas Tab -->
                        <div id="tab-canvas" class="tv-tab-pane" style="display: none;">
                            <div style="font-size: 11px; color: #9598a1; font-weight: bold; margin-bottom: 15px;">BACKGROUND</div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <span style="font-size: 13px;">Background Color</span>
                                <input type="color" id="tvBgColor" value="#131722" style="border: none; width: 35px; height: 25px; cursor: pointer; background: none;">
                            </div>
                        </div>

                        <!-- 5. Trading Tab -->
                        <div id="tab-trading" class="tv-tab-pane" style="display: none;">
                            <div style="font-size: 11px; color: #9598a1; font-weight: bold; margin-bottom: 15px;">TRADING PANELS</div>
                            <label style="font-size: 13px; display: flex; align-items: center; gap: 8px; margin-bottom: 12px; cursor: pointer;">
                                <input type="checkbox" checked style="accent-color: #2962ff;"> Buy/Sell execution buttons on chart
                            </label>
                        </div>

                        <!-- 6. Alerts Tab -->
                        <div id="tab-alerts" class="tv-tab-pane" style="display: none;">
                            <div style="font-size: 11px; color: #9598a1; font-weight: bold; margin-bottom: 15px;">LINES</div>
                            <label style="font-size: 13px; display: flex; align-items: center; gap: 8px; margin-bottom: 12px; cursor: pointer;">
                                <input type="checkbox" checked style="accent-color: #2962ff;"> Show active alert lines
                            </label>
                        </div>

                        <!-- 7. Events Tab -->
                        <div id="tab-events" class="tv-tab-pane" style="display: none;">
                            <div style="font-size: 11px; color: #9598a1; font-weight: bold; margin-bottom: 15px;">CALENDAR</div>
                            <label style="font-size: 13px; display: flex; align-items: center; gap: 8px; margin-bottom: 12px; cursor: pointer;">
                                <input type="checkbox" style="accent-color: #2962ff;"> Economic calendar events on chart
                            </label>
                        </div>

                    </div>
                </div>

                <!-- Modal Footer -->
                <div style="display: flex; justify-content: flex-end; align-items: center; padding: 12px 20px; border-top: 1px solid #2a2e39; gap: 10px; background: #181c25;">
                    <button id="tvCancelSettings" style="background: transparent; border: 1px solid #2a2e39; color: #d1d4dc; padding: 6px 16px; border-radius: 4px; cursor: pointer; font-size: 13px;">Cancel</button>
                    <button id="tvOkSettings" style="background: #2962ff; border: none; color: #fff; padding: 6px 20px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;">Ok</button>
                </div>

            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modalElement = document.getElementById('tvChartSettingsModal');
    }

    attachEventListeners() {
        const modal = this.modalElement;
        if (!modal) return;

        // Tab Switching Logic
        const tabBtns = modal.querySelectorAll('.tv-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                tabBtns.forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'none';
                    b.style.color = '#9598a1';
                });
                
                const targetId = btn.getAttribute('data-target');
                modal.querySelectorAll('.tv-tab-pane').forEach(pane => pane.style.display = 'none');
                
                btn.classList.add('active');
                btn.style.background = '#2a2e39';
                btn.style.color = '#fff';
                
                const targetPane = modal.querySelector(`#${targetId}`);
                if (targetPane) targetPane.style.display = 'block';
            });
        });

        // Close & Cancel Buttons
        const closeModal = () => modal.style.display = 'none';
        modal.querySelector('#tvCloseSettings').addEventListener('click', closeModal);
        modal.querySelector('#tvCancelSettings').addEventListener('click', closeModal);
        window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        // OK Button: Apply Settings to Lightweight Charts Live
        modal.querySelector('#tvOkSettings').addEventListener('click', () => {
            if (window.chart && window.candlestickSeries) {
                // Colors & Candles
                const upColor = modal.querySelector('#tvUpColor').value;
                const downColor = modal.querySelector('#tvDownColor').value;
                const borderUp = modal.querySelector('#tvBorderUpColor').value;
                const borderDown = modal.querySelector('#tvBorderDownColor').value;
                const wickUp = modal.querySelector('#tvWickUpColor').value;
                const wickDown = modal.querySelector('#tvWickDownColor').value;
                const bgColor = modal.querySelector('#tvBgColor').value;
                
                const gridVert = modal.querySelector('#tvGridVert').checked;
                const gridHorz = modal.querySelector('#tvGridHorz').checked;

                // Apply to Series
                window.candlestickSeries.applyOptions({
                    upColor: upColor,
                    downColor: downColor,
                    borderUpColor: borderUp,
                    borderDownColor: borderDown,
                    wickUpColor: wickUp,
                    wickDownColor: wickDown,
                });

                // Apply to Chart Layout & Grid
                window.chart.applyOptions({
                    layout: {
                        background: { type: 'solid', color: bgColor }
                    },
                    grid: {
                        vertLines: { visible: gridVert },
                        horzLines: { visible: gridHorz }
                    }
                });
            }

            modal.style.display = 'none';
        });
    }

    show() {
        if (this.modalElement) {
            this.modalElement.style.display = 'flex';
        }
    }
}

// Initialize and link globally
window.chartSettingsModal = new ChartSettingsModal();