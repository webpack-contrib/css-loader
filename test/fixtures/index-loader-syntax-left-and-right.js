import one from 'other.css!=!./my-inline-loader!./index-loader-syntax.modules.css';
import two from 'other.modules.css!=!./my-inline-loader!./simple.css';
import three from 'other.css!=!./my-inline-loader!./simple-1.css';

__export__ = [...one, ...two, ...three];

export default [...one, ...two, ...three];
