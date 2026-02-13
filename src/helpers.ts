const SVG_NS = 'http://www.w3.org/2000/svg';

export function createSVGElement(tag: string, attrs: Record<string, any> = {}): SVGElement {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, String(value));
  }
  return el;
}

export function createHTMLElement(tag: string, attrs: Record<string, any> = {}): HTMLElement {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'style' && typeof value === 'object') {
      Object.assign(el.style, value);
    } else {
      el.setAttribute(key, String(value));
    }
  }
  return el;
}

export function createBar(
  x: number,
  y: number,
  w: number,
  h: number,
  fill?: string
): SVGRectElement {
  return createSVGElement('rect', {
    x, y, width: w, height: h,
    fill: fill || '#4ecdc4',
    rx: 2,
  }) as SVGRectElement;
}

export function createCircle(
  cx: number,
  cy: number,
  r: number,
  fill?: string
): SVGCircleElement {
  return createSVGElement('circle', {
    cx, cy, r,
    fill: fill || '#ff6b6b',
  }) as SVGCircleElement;
}

export function createText(
  x: number,
  y: number,
  content: string,
  attrs?: Record<string, any>
): SVGTextElement {
  const el = createSVGElement('text', {
    x, y,
    fill: '#ffffff',
    'font-family': 'sans-serif',
    'font-size': '12',
    'text-anchor': 'middle',
    ...attrs,
  }) as SVGTextElement;
  el.textContent = content;
  return el;
}

export function createGauge(
  cx: number,
  cy: number,
  r: number,
  value: number,
  min: number,
  max: number,
  color?: string
): SVGGElement {
  const g = createSVGElement('g') as SVGGElement;
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  const arcLength = Math.PI * 1.5;
  const startAngle = Math.PI * 0.75;
  const endAngle = startAngle + arcLength * normalized;

  // Background arc
  const bgPath = describeArc(cx, cy, r, startAngle, startAngle + arcLength);
  g.appendChild(createSVGElement('path', {
    d: bgPath,
    fill: 'none',
    stroke: '#333',
    'stroke-width': r * 0.2,
    'stroke-linecap': 'round',
  }));

  // Value arc
  if (normalized > 0) {
    const valPath = describeArc(cx, cy, r, startAngle, endAngle);
    g.appendChild(createSVGElement('path', {
      d: valPath,
      fill: 'none',
      stroke: color || colorScale(value, min, max),
      'stroke-width': r * 0.2,
      'stroke-linecap': 'round',
    }));
  }

  // Center text
  const label = createText(cx, cy + r * 0.15, String(Math.round(value)), {
    'font-size': String(r * 0.5),
    'font-weight': 'bold',
  });
  g.appendChild(label);

  return g;
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

export function colorScale(value: number, min: number, max: number): string {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  // Green → Yellow → Red
  const r = Math.round(t < 0.5 ? t * 2 * 255 : 255);
  const g = Math.round(t < 0.5 ? 255 : (1 - (t - 0.5) * 2) * 255);
  return `rgb(${r},${g},50)`;
}
