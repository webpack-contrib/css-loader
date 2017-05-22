/* eslint-disable
  prefer-destructuring,
*/
import loader from '../src';
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

  test('Validation Error', () => {
    const err = () => loader.call({ query: { sourceMap: 1 } });

    expect(err).toThrow();
    expect(err).toThrowErrorMatchingSnapshot();
  });
});
