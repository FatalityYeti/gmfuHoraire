/** @jsx createElement */
/** @jsxFrag createFragment */

console.log("test")

const canvas = {
  marginX: 10,
  marginY: 10,

  // for the inputs
  minX: 20,
  maxX: 140,
  minY: 0,
  maxY: 20,
}
const lines = [
  {
    color: "#000000",
    strokeWidth: 4,
    points: [[20,0], [140,20]]
  },
  {
    color: "var(--accent)",
    strokeWidth: 4,
    points: [[50,10], [60, 10], [100, 16]]
  },
]
/*
function renderGraph(canvas, lines) {
  const element = <svg class="graphsvg" width="100" height="100" xmlns="http://www.w3.org/2000/svg"></svg>
  function render() {
    const rect = document.querySelector(".graph").getBoundingClientRect()
    const availableWidth = rect.width - canvas.marginX * 2;
    const availableHeight = rect.height - canvas.marginY * 2;
    const xMult = availableWidth / (canvas.maxX - canvas.minX)
    const yMult = availableHeight / (canvas.maxY - canvas.minY)
    const baseX = canvas.marginX
    const baseY = rect.height - canvas.marginY
    element.setAttribute("width", rect.width);
    element.setAttribute("height", rect.height);
    element.innerHTML = lines.map(line =>
      `<path stroke="${line.color}" stroke-width="${line.strokeWidth}" fill="none" stroke-linejoin="round" stroke-linecap="round"
          d="${line.points.map(([x,y], i) => {
            if (i == 0 ) return `M ${Math.round(baseX + (x - canvas.minX) * xMult)} ${Math.round(baseY - (y - canvas.minY) * yMult)}`
            return `L ${Math.round(baseX + (x - canvas.minX) * xMult)} ${Math.round(baseY - (y - canvas.minY) * yMult)}`
        }).join(" ")}"
      /></path>`
    ).join("")
  }
  window.addEventListener("resize", render);
  render();
  return element
}*/
function renderGraph(canvas, lines) {
  const element = document.querySelector(".graph")
  function render() {
    const rect = element.getBoundingClientRect()
    const availableWidth = rect.width - canvas.marginX * 2;
    const availableHeight = rect.height - canvas.marginY * 2;
    const xMult = availableWidth / (canvas.maxX - canvas.minX)
    const yMult = availableHeight / (canvas.maxY - canvas.minY)
    const baseX = canvas.marginX
    const baseY = rect.height - canvas.marginY
    console.log(availableWidth, availableHeight)
    element.innerHTML = 
    `<svg class="graphsvg" width="100" height="100" xmlns="http://www.w3.org/2000/svg">${
      lines.map(line =>
        `<path stroke="${line.color}" stroke-width="${line.strokeWidth}" fill="none" stroke-linejoin="round" stroke-linecap="round"
            d="${line.points.map(([x,y], i) => {
              if (i == 0 ) return `M ${Math.round(baseX + (x - canvas.minX) * xMult)} ${Math.round(baseY - (y - canvas.minY) * yMult)}`
              return `L ${Math.round(baseX + (x - canvas.minX) * xMult)} ${Math.round(baseY - (y - canvas.minY) * yMult)}`
          }).join(" ")}"
        /></path>`
      ).join("")
    }</svg>`
  }
  window.addEventListener("resize", render);
  render();
  return element
}

renderGraph(canvas, lines)
