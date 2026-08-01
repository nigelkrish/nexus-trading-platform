// --- Nexus Trading Platform - Chart Settings Modal Module ---

class ChartSettingsModal {
    constructor() {
        this.modalElement = null;
        this.init();
    }

    init() {
        this.modalElement = document.getElementById('tradingViewSettingsModal');
        
        // CRITICAL FIX: Ensure modal is strictly hidden on initial page load
        if (this.modalElement) {
            this.modalElement.style.display = 'none';
        }

        this.attachEventListeners();
    }

    attachEventListeners() {
        const modal = this.modalElement;
        if (!modal) return;

        // 1. Open modal ONLY when clicking "Settings" in top navigation
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

        // 3. Universal Close / Cancel / OK listener using Event Delegation
        const closeModal = () => { 
            modal.style.display = 'none'; 
        };

        modal.addEventListener('click', (e) => {
            // Check if clicked element is a close button, cross icon, cancel, or ok
            const isCloseAction = 
                e.target.id === 'closeChartSettings' || 
                e.target.classList.contains('close-btn') || 
                e.target.classList.contains('tv-close-btn') ||
                e.target.id === 'tvCancelBtn' ||
                e.target.id === 'tvOkBtn' ||
                e.target.textContent.trim() === '×' ||
                e.target.closest('.tv-close-btn') ||
                e.target.closest('#closeChartSettings');

            if (isCloseAction) {
                e.preventDefault();
                if (e.target.id === 'tvOkBtn' || e.target.closest('#tvOkBtn')) {
                    this.applySettingsToChart();
                }
                closeModal();
            }
        });

        // Close when clicking outside modal container (on the dark overlay background)
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    applySettingsToChart() {
        if (!window.chart || !window.candlestickSeries) return;

        const vertGridToggle = document.getElementById('masterGridToggle');
        const vertGrid = vertGridToggle ? vertGridToggle.checked : true;

        window.chart.applyOptions({
            grid: {
                vertLines: { visible: vertGrid },
                horzLines: { visible: vertGrid }
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