import css from './index-loader-syntax.css';

import styles from 'button.modules.css!=!./index-loader-syntax-sass.css'

// the base64 decodes to ".foo { color: red; }"
import styles2 from './button.module.scss!=!./base64-loader?LmZvbyB7IGNvbG9yOiByZWQ7IH0=!./simple.js'


__export__ = [...css, ...styles, ...styles2];

export default css;
