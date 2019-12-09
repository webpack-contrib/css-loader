import { webpack } from './helpers';

describe('modules', () => {
  it('true', async () => {
    const config = {
      loader: {
        options: {
          modules: {
            mode: 'local',
            localIdentName: '_[local]',
          },
          onlyLocals: true,
        },
      },
    };
    const testId = `./modules/composes.css`;
    const stats = await webpack(testId, config);
    const { modules } = stats.toJson();
    const module = modules.find((m) => m.id === testId);
    const valueModule = modules.find((m) =>
      m.id.endsWith('./modules/values.css')
    );

    expect(module.source).toMatchSnapshot('module');
    expect(valueModule.source).toMatchSnapshot('values module');
    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });
});
