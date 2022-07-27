import { Application } from 'egg';
import { initApp } from './lib/decorator';

export default (app: Application) => {
  app.beforeStart(async () => {
    initApp(app);
    app.coreLogger.info('egg-fancy-decorator plugin initialized');
  });
};
