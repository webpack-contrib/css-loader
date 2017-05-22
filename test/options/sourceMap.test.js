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
        .map(source => path.relative(__dirname, source));

      expect(map).toMatchSnapshot();
    });
  });
});
