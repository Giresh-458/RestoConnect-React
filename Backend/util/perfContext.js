const { AsyncLocalStorage } = require("async_hooks");

const perfStorage = new AsyncLocalStorage();

const runWithRequestContext = (context, callback) =>
  perfStorage.run(context, callback);

const getRequestContext = () => perfStorage.getStore();

module.exports = {
  runWithRequestContext,
  getRequestContext,
};
