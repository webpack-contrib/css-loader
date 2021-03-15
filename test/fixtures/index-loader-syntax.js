import one from './index-loader-syntax.css';
import two from 'button.modules.css!=!./index-loader-syntax-sass.css';
import three from './button.module.scss!=!./base64-loader?LmZvbyB7IGNvbG9yOiByZWQ7IH0=!./simple.js';

__export__ = [...one, ...two, ...three];

export default [...one, ...two, ...three];