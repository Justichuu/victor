// The wrapper's four promises, on two made-up spaces so no model or download is needed.
// Space A reads a text as [length, vowels]; space B as [1, length, words], another size.

const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const load = () => import(pathToFileURL(path.join(__dirname, '..', '.cursor', 'skills', 'victor', 'space.mjs')));
const vowels = (s) => (s.match(/[aeiou]/g) || []).length;
const A = async (texts) => texts.map((s) => [s.length, vowels(s)]);
const B = async (texts) => texts.map((s) => [1, s.length, s.split(' ').length]);

test('one space gives one stamp every time, and two spaces two stamps', async () => {
  const { space } = await load();
  const [a1, a2, b] = await Promise.all([space('a', A), space('a', A), space('a', B)]);
  assert.strictEqual(a1.stamp, a2.stamp);
  assert.notStrictEqual(a1.stamp, b.stamp, 'same name, different space: the fingerprint must tell them apart');
});

test('inside one space, cosine is the cosine of unit vectors', async () => {
  const { space } = await load();
  const a = await space('a', A);
  const [x, y] = await a.embed(['banana', 'kiwi']);
  assert.ok(Math.abs((await a.cosine(x, x)) - 1) < 1e-12);
  const want = (6 * 4 + 3 * 2) / (Math.hypot(6, 3) * Math.hypot(4, 2));
  assert.ok(Math.abs((await a.cosine(x, y)) - want) < 1e-12);
});

test('a vector from another space is made again from its text, never mixed', async () => {
  const { space } = await load();
  const [a, b] = await Promise.all([space('a', A), space('b', B)]);
  const [old] = await b.embed(['banana']);
  const [fresh, other] = await a.embed(['banana', 'kiwi']);
  assert.strictEqual(old.vector.length, 3, 'B is a different size, so a mixed dot product would be wrong');
  assert.strictEqual(await a.cosine(old, other), await a.cosine(fresh, other));
});

test('a vector from another space with no text is refused', async () => {
  const { space } = await load();
  const a = await space('a', A);
  const [kiwi] = await a.embed(['kiwi']);
  await assert.rejects(a.cosine({ stamp: 'elsewhere', vector: [1, 0] }, kiwi), /no text to remake/);
});
