import { PanelPlugin } from '@grafana/data';
import { GsapPanelOptions } from './types';
import { GsapPanel } from './components/GsapPanel';
import { GsapCodeEditor } from './components/GsapCodeEditor';
import { TemplateSelector } from './components/TemplateSelector';
import { DEFAULT_CODE } from './defaults';

export const plugin = new PanelPlugin<GsapPanelOptions>(GsapPanel).setPanelOptions((builder) => {
  return builder
    .addCustomEditor({
      id: 'code',
      path: 'code',
      name: 'Code',
      description: 'JavaScript code with access to context (gsap, timeline, svg, data, helpers, plugins)',
      defaultValue: DEFAULT_CODE,
      editor: GsapCodeEditor,
      category: ['Code'],
    })
    .addCustomEditor({
      id: 'template',
      path: 'template',
      name: 'Load Template',
      description: 'Load a code template (replaces current code)',
      defaultValue: '',
      editor: TemplateSelector,
      category: ['Code'],
    })
    .addSelect({
      path: 'containerMode',
      name: 'Container Mode',
      description: 'SVG for vector graphics, HTML for DOM elements, Both for layered rendering',
      defaultValue: 'svg',
      category: ['Display'],
      settings: {
        options: [
          { value: 'svg', label: 'SVG' },
          { value: 'html', label: 'HTML' },
          { value: 'both', label: 'Both (SVG + HTML)' },
        ],
      },
    })
    .addBooleanSwitch({
      path: 'showDebugInfo',
      name: 'Show Debug Info',
      description: 'Show data stats overlay on the panel',
      defaultValue: false,
      category: ['Display'],
    });
});
