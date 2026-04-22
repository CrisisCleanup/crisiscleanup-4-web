import { SVG_STROKE_WIDTH } from '@/constants';
import { resolveStatusColors, templates } from '../../icons/icons_templates';

export type WorktypeSVGVariant = 'flat' | 'elevated';

// Lightweight drop shadow for pixi-overlay markers (which rasterize the SVG
// to a texture, so CSS box-shadow can't reach them). Kept subtle on purpose
// to avoid re-introducing the iOS-era halo look the flat templates removed.
const CC_ELEVATION_FILTER =
  '<defs><filter id="cc-shadow" x="-20%" y="-20%" width="140%" height="140%">' +
  '<feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.25"/>' +
  '</filter></defs>';

function injectElevationFilter(svg: string): string {
  // Skip if the filter is already in place — callers can compose safely.
  if (svg.includes('id="cc-shadow"')) return svg;
  return svg.replace(
    /^(\s*<svg[^>]*>)([\S\s]*)(<\/svg>\s*)$/,
    (_, open: string, body: string, close: string) =>
      `${open}${CC_ELEVATION_FILTER}<g filter="url(#cc-shadow)">${body}</g>${close}`,
  );
}

function applyVariant(svg: string, variant: WorktypeSVGVariant): string {
  return variant === 'elevated' ? injectElevationFilter(svg) : svg;
}

const getWorktypeColors = (worktype: any) => {
  const { fill, stroke } = resolveStatusColors(
    worktype.status,
    Boolean(worktype.claimed_by),
  );
  return { fillColor: fill, strokeColor: stroke };
};

const getWorktypeSVG = (
  worktype: any,
  size = 53,
  variant: WorktypeSVGVariant = 'flat',
) => {
  const template = templates[worktype.work_type] || templates.unknown;
  const { fillColor, strokeColor } = getWorktypeColors(worktype);
  const svg = template
    .replaceAll('{{fillColor}}', fillColor)
    .replaceAll('{{strokeWidth}}', SVG_STROKE_WIDTH.toString())
    .replaceAll('{{strokeColor}}', strokeColor)
    .replaceAll(/(width="[1-9]+")/g, `width="${size}"`)
    .replaceAll(/(height="[1-9]+")/g, `height="${size}"`);
  return applyVariant(svg, variant);
};

const getBasicWorktypeSVG = (
  work_type_key: any,
  size = 53,
  variant: WorktypeSVGVariant = 'flat',
) => {
  const template = templates[work_type_key] || templates.unknown;
  const svg = template
    .replaceAll('{{fillColor}}', 'black')
    .replaceAll('{{strokeWidth}}', SVG_STROKE_WIDTH.toString())
    .replaceAll('{{strokeColor}}', 'black')
    .replaceAll(/(width="[1-9]+")/g, `width="${size}"`)
    .replaceAll(/(height="[1-9]+")/g, `height="${size}"`);
  return applyVariant(svg, variant);
};

export {
  getWorktypeColors,
  getWorktypeSVG,
  getBasicWorktypeSVG,
  injectElevationFilter,
};

export default () => ({
  getWorktypeColors,
  getWorktypeSVG,
  getBasicWorktypeSVG,
});
