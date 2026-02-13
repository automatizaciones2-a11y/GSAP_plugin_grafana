import { PanelProps } from '@grafana/data';

export type ContainerMode = 'svg' | 'html' | 'both';

export interface GsapPanelOptions {
  code: string;
  template: string;
  containerMode: ContainerMode;
  showDebugInfo: boolean;
}

export interface GsapPanelProps extends PanelProps<GsapPanelOptions> {}

export interface ParsedData {
  fields: { name: string; values: any[]; type: string }[];
  rows: Record<string, any>[];
  lastValues: Record<string, any>;
  seriesCount: number;
  rowCount: number;
}

export interface GsapContext {
  gsap: any;
  timeline: any;
  svg: SVGSVGElement;
  container: HTMLDivElement;
  width: number;
  height: number;
  data: ParsedData;
  panel: { data: any; series: any[] };
  grafana: {
    replaceVariables: (value: string) => string;
    eventBus: any;
    timeRange: any;
    theme: any;
  };
  helpers: typeof import('./helpers');
  plugins: Record<string, any>;
}
