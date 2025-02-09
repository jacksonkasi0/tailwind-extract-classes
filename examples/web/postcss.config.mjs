export default {
  plugins: [
    'tailwindcss',
    'autoprefixer',
    [
      (await import('./postcss-extract-tailwind.js')).default,
      { output: 'public/extracted-tailwind.css' }
    ]
  ]
}