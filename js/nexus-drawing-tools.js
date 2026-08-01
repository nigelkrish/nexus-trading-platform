// --- Nexus Trading Platform - Advanced Drawing Manager (TradingView Style with Handles, Text & Floating Toolbar) ---

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

    draw(ctx, item, isSelected = false) {
        ctx.strokeStyle = item.color || '#26a69a';
        ctx.fillStyle = item.color || '#26a69a';
        ctx.lineWidth = item.width || 2;

        // Main Shape Drawing
        if (item.subType === 'trendline' || item.type === 'trend') {
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

        // Render Text if available
        if (item.text) {
            ctx.save();
            ctx.font = '12px Inter, sans-serif';
            ctx.fillStyle = item.color || '#26a69a';
            ctx.textAlign = 'center';
            const midX = (item.x1 + item.x2) / 2;
            const midY = (item.y1 + item.y2) / 2 - 8;
            ctx.fillText(item.text, midX, midY);
            ctx.restore();
        }

        // Render TradingView Style Selection Handles & Boxes
        if (isSelected) {
            // Endpoints (Blue Circles)
            const drawHandle = (hx, hy) => {
                ctx.save();
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#2962ff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(hx, hy, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            };

            drawHandle(item.x1, item.y1);
            drawHandle(item.x2, item.y2);

            // Middle Text Box Indicator (TradingView Style box on line center)
            const midX = (item.x1 + item.x2) / 2;
            const midY = (item.y1 + item.y2) / 2;
            ctx.save();
            ctx.strokeStyle = '#2962ff';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.strokeRect(midX - 35, midY - 12, 70, 24);
            ctx.restore();
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
        this.selectedDrawing = null;
        this.draggingHandle = null; // 'p1', 'p2', or 'move'
        
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
                this.selectedDrawing = null;
                this.removeFloatingToolbar();
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
        if (toolId !== 'cursor') {
            this.selectedDrawing = null;
            this.removeFloatingToolbar();
            this.redrawCanvas();
        }
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
        let dragStartX = 0, dragStartY = 0;

        canvas.onmousedown = (e) => {
            if (!this.isVisible || this.isLocked) return;
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (e.button === 2) { // Right Click
                e.preventDefault();
                return;
            }

            if (this.activeTool === 'cursor') {
                // Check if clicking on handles of selected drawing
                if (this.selectedDrawing) {
                    const distP1 = Math.hypot(mouseX - this.selectedDrawing.x1, mouseY - this.selectedDrawing.y1);
                    const distP2 = Math.hypot(mouseX - this.selectedDrawing.x2, mouseY - this.selectedDrawing.y2);
                    
                    if (distP1 < 10) {
                        this.draggingHandle = 'p1';
                        return;
                    } else if (distP2 < 10) {
                        this.draggingHandle = 'p2';
                        return;
                    }

                    // Check if clicking near middle text box area
                    const midX = (this.selectedDrawing.x1 + this.selectedDrawing.x2) / 2;
                    const midY = (this.selectedDrawing.y1 + this.selectedDrawing.y2) / 2;
                    if (Math.abs(mouseX - midX) < 35 && Math.abs(mouseY - midY) < 12) {
                        let newText = prompt('Enter text for this drawing:', this.selectedDrawing.text || '');
                        if (newText !== null) {
                            this.selectedDrawing.text = newText;
                            this.redrawCanvas();
                            this.showFloatingToolbar(this.selectedDrawing);
                        }
                        return;
                    }
                }

                // Select drawing on click
                let found = null;
                for (let item of this.drawings) {
                    if (this.pDistance(mouseX, mouseY, item.x1, item.y1, item.x2, item.y2) < 10) {
                        found = item;
                        break;
                    }
                }

                this.selectedDrawing = found;
                if (this.selectedDrawing) {
                    this.showFloatingToolbar(this.selectedDrawing);
                    dragStartX = mouseX;
                    dragStartY = mouseY;
                    this.draggingHandle = 'move';
                } else {
                    this.removeFloatingToolbar();
                }
                this.redrawCanvas();
                return;
            }

            // New Drawing Creation
            isDrawing = true;
            startX = mouseX;
            startY = mouseY;
        };

        canvas.onmousemove = (e) => {
            if (!this.isVisible) return;
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (this.draggingHandle && this.selectedDrawing) {
                const dx = mouseX - dragStartX;
                const dy = mouseY - dragStartY;

                if (this.draggingHandle === 'p1') {
                    this.selectedDrawing.x1 = mouseX;
                    this.selectedDrawing.y1 = mouseY;
                } else if (this.draggingHandle === 'p2') {
                    this.selectedDrawing.x2 = mouseX;
                    this.selectedDrawing.y2 = mouseY;
                } else if (this.draggingHandle === 'move') {
                    this.selectedDrawing.x1 += dx;
                    this.selectedDrawing.y1 += dy;
                    this.selectedDrawing.x2 += dx;
                    this.selectedDrawing.y2 += dy;
                    dragStartX = mouseX;
                    dragStartY = mouseY;
                }
                this.redrawCanvas();
                return;
            }
        };

        canvas.onmouseup = (e) => {
            this.draggingHandle = null;
            if (!isDrawing) return;
            isDrawing = false;
            const rect = canvas.getBoundingClientRect();
            const endX = e.clientX - rect.left;
            const endY = e.clientY - rect.top;

            if (this.activeTool !== 'cursor') {
                const newObj = {
                    id: Date.now(),
                    type: this.activeTool,
                    subType: this.activeTool === 'trendline' ? this.activeSubTool : this.activeTool,
                    x1: startX, y1: startY,
                    x2: endX, y2: endY,
                    color: '#26a69a',
                    width: 2,
                    text: ''
                };
                this.drawings.push(newObj);
                this.selectedDrawing = newObj;
                this.showFloatingToolbar(newObj);
                this.activeTool = 'cursor';
                
                // Reset toolbar active visual back to cursor
                document.querySelectorAll('#nexusDrawingToolbar button').forEach(b => {
                    b.style.background = 'transparent';
                    b.style.color = '#d1d4dc';
                });
                const cursorBtn = document.getElementById('tool_cursor');
                if (cursorBtn) {
                    cursorBtn.style.background = '#26a69a';
                    cursorBtn.style.color = '#ffffff';
                }

                this.redrawCanvas();
            }
        };

        canvas.oncontextmenu = (e) => e.preventDefault();

        window.addEventListener('resize', () => {
            if (this.container) {
                canvas.width = this.container.clientWidth;
                canvas.height = this.container.clientHeight;
                this.redrawCanvas();
            }
        });
    }

    // TradingView Style Floating Smooth Draggable Toolbar
    showFloatingToolbar(drawing) {
        this.removeFloatingToolbar();

        const bar = document.createElement('div');
        bar.id = 'nexusFloatingBar';
        bar.style.cssText = `
            position: absolute; left: ${Math.min(drawing.x1, drawing.x2) + 20}px; top: ${Math.min(drawing.y1, drawing.y2) - 50}px; z-index: 99999;
            background: #1e222d; border: 1px solid #363c4e; border-radius: 8px;
            display: flex; align-items: center; gap: 8px; padding: 6px 12px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.5); user-select: none; cursor: grab;
        `;

        bar.innerHTML = `
            <span style="color: #848e9c; cursor: grab; font-size: 14px;" title="Drag Toolbar">⠿</span>
            <input type="color" id="ftColor" value="${drawing.color}" style="border:none; width:22px; height:22px; background:none; cursor:pointer;" title="Change Color">
            <select id="ftWidth" style="background:#2a2e39; color:#fff; border:1px solid #363c4e; border-radius:4px; padding:2px 4px; font-size:12px;" title="Thickness">
                <option value="1" ${drawing.width==1?'selected':''}>1px</option>
                <option value="2" ${drawing.width==2?'selected':''}>2px</option>
                <option value="3" ${drawing.width==3?'selected':''}>3px</option>
                <option value="4" ${drawing.width==4?'selected':''}>4px</option>
            </select>
            <button id="ftTextBtn" style="background:#2a2e39; color:#d1d4dc; border:1px solid #363c4e; border-radius:4px; padding:2px 6px; font-size:12px; cursor:pointer;" title="Add/Edit Text">T Text</button>
            <div style="width:1px; height:16px; background:#363c4e;"></div>
            <button id="ftDel" style="background:transparent; border:none; color:#ef5350; cursor:pointer; font-size:14px;" title="Delete">🗑️</button>
        `;

        this.container.appendChild(bar);

        // Smooth Dragging functionality for the Floating Toolbar itself
        let isDraggingBar = false;
        let startX, startY;

        bar.onmousedown = (e) => {
            if (['INPUT', 'SELECT', 'BUTTON'].includes(e.target.tagName)) return;
            isDraggingBar = true;
            startX = e.clientX - bar.offsetLeft;
            startY = e.clientY - bar.offsetTop;
            bar.style.cursor = 'grabbing';
        };

        window.onmousemove = (e) => {
            if (!isDraggingBar) return;
            bar.style.left = `${e.clientX - startX}px`;
            bar.style.top = `${e.clientY - startY}px`;
        };

        window.onmouseup = () => {
            isDraggingBar = false;
            bar.style.cursor = 'grab';
        };

        // Event bindings for toolbar controls
        document.getElementById('ftColor').oninput = (e) => {
            drawing.color = e.target.value;
            this.redrawCanvas();
        };

        document.getElementById('ftWidth').onchange = (e) => {
            drawing.width = parseInt(e.target.value);
            this.redrawCanvas();
        };

        document.getElementById('ftTextBtn').onclick = () => {
            let txt = prompt('Enter text for this tool:', drawing.text || '');
            if (txt !== null) {
                drawing.text = txt;
                this.redrawCanvas();
            }
        };

        document.getElementById('ftDel').onclick = () => {
            this.drawings = this.drawings.filter(d => d !== drawing);
            this.selectedDrawing = null;
            this.removeFloatingToolbar();
            this.redrawCanvas();
        };
    }

    removeFloatingToolbar() {
        const bar = document.getElementById('nexusFloatingBar');
        if (bar) bar.remove();
    }

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
        
        this.drawings.forEach(item => {
            const isSelected = (item === this.selectedDrawing);
            this.trendModule.draw(ctx, item, isSelected);
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.nexusDrawingManager = new NexusDrawingManager();
});