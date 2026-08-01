// --- Nexus Trading Platform - Chart Settings Modal Module ---

class ChartSettingsModal {
    constructor() {
        this.modalElement = null;
        this.init();
    }

    init() {
        this.modalElement = document.getElementById('tradingViewSettingsModal');
        this.attachEventListeners();
    }

    attachEventListeners() {
        const modal = this.modalElement;
        if (!modal) return;

        // 1. Open modal when clicking "Settings" in top navigation
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

        // 3. Close / Cancel / OK buttons (Catching all possible selectors for the close button)
        const closeBtn = modal.querySelector('#closeChartSettings') || 
                         modal.querySelector('.close-btn') || 
                         modal.querySelector('.tv-close-btn') || 
                         modal.querySelector('.tv-modal-header button');
                         
        const cancelBtn = modal.querySelector('#tvCancelBtn');
        const okBtn = modal.querySelector('#tvOkBtn');

        const closeModal = () => { 
            modal.style.display = 'none'; 
        };

        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                closeModal();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                closeModal();
            });
        }
        
        // Close when clicking outside modal container
        window.addEventListener('click', (e) => { 
            if (e.target === modal) closeModal(); 
        });

        // 4. Apply Settings on OK click
        if (okBtn) {
            okBtn.addEventListener('click', () => {
                this.applySettingsToChart();
                closeModal();
            });
        }
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