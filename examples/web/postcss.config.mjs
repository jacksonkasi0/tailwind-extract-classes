// postcss.config.mjs
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
// import extractTailwind from './postcss-extract-tailwind.js';

export default {
  plugins: [
    tailwindcss,
    autoprefixer,
    // extractTailwind({ output: 'public/extracted-tailwind.css' })
  ]
};
