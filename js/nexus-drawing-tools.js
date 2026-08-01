// --- Nexus Trading Platform - Main Drawing Manager & Toolbar (With Right-Click Settings Menu) ---

class TrendToolsModule {
    constructor() {
        this.subTools = [
            { id: 'trendline', name: 'Trend Line', icon: '📈' },
            { id: 'ray', name: 'Ray', icon: '↗️' },
            { id: 'infoline', name: 'Info Line', icon: 'ℹ️' },
            { id: 'extendedline', name: 'Extended Line', icon: '⟷' },
            { id: 'horizline', name: 'Horizontal Line', icon: '➖' },
            { id: 'vertline', name: 'Vertical Line', icon: '⏐' },
            { id: 'parallelchannel', name: 'Parallel Channel', icon: '📊' }
        ];
    }

    showSubMenu(parentButton, onSelectCallback) {
        let existingMenu = document.getElementById('nexusTrendSubMenu');
        if (existingMenu) {
            existingMenu.remove();
            return;
        }

        const menu = document.createElement('div');
        menu.id = 'nexusTrendSubMenu';
        menu.style.cssText = `
            position: absolute; left: 45px; top: ${parentButton.offsetTop}px; z-index: 50;
            background: #1e222d; border: 1px solid #363c4e; border-radius: 6px;
            display: flex; flex-direction: column; gap: 2px; padding: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5); width: 160px; user-select: none;
        `;

        this.subTools.forEach(tool => {
            const item = document.createElement('div');
            item.innerHTML = `<span style="margin-right:8px;">${tool.icon}</span> ${tool.name}`;
            item.style.cssText = `
                padding: 6px 10px; font-size: 12px; color: #d1d4dc; cursor: pointer;
                border-radius: 4px; display: flex; align-items: center; transition: background 0.2s;
            `;
            item.onmouseover = () => item.style.background = '#2a2e39';
            item.onmouseout = () => item.style.background = 'transparent';
            
            item.onclick = (e) => {
                e.stopPropagation();
                onSelectCallback(tool.id, tool.icon);
                menu.remove();
            };
            menu.appendChild(item);
        });

        parentButton.parentElement.appendChild(menu);

        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }

    draw(ctx, item) {
        ctx.strokeStyle = item.color || '#26a69a';
        ctx.fillStyle = item.color || '#26a69a';
        ctx.lineWidth = item.width || 2;

        if (item.subType === 'trendline') {
            ctx.beginPath();
            ctx.moveTo(item.x1, item.y1);
            ctx.lineTo(item.x2, item.y2);
            ctx.stroke();
        } 
        else if (item.subType === 'ray') {
            const angle = Math.atan2(item.y2 - item.y1, item.x2 - item.x1);
            const extendedX = item.x1 + Math.cos(angle) * 3000;
            const extendedY = item.y1 + Math.sin(angle) * 3000;
            ctx.beginPath();
            ctx.moveTo(item.x1, item.y1);
            ctx.lineTo(extendedX, extendedY);
            ctx.stroke();
        } 
        else if (item.subType === 'horizline') {
            ctx.beginPath();
            ctx.moveTo(0, item.y1);
            ctx.lineTo(ctx.canvas.width, item.y1);
            ctx.stroke();
        } 
        else if (item.subType === 'vertline') {
            ctx.beginPath();
            ctx.moveTo(item.x1, 0);
            ctx.lineTo(item.x1, ctx.canvas.height);
            ctx.stroke();
        }
        else if (item.subType === 'parallelchannel') {
            let heightOffset = (item.y2 - item.y1) / 2;
            ctx.beginPath();
            ctx.moveTo(item.x1, item.y1);
            ctx.lineTo(item.x2, item.y2);
            ctx.moveTo(item.x1, item.y1 + heightOffset);
            ctx.lineTo(item.x2, item.y2 + heightOffset);
            ctx.stroke();
            ctx.fillStyle = 'rgba(38, 166, 154, 0.08)';
            ctx.fillRect(Math.min(item.x1, item.x2), Math.min(item.y1, item.y1 + heightOffset), Math.abs(item.x2 - item.x1), Math.abs(heightOffset));
        }
    }
}

class NexusDrawingManager {
    constructor() {
        this.activeTool = 'cursor';
        this.activeSubTool = 'trendline';
        this.isMagnetActive = false;
        this.isLocked = false;
        this.isVisible = true;
        this.drawings = [];
        
        this.trendModule = new TrendToolsModule();

        this.initContainer();
        this.initToolbar();
        this.setupCanvasLayer();
    }

    initContainer() {
        this.container = document.getElementById('chartContainer');
        if (!this.container) {
            setTimeout(() => this.initContainer(), 300);
            return;
        }
        if (getComputedStyle(this.container).position === 'static') {
            this.container.style.position = 'relative';
        }
    }

    initToolbar() {
        if (!this.container) return;

        let toolbar = document.getElementById('nexusDrawingToolbar');
        if (!toolbar) {
            toolbar = document.createElement('div');
            toolbar.id = 'nexusDrawingToolbar';
            toolbar.style.cssText = `
                position: absolute; left: 10px; top: 60px; z-index: 9999;
                background: #1e222d; border: 1px solid #363c4e; border-radius: 6px;
                display: flex; flex-direction: column; gap: 4px; padding: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4); user-select: none;
            `;
            this.container.appendChild(toolbar);
        }

        toolbar.innerHTML = '';

        const tools = [
            { id: 'cursor', icon: '➕', title: 'Cursor / Select' },
            { id: 'trendline', icon: '📈', title: 'Trend Line Tools', hasSubMenu: true },
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
            btn.innerHTML = item.icon + (item.hasSubMenu ? ' <span style="font-size:8px;">▼</span>' : '');
            btn.title = item.title;
            btn.style.cssText = `
                background: ${this.activeTool === item.id ? '#26a69a' : 'transparent'};
                color: #d1d4dc; border: none; width: 32px; height: 32px;
                border-radius: 4px; display: flex; align-items: center; justify-content: center;
                font-size: 14px; cursor: pointer; transition: all 0.2s ease;
            `;

            btn.onclick = (e) => {
                e.stopPropagation();
                if (item.hasSubMenu) {
                    this.trendModule.showSubMenu(btn, (selectedId, selectedIcon) => {
                        this.activeSubTool = selectedId;
                        btn.innerHTML = selectedIcon + ' <span style="font-size:8px;">▼</span>';
                    });
                }
                this.handleToolClick(item.id, btn);
            };
            toolbar.appendChild(btn);
        });
    }

    handleToolClick(toolId, btnElement) {
        if (toolId === 'clear') {
            if (confirm('සියලුම Drawings ඉවත් කිරීමට අවශ්‍යද?')) {
                this.drawings = [];
                this.redrawCanvas();
            }
            return;
        }

        if (toolId === 'magnet' || toolId === 'lock' || toolId === 'hide') {
            this.handleToggleTools(toolId, btnElement);
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
    }

    handleToggleTools(toolId, btnElement) {
        if (toolId === 'magnet') {
            this.isMagnetActive = !this.isMagnetActive;
            btnElement.style.background = this.isMagnetActive ? '#26a69a' : 'transparent';
        } else if (toolId === 'lock') {
            this.isLocked = !this.isLocked;
            btnElement.innerHTML = this.isLocked ? '🔒' : '🔓';
            btnElement.style.background = this.isLocked ? '#26a69a' : 'transparent';
        } else if (toolId === 'hide') {
            this.isVisible = !this.isVisible;
            btnElement.style.background = !this.isVisible ? '#ef5350' : 'transparent';
            const canvas = document.getElementById('nexusDrawingCanvas');
            if (canvas) canvas.style.display = this.isVisible ? 'block' : 'none';
        }
    }

    setupCanvasLayer() {
        if (!this.container) return;

        let canvas = document.getElementById('nexusDrawingCanvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'nexusDrawingCanvas';
            canvas.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: auto; z-index: 22;';
            canvas.width = this.container.clientWidth;
            canvas.height = this.container.clientHeight;
            this.container.appendChild(canvas);
        }

        let isDrawing = false;
        let startX = 0, startY = 0;

        canvas.onmousedown = (e) => {
            if (!this.isVisible || this.isLocked) return;
            
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Right-Click කළ විට (Button 2) ඩ්‍රොයින් එකක් අසල මෙනුව පෙන්වීම
            if (e.button === 2) {
                e.preventDefault();
                this.checkAndShowContextMenu(mouseX, mouseY, e.clientX, e.clientY);
                return;
            }

            if (this.activeTool === 'cursor') return;

            isDrawing = true;
            startX = mouseX;
            startY = mouseY;
        };

        // Right-Click එකේදී Default Browser Context Menu එක ඒම වැළැක්වීම
        canvas.oncontextmenu = (e) => e.preventDefault();

        canvas.onmouseup = (e) => {
            if (!isDrawing) return;
            isDrawing = false;
            const rect = canvas.getBoundingClientRect();
            const endX = e.clientX - rect.left;
            const endY = e.clientY - rect.top;

            if (this.activeTool === 'trendline') {
                this.drawings.push({
                    id: Date.now(),
                    type: 'trend',
                    subType: this.activeSubTool,
                    x1: startX, y1: startY,
                    x2: endX, y2: endY,
                    color: '#26a69a', width: 2
                });
                this.redrawCanvas();
            }
        };

        window.addEventListener('resize', () => {
            if (this.container) {
                canvas.width = this.container.clientWidth;
                canvas.height = this.container.clientHeight;
                this.redrawCanvas();
            }
        });
    }

    // ඩ්‍රොයින් එකක් මත Right-Click කළ විට Settings මෙනුව පෙන්වීම
    checkAndShowContextMenu(x, y, clientX, clientY) {
        let clickedDrawing = null;

        // ක්ලික් කළ තැනට ආසන්නව ඇති ඩ්‍රොයින් එකක් සෙවීම (Tolerance: 10px)
        for (let item of this.drawings) {
            let dist = this.pDistance(x, y, item.x1, item.y1, item.x2, item.y2);
            if (dist < 10) {
                clickedDrawing = item;
                break;
            }
        }

        let existingMenu = document.getElementById('nexusContextMenu');
        if (existingMenu) existingMenu.remove();

        if (!clickedDrawing) return;

        const menu = document.createElement('div');
        menu.id = 'nexusContextMenu';
        menu.style.cssText = `
            position: fixed; left: ${clientX}px; top: ${clientY}px; z-index: 10000;
            background: #1e222d; border: 1px solid #363c4e; border-radius: 6px;
            display: flex; flex-direction: column; gap: 4px; padding: 6px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.6); width: 170px; user-select: none;
        `;

        menu.innerHTML = `
            <div style="font-size: 11px; color: #848e9c; padding: 4px 8px; border-bottom: 1px solid #363c4e; margin-bottom: 2px;">Drawing Settings</div>
            <div id="set_color" style="padding: 6px 8px; font-size: 12px; color: #d1d4dc; cursor: pointer; border-radius: 4px; display:flex; justify-content:space-between; align-items:center;">
                <span>🎨 Change Color</span>
                <input type="color" id="drawingColorPicker" value="${clickedDrawing.color}" style="border:none; width:20px; height:20px; background:none; cursor:pointer;">
            </div>
            <div id="set_width" style="padding: 6px 8px; font-size: 12px; color: #d1d4dc; cursor: pointer; border-radius: 4px;">
                📏 Thickness: <select id="drawingWidthSelect" style="background:#2a2e39; color:#fff; border:1px solid #363c4e; border-radius:3px;">
                    <option value="1" ${clickedDrawing.width==1?'selected':''}>1px</option>
                    <option value="2" ${clickedDrawing.width==2?'selected':''}>2px</option>
                    <option value="3" ${clickedDrawing.width==3?'selected':''}>3px</option>
                    <option value="4" ${clickedDrawing.width==4?'selected':''}>4px</option>
                </select>
            </div>
            <div style="height: 1px; background: #363c4e; margin: 2px 0;"></div>
            <div id="set_delete" style="padding: 6px 8px; font-size: 12px; color: #ef5350; cursor: pointer; border-radius: 4px;">🗑️ Delete Drawing</div>
        `;

        document.body.appendChild(menu);

        // පාට වෙනස් කිරීම
        document.getElementById('drawingColorPicker').oninput = (e) => {
            clickedDrawing.color = e.target.value;
            this.redrawCanvas();
        };

        // ඝනකම වෙනස් කිරීම
        document.getElementById('drawingWidthSelect').onchange = (e) => {
            clickedDrawing.width = parseInt(e.target.value);
            this.redrawCanvas();
        };

        // ඩ්‍රොයින් එක ඉවත් කිරීම (Delete)
        document.getElementById('set_delete').onclick = () => {
            this.drawings = this.drawings.filter(d => d !== clickedDrawing);
            this.redrawCanvas();
            menu.remove();
        };

        // මෙනුවෙන් පිටත ක්ලික් කළහොත් එය වැසී යාම
        document.addEventListener('click', function closeCtx(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeCtx);
            }
        });
    }

    // ලයින් එකක් අසලටම මවුසය ක්ලික් වී ඇත්දැයි ගණනය කරන ගණිතමය සූත්‍රය
    pDistance(x, y, x1, y1, x2, y2) {
        let A = x - x1;
        let B = y - y1;
        let C = x2 - x1;
        let D = y2 - y1;
        let dot = A * C + B * D;
        let len_sq = C * C + D * D;
        let param = -1;
        if (len_sq !== 0) param = dot / len_sq;
        let xx, yy;
        if (param < 0) { xx = x1; yy = y1; }
        else if (param > 1) { xx = x2; yy = y2; }
        else { xx = x1 + param * C; yy = y1 + param * D; }
        let dx = x - xx;
        let dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    redrawCanvas() {
        const canvas = document.getElementById('nexusDrawingCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        this.drawings.drawings = this.drawings || [];
        this.drawings.forEach(item => {
            if (item.type === 'trend') {
                this.trendModule.draw(ctx, item);
            }
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.nexusDrawingManager = new NexusDrawingManager();
});