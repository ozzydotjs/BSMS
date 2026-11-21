import test from 'node:test';
import assert from 'node:assert/strict';
import { jsonToCsv } from './csv';

test('jsonToCsv serializes rows and escapes commas and quotes per RFC 4180', () => {
  const rows = [
    { name: 'Dela Cruz, Juan', purok: 'Purok 1', note: 'Said "hello"' },
    { name: 'Santos, Maria', purok: 'Purok 2', note: 'Normal' },
  ];

  const csv = jsonToCsv(rows, [
    { header: 'Resident Name', accessor: (r) => r.name },
    { header: 'Purok', accessor: (r) => r.purok },
    { header: 'Note', accessor: (r) => r.note },
  ]);

  const lines = csv.split('\r\n');
  assert.equal(lines.length, 3);
  assert.equal(lines[0], 'Resident Name,Purok,Note');
  assert.equal(lines[1], '"Dela Cruz, Juan",Purok 1,"Said ""hello"""');
  assert.equal(lines[2], '"Santos, Maria",Purok 2,Normal');
});
