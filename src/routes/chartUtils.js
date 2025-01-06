
// Generate colors tailored to each chart
export const generateColors = (num) => {
    const colors = [];
    for (let i = 0; i < num; i++) {
        let r = Math.floor(Math.random() * 255);
        let g = Math.floor(Math.random() * 255);
        let b = Math.floor(Math.random() * 255);
        colors.push(`rgba(${r},${g},${b},0.6)`); // Semi-transparent colors
    }
    return colors;
};


// Generate random colors
const getChartColors = () => {
    const backdropColor = [];
    const backgroundColor = [];
    const borderColor = [];
    for (let i = 0; i < 50; i++) {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        backgroundColor.push(`rgba(${r},${g},${b},0.20)`);
        backdropColor.push(`rgba(${r},${g},${b},0.75)`);
        borderColor.push(`rgba(${r},${g},${b},1)`);
    }
    return { backdropColor, backgroundColor, borderColor };
};

export const chartColors = getChartColors();