/* eslint-disable
  prefer-destructuring,
*/
import webpack from './helpers/compiler';

describe('Errors', () => {
  test('Loader Error', async () => {
    const config = {
      loader: {
        test: /\.css$/,
        options: {},
      },
    };

    const stats = await webpack('error.js', config);
    const { source } = stats.toJson().modules[1];

    // eslint-disable-next-line
    const err = () => eval(source);

    expect(err).toThrow();
    expect(err).toThrowErrorMatchingSnapshot();
  });

  test('Validation Error', async () => {
    const config = {
      loader: {
        test: /\.css$/,
        options: {
          sourceMap: 1,
        },
      },
    };

    const stats = await webpack('error.js', config);
    const { source } = stats.toJson().modules[1];

    // eslint-disable-next-line
    const err = () => eval(source);

    expect(err).toThrow();
    expect(err).toThrowErrorMatchingSnapshot();
  });
});
