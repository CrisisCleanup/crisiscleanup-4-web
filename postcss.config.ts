import autoprefixer from 'autoprefixer';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import tailwindNesting from 'tailwindcss/nesting';
import postcssPresetEnv from 'postcss-preset-env';
import postcssPxToRem from 'postcss-pxtorem';

export default {
  plugins: [
    postcssImport,
    tailwindNesting,
    tailwindcss,
    /**
     * postcss-preset-env
     * @see http://preset-env.cssdb.org/features
     */
    postcssPresetEnv({
      stage: 1,
      features: {
        'nesting-rules': true,
      },
    }),
    autoprefixer,
    // needs to be post auto-prefixer
    postcssPxToRem({
      propList: ['font', 'font-size', 'line-height', 'letter-spacing'],
    }),
  ],
};
