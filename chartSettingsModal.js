// --- Nexus Trading Platform - Chart Settings Modal Module ---

class ChartSettingsModal {
    constructor() {
        this.modalElement = null;
        this.init();
    }

    init() {
        this.modalElement = document.getElementById('tradingViewSettingsModal');
        
        if (this.modalElement) {
            this.modalElement.style.setProperty('display', 'none', 'important');
        }

        this.attachEventListeners();
    }

    attachEventListeners() {
        const modal = this.modalElement;
        if (!modal) return;

        // 1. Open modal only when clicking "Settings" in top navigation
        const mainSettingsNavBtn = document.getElementById('mainSettingsNavBtn');
        if (mainSettingsNavBtn) {
            mainSettingsNavBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.show();
            });
        }

        // 2. Tab Switching logic inside modal
        const tabs = modal.querySelectorAll('.tv-tab-item');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const targetId = tab.getAttribute('data-target');
                modal.querySelectorAll('.tv-panel-content').forEach(panel => {
                    panel.classList.remove('active');
                });
                
                const targetPanel = modal.querySelector(`#${targetId}`);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                }
            });
        });

        // 3. Close / Cancel / OK / Cross Button Listeners
        const closeModal = () => { 
            modal.style.setProperty('display', 'none', 'important'); 
        };

        modal.addEventListener('click', (e) => {
            const target = e.target;
            const isCloseBtn = target.id === 'closeChartSettings' || 
                               target.classList.contains('close-btn') || 
                               target.classList.contains('tv-close-btn') ||
                               target.id === 'tvCancelBtn' ||
                               target.textContent.trim() === '×' ||
                               target.closest('.tv-close-btn') ||
                               target.closest('#closeChartSettings');

            const isOkBtn = target.id === 'tvOkBtn' || target.closest('#tvOkBtn');

            if (isCloseBtn || isOkBtn) {
                e.preventDefault();
                e.stopPropagation();
                if (isOkBtn) {
                    this.applySettingsToChart();
                }
                closeModal();
            }
        });

        // Close when clicking outside modal container
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    applySettingsToChart() {
        if (!window.chart || !window.candlestickSeries) return;

        // 1. Read values securely from inputs (with fallback selectors if IDs vary)
        const upBodyInput = document.getElementById('tvUpBodyColor') || document.querySelector('#panel-symbol input[type="color"]');
        const downBodyInput = document.querySelector('#tvDownBodyColor') || document.querySelectorAll('#panel-symbol input[type="color"]')[1];
        
        const vertGridToggle = document.getElementById('tvVertGridToggle') || document.getElementById('masterGridToggle');
        const horzGridToggle = document.getElementById('tvHorzGridToggle');
        const bgColorInput = document.getElementById('tvBgColor') || document.querySelector('#panel-canvas input[type="color"]');

        // 2. Apply options to Lightweight Charts series & instance
        const seriesOptions = {};
        if (upBodyInput) {
            seriesOptions.upColor = upBodyInput.value;
            seriesOptions.borderUpColor = upBodyInput.value;
            seriesOptions.wickUpColor = upBodyInput.value;
        }
        if (downBodyInput) {
            seriesOptions.downColor = downBodyInput.value;
            seriesOptions.borderDownColor = downBodyInput.value;
            seriesOptions.wickDownColor = downBodyInput.value;
        }

        window.candlestickSeries.applyOptions(seriesOptions);

        const chartOptions = {
            grid: {
                vertLines: { visible: vertGridToggle ? vertGridToggle.checked : true },
                horzLines: { visible: horzGridToggle ? horzGridToggle.checked : true }
            }
        };

        if (bgColorInput) {
            chartOptions.layout = {
                background: { type: 'solid', color: bgColorInput.value }
            };
        }

        window.chart.applyOptions(chartOptions);
    }

    show() {
        if (this.modalElement) {
            this.modalElement.style.setProperty('display', 'flex', 'important');
        }
    }
}

// Initialize and attach to global scope
document.addEventListener('DOMContentLoaded', () => {
    window.chartSettingsModal = new ChartSettingsModal();
});