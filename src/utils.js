function messageReducer(messages, type, initialValue, loaderContext) {
  if (messages.length === 0) {
    return initialValue;
  }

  return messages
    .filter((message) => (message.type === type ? message : false))
    .filter((message) => message[type] && typeof message[type] === 'function')
    .reduce((accumulator, currentValue, index, array) => {
      try {
        // eslint-disable-next-line no-param-reassign
        accumulator = currentValue[type](
          accumulator,
          currentValue,
          index,
          array,
          loaderContext
        );
      } catch (error) {
        loaderContext.emitError(error);
      }

      return accumulator;
    }, initialValue);
}

// eslint-disable-next-line import/prefer-default-export
export { messageReducer };
