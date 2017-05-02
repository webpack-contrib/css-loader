import OriginalSource from 'webpack-sources/lib/OriginalSource';
import RawSource from 'webpack-sources/lib/RawSource';
import ReplaceSource from 'webpack-sources/lib/ReplaceSource';
import SourceMapSource from 'webpack-sources/lib/SourceMapSource';
import loaderUtils from 'loader-utils';
import parse from './parse';

export default function loader(source, map) {
  const options = loaderUtils.getOptions(this);
  const remainingRequest = loaderUtils.getRemainingRequest(this);
  const parseResult = parse(source);

  let replacer;
  if(options.sourceMap) {
    replacer = new ReplaceSource(
      map ? new SourceMapSource(source, remainingRequest, map) : new OriginalSource(source, remainingRequest),
      remainingRequest);
  } else {
    replacer = new ReplaceSource(new RawSource(source), remainingRequest);
  }

  parseResult.metablocks.forEach((block) => {
    replacer.replace(block.start, block.end, '');
  });
}
