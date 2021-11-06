import sheet from './basic-css-style-sheet.css' assert { type: "css" };
import standard from './basic.css?foo=1';

const standardStyleSheet = new CSSStyleSheet();

standardStyleSheet.replaceSync(standard.toString());

document.adoptedStyleSheets = [sheet, standardStyleSheet];

__export__ = [sheet, standard];
