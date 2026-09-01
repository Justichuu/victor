// One runnable check. The smallest thing that fails if the geometry breaks.
//
// victor.mjs is a CLI with no exports, so this drives the CLI rather than
// refactoring the script to be importable. Testing the thing people actually
// run beats testing a shape invented for the test.

const { test } = require('node:test');
const assert = require('node:assert');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const PROBE = path.join(__dirname, '..', '.cursor', 'skills', 'victor', 'victor.mjs');

function run(left, right) {
  const out = execFileSync(process.execPath, [PROBE, left, right], { encoding: 'utf8' });
  const num = (label) => Number(out.match(new RegExp(label + ':\\s+(-?[\\d.]+)'))[1]);
  return { overlap: num('overlap'), hashed: num('hashed'), out };
}

test('a string is identical to itself in both measures', () => {
  // If normalization broke, cosine would not land on 1.
  const r = run('cars is a fix', 'cars is a fix');
  assert.strictEqual(r.overlap, 1);
  assert.ok(Math.abs(r.hashed - 1) < 1e-9, 'cosine of a unit vector with itself is 1, got ' + r.hashed);
});

test('cosine stays inside [-1, 1]', () => {
  // The one way to tell a normalized vector from an unnormalized one.
  for (const [a, b] of [['x', 'y'], ['the lattice', 'Skye Wood'], ['a', 'aaaaaaaaaa']]) {
    const { hashed } = run(a, b);
    assert.ok(hashed >= -1 && hashed <= 1, `${a} vs ${b} gave ${hashed}`);
  }
});

test('overlap and cosine are different questions', () => {
  // The whole reason to reach for a vector. No shared token, still related by
  // pieces. If this ever reads 0, the hashing collapsed and the probe is
  // measuring overlap twice.
  const r = run('attribution for the lattice', 'credited as Skye Wood');
  assert.strictEqual(r.overlap, 0, 'these share no whole token');
  assert.ok(r.hashed > 0.1, 'hashed cosine should still see shared pieces, got ' + r.hashed);
});

test('the probe says what it is, so nobody quotes it as meaning', () => {
  const { out } = run('a', 'b');
  assert.match(out, /not a model/);
});
