export default {
  multipass: true,
  plugins: [
    'preset-default',
    'removeDimensions',
    {
      name: 'convertPathData',
      params: { floatPrecision: 2 },
    },
  ],
}
