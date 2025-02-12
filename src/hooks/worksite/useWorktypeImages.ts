import { SVG_STROKE_WIDTH } from '@/constants';
import { colors, templates } from '../../icons/icons_templates';

const getWorktypeColors = (worktype: any) => {
  const colorsKey = `${worktype.status}_${
    worktype.claimed_by ? 'claimed' : 'unclaimed'
  }`;
  return colors[colorsKey] || colors.open_assigned_unclaimed;
};

const getWorktypeSVG = (worktype: any, size = 53) => {
  const template = templates[worktype.work_type] || templates.unknown;
  const { fillColor, strokeColor } = getWorktypeColors(worktype);
  const svg = template
    .replaceAll('{{fillColor}}', fillColor)
    .replaceAll('{{strokeWidth}}', SVG_STROKE_WIDTH.toString())
    .replaceAll('{{strokeColor}}', strokeColor)
    .replaceAll(/(width="[1-9]+")/g, `width="${size}"`)
    .replaceAll(/(height="[1-9]+")/g, `height="${size}"`);
  return svg;
};

const getBasicWorktypeSVG = (work_type_key: any, size = 53) => {
  const template = templates[work_type_key] || templates.unknown;
  const svg = template
    .replaceAll('{{fillColor}}', 'black')
    .replaceAll('{{strokeWidth}}', SVG_STROKE_WIDTH.toString())
    .replaceAll('{{strokeColor}}', 'black')
    .replaceAll(/(width="[1-9]+")/g, `width="${size}"`)
    .replaceAll(/(height="[1-9]+")/g, `height="${size}"`);
  return svg;
};

export default () => ({
  getWorktypeColors,
  getWorktypeSVG,
  getBasicWorktypeSVG,
});
