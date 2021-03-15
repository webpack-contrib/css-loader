import one from './index-loader-syntax.css';
import two from 'button.modules.css!=!./index-loader-syntax-sass.css';
// Hash should be different
import three from './button.module.scss!=!./base64-loader?LmZvbyB7IGNvbG9yOiByZWQ7IH0=!./simple.js?foo=bar';
import four from './other.module.scss!=!./base64-loader?LmZvbyB7IGNvbG9yOiByZWQ7IH0=!./simple.js?foo=baz';

__export__ = [...one, ...two, ...three, ...four];

export default [...one, ...two, ...three, ...four];