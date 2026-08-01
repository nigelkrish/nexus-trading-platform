document.addEventListener("DOMContentLoaded", () => {
    // 1. Initial Load එකේදී Default Colors ඩීෆෝල්ට් සිලෙක්ට් වෙලා තියෙන්න දාන කොටස
    const defaultSettings = {
        upBody: "#2962ff",
        downBody: "#000000",
        upBorder: "#2962ff",
        downBorder: "#000000",
        upWick: "#2962ff",
        downWick: "#000000"
    };

    // UI එකේ input සහ color swatch වලට මුල් අගයන් දීම
    function initColorPickers() {
        const colorMappings = [
            { inputId: "tvUpBodyColor", value: defaultSettings.upBody },
            { inputId: "tvDownBodyColor", value: defaultSettings.downBody },
            { inputId: "tvUpBorderColor", value: defaultSettings.upBorder },
            { inputId: "tvDownBorderColor", value: defaultSettings.downBorder },
            { inputId: "tvUpWickColor", value: defaultSettings.upWick },
            { inputId: "tvDownWickColor", value: defaultSettings.downWick }
        ];

        colorMappings.forEach(item => {
            const inputEl = document.getElementById(item.inputId);
            if (inputEl) {
                inputEl.value = item.value;
                const swatch = inputEl.parentElement.querySelector(".tv-custom-color-swatch");
                if (swatch) {
                    swatch.style.backgroundColor = item.value;
                }
            }
        });
    }

    initColorPickers();

    // 2. අපි වෙනස් කළාට පස්සේ (Change Event) පමණක් චාට් එකට පාට මාරු වෙන්න හදන කොටස
    const colorInputs = document.querySelectorAll(".tv-native-color-input");
    colorInputs.forEach(input => {
        input.addEventListener("input", (e) => {
            const selectedColor = e.target.value;
            const swatch = e.target.parentElement.querySelector(".tv-custom-color-swatch");
            
            // Rounded box එකේ background එක ක්ෂණිකව අපේට් කිරීම
            if (swatch) {
                swatch.style.backgroundColor = selectedColor;
            }
        });

        // වෙනස්කම් ඉන්පුට් කරලා අවසන් වුණාම (Change) චාට් එකට පාට යැවීම
        input.addEventListener("change", (e) => {
            const colorId = e.target.id;
            const newColor = e.target.value;
            applyChartColorChange(colorId, newColor);
        });
    });

    function applyChartColorChange(id, color) {
        // මෙතැනදී ඔයාගේ Lightweight Charts වලට අදාළ වන Series එක Update කිරීමේ කෝඩ් එක ක්‍රියාත්මක වේ
        if (typeof window.myChartSeries !== "undefined" && window.myChartSeries) {
            // උදාහරණයක් ලෙස Candles options අප්ඩේට් කිරීම
            let options = {};
            if (id.includes("Body")) {
                options = id.includes("Up") ? { upColor: color } : { downColor: color };
            } else if (id.includes("Border")) {
                options = id.includes("Up") ? { borderUpColor: color } : { borderDownColor: color };
            } else if (id.includes("Wick")) {
                options = id.includes("Up") ? { wickUpColor: color } : { wickDownColor: color };
            }
            window.myChartSeries.applyOptions(options);
        }
    }
});