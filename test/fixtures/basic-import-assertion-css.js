import sheet from './basic.css' assert { type: "css" };

console.log(sheet instanceof CSSStyleSheet);

document.adoptedStyleSheets = [sheet];

