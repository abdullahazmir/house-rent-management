# legacy-bootstrap

Reserved and currently unused.

Per `CLAUDE.md`, Bootstrap must never be loaded globally alongside Tailwind. If a
genuine future need arises to reuse a Bootstrap-based template or component, it
must be scoped hard to this subtree, with its CSS prefixed/scoped (e.g. via
`postcss-prefix-selector`) so it never leaks onto the rest of the app.

Nothing here yet — do not add global Bootstrap imports anywhere else in the app.
