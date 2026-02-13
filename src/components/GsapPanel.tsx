import React, { useEffect, useRef, useCallback, useState, useMemo, Component } from 'react';
import { useTheme2 } from '@grafana/ui';
import { GsapPanelProps, GsapContext } from '../types';
import { parseData } from '../dataParser';
import * as helpers from '../helpers';
import gsap from 'gsap';

// Free GSAP plugins (always available in standard npm package)
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { TextPlugin } from 'gsap/TextPlugin';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { Flip } from 'gsap/Flip';
import { Draggable } from 'gsap/Draggable';

// Club GSAP plugins (require paid license - standard npm package includes stubs)
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { CustomEase } from 'gsap/CustomEase';
import { EasePack } from 'gsap/EasePack';
import { SplitText } from 'gsap/SplitText';

const gsapPlugins: Record<string, any> = {
  MorphSVGPlugin,
  DrawSVGPlugin,
  MotionPathPlugin,
  TextPlugin,
  ScrambleTextPlugin,
  Flip,
  Draggable,
  CustomEase,
  EasePack,
  SplitText,
  ScrollToPlugin,
};

// Register all available plugins with GSAP (safely)
const pluginList = Object.values(gsapPlugins).filter(Boolean);
if (pluginList.length > 0) {
  try {
    gsap.registerPlugin(...pluginList);
  } catch (err) {
    console.warn('[GsapPanel] Some GSAP plugins failed to register:', err);
  }
}

// Debounce delay for re-execution when data/size changes
const DEBOUNCE_MS = 150;

// Create a lightweight fingerprint from panel data so we can compare by value
// instead of by object reference. This avoids re-running animations on every
// React render when the underlying data hasn't actually changed.
function dataFingerprint(data: any): string {
  const series = data?.series;
  if (!series || series.length === 0) {
    return 'empty';
  }
  let fp = `s${series.length}`;
  for (const frame of series) {
    fp += `|f${frame.fields.length}`;
    for (const field of frame.fields) {
      const len = field.values?.length || 0;
      const last = len > 0
        ? (field.values.get ? (field.values as any).get(len - 1) : field.values[len - 1])
        : '';
      fp += `:${field.name}(${len})=${last}`;
    }
  }
  return fp;
}

// --- Error Boundary ---
interface ErrorBoundaryState {
  error: string | null;
}

class GsapErrorBoundary extends Component<
  { children: React.ReactNode; width: number; height: number },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error: error.message || String(error) };
  }

  componentDidCatch(error: Error) {
    console.error('[GsapPanel] React error boundary caught:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            width: this.props.width,
            height: this.props.height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ff4444',
            fontFamily: 'monospace',
            fontSize: 13,
            padding: 20,
            textAlign: 'center',
          }}
        >
          <div>
            <strong>Panel Error</strong>
            <div style={{ marginTop: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {this.state.error}
            </div>
            <button
              onClick={() => this.setState({ error: null })}
              style={{
                marginTop: 12,
                padding: '6px 16px',
                background: '#333',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Inner Panel ---
const GsapPanelInner: React.FC<GsapPanelProps> = ({
  options,
  data,
  width,
  height,
  replaceVariables,
  eventBus,
  timeRange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const htmlRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const timelineRef = useRef<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const theme = useTheme2();

  // Keep a ref to the raw PanelData so executeCode can access it
  // without needing it as a useCallback dependency
  const dataRef = useRef(data);
  dataRef.current = data;

  // Stable data fingerprint (primitive string, compared by value)
  const dataKey = dataFingerprint(data);

  // Only re-parse when data actually changes (via fingerprint)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const parsedData = useMemo(() => parseData(data), [dataKey]);

  const executeCode = useCallback(() => {
    if (!mountedRef.current || !containerRef.current || !svgRef.current || !htmlRef.current) {
      return;
    }

    // Cleanup previous execution
    if (cleanupRef.current) {
      try { cleanupRef.current(); } catch (_) { /* ignore */ }
      cleanupRef.current = null;
    }
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }

    // Kill any lingering tweens on our containers
    gsap.killTweensOf(svgRef.current.querySelectorAll('*'));
    gsap.killTweensOf(htmlRef.current.querySelectorAll('*'));

    // Clear containers
    svgRef.current.innerHTML = '';
    htmlRef.current.innerHTML = '';

    setError(null);

    const code = options.code;
    if (!code || code.trim() === '') {
      return;
    }

    const tl = gsap.timeline();
    timelineRef.current = tl;

    const currentData = dataRef.current;

    const context: GsapContext = {
      gsap,
      timeline: tl,
      svg: svgRef.current,
      container: htmlRef.current,
      width,
      height,
      data: parsedData,
      panel: { data: currentData, series: currentData.series },
      grafana: {
        replaceVariables: replaceVariables || ((v: string) => v),
        eventBus,
        timeRange,
        theme: { isDark: theme.isDark },
      },
      helpers,
      plugins: gsapPlugins,
    };

    try {
      const fn = new Function('context', code);
      const result = fn(context);

      if (typeof result === 'function') {
        cleanupRef.current = result;
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      setError(msg);
      console.error('[GsapPanel] Code execution error:', err);
    }
  }, [options.code, parsedData, width, height, replaceVariables, eventBus, timeRange, theme.isDark]);

  // Debounced execution: old animations keep playing during the delay,
  // cleanup happens at the start of the next executeCode call
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (mountedRef.current) {
        executeCode();
      }
      debounceRef.current = null;
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [executeCode]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (cleanupRef.current) {
        try { cleanupRef.current(); } catch (_) { /* ignore */ }
        cleanupRef.current = null;
      }
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }
    };
  }, []);

  const showSvg = options.containerMode !== 'html';
  const showHtml = options.containerMode !== 'svg';

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'transparent',
      }}
    >
      {/* SVG layer */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          display: showSvg ? 'block' : 'none',
        }}
      />

      {/* HTML layer */}
      <div
        ref={htmlRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: showHtml ? 'block' : 'none',
          pointerEvents: showSvg && showHtml ? 'none' : 'auto',
        }}
      />

      {/* Error overlay */}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            right: 10,
            color: '#ff4444',
            fontFamily: 'monospace',
            fontSize: 12,
            backgroundColor: 'rgba(50,0,0,0.9)',
            padding: 12,
            borderRadius: 4,
            border: '1px solid #ff4444',
            zIndex: 20,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: '40%',
            overflow: 'auto',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Debug info overlay */}
      {options.showDebugInfo && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            color: '#ccc',
            fontFamily: 'monospace',
            fontSize: 11,
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: '6px 10px',
            borderRadius: 4,
            zIndex: 15,
            pointerEvents: 'none',
          }}
        >
          <div style={{ color: '#4ecdc4', fontWeight: 'bold', marginBottom: 2 }}>GSAP Panel v2</div>
          <div>{width}x{height} | {options.containerMode}</div>
          {parsedData.seriesCount > 0 && (
            <div style={{ marginTop: 2, color: '#ffe66d' }}>
              {parsedData.seriesCount} series, {parsedData.rowCount} rows
              {Object.keys(parsedData.lastValues).length > 0 && (
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 1 }}>
                  {Object.entries(parsedData.lastValues)
                    .filter(([k]) => k !== 'Time' && k !== 'time')
                    .slice(0, 4)
                    .map(([k, v]) => `${k}: ${typeof v === 'number' ? v.toFixed(2) : v}`)
                    .join(' | ')}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- Exported Panel (wrapped with Error Boundary) ---
export const GsapPanel: React.FC<GsapPanelProps> = (props) => (
  <GsapErrorBoundary width={props.width} height={props.height}>
    <GsapPanelInner {...props} />
  </GsapErrorBoundary>
);
