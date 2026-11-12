import React from 'react';
import { FAMILY_COPY } from '../../shared/core/data/assessment2/content.ts';
import { FAMILIES, FAMILY_DEFAULT } from '../../shared/core/data/assessment2/taxonomy.ts';
import { rankFamilies } from '../../shared/core/data/assessment2/scoring.ts';

// The fixed axes run from −1 to 1 across the inner square. The margin holds the edge labels. The view box is shorter than
// the square, so the pad has no empty space above and below the labels.
const VIEW = 260;
const INSET = 60;
const SPAN = VIEW - 2 * INSET;
const MID = VIEW / 2;
const BOX_TOP = INSET - 32;
const BOX_HEIGHT = SPAN + 64;
const toX = (direction) => INSET + ((direction + 1) / 2) * SPAN;
const toY = (energy) => INSET + ((1 - energy) / 2) * SPAN;

/**
 * One point per family that has a score. A null score is unknown, so that family gets no point; unknown is never zero.
 * The top three are the first three of rankFamilies. A fourth family that rankFamilies includes is ranked but not marked.
 */
export function provisionalPoints(scores) {
  const rankOf = new Map(rankFamilies(scores).map((entry) => [entry.family, entry.rank]));
  return FAMILIES
    .filter((family) => Number.isFinite(scores[family]))
    .map((family) => {
      const rank = rankOf.get(family) ?? null;
      return {
        family,
        x: toX(FAMILY_DEFAULT[family].direction),
        y: toY(FAMILY_DEFAULT[family].energy),
        rank,
        top: rank !== null && rank <= 3,
      };
    });
}

/**
 * Read-only map of the eight protector families at their plan §5.1 defaults: direction runs across, energy runs up.
 * It shows where the families sit, not where the person's parts sit. It has no pointer or click handlers.
 */
export function ProvisionalPad({ T, tx, scores }) {
  const label = T('provisionalLabel');
  return (
    <figure className="p2-prov">
      <svg className="p2-prov-svg" viewBox={`0 ${BOX_TOP} ${VIEW} ${BOX_HEIGHT}`} role="img" aria-label={label}>
        <rect className="p2-prov-frame" x={INSET} y={INSET} width={SPAN} height={SPAN} />
        <line className="p2-prov-axis" x1={MID} y1={INSET} x2={MID} y2={INSET + SPAN} />
        <line className="p2-prov-axis" x1={INSET} y1={MID} x2={INSET + SPAN} y2={MID} />
        <text className="p2-prov-edge" x={MID} y={INSET - 10} textAnchor="middle">{T('highLabel')}</text>
        <text className="p2-prov-edge" x={MID} y={INSET + SPAN + 18} textAnchor="middle">{T('lowLabel')}</text>
        <text className="p2-prov-edge" x={INSET - 8} y={MID + 3} textAnchor="end">{T('awayLabel')}</text>
        <text className="p2-prov-edge" x={INSET + SPAN + 8} y={MID + 3} textAnchor="start">{T('towardLabel')}</text>
        {provisionalPoints(scores).map((point) => (
          <React.Fragment key={point.family}>
            <circle className={point.top ? 'p2-prov-point p2-prov-top' : 'p2-prov-point'} data-family={point.family}
              cx={point.x} cy={point.y} r={point.top ? 6 : 4.5}>
              <title>{tx(FAMILY_COPY[point.family])}</title>
            </circle>
            {point.top ? <text className="p2-prov-rank" x={point.x + 9} y={point.y + 4}>{point.rank}</text> : null}
          </React.Fragment>
        ))}
      </svg>
      <figcaption className="p2-prov-label">{label}</figcaption>
    </figure>
  );
}
