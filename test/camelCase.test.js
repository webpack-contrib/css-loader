import { camelCase } from "../src/utils";

describe("camelCase", () => {
  const data = [
    "foo",
    "foo-bar",
    "foo-bar-baz",
    "foo--bar",
    "--foo-bar",
    "--foo---bar",
    "FOO-BAR",
    "FOÈ-BAR",
    "FOÈ-BAr",
    "--foo---bar--",
    "--foo--1",
    "--foo..bar",
    "foo_bar",
    "__foo__bar__",
    "foo bar",
    "  foo  bar ",
    "-",
    "fooBar",
    "fooBar-baz",
    "fooBarBaz-bazzy",
    "",
    "--__--_--_",
    "A::a",
    "1Hello",
    "h2w",
    "F",
    "foo bar?",
    "foo bar!",
    "foo bar#",
    "mGridCol6@md",
    "Hello1World11foo",
  ];

  for (const entry of data) {
    it(`should transform`, () => {
      expect(camelCase(entry)).toMatchSnapshot(`${entry}`);
    });
  }
});
