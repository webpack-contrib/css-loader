import fixture from '../fixtures/url.css';

test('Url', () => {
  expect(fixture.toString()).toEqual(`.a {
  background: url("#");
  background: url("#hash");
  background: url({./module});
  background: url('{./module module}');
  background: url("{./module module}");
  background: url({./module});
  background: url({./module}#?iefix);
  background: url(//example.com/img.png);
  background: url(http://example.com/img.jpg);
  background: url(data:image/png;base64,AAA);
  background: url(9c87cbf3ba33126ffd25ae7f2f6bbafb.png);
  background: green url(data:image/png;base64,AAA) url(http://example.com/img.jpg) url(//example.com/img.png) url(9c87cbf3ba33126ffd25ae7f2f6bbafb.png)
}`);
});
