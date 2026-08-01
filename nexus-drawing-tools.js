// --- Nexus Trading Platform - TradingView Style Interactive Drawing & Floating Toolbar ---

class NexusDrawingToolbar {
    constructor() {
        this.activeTool = 'cursor';
        this.isMagnetActive = false;
        this.isLocked = false;
        this.isVisible = true;
        this.drawings = [];
        this.currentDrawing = null;
        
        this.selectedDrawing = null;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;

        this.initToolbar();
    }

    initToolbar() {
        const container = document.getElementById('chartContainer');
        if (!container) {
            setTimeout(() => this.initToolbar(), 300);
            return;
        }

        let toolbar = document.getElementById('nexusDrawingToolbar');
        if (!toolbar) {
            toolbar = document.createElement('div');
            toolbar.id = 'nexusDrawingToolbar';
            toolbar.style.cssText = `
                position: absolute; left: 10px; top: 60px; z-index: 35;
                background: #1e222d; border: 1px solid #363c4e; border-radius: 6px;
                display: flex; flex-direction: column; gap: 4px; padding: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4); user-select: none;
            `;
            if (getComputedStyle(container).position === 'static') {
                container.style.position = 'relative';
            }
            container.appendChild(toolbar);
        }

        toolbar.innerHTML = '';

        const tools = [
            { id: 'cursor', icon: '➕', title: 'Cursor / Select' },
            { id: 'trendline', icon: '📈', title: 'Trend Line' },
            { id: 'fib', icon: '📊', title: 'Fibonacci Retracement' },
            { id: 'brush', icon: '🖌️', title: 'Brush / Freehand' },
            { id: 'text', icon: 'T', title: 'Text Note' },
            { id: 'measure', icon: '📏', title: 'Measure Range' },
            { type: 'separator' },
            { id: 'magnet', icon: '🧲', title: 'Magnet Mode', toggle: true },
            { id: 'lock', icon: '🔓', title: 'Lock All Drawings', toggle: true },
            { id: 'hide', icon: '👁️', title: 'Hide / Show Drawings', toggle: true },
            { type: 'separator' },
            { id: 'clear', icon: '🗑️', title: 'Clear All Drawings' }
        ];

        tools.forEach(item => {
            if (item.type === 'separator') {
                const sep = document.createElement('div');
                sep.style.cssText = 'height: 1px; background: #363c4e; margin: 4px 2px;';
                toolbar.appendChild(sep);
                return;
            }

            const btn = document.createElement('button');
            btn.id = `tool_${item.id}`;
            btn.innerHTML = item.icon;
            btn.title = item.title;
            btn.style.cssText = `
                background: ${this.activeTool === item.id ? '#26a69a' : 'transparent'};
                color: #d1d4dc; border: none; width: 32px; height: 32px;
                border-radius: 4px; display: flex; align-items: center; justify-content: center;
                font-size: 14px; cursor: pointer; transition: all 0.2s ease;
            `;

            btn.onclick = (e) => {
                e.stopPropagation();
                this.handleToolClick(item.id, btn);
            };
            toolbar.appendChild(btn);
        });

        this.setupCanvasLayer();
        this.setupFloatingToolbar();
        this.setupSettingsModal();
    }

    handleToolClick(toolId, btnElement) {
        if (toolId === 'clear') {
            if (confirm('සියලුම Drawings ඉවත් කිරීමට අවශ්‍යද?')) {
                this.drawings = [];
                this.selectedDrawing = null;
                this.hideFloatingToolbar();
                this.redrawCanvas();
            }
            return;
        }

        if (toolId === 'magnet') {
            this.isMagnetActive = !this.isMagnetActive;
            btnElement.style.background = this.isMagnetActive ? '#26a69a' : 'transparent';
            btnElement.style.color = this.isMagnetActive ? '#ffffff' : '#d1d4dc';
            return;
        }

        if (toolId === 'lock') {
            this.isLocked = !this.isLocked;
            btnElement.innerHTML = this.isLocked ? '🔒' : '🔓';
            btnElement.style.background = this.isLocked ? '#26a69a' : 'transparent';
            if (this.isLocked) this.hideFloatingToolbar();
            return;
        }

        if (toolId === 'hide') {
            this.isVisible = !this.isVisible;
            btnElement.style.background = !this.isVisible ? '#ef5350' : 'transparent';
            const canvas = document.getElementById('nexusDrawingCanvas');
            if (canvas) canvas.style.display = this.isVisible ? 'block' : 'none';
            if (!this.isVisible) this.hideFloatingToolbar();
            return;
        }

        document.querySelectorAll('#nexusDrawingToolbar button').forEach(b => {
            if (!['tool_magnet', 'tool_lock', 'tool_hide', 'tool_clear'].includes(b.id)) {
                b.style.background = 'transparent';
                b.style.color = '#d1d4dc';
            }
        });

        this.activeTool = toolId;
        btnElement.style.background = '#26a69a';
        btnElement.style.color = '#ffffff';

        const canvas = document.getElementById('nexusDrawingCanvas');
        if (canvas) {
            canvas.style.pointerEvents = (toolId === 'cursor' && !this.isDragging) ? 'none' : 'auto';
        }
    }

    setupCanvasLayer() {
        const container = document.getElementById('chartContainer');
        if (!container) return;

        let canvas = document.getElementById('nexusDrawingCanvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'nexusDrawingCanvas';
            canvas.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 22;';
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            container.appendChild(canvas);
        }

        const ctx = canvas.getContext('2d');
        let isDrawing = false;
        let startX = 0, startY = 0;

        container.onmousedown = (e) => {
            if (!this.isVisible || this.isLocked) return;
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (this.activeTool === 'cursor') {
                const clickedDrawing = this.findClosestDrawing(mouseX, mouseY);
                if (clickedDrawing) {
                    this.selectedDrawing = clickedDrawing;
                    this.isDragging = true;
                    this.dragStartX = mouseX;
                    this.dragStartY = mouseY;
                    canvas.style.pointerEvents = 'auto';
                    this.showFloatingToolbar(clickedDrawing, e.clientX, e.clientY);
                } else {
                    this.selectedDrawing = null;
                    this.hideFloatingToolbar();
                }
                this.redrawCanvas();
                return;
            }

            isDrawing = true;
            startX = mouseX;
            startY = mouseY;

            if (this.activeTool === 'text') {
                const text = prompt('ඇතුළත් කළ යුතු සටහන (Text) ලියන්න:', 'Nexus Trade');
                if (text) {
                    this.drawings.push({ 
                        type: 'text', x: startX, y: startY, text: text, color: '#26a69a', fontSize: 14 
                    });
                    this.redrawCanvas();
                }
                isDrawing = false;
            } else if (this.activeTool === 'brush') {
                this.currentDrawing = { type: 'brush', points: [{x: startX, y: startY}], color: '#26a69a', lineWidth: 2 };
            }
        };

        window.onmousemove = (e) => {
            if (!this.isVisible || !container) return;
            const rect = canvas.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;

            if (this.isDragging && this.selectedDrawing) {
                const dx = currentX - this.dragStartX;
                const dy = currentY - this.dragStartY;
                this.moveDrawing(this.selectedDrawing, dx, dy);
                this.dragStartX = currentX;
                this.dragStartY = currentY;
                this.redrawCanvas();
                return;
            }

            if (!isDrawing) return;
            this.redrawCanvas();

            ctx.strokeStyle = '#26a69a';
            ctx.lineWidth = 2;

            if (this.activeTool === 'trendline' || this.activeTool === 'measure' || this.activeTool === 'fib') {
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(currentX, currentY);
                ctx.stroke();
            } else if (this.activeTool === 'brush' && this.currentDrawing) {
                this.currentDrawing.points.push({x: currentX, y: currentY});
                ctx.beginPath();
                ctx.moveTo(this.currentDrawing.points[0].x, this.currentDrawing.points[0].y);
                this.currentDrawing.points.forEach(p => ctx.lineTo(p.x, p.y));
                ctx.stroke();
            }
        };

        window.onmouseup = (e) => {
            if (this.isDragging) {
                this.isDragging = false;
                if (this.activeTool === 'cursor') {
                    canvas.style.pointerEvents = 'none';
                }
                return;
            }
            if (!isDrawing) return;
            isDrawing = false;
            const rect = canvas.getBoundingClientRect();
            const endX = e.clientX - rect.left;
            const endY = e.clientY - rect.top;

            if (this.activeTool === 'trendline') {
                this.drawings.push({ type: 'trendline', x1: startX, y1: startY, x2: endX, y2: endY, color: '#26a69a', width: 2 });
            } else if (this.activeTool === 'fib') {
                this.drawings.push({ type: 'fib', x1: startX, y1: startY, x2: endX, y2: endY, color: '#26a69a', width: 2 });
            } else if (this.activeTool === 'brush' && this.currentDrawing) {
                this.drawings.push(this.currentDrawing);
                this.currentDrawing = null;
            } else if (this.activeTool === 'measure') {
                this.drawings.push({ type: 'measure', x1: startX, y1: startY, x2: endX, y2: endY, color: '#26a69a' });
            }

            this.redrawCanvas();
        };

        container.ondblclick = (e) => {
            if (this.isLocked) return;
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const target = this.findClosestDrawing(mouseX, mouseY);
            if (target) {
                this.openSettingsModal(target);
            }
        };

        window.addEventListener('resize', () => {
            if (container) {
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
                this.redrawCanvas();
            }
        });
    }

    setupFloatingToolbar() {
        if (document.getElementById('nexusFloatingToolbar')) return;
        const floatBar = document.createElement('div');
        floatBar.id = 'nexusFloatingToolbar';
        floatBar.style.cssText = `
            position: absolute; display: none; z-index: 100;
            background: #1e222d; border: 1px solid #363c4e; border-radius: 6px;
            padding: 4px 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            align-items: center; gap: 6px; user-select: none;
        `;
        floatBar.innerHTML = `
            <button id="float_settings" title="Settings" style="background:transparent; border:none; color:#d1d4dc; cursor:pointer; font-size:14px;">⚙️</button>
            <button id="float_color" title="Color" style="background:transparent; border:none; cursor:pointer; display:flex; align-items:center;"><input type="color" id="float_color_input" value="#26a69a" style="width:18px; height:18px; border:none; background:none; cursor:pointer;"></button>
            <button id="float_delete" title="Delete" style="background:transparent; border:none; color:#ef5350; cursor:pointer; font-size:14px;">🗑️</button>
        `;
        const container = document.getElementById('chartContainer');
        if (container) container.appendChild(floatBar);

        document.getElementById('float_delete').onclick = () => {
            if (this.selectedDrawing) {
                this.drawings = this.drawings.filter(d => d !== this.selectedDrawing);
                this.selectedDrawing = null;
                this.hideFloatingToolbar();
                this.redrawCanvas();
            }
        };

        document.getElementById('float_settings').onclick = () => {
            if (this.selectedDrawing) {
                this.openSettingsModal(this.selectedDrawing);
            }
        };

        document.getElementById('float_color_input').onchange = (e) => {
            if (this.selectedDrawing) {
                this.selectedDrawing.color = e.target.value;
                this.redrawCanvas();
            }
        };
    }

    showFloatingToolbar(drawing, clientX, clientY) {
        const floatBar = document.getElementById('nexusFloatingToolbar');
        const container = document.getElementById('chartContainer');
        if (!floatBar || !container) return;
        const rect = container.getBoundingClientRect();
        
        floatBar.style.display = 'flex';
        floatBar.style.left = `${Math.max(10, clientX - rect.left - 40)}px`;
        floatBar.style.top = `${Math.max(10, clientY - rect.top - 50)}px`;
        document.getElementById('float_color_input').value = drawing.color || '#26a69a';
    }

    hideFloatingToolbar() {
        const floatBar = document.getElementById('nexusFloatingToolbar');
        if (floatBar) floatBar.style.display = 'none';
    }

    findClosestDrawing(x, y) {
        for (let i = this.drawings.length - 1; i >= 0; i--) {
            let d = this.drawings[i];
            if (d.type === 'trendline' || d.type === 'measure' || d.type === 'fib') {
                let dist = this.distToSegment({x, y}, {x: d.x1, y: d.y1}, {x: d.x2, y: d.y2});
                if (dist < 12) return d;
            } else if (d.type === 'text') {
                let dist = Math.hypot(d.x - x, d.y - y);
                if (dist < 20) return d;
            }
        }
        return null;
    }

    distToSegment(p, p1, p2) {
        let l2 = (p2.x - p1.x)**2 + (p2.y - p1.y)**2;
        if (l2 === 0) return Math.hypot(p.x - p1.x, p.y - p1.y);
        let t = ((p.x - p1.x) * (p2.x - p1.x) + (p.y - p1.y) * (p2.y - p1.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(p.x - (p1.x + t * (p2.x - p1.x)), p.y - (p1.y + t * (p2.y - p1.y)));
    }

    moveDrawing(d, dx, dy) {
        if (d.x1 !== undefined) { d.x1 += dx; d.y1 += dy; }
        if (d.x2 !== undefined) { d.x2 += dx; d.y2 += dy; }
        if (d.x !== undefined) { d.x += dx; d.y += dy; }
        if (d.points) {
            d.points.forEach(p => { p.x += dx; p.y += dy; });
        }
    }

    redrawCanvas() {
        const canvas = document.getElementById('nexusDrawingCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        this.drawings.forEach(item => {
            ctx.strokeStyle = item.color || '#26a69a';
            ctx.fillStyle = item.color || '#26a69a';
            ctx.lineWidth = item.width || 2;

            if (item === this.selectedDrawing) {
                ctx.shadowColor = '#26a69a';
                ctx.shadowBlur = 8;
            } else {
                ctx.shadowBlur = 0;
            }

            if (item.type === 'trendline') {
                ctx.beginPath();
                ctx.moveTo(item.x1, item.y1);
                ctx.lineTo(item.x2, item.y2);
                ctx.stroke();
            } else if (item.type === 'fib') {
                ctx.beginPath();
                ctx.moveTo(item.x1, item.y1);
                ctx.lineTo(item.x2, item.y2);
                ctx.stroke();
                [0, 0.236, 0.382, 0.5, 0.618, 0.65, 0.786, 1].forEach(lvl => {
                    let lx = item.x1 + (item.x2 - item.x1) * lvl;
                    let ly = item.y1 + (item.y2 - item.y1) * lvl;
                    ctx.font = '10px sans-serif';
                    ctx.fillText(`${lvl}`, lx + 6, ly);
                });
            } else if (item.type === 'brush' && item.points) {
                ctx.beginPath();
                ctx.moveTo(item.points[0].x, item.points[0].y);
                item.points.forEach(p => ctx.lineTo(p.x, p.y));
                ctx.stroke();
            } else if (item.type === 'text') {
                ctx.font = `${item.fontSize || 14}px sans-serif`;
                ctx.fillText(item.text, item.x, item.y);
            } else if (item.type === 'measure') {
                ctx.beginPath();
                ctx.moveTo(item.x1, item.y1);
                ctx.lineTo(item.x2, item.y2);
                ctx.stroke();
                ctx.fillStyle = 'rgba(38, 166, 154, 0.15)';
                ctx.fillRect(Math.min(item.x1, item.x2), Math.min(item.y1, item.y2), Math.abs(item.x2 - item.x1), Math.abs(item.y2 - item.y1));
            }
            ctx.shadowBlur = 0;
        });
    }

    setupSettingsModal() {
        if (document.getElementById('nexusSettingsModal')) return;
        const modal = document.createElement('div');
        modal.id = 'nexusSettingsModal';
        modal.style.cssText = `
            position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%);
            background: #1e222d; border: 1px solid #363c4e; border-radius: 8px;
            padding: 20px; z-index: 10000; width: 300px; box-shadow: 0 8px 24px rgba(0,0,0,0.6);
            display: none; color: #d1d4dc; font-family: sans-serif; user-select: none;
        `;
        modal.innerHTML = `
            <h3 style="margin-top:0; color:#fff; font-size:16px;">Drawing Settings</h3>
            <div id="nexusModalBody" style="margin: 15px 0; display: flex; flex-direction: column; gap: 10px;"></div>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button id="nexusModalSave" style="background:#26a69a; color:#fff; border:none; padding:6px 14px; border-radius:4px; cursor:pointer;">Save</button>
                <button id="nexusModalClose" style="background:#363c4e; color:#fff; border:none; padding:6px 14px; border-radius:4px; cursor:pointer;">Cancel</button>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('nexusModalClose').onclick = () => modal.style.display = 'none';
    }

    openSettingsModal(drawing) {
        const modal = document.getElementById('nexusSettingsModal');
        const body = document.getElementById('nexusModalBody');
        if (!modal || !body) return;

        let html = '';
        if (drawing.type === 'trendline' || drawing.type === 'measure' || drawing.type === 'fib') {
            html = `
                <label style="font-size:12px;">X1 Coordinate: <input type="number" id="set_x1" value="${Math.round(drawing.x1)}" style="width:100%; background:#2a2e39; color:#fff; border:1px solid #363c4e; padding:4px; border-radius:4px;"></label>
                <label style="font-size:12px;">Y1 Coordinate: <input type="number" id="set_y1" value="${Math.round(drawing.y1)}" style="width:100%; background:#2a2e39; color:#fff; border:1px solid #363c4e; padding:4px; border-radius:4px;"></label>
                <label style="font-size:12px;">X2 Coordinate: <input type="number" id="set_x2" value="${Math.round(drawing.x2)}" style="width:100%; background:#2a2e39; color:#fff; border:1px solid #363c4e; padding:4px; border-radius:4px;"></label>
                <label style="font-size:12px;">Y2 Coordinate: <input type="number" id="set_y2" value="${Math.round(drawing.y2)}" style="width:100%; background:#2a2e39; color:#fff; border:1px solid #363c4e; padding:4px; border-radius:4px;"></label>
            `;
        } else if (drawing.type === 'text') {
            html = `
                <label style="font-size:12px;">Text Content: <input type="text" id="set_text" value="${drawing.text}" style="width:100%; background:#2a2e39; color:#fff; border:1px solid #363c4e; padding:4px; border-radius:4px;"></label>
                <label style="font-size:12px;">X Coordinate: <input type="number" id="set_x" value="${Math.round(drawing.x)}" style="width:100%; background:#2a2e39; color:#fff; border:1px solid #363c4e; padding:4px; border-radius:4px;"></label>
                <label style="font-size:12px;">Y Coordinate: <input type="number" id="set_y" value="${Math.round(drawing.y)}" style="width:100%; background:#2a2e39; color:#fff; border:1px solid #363c4e; padding:4px; border-radius:4px;"></label>
            `;
        }
        body.innerHTML = html;
        modal.style.display = 'block';

        document.getElementById('nexusModalSave').onclick = () => {
            if (drawing.x1 !== undefined) {
                drawing.x1 = parseFloat(document.getElementById('set_x1').value) || drawing.x1;
                drawing.y1 = parseFloat(document.getElementById('set_y1').value) || drawing.y1;
                drawing.x2 = parseFloat(document.getElementById('set_x2').value) || drawing.x2;
                drawing.y2 = parseFloat(document.getElementById('set_y2').value) || drawing.y2;
            } else if (drawing.type === 'text') {
                drawing.text = document.getElementById('set_text').value;
                drawing.x = parseFloat(document.getElementById('set_x').value) || drawing.x;
                drawing.y = parseFloat(document.getElementById('set_y').value) || drawing.y;
            }
            this.redrawCanvas();
            modal.style.display = 'none';
        };
    }
}

// Safe Initialization
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.nexusDrawingToolbar = new NexusDrawingToolbar();
} else {
    window.addEventListener('DOMContentLoaded', () => {
        window.nexusDrawingToolbar = new NexusDrawingToolbar();
    });
}