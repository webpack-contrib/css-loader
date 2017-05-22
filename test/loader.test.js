/* eslint-disable
  prefer-destructuring,
*/
import webpack from './helpers/compiler';

describe('Loader', () => {
  test('Defaults', async () => {
    const config = {
      loader: {
        test: /\.css$/,
        options: {},
      },
    };

    const stats = await webpack('fixture.js', config);
    const { type } = stats.compilation.modules[1];
    const { source } = stats.toJson().modules[1];

    expect(type).toEqual('text/css');
    expect(source).toMatchSnapshot();
  });
});
