import React from 'react';
import { StandardEditorProps } from '@grafana/data';
import { CodeEditor } from '@grafana/ui';
import { GsapPanelOptions } from '../types';

type Props = StandardEditorProps<string, any, GsapPanelOptions>;

export const GsapCodeEditor: React.FC<Props> = ({ value, onChange, context: editorContext }) => {
  return (
    <div style={{ border: '1px solid #333', borderRadius: 4 }}>
      <CodeEditor
        value={value || ''}
        language="javascript"
        height={400}
        showLineNumbers={true}
        showMiniMap={false}
        monacoOptions={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          tabSize: 2,
          wordWrap: 'on',
          suggest: { showKeywords: true, showSnippets: true },
        }}
        onBlur={(code) => onChange(code)}
        onSave={(code) => onChange(code)}
      />
    </div>
  );
};
