// --- Nexus Trading Platform - Fibonacci Retracement Module ---

class NexusFibonacciTool {
    constructor(chart, series) {
        this.chart = chart;
        this.series = series;
        this.isDrawing = false;
        this.startX = null;
        this.startY = null;
        this.currentFibLines = [];
        this.fibLevels = [
            { level: 0.0, color: 'rgba(41, 98, 255, 0.8)', label: '0' },
            { level: 0.236, color: 'rgba(41, 98, 255, 0.6)', label: '0.236' },
            { level: 0.382, color: 'rgba(41, 98, 255, 0.6)', label: '0.382' },
            { level: 0.5, color: 'rgba(239, 83, 80, 0.8)', label: '0.5' },
            { level: 0.618, color: 'rgba(38, 166, 154, 0.8)', label: '0.618' },
            { level: 0.786, color: 'rgba(41, 98, 255, 0.6)', label: '0.786' },
            { level: 1.0, color: 'rgba(41, 98, 255, 0.8)', label: '1' }
        ];
    }

    // ෆිබොනාච්චි ඇඳීම ආරම්භ කිරීම (Drawing Mode Activate කිරීම)
    enableDrawing(container) {
        this.isDrawing = true;
        container.style.cursor = 'crosshair';

        this.boundClickHandler = (e) => this.handleChartClick(e, container);
        container.addEventListener('click', this.boundClickHandler);
    }

    disableDrawing(container) {
        this.isDrawing = false;
        container.style.cursor = 'default';
        if (this.boundClickHandler) {
            container.removeEventListener('click', this.boundClickHandler);
        }
    }

    handleChartClick(e, container) {
        if (!this.isDrawing) return;

        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const timeCoord = this.chart.timeScale().coordinateToTime(x);
        const priceCoord = this.series.coordinateToPrice(y);

        if (timeCoord === null || priceCoord === null) return;

        if (!this.startX) {
            // පළමු පොයින්ට් එක ක්ලික් කළ විට (ප්‍රධාන ආරම්භක ලක්ෂ්‍යය)
            this.startX = timeCoord;
            this.startY = priceCoord;
        } else {
            // දෙවන පොයින්ට් එක ක්ලික් කළ විට (අවසාන ලක්ෂ්‍යය) - ෆිබොනාච්චි සටහන සම්පූර්ණ කිරීම
            const endX = timeCoord;
            const endY = priceCoord;

            this.drawFibonacci(this.startX, this.startY, endX, endY);

            // රීසෙට් කිරීම
            this.startX = null;
            this.startY = null;
            this.disableDrawing(container);
        }
    }

    drawFibonacci(time1, price1, time2, price2) {
        // පරණ ෆිබොනාච්චි ලයින්ස් ඉවත් කිරීම (අවශ්‍ය නම් තනි එකක් හෝ බහු එකක් තබාගත හැක)
        this.clearFibonacci();

        const priceDifference = price2 - price1;

        this.fibLevels.forEach(fib => {
            const calculatedPrice = price1 + (priceDifference * fib.level);

            // Lightweight Charts හි TrendLine හෝ Custom Price Line හරහා ලෙවල්ස් ඇඳීම
            const fibLine = this.chart.addLineSeries({
                color: fib.color,
                lineWidth: 1,
                lineStyle: 2, // Dashed line (TradingView style)
                priceLineVisible: false,
                lastValueVisible: false,
            });

            fibLine.setData([
                { time: time1, value: calculatedPrice },
                { time: time2, value: calculatedPrice }
            ]);

            this.currentFibLines.push(fibLine);
        });
    }

    clearFibonacci() {
        this.currentFibLines.forEach(line => {
            this.chart.removeSeries(line);
        });
        this.currentFibLines = [];
    }
}

// Global window object එකට සම්බන්ධ කිරීම
window.NexusFibonacciTool = NexusFibonacciTool;