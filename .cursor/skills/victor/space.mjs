// space.mjs: victor's real model, and the one wrapper every vector passes through.
// A space is one model with one way of reading text. Every vector it makes is made a unit
// vector and stamped with the space's fingerprint, and every comparison goes through its
// cosine(), which never mixes two spaces: a vector from another space is made again from
// its kept text, and one with no text is refused. So a model update, a changed setting or a
// new library version cannot mix two worlds, and nobody has to remember to bump a version.
import { createHash } from 'node:crypto';

// unit: the vector scaled to length 1, so the dot product of two of them is their cosine.
const unit = v => { const n = Math.hypot(...v) || 1; return v.map(x => x / n); };

// fingerprint: the space's own vector for one fixed word, rounded to 3 places and hashed.
// The same space gives the same stamp in every run; a different space gives another one.
async function fingerprint(name, embedFn) {
  const [probe] = await embedFn(['victor']);
  return `${name} ${createHash('sha256').update(unit(probe).map(x => x.toFixed(3)).join()).digest('hex').slice(0, 16)}`;
}

// space: wraps any function that turns a list of texts into a list of number lists.
export async function space(name, embedFn) {
  const stamp = await fingerprint(name, embedFn);
  const embed = async texts => (await embedFn(texts)).map((v, i) => ({ text: texts[i], stamp, vector: unit(v) }));
  const own = async v => {
    if (v.stamp === stamp) return v;
    if (typeof v.text !== 'string') throw new Error(`victor: a vector from "${v.stamp}" has no text to remake in "${stamp}"`);
    return (await embed([v.text]))[0];
  };
  const cosine = async (a, b) => {
    [a, b] = await Promise.all([own(a), own(b)]);
    return a.vector.reduce((s, x, i) => s + x * b.vector[i], 0);
  };
  return { stamp, embed, cosine };
}

// miniLM: the skill's default English model (384 numbers a text), run on this machine by
// transformers.js. That package is optional: without it, victor.mjs and its tests still run.
export async function miniLM(model = 'Xenova/all-MiniLM-L6-v2', pooling = 'mean') {
  const { pipeline } = await import('@huggingface/transformers');
  const run = await pipeline('feature-extraction', model);
  return space(model, async texts => {
    const out = await run(texts, { pooling }), d = out.dims.at(-1);
    return texts.map((_, i) => Array.from(out.data.slice(i * d, (i + 1) * d)));
  });
}
