import src from "../src";
import cjs from "../src/cjs";

describe("cjs", () => {
  it("should exported", () => {
    expect(cjs).toEqual(src);
  });
});
