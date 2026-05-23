import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { LedgerTransformer } from './ledger.transformer';

async function readRawDataSet(fileName: string): Promise<unknown> {
  const content = await readFile(
    join(process.cwd(), 'data', 'raw', fileName),
    'utf8',
  );
  return JSON.parse(content) as unknown;
}

describe('LedgerTransformer', () => {
  it('normalizes both required source files into one report shape', async () => {
    const transformer = new LedgerTransformer();
    const [quickBooks, rootFi] = await Promise.all([
      readRawDataSet('data_set_1.json'),
      readRawDataSet('data_set_2.json'),
    ]);

    const report = transformer.buildUnifiedReport({ quickBooks, rootFi });

    expect(report.status).toBe('integrated');
    expect(report.periods).toHaveLength(68);
    expect(report.rows).toHaveLength(163);
    expect(report.sources).toEqual([
      expect.objectContaining({
        id: 'data-set-1',
        fileName: 'data_set_1.json',
        system: 'quickbooks-report',
        rowsImported: 76,
        periodsImported: 68,
      }),
      expect.objectContaining({
        id: 'data-set-2',
        fileName: 'data_set_2.json',
        system: 'rootfi-periods',
        rowsImported: 87,
        periodsImported: 36,
      }),
    ]);
    expect(report.rows[0]).toEqual(
      expect.objectContaining({
        sourceId: 'data-set-1',
        parentId: null,
        label: 'Income',
        kind: 'section',
      }),
    );
  });
});
