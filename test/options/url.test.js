/* eslint-disable
  prefer-destructuring,
*/
import webpack from '../helpers/compiler';

describe('Options', () => {
  describe('url', () => {
    test('{Boolean}', async () => {
      const config = {
        loader: {
          test: /\.css$/,
          options: {},
        },
      };

      const stats = await webpack('urls/fixture.js', config);
      const { source } = stats.toJson().modules[1];

      expect(source).toMatchSnapshot();
    });

    test('{RegExp}', async () => {
      const config = {
        loader: {
          test: /\.css$/,
          options: {
            url: /filter/,
          },
        },
      };

      const stats = await webpack('urls/filter/fixture.js', config);
      const { source } = stats.toJson().modules[1];

      expect(source).toMatchSnapshot();
    });

    test('{Function}', async () => {
      const config = {
        loader: {
          test: /\.css$/,
          options: {
            url(url) {
              return /filter/.test(url);
            },
          },
        },
      };

      const stats = await webpack('urls/filter/fixture.js', config);
      const { source } = stats.toJson().modules[1];

      expect(source).toMatchSnapshot();
    });
  });
});
