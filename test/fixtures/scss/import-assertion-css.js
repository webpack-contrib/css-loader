import sheet from './source.scss' assert { type: "css" };

console.log(sheet instanceof CSSStyleSheet);

document.adoptedStyleSheets = [sheet];

