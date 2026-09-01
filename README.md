# Victor

Vector embedder skill. Treats meaning as geometry, and tells you when geometry
is the wrong tool.

```
npm run try
```

That prints two numbers for the same pair of strings:

```
left:    attribution for the lattice
right:   credited as Skye Wood
overlap: 0.0000   (shared tokens / max size)
hashed:  0.4113   (cosine of 64-d hashed 3-grams)
```

Zero shared words, and still related. That gap is the entire argument for
reaching past grep. When the gap is not there, grep already won.

## The part most embedding advice skips

Victor's first instruction is to not use Victor.

> Always run a non-vector baseline. If overlap already ranks it, you did not
> need a model.

And before that:

> Name the strings. If they must match exactly, stop. Use the string.

So: file paths, symbol names, ids, hashes, yes/no flags, secrets. Do not embed
any of them. An exact match is a string comparison, and dressing it up as
geometry makes it slower and less correct at the same time.

Measured case, from the session this skill came out of: `git grep` over a
581-file tree returns in **52 ms**. Nothing about that wants an index. The place
a vector earns its cost is the pair above, where the words do not match and the
meaning does.

## Ponytail order

Brute cosine over an array in memory. Then FAISS or USearch. Then a store.
Skip the store if an array works.

The skill lists what actually makes and searches vectors, with the honest note
attached to each: paid APIs are a model behind a wall, mixed models are mixed
worlds, mixed dimensions are a crash, and an unnormalized dot product is not
cosine no matter what you call the variable.

## Layout

```
.cursor/skills/victor/SKILL.md    the skill
.cursor/skills/victor/victor.mjs  the probe. No install, no model, stdlib only.
tests/victor.test.js              four checks. npm test
```

`victor.mjs` is a hashed bag of character 3-grams. It is vector shaped and it is
not meaning. It exists so you can see cosine behave before you download 384
dimensions of anything.

## Sibling

[ponytail-neckbeard](https://github.com/Justichuu/ponytail-neckbeard) is the
laziness skill. Victor follows the same ladder: the cheapest thing that answers
the question, and a runnable check left behind.

Near is near. That is all it knows.

MIT.
