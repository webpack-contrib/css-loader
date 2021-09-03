import sheet from './basic.css' assert { type: "css" };
import standard from './basic.css?foo=1';

console.log(sheet instanceof CSSStyleSheet);
console.log(standard instanceof CSSStyleSheet);

const standardStyleSheet = new CSSStyleSheet();

standardStyleSheet.replace(standard.toString());

document.adoptedStyleSheets = [sheet, standardStyleSheet];
