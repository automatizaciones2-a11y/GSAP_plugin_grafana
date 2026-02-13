export interface CodeTemplate {
  label: string;
  value: string;
  code: string;
}

export const TEMPLATES: CodeTemplate[] = [
  {
    label: 'Bar Chart (Animated)',
    value: 'bar-chart',
    code: `const { gsap, timeline, svg, data, width, height, helpers } = context;

svg.innerHTML = '';
const padding = 40;
const chartW = width - padding * 2;
const chartH = height - padding * 2;
const rows = data.rows.length > 0 ? data.rows : [{value: 30}, {value: 60}, {value: 90}, {value: 45}, {value: 75}];
const barW = chartW / Math.max(rows.length, 1) - 4;

rows.forEach((row, i) => {
  const val = typeof row.value === 'number' ? row.value : (Object.values(row).find(v => typeof v === 'number') || 50);
  const h = (Math.abs(val) / 100) * chartH;
  const x = padding + i * (barW + 4) + 2;
  const y = height - padding - h;
  const bar = helpers.createBar(x, y, barW, h, helpers.colorScale(val, 0, 100));
  svg.appendChild(bar);

  timeline.from(bar, {
    scaleY: 0,
    transformOrigin: 'bottom',
    duration: 0.6,
    ease: 'back.out(1.7)',
  }, i * 0.1);

  const label = helpers.createText(x + barW / 2, height - padding + 16, String(Math.round(val)), {'font-size': '11'});
  svg.appendChild(label);
  timeline.from(label, { opacity: 0, duration: 0.3 }, i * 0.1 + 0.3);
});
`,
  },
  {
    label: 'Gauge',
    value: 'gauge',
    code: `const { gsap, timeline, svg, data, width, height, helpers } = context;

svg.innerHTML = '';
const val = data.lastValues.value || data.lastValues.Value || 65;
const r = Math.min(width, height) * 0.35;
const gauge = helpers.createGauge(width / 2, height / 2, r, val, 0, 100);
svg.appendChild(gauge);

// Animate the value arc drawing
const arc = gauge.querySelectorAll('path')[1];
if (arc) {
  const len = arc.getTotalLength ? arc.getTotalLength() : 300;
  gsap.set(arc, { attr: { 'stroke-dasharray': len, 'stroke-dashoffset': len } });
  timeline.to(arc, { attr: { 'stroke-dashoffset': 0 }, duration: 1.2, ease: 'power2.out' });
}

// Animate the number counting up
const text = gauge.querySelector('text');
if (text) {
  const obj = { v: 0 };
  timeline.to(obj, {
    v: val,
    duration: 1.2,
    ease: 'power2.out',
    onUpdate: () => { text.textContent = String(Math.round(obj.v)); },
  }, 0);
}
`,
  },
  {
    label: 'Morphing Shapes',
    value: 'morph',
    code: `const { gsap, timeline, svg, width, height, helpers, plugins } = context;

svg.innerHTML = '';
const cx = width / 2, cy = height / 2;
const r = Math.min(width, height) * 0.3;

// Star path
const starPoints = 5;
let starD = '';
for (let i = 0; i < starPoints * 2; i++) {
  const angle = (i * Math.PI) / starPoints - Math.PI / 2;
  const rad = i % 2 === 0 ? r : r * 0.45;
  const x = cx + rad * Math.cos(angle);
  const y = cy + rad * Math.sin(angle);
  starD += (i === 0 ? 'M' : 'L') + x + ' ' + y;
}
starD += 'Z';

// Circle path (approximated)
let circleD = '';
const segments = 10;
for (let i = 0; i <= segments; i++) {
  const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
  const x = cx + r * Math.cos(angle);
  const y = cy + r * Math.sin(angle);
  circleD += (i === 0 ? 'M' : 'L') + x + ' ' + y;
}
circleD += 'Z';

const shape = helpers.createSVGElement('path', { d: starD, fill: '#4ecdc4' });
svg.appendChild(shape);

if (plugins.MorphSVGPlugin) {
  timeline.to(shape, { morphSVG: circleD, fill: '#ff6b6b', duration: 1.5, ease: 'power2.inOut' })
    .to(shape, { morphSVG: starD, fill: '#4ecdc4', duration: 1.5, ease: 'power2.inOut' });
  timeline.repeat(-1);
} else {
  timeline.to(shape, { rotation: 360, transformOrigin: cx + 'px ' + cy + 'px', duration: 2, repeat: -1, ease: 'none' });
}
`,
  },
  {
    label: 'Text Scramble',
    value: 'text-scramble',
    code: `const { gsap, timeline, svg, data, width, height, helpers, plugins } = context;

svg.innerHTML = '';
const text = helpers.createText(width / 2, height / 2, '', {
  'font-size': String(Math.min(width, height) * 0.08),
  'font-weight': 'bold',
  'fill': '#4ecdc4',
});
svg.appendChild(text);

const displayText = data.lastValues.text || data.lastValues.name || 'GSAP Panel';
if (plugins.TextPlugin) {
  timeline.to(text, { textContent: displayText, duration: 0, onComplete: () => { text.textContent = displayText; } });
  timeline.from(text, { opacity: 0, attr: { y: height / 2 + 20 }, duration: 0.8, ease: 'back.out(1.7)' }, 0);
} else {
  text.textContent = displayText;
  timeline.from(text, { opacity: 0, attr: { y: height / 2 + 30 }, duration: 1, ease: 'elastic.out(1, 0.5)' });
}
`,
  },
  {
    label: 'Dot Grid',
    value: 'dot-grid',
    code: `const { gsap, timeline, svg, data, width, height, helpers } = context;

svg.innerHTML = '';
const cols = 10, rows = 8;
const spacingX = width / (cols + 1);
const spacingY = height / (rows + 1);
const r = Math.min(spacingX, spacingY) * 0.3;

for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    const cx = spacingX * (col + 1);
    const cy = spacingY * (row + 1);
    const dot = helpers.createCircle(cx, cy, r, helpers.colorScale((row * cols + col) / (cols * rows) * 100, 0, 100));
    svg.appendChild(dot);

    timeline.from(dot, {
      attr: { r: 0 },
      duration: 0.4,
      ease: 'back.out(2)',
    }, (row + col) * 0.04);
  }
}

// Pulsing wave
timeline.to(svg.querySelectorAll('circle'), {
  attr: { r: r * 1.4 },
  duration: 0.6,
  stagger: { each: 0.03, from: 'center', grid: [rows, cols] },
  yoyo: true,
  repeat: -1,
  ease: 'sine.inOut',
}, '+=0.2');
`,
  },
  {
    label: 'Empty (Blank Canvas)',
    value: 'empty',
    code: `const { gsap, timeline, svg, container, data, width, height, helpers, plugins } = context;

// SVG element fills the entire panel
svg.innerHTML = '';

// context.data contains parsed query data:
//   data.fields    - [{name, values, type}]
//   data.rows      - [{field: value, ...}]
//   data.lastValues - {field: lastValue}
//   data.seriesCount, data.rowCount

// context.helpers has: createBar, createCircle, createText, createGauge,
//   colorScale, createSVGElement, createHTMLElement

// context.plugins has GSAP plugins: MorphSVGPlugin, DrawSVGPlugin, etc.

// Use timeline (auto-cleaned) for animations:
// timeline.to(element, { x: 100, duration: 1 });

// Return a cleanup function if needed:
// return () => { /* custom cleanup */ };
`,
  },
];

export const DEFAULT_CODE = TEMPLATES[0].code;
