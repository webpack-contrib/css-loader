import sheet, {foo, simple} from '././composes.css' assert { type: "css" };

console.log(sheet instanceof CSSStyleSheet);
console.log(foo);
console.log(simple);

document.adoptedStyleSheets = [sheet];

