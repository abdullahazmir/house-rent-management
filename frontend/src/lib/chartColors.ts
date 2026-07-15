/**
 * Fixed-order categorical chart palette — validated with the dataviz skill's
 * `validate_palette.js` (lightness band, chroma floor, CVD separation, contrast)
 * against both the light and dark surface colors in globals.css. Derived from the
 * brand hues (terracotta/teal/blue/brick) but pushed into the lightness/chroma band
 * chart marks need — the raw UI decoration hex values fail that check on their own.
 *
 * Assign in this fixed order; never re-cycle by rank. A category beyond slot 4
 * folds into OTHER_CHART_COLOR rather than generating a new hue.
 */
export const CATEGORICAL_CHART_COLORS = ['#C15A34', '#0093A0', '#3B6EA5', '#A23B3B'] as const;
export const OTHER_CHART_COLOR = '#6B7280';

export const CHART_GRID_COLOR = '#9CA3AF';
export const CHART_TEXT_COLOR = '#6B7280';

/** Maps each label to a fixed slot color in first-seen order; overflow shares OTHER_CHART_COLOR. */
export function colorForIndex(index: number): string {
  return CATEGORICAL_CHART_COLORS[index] ?? OTHER_CHART_COLOR;
}
