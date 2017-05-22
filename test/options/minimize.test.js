/* eslint-disable
  prefer-destructuring,
*/
import webpack from '../helpers/compiler';

describe('Options', () => {
  describe('minimize', () => {
    test('Defaults', async () => {
      const config = {
        loader: {
          test: /\.css$/,
          options: {
            minimize: true,
          },
        },
      };

      const stats = await webpack('fixture.js', config);
      const { source } = stats.toJson().modules[1];

      expect(source).toMatchSnapshot();
    });
  });
});

