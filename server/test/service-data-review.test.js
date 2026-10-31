import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { services } from '../src/config/salon.js';

const report = readFileSync(fileURLToPath(new URL('../../SERVICE_DATA_REVIEW.md', import.meta.url)), 'utf8');
const rupee = String.fromCodePoint(0x20b9);

describe('service data review report', () => {
  it('lists every canonical service once with its current price, duration, and confirmation state', () => {
    const rows = report.split('\n').filter((line) => line.startsWith('| '));
    const tableRows = rows.slice(1);
    const reportById = new Map(tableRows.map((line) => {
      const cells = line.split('|').map((cell) => cell.trim());
      return [cells[1], cells];
    }));

    assert.equal(reportById.size, services.length);
    for (const service of services) {
      const cells = reportById.get(service.id);
      assert.ok(cells, `missing report row for ${service.id}`);
      const expectedPrice = Number.isFinite(service.priceRupees) && service.priceRupees > 0
        ? `${rupee}${new Intl.NumberFormat('en-IN').format(service.priceRupees)}`
        : `${service.priceDisplay} (numeric price missing)`;
      assert.equal(cells[5], expectedPrice, `stale price for ${service.id}`);
      assert.equal(cells[7], 'Not supplied', `stale duration for ${service.id}`);
      assert.equal(cells[10], service.needsConfirmation ? 'Yes' : 'No', `stale confirmation flag for ${service.id}`);
    }
  });

  it('reports the missing offer prices and the all-service duration gap', () => {
    assert.match(report, /\*\*201\*\* services/);
    assert.match(report, /women-botox - Botox treatment/);
    assert.match(report, /women-nanoplastia - Nanoplastia/);
    assert.match(report, /women-bioplastia - Bioplastia/);
    assert.match(report, /women-global-highlights - Global highlights/);
    assert.match(report, /All \*\*201\*\* services have no approved duration/);
  });
});
