import { Application, Context } from 'egg';
import _get from 'lodash/get';
import 'reflect-metadata';

type InitFunction = (app: Application) => void;

/**
 * 存储需要初始化的方法
 */
const initFunctions: InitFunction[] = [];

const requestParamMetadataKey = Symbol('RequestParam');
const requestQueryMetadataKey = Symbol('RequestQuery');
const requestBodyMetadataKey = Symbol('RequestBody');

const IS_REQUIRED = (value: any) => value != null;

export const initApp = (app: Application) => {
  initFunctions.forEach((fn) => fn(app));
};

export type ValueType = 'string' | 'number' | 'boolean' | 'json';
export type QueryType = 'query' | 'queries';

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
 * RequestParam配置
 */
export type RequestParamOptions = {
  /**
   * 对应的request中参数字段名
   */
  value: string;
  /**
   * 参数的默认值
   */
  defaultValue?: string;
  /**
   * 参数是否必传，当设置了defaultValue时无效
   * 是否必传的逻辑判断可以通过 isRequired 自己定义
   */
  required?: boolean;
  /**
   * 当前参数是否必传的判断函数，和 required 联用
   * 默认是
   * ~~~
   * (value: any) => value != null;
   * ~~~
   */
  isRequired?: (value: any) => boolean;
  /**
   * 参数类型，可做对应的类型转换, 默认是string
   */
  valueType?: ValueType;
  /**
   * 指定获取query上参数的时候取的数据节点, 默认为'query'
   * 'query' 对应 ctx.query
   * 'queries' 对应 ctx.queries
   */
  queryType?: QueryType;
};

/**
 * RequestQuery配置
 */
export type RequestQueryOptions = Omit<RequestParamOptions, 'value'> & {
  /**
   * 对应的request中参数字段名
   */
  value?: string;
};

/**
 * RequestBody配置
 */
export type RequestBodyOptions = Omit<RequestParamOptions, 'value'> & {
  /**
   * 对应的request中参数字段名
   */
  value?: string;
};

type RequestMetadata = { index: number; options: any };

const isEmptyArray = (value: any[]) => value == null || value.length <= 0;

const convertType = (value: string, type?: ValueType): any => {
  switch (type) {
    case 'boolean': {
      if (value === 'true') {
        return true;
      } else if (value === 'false') {
        return false;
      } else {
        throw new Error('convert type error');
      }
    }
    case 'number': {
      let val = parseFloat(value);
      if (isNaN(val)) {
        throw new Error('convert type error');
      } else {
        return val;
      }
    }
    case 'json': {
      try {
        return JSON.parse(value);
      } catch (e) {
        throw new Error('convert type error');
      }
    }
  }
  return value;
};

/**
 * 获取query的参数
 */
const getQuery = (ctx: Context, key: string, queryType: QueryType = 'query'): any => {
  if (queryType === 'queries') {
    return key == null ? ctx.queries : ctx.queries?.[key];
  } else {
    return key == null ? ctx.query : ctx.query?.[key];
  }
};

/**
 * 获取提交的参数，post从body, query中，get从query中
 */
const getParameter = (ctx: Context, key: string, queryType?: QueryType): any => {
  const method = ctx.method?.toUpperCase();
  if ('GET' === method) {
    return getQuery(ctx, key, queryType);
  } else if ('POST' === method) {
    const value = ctx.request.body?.[key];
    return value == null ? getQuery(ctx, key, queryType) : value;
  }
  return null;
};

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
    initFunctions.push((app) => {
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
      const values: string[] = typeof opts.value === 'string' ? [opts.value] : opts.value;
      values.forEach((value) => {
        if (Array.isArray(opts.method)) {
          opts.method.forEach((item) => {
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

    const oriValue = descriptor.value;
    descriptor.value = async function (...args) {
      let params: RequestMetadata[] = Reflect.getOwnMetadata(requestParamMetadataKey, target, name);
      let querys: RequestMetadata[] = Reflect.getOwnMetadata(requestQueryMetadataKey, target, name);
      let bodys: RequestMetadata[] = Reflect.getOwnMetadata(requestBodyMetadataKey, target, name);
      const { ctx } = this as { ctx: Context };
      if (!isEmptyArray(params) || !isEmptyArray(querys) || !isEmptyArray(bodys)) {
        args = [];
      }
      if (!isEmptyArray(params)) {
        const l = params.length;
        let param: RequestMetadata;
        let value;
        let isRequired;
        for (let i = 0; i < l; i++) {
          param = params[i];
          value = getParameter(ctx, param.options.value, param.options.queryType);
          isRequired = param.options.isRequired || IS_REQUIRED;
          if (!isRequired(value)) {
            value = param.options.defaultValue;
          }
          if (param.options.required && !isRequired(value)) {
            ctx.throw(`Missing parameter [${param.options.value}]`, 400);
            return;
          }
          if (isRequired(value)) {
            try {
              value = convertType(value, param.options.valueType);
            } catch (e) {
              ctx.throw(`Convert parameter [${param.options.value}] error`, 400);
              return;
            }
          }
          args[param.index] = value;
        }
      }
      if (!isEmptyArray(querys)) {
        const l = querys.length;
        let param: RequestMetadata;
        let value;
        let isRequired;
        for (let i = 0; i < l; i++) {
          param = querys[i];
          if (param.options.value == null) {
            // 没指定key直接返回query
            args[param.index] = getQuery(ctx, param.options.value, param.options.queryType) || {};
          } else {
            value = getQuery(ctx, param.options.value, param.options.queryType);
            isRequired = param.options.isRequired || IS_REQUIRED;
            if (!isRequired(value)) {
              value = param.options.defaultValue;
            }
            if (param.options.required && !isRequired(value)) {
              ctx.throw(`Missing query parameter [${param.options.value}]`, 400);
              return;
            }
            if (isRequired(value)) {
              try {
                value = convertType(value, param.options.valueType);
              } catch (e) {
                ctx.throw(`Convert query parameter [${param.options.value}] error`, 400);
                return;
              }
            }
            args[param.index] = value;
          }
        }
      }
      if (!isEmptyArray(bodys)) {
        const l = bodys.length;
        let param: RequestMetadata;
        let value;
        let isRequired;
        for (let i = 0; i < l; i++) {
          param = bodys[i];
          if (param.options.value == null) {
            // 没指定key直接返回body
            args[param.index] = ctx.request.body || {};
          } else {
            value = ctx.request.body?.[param.options.value];
            isRequired = param.options.isRequired || IS_REQUIRED;
            if (!isRequired(value)) {
              value = param.options.defaultValue;
            }
            if (param.options.required && !isRequired(value)) {
              ctx.throw(`Missing body parameter [${param.options.value}]`, 400);
              return;
            }
            if (isRequired(value)) {
              try {
                value = convertType(value, param.options.valueType);
              } catch (e) {
                ctx.throw(`Convert body parameter [${param.options.value}] error`, 400);
                return;
              }
            }
            args[param.index] = value;
          }
        }
      }
      return await oriValue.apply(this, args);
    };

    return descriptor;
  };

/**
 * ResponseBody修饰器, 功能类似 spring-boot中的 @ResponseBody
 */
export const ResponseBody: MethodDecorator = (target, name, descriptor: TypedPropertyDescriptor<any>) => {
  const oriValue = descriptor.value;
  descriptor.value = async function (...args) {
    const { ctx } = this as { ctx: Context };
    const rs = await oriValue.apply(this, args);
    ctx.body = rs;
    return rs;
  };

  return descriptor;
};

export type ResponseData<T> = {
  success?: boolean;
  errorCode?: string;
  errorMessage?: string;
  data?: T;
};

export const defaultDataWrapper = (data: any): ResponseData<any> => {
  return {
    success: true,
    data,
  };
};

export const defaultErrorWrapper = (error: any): ResponseData<any> => {
  return {
    success: false,
    errorMessage: error.message,
  };
};

export type ResponseJsonOptions = {
  /**
   * 用来转换返回的结果对象到标准的json
   */
  dataWrapper?: (data: any) => any;
  /**
   * 用来转换错误异常对象到标准的json
   */
  errorWrapper?: (error: any) => any;
};

/**
 * ResponseJson修饰器, 用于包装返回的json数据
 * 默认输出的结构为
 * ~~~typescript
 * type ResponseData<T> = {
 *   success?: boolean;
 *   errorCode?: string;
 *   errorMessage?: string;
 *   data?: T;
 * };
 * ~~~
 */
export const ResponseJson =
  ({ dataWrapper = defaultDataWrapper, errorWrapper = defaultErrorWrapper }: ResponseJsonOptions): MethodDecorator =>
  (target, name, descriptor: TypedPropertyDescriptor<any>) => {
    const oriValue = descriptor.value;
    descriptor.value = async function (...args) {
      const { ctx } = this as { ctx: Context };
      let rs;
      try {
        rs = await oriValue.apply(this, args);
        rs = dataWrapper(rs);
      } catch (e) {
        rs = errorWrapper(e);
      }
      ctx.body = rs;
      return rs;
    };
    return descriptor;
  };

/**
 * RequestParam修饰器, 功能类似 spring-boot中的 @RequestParam
 */
export const RequestParam = (options: string | RequestParamOptions): ParameterDecorator => {
  return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
    let opts: RequestParamOptions;
    if (typeof options === 'string') {
      opts = {
        value: options,
      };
    } else {
      opts = options;
    }
    const params: RequestMetadata[] = Reflect.getOwnMetadata(requestParamMetadataKey, target, propertyKey) || [];
    params.push({
      index: parameterIndex,
      options: opts,
    });
    Reflect.defineMetadata(requestParamMetadataKey, params, target, propertyKey);
  };
};

/**
 * RequestQuery修饰器, 提供获取query参数值功能
 */
export const RequestQuery = (options?: string | RequestQueryOptions): ParameterDecorator => {
  return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
    let opts: RequestQueryOptions;
    if (options == null || typeof options === 'string') {
      opts = {
        value: options!,
      };
    } else {
      opts = options;
    }
    const params: RequestMetadata[] = Reflect.getOwnMetadata(requestQueryMetadataKey, target, propertyKey) || [];
    params.push({
      index: parameterIndex,
      options: opts,
    });
    Reflect.defineMetadata(requestQueryMetadataKey, params, target, propertyKey);
  };
};

/**
 * RequestBody修饰器，提供获取post body参数值功能
 */
export const RequestBody = (options?: string | RequestBodyOptions): ParameterDecorator => {
  return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
    let opts: RequestBodyOptions;
    if (options == null || typeof options === 'string') {
      opts = {
        value: options!,
      };
    } else {
      opts = options;
    }
    const params: RequestMetadata[] = Reflect.getOwnMetadata(requestBodyMetadataKey, target, propertyKey) || [];
    params.push({
      index: parameterIndex,
      options: opts,
    });
    Reflect.defineMetadata(requestBodyMetadataKey, params, target, propertyKey);
  };
};
