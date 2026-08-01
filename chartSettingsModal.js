// --- Nexus Trading Platform - Chart Settings Modal Module ---

class ChartSettingsModal {
    constructor() {
        this.modalElement = null;
        this.init();
    }

    init() {
        this.createModalHTML();
        this.attachEventListeners();
    }

    createModalHTML() {
        if (document.getElementById('tradingViewSettingsModal')) return;

        const modalHTML = `
        <div id="tradingViewSettingsModal" class="tv-modal-overlay" style="display: none;">
            <div class="tv-modal-container">
                <!-- Modal Header -->
                <div class="tv-modal-header">
                    <h2>Settings</h2>
                    <button class="tv-close-btn" id="tvCloseModal">&times;</button>
                </div>

                <!-- Modal Body Layout -->
                <div class="tv-modal-body">
                    <!-- Left Sidebar Tabs -->
                    <div class="tv-sidebar-tabs">
                        <button class="tv-tab-item active" data-target="panel-symbol">
                            <span class="tv-icon">📊</span> Symbol
                        </button>
                        <button class="tv-tab-item" data-target="panel-status">
                            <span class="tv-icon">➖</span> Status line
                        </button>
                        <button class="tv-tab-item" data-target="panel-scales">
                            <span class="tv-icon">📈</span> Scales and lines
                        </button>
                        <button class="tv-tab-item" data-target="panel-canvas">
                            <span class="tv-icon">🎨</span> Canvas
                        </button>
                        <button class="tv-tab-item" data-target="panel-trading">
                            <span class="tv-icon">💰</span> Trading
                        </button>
                        <button class="tv-tab-item" data-target="panel-alerts">
                            <span class="tv-icon">⏰</span> Alerts
                        </button>
                        <button class="tv-tab-item" data-target="panel-events">
                            <span class="tv-icon">📅</span> Events
                        </button>
                    </div>

                    <!-- Right Content Panels -->
                    <div class="tv-content-panels">
                        <!-- Symbol Panel -->
                        <div class="tv-panel-content active" id="panel-symbol">
                            <div class="tv-section-title">CANDLES</div>
                            <div class="tv-control-row">
                                <label><input type="checkbox" id="tvColorBarsPrev"> Color bars based on previous close</label>
                            </div>
                            <div class="tv-control-row">
                                <label><input type="checkbox" id="tvBodyToggle" checked> Body</label>
                                <div class="tv-color-pickers">
                                    <input type="color" id="tvUpBodyColor" value="#26a69a">
                                    <input type="color" id="tvDownBodyColor" value="#ef5350">
                                </div>
                            </div>
                            <div class="tv-control-row">
                                <label><input type="checkbox" id="tvBordersToggle" checked> Borders</label>
                                <div class="tv-color-pickers">
                                    <input type="color" id="tvUpBorderColor" value="#26a69a">
                                    <input type="color" id="tvDownBorderColor" value="#ef5350">
                                </div>
                            </div>
                            <div class="tv-control-row">
                                <label><input type="checkbox" id="tvWickToggle" checked> Wick</label>
                                <div class="tv-color-pickers">
                                    <input type="color" id="tvUpWickColor" value="#26a69a">
                                    <input type="color" id="tvDownWickColor" value="#ef5350">
                                </div>
                            </div>

                            <div class="tv-section-title" style="margin-top: 20px;">DATA MODIFICATION</div>
                            <div class="tv-control-row select-row">
                                <span>Precision</span>
                                <select id="tvPrecisionSelect">
                                    <option value="default">Default</option>
                                    <option value="2">0.01</option>
                                    <option value="4">0.0001</option>
                                </select>
                            </div>
                            <div class="tv-control-row select-row">
                                <span>Timezone</span>
                                <select id="tvTimezoneSelect">
                                    <option value="Asia/Colombo">(UTC+5:30) Colombo</option>
                                    <option value="UTC">UTC</option>
                                </select>
                            </div>
                        </div>

                        <!-- Status Line Panel -->
                        <div class="tv-panel-content" id="panel-status">
                            <div class="tv-section-title">VALUES</div>
                            <div class="tv-control-row"><label><input type="checkbox" checked> Symbol name</label></div>
                            <div class="tv-control-row"><label><input type="checkbox" checked> Open market status</label></div>
                            <div class="tv-control-row"><label><input type="checkbox" checked> OHLC values</label></div>
                            <div class="tv-control-row"><label><input type="checkbox" checked> Bar change values</label></div>
                        </div>

                        <!-- Scales and Lines Panel -->
                        <div class="tv-panel-content" id="panel-scales">
                            <div class="tv-section-title">AXES</div>
                            <div class="tv-control-row"><label><input type="checkbox" checked> Values in price scale</label></div>
                            <div class="tv-control-row"><label><input type="checkbox" checked> Dates on time scale</label></div>
                        </div>

                        <!-- Canvas Panel -->
                        <div class="tv-panel-content" id="panel-canvas">
                            <div class="tv-section-title">GRID LINES</div>
                            <div class="tv-control-row"><label><input type="checkbox" id="tvVertGridToggle" checked> Vertical grid lines</label></div>
                            <div class="tv-control-row"><label><input type="checkbox" id="tvHorzGridToggle" checked> Horizontal grid lines</label></div>
                            <div class="tv-section-title" style="margin-top: 20px;">BACKGROUND</div>
                            <div class="tv-control-row select-row">
                               <span>Color</span>
                               <input type="color" id="tvBgColor" value="#131722">
                            </div>
                        </div>

                        <!-- Trading Panel -->
                        <div class="tv-panel-content" id="panel-trading">
                            <div class="tv-section-title">TRADING OPTIONS</div>
                            <div class="tv-control-row"><label><input type="checkbox" checked> Instant orders placement</label></div>
                            <div class="tv-control-row"><label><input type="checkbox" checked> Position lines</label></div>
                        </div>

                        <!-- Alerts Panel -->
                        <div class="tv-panel-content" id="panel-alerts">
                            <div class="tv-section-title">APPEARANCE</div>
                            <div class="tv-control-row"><label><input type="checkbox" checked> Show alert lines</label></div>
                        </div>

                        <!-- Events Panel -->
                        <div class="tv-panel-content" id="panel-events">
                            <div class="tv-section-title">CHART EVENTS</div>
                            <div class="tv-control-row"><label><input type="checkbox"> Economic events on chart</label></div>
                        </div>
                    </div>
                </div>

                <!-- Modal Footer -->
                <div class="tv-modal-footer">
                    <div class="tv-template-dropdown">
                        <select id="tvTemplateSelect">
                            <option value="default">Template</option>
                            <option value="saved">Save As...</option>
                        </select>
                    </div>
                    <div class="tv-footer-buttons">
                        <button class="tv-btn-cancel" id="tvCancelBtn">Cancel</button>
                        <button class="tv-btn-ok" id="tvOkBtn">Ok</button>
                    </div>
                </div>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modalElement = document.getElementById('tradingViewSettingsModal');
    }

    attachEventListeners() {
        const modal = this.modalElement;
        if (!modal) return;

        // Tab Switching logic
        const tabs = modal.querySelectorAll('.tv-tab-item');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const targetId = tab.getAttribute('data-target');
                modal.querySelectorAll('.tv-panel-content').forEach(panel => {
                    panel.classList.remove('active');
                });
                modal.querySelector(`#${targetId}`).classList.add('active');
            });
        });

        // Close / Cancel / OK buttons
        const closeBtn = modal.querySelector('#tvCloseModal');
        const cancelBtn = modal.querySelector('#tvCancelBtn');
        const okBtn = modal.querySelector('#tvOkBtn');

        const closeModal = () => { modal.style.display = 'none'; };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        // Apply Settings on OK click
        okBtn.addEventListener('click', () => {
            this.applySettingsToChart();
            closeModal();
        });
    }

    applySettingsToChart() {
        if (!window.chart || !window.candlestickSeries) return;

        // Read UI inputs and apply to Lightweight Charts instance
        const upBody = document.getElementById('tvUpBodyColor').value;
        const downBody = document.getElementById('tvDownBodyColor').value;
        const upWick = document.getElementById('tvUpWickColor').value;
        const downWick = document.getElementById('tvDownWickColor').value;
        const bgColor = document.getElementById('tvBgColor').value;
        const vertGrid = document.getElementById('tvVertGridToggle').checked;
        const horzGrid = document.getElementById('tvHorzGridToggle').checked;

        window.candlestickSeries.applyOptions({
            upColor: upBody,
            downColor: downBody,
            wickUpColor: upWick,
            wickDownColor: downWick,
        });

        window.chart.applyOptions({
            layout: {
                background: { type: 'solid', color: bgColor }
            },
            grid: {
                vertLines: { visible: vertGrid },
                horzLines: { visible: horzGrid }
            }
        });
    }

    show() {
        if (this.modalElement) {
            this.modalElement.style.display = 'flex';
        }
    }
}

// Initialize and attach to global scope
document.addEventListener('DOMContentLoaded', () => {
    window.chartSettingsModal = new ChartSettingsModal();
});