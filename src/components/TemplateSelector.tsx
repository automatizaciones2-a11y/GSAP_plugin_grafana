import React, { useCallback } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Select } from '@grafana/ui';
import { GsapPanelOptions } from '../types';
import { TEMPLATES } from '../defaults';

type Props = StandardEditorProps<string, any, GsapPanelOptions>;

const templateOptions = [
  { value: '', label: '-- Select template --' },
  ...TEMPLATES.map((t) => ({ value: t.value, label: t.label })),
];

export const TemplateSelector: React.FC<Props> = ({ value, onChange, context: editorContext }) => {
  const handleChange = useCallback(
    (selected: any) => {
      const templateValue = selected?.value || '';
      if (!templateValue) {
        return;
      }

      const template = TEMPLATES.find((t) => t.value === templateValue);
      const ctx = editorContext as any;
      if (template && ctx.onOptionsChange && ctx.options) {
        ctx.onOptionsChange({
          ...ctx.options,
          code: template.code,
          template: templateValue,
        });
      } else {
        onChange(templateValue);
      }
    },
    [onChange, editorContext]
  );

  return (
    <Select
      options={templateOptions}
      value={value || ''}
      onChange={handleChange}
      placeholder="Select a template..."
    />
  );
};
