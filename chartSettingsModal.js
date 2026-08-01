// --- Nexus Trading Platform - Chart Settings Modal Module ---

class ChartSettingsModal {
    constructor() {
        this.modalElement = null;
        
        // TradingView වගේ පාවිච්චි කරන Default Colors
        this.defaultSettings = {
            upBody: '#26a69a',      // TradingView Green
            downBody: '#ef5350',    // TradingView Red
            upBorder: '#26a69a',
            downBorder: '#ef5350',
            upWick: '#26a69a',
            downWick: '#ef5350',
            bgColor: '#131722'
        };

        this.init();
    }

    init() {
        this.modalElement = document.getElementById('tradingViewSettingsModal');
        
        if (this.modalElement) {
            this.modalElement.style.setProperty('display', 'none', 'important');
        }

        this.attachEventListeners();
        this.initColorPickers(); // මෝඩල් එක లోඩ් වෙද්දී කලර්ස් ඔටෝ සෙට් කිරීම
    }

    // කලර් පික්ස් වලට සහ ස්වොච් (Swatches) වලට ඩිෆෝල්ට්/වත්මන් පාට ඔටෝ දාලා දෙන්න
    initColorPickers() {
        const modal = this.modalElement;
        if (!modal) return;

        // උදාහරණයක් ලෙස අදාළ ඉන්පුට් සහ Swatch මැප් කිරීම
        const colorMappings = [
            { id: 'tvUpBodyColor', defaultVal: this.defaultSettings.upBody },
            { id: 'tvDownBodyColor', defaultVal: this.defaultSettings.downBody },
            { id: 'tvUpBorderColor', defaultVal: this.defaultSettings.upBorder },
            { id: 'tvDownBorderColor', defaultVal: this.defaultSettings.downBorder },
            { id: 'tvUpWickColor', defaultVal: this.defaultSettings.upWick },
            { id: 'tvDownWickColor', defaultVal: this.defaultSettings.downWick },
            { id: 'tvBgColor', defaultVal: this.defaultSettings.bgColor }
        ];

        colorMappings.forEach(item => {
            const inputEl = document.getElementById(item.id) || modal.querySelector(`#${item.id}`);
            if (inputEl) {
                // දැනට චාට් එකේ සෙටින්ග්ස් තියෙනවා නම් ඒවා ගන්න, නැත්නම් ඩිෆෝල්ට් එක දෙන්න
                inputEl.value = item.defaultVal;
                
                // Rounded box (swatch) එකේ කලර් එක අප්ඩේට් කරන්න
                const wrapper = inputEl.closest('.tv-color-box-wrapper') || inputEl.parentElement;
                if (wrapper) {
                    const swatch = wrapper.querySelector('.tv-custom-color-swatch');
                    if (swatch) {
                        swatch.style.backgroundColor = item.defaultVal;
                    }
                }
            }
        });
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

        // 3. Live UI update for Rounded Color Boxes when user changes a color in panel
        const colorInputs = modal.querySelectorAll('input[type="color"], .tv-native-color-input');
        colorInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const selectedColor = e.target.value;
                const wrapper = e.target.closest('.tv-color-box-wrapper') || e.target.parentElement;
                if (wrapper) {
                    const swatch = wrapper.querySelector('.tv-custom-color-swatch');
                    if (swatch) {
                        swatch.style.backgroundColor = selectedColor;
                    }
                }
            });
        });

        // 4. Close / Cancel / OK / Cross Button Listeners
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
                    // OK කලාම පමණක් චාට් එකට සෙටින්ග්ස් ඇප්ලයි වේ
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

        // 1. Read values securely from inputs
        const upBodyInput = document.getElementById('tvUpBodyColor') || document.querySelector('#panel-symbol input[type="color"]');
        const downBodyInput = document.getElementById('tvDownBodyColor') || document.querySelectorAll('#panel-symbol input[type="color"]')[1];
        
        const upBorderInput = document.getElementById('tvUpBorderColor');
        const downBorderInput = document.getElementById('tvDownBorderColor');
        const upWickInput = document.getElementById('tvUpWickColor');
        const downWickInput = document.getElementById('tvDownWickColor');

        const vertGridToggle = document.getElementById('tvVertGridToggle') || document.getElementById('masterGridToggle');
        const horzGridToggle = document.getElementById('tvHorzGridToggle');
        const bgColorInput = document.getElementById('tvBgColor') || document.querySelector('#panel-canvas input[type="color"]');

        // 2. Apply options to Lightweight Charts series
        const seriesOptions = {};
        
        if (upBodyInput) seriesOptions.upColor = upBodyInput.value;
        if (downBodyInput) seriesOptions.downColor = downBodyInput.value;
        
        if (upBorderInput) seriesOptions.borderUpColor = upBorderInput.value;
        else if (upBodyInput) seriesOptions.borderUpColor = upBodyInput.value;

        if (downBorderInput) seriesOptions.borderDownColor = downBorderInput.value;
        else if (downBodyInput) seriesOptions.borderDownColor = downBodyInput.value;

        if (upWickInput) seriesOptions.wickUpColor = upWickInput.value;
        else if (upBodyInput) seriesOptions.wickUpColor = upBodyInput.value;

        if (downWickInput) seriesOptions.wickDownColor = downWickInput.value;
        else if (downBodyInput) seriesOptions.wickDownColor = downBodyInput.value;

        window.candlestickSeries.applyOptions(seriesOptions);

        // 3. Apply chart options (Grid & Background)
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
            this.initColorPickers(); // මෝඩල් එක ඕන් වෙනකොට අලුත්ම තත්ත්වය ලෝඩ් කරගන්න
        }
    }
}

// Initialize and attach to global scope
document.addEventListener('DOMContentLoaded', () => {
    window.chartSettingsModal = new ChartSettingsModal();
});