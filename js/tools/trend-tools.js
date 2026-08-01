export class TrendToolsModule {
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

    // Trend Sub-menu එක Toolbar එක අසල පෙන්වීම
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
                onSelectCallback(tool.id);
                menu.remove();
            };
            menu.appendChild(item);
        });

        parentButton.parentElement.appendChild(menu);

        // වෙනත් තැනක ක්ලික් කළහොත් මෙනුව වැසීම
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }

    // Canvas එක මත අදාළ Trend Tool එකට අනුව ඇඳීම සිදු කිරීම
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
            // Ray: එක පැත්තකට පමණක් අනන්තයට දිගු වේ
            const angle = Math.atan2(item.y2 - item.y1, item.x2 - item.x1);
            const extendedX = item.x1 + Math.cos(angle) * 2000;
            const extendedY = item.y1 + Math.sin(angle) * 2000;
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
            let heightOffset = (item.y2 - item.y1) / 2; // සරල Parallel පරතරය
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