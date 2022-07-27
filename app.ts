import { Application } from 'egg';
import { initApp } from './lib/decorator';

export default (app: Application) => {
  app.beforeStart(async () => {
    initApp(app);
    app.coreLogger.info('egg-decoraror plugin initialized');
  });
};
