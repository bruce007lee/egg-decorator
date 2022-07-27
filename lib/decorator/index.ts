import { Application, Context } from 'egg';
import _get from 'lodash/get';

type InitFunction = (app: Application) => void;

/**
 * 存储需要初始化的方法
 */
const initFunctions: InitFunction[] = [];

export const initApp = (app: Application) => {
  initFunctions.forEach(fn => fn(app));
};

/**
 * 请求类型
 */
export enum RequestMethod {
  POST = 'post',
  GET = 'get',
  PUT = 'put',
  DELETE = 'delete',
  OPTIONS = 'options',
}

/**
 * RequestMapping配置
 */
export type RequestMappingOptions = {
  value: string | string[];
  method?: RequestMethod | RequestMethod[];
};

/**
 * RequestMapping修饰器, 功能类似 spring-boot中的 @RequestMapping
 */
export const RequestMapping =
  (options: string | string[] | RequestMappingOptions): MethodDecorator =>
    (target, name, descriptor: TypedPropertyDescriptor<any>) => {
      initFunctions.push(app => {
        let opts: RequestMappingOptions;
        if (typeof options === 'string' || Array.isArray(options)) {
          opts = {
            value: options,
          };
        } else {
          opts = options;
        }

        /* @ts-ignore */
        const path = `${target.pathName}.${name}`;
        app.logger.debug('RequestMapping init:', options, path);
        const values: string[] = typeof opts.value === 'string' ? [ opts.value ] : opts.value;
        values.forEach(value => {
          if (Array.isArray(opts.method)) {
            opts.method.forEach(item => {
              app.router[item](value, _get(app, path));
            });
          } else if (opts.method != null) {
            app.router[opts.method](value, _get(app, path));
          } else {
          // 默认走get
            app.router.get(value, _get(app, path));
          }
        });
      });
      return descriptor;
    };

/**
 * ResponseBody修饰器, 功能类似 spring-boot中的 @ResponseBody
 */
export const ResponseBody: MethodDecorator = (target, name, descriptor: TypedPropertyDescriptor<any>) => {
  const oriValue = descriptor.value;
  descriptor.value = async function(...args) {
    const { ctx } = this as { ctx: Context };
    ctx.body = await oriValue.apply(this, args);
  };

  return descriptor;
};
