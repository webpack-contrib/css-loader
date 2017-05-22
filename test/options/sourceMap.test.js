/* eslint-disable
  prefer-destructuring,
  no-underscore-dangle,
*/
import path from 'path';
import webpack from '../helpers/compiler';

describe('Options', () => {
  describe('sourceMap', () => {
    test('{Boolean}', async () => {
      const config = {
        loader: {
          test: /\.css$/,
          options: {
            sourceMap: true,
          },
        },
      };

      const stats = await webpack('fixture.js', config);
      const { map } = stats.compilation.modules[1]._source.sourceAndMap();

      // Strip host specific paths for CI
      map.sources = map.sources
        .map((src) => {
          src = src.split('!');

          src[1] = path.relative(__dirname, src[1]);

          return src.join('!');
        });

      expect(map).toMatchSnapshot();
    });
  });
});
