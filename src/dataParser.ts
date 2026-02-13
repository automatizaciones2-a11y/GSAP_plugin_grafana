import { PanelData } from '@grafana/data';
import { ParsedData } from './types';

export function parseData(panelData: PanelData): ParsedData {
  const result: ParsedData = {
    fields: [],
    rows: [],
    lastValues: {},
    seriesCount: panelData.series.length,
    rowCount: 0,
  };

  if (panelData.series.length === 0) {
    return result;
  }

  for (const frame of panelData.series) {
    for (const field of frame.fields) {
      const values: any[] = [];
      for (let i = 0; i < field.values.length; i++) {
        values.push(field.values.get ? (field.values as any).get(i) : field.values[i]);
      }
      result.fields.push({
        name: field.name,
        values,
        type: field.type,
      });

      if (values.length > 0) {
        result.lastValues[field.name] = values[values.length - 1];
      }
    }
  }

  const firstFrame = panelData.series[0];
  if (firstFrame && firstFrame.fields.length > 0) {
    const length = firstFrame.fields[0]?.values.length || 0;
    result.rowCount = length;

    for (let i = 0; i < length; i++) {
      const row: Record<string, any> = {};
      for (const field of firstFrame.fields) {
        row[field.name] = field.values.get ? (field.values as any).get(i) : field.values[i];
      }
      result.rows.push(row);
    }
  }

  return result;
}
