// --- Nexus Trading Platform - Chart Settings Modal Module ---

class ChartSettingsModal {
    constructor() {
        this.modalElement = null;
        this.init();
    }

    init() {
        this.modalElement = document.getElementById('tradingViewSettingsModal');
        
        if (this.modalElement) {
            // Force hide initially
            this.modalElement.style.setProperty('display', 'none', 'important');
        }

        this.attachEventListeners();
        this.preventExternalForcedOpen();
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

        // 3. Close / Cancel / OK / Cross Button Listeners (Targeting directly)
        const closeModal = () => { 
            modal.style.setProperty('display', 'none', 'important'); 
        };

        // Universal click listener inside modal
        modal.addEventListener('click', (e) => {
            // Check if close, cancel, ok or the cross (×) text was clicked
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

        // Close when clicking outside modal container (on background overlay)
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    preventExternalForcedOpen() {
        // If some other script forces the modal to open on load, watch and block it unless triggered by user
        if (!this.modalElement) return;

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'style') {
                    const display = window.getComputedStyle(this.modalElement).display;
                    // If it opened automatically without user interaction flag, you can handle it here
                }
            });
        });

        observer.observe(this.modalElement, { attributes: true });
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
            this.modalElement.style.setProperty('display', 'flex', 'important');
        }
    }
}

// Initialize and attach to global scope
document.addEventListener('DOMContentLoaded', () => {
    window.chartSettingsModal = new ChartSettingsModal();
});