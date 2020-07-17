import css from './index.css';

let html = '\n';

html += `<div class="${css['header-baz']}">\n`;
html += `<div class="${css.body}">\n`;
html += `<div class="${css.footer}">\n`;

export default  html;
