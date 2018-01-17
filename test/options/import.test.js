/* eslint-disable
  prefer-destructuring,
*/
import webpack from '../helpers/compiler';

describe('Options', () => {
  describe('import', () => {
    test('{Boolean}', async () => {
      const config = {
        loader: {
          test: /\.css$/,
          options: {},
        },
      };

      const stats = await webpack('import/fixture.js', config);
      const { source } = stats.toJson().modules[1];

      expect(source).toMatchSnapshot();
    });

    test('{RegExp}', async () => {
      const config = {
        loader: {
          test: /\.css$/,
          options: {
            import: /filter/,
          },
        },
      };

      const stats = await webpack('import/filter/fixture.js', config);
      const { source } = stats.toJson().modules[1];

      expect(source).toMatchSnapshot();
    });

    test('{Function}', async () => {
      const config = {
        loader: {
          test: /\.css$/,
          options: {
            import(url) {
              return /filter/.test(url);
            },
          },
        },
      };

      const stats = await webpack('import/filter/fixture.js', config);
      const { source } = stats.toJson().modules[1];

      expect(source).toMatchSnapshot();
    });
  });
});
