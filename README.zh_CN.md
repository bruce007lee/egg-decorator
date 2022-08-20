# egg-fancy-decorator

[![NPM version][npm-image]][npm-url]
[![Test coverage][codecov-image]][codecov-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-fancy-decorator.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-fancy-decorator
[codecov-image]: https://img.shields.io/codecov/c/github/bruce007lee/egg-fancy-decorator.svg?style=flat-square
[codecov-url]: https://codecov.io/github/bruce007lee/egg-fancy-decorator?branch=main
[david-url]: https://david-dm.org/eggjs/egg-fancy-decorator
[snyk-image]: https://snyk.io/test/npm/egg-fancy-decorator/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-fancy-decorator
[download-image]: https://img.shields.io/npm/dm/egg-fancy-decorator.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-fancy-decorator

<!--
Description here.
-->

为 egg 框架提供一些有用的修饰器

- @ResponseBody: 和`spring-boot`中的`@ResponseBody`用法类似
- @ResponseJson: 和 `@ResponseBody` 类似, 转换 response 为指定的 json 结构
- @RequestMapping: 和`spring-boot`中的`@RequestMapping`用法类似
- @RequestParam: 和`spring-boot`中的`@RequestParam`用法类似
- @RequestQuery: 获取 url 中 query 的数据
- @RequestBody: 获取 post body 中的数据

## 依赖说明

### 依赖的 egg 版本

| egg-decorator 版本 | egg 1.x |
| ------------------ | ------- |
| 1.x                | 😁      |
| 0.x                | ❌      |

## 开启插件

- 修改 `tsconfig.json`, 开启 ts 的修饰器支持, 添加支持修饰器的编译选项

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

- 修改 `{app_root}/config/plugin.js`

```js
// {app_root}/config/plugin.js
exports.fancyDecorator = {
  enable: true,
  package: 'egg-fancy-decorator',
};
```

## 使用场景

原来在 egg 中使用 router 和 controller 的方式

```typescript
// router.ts
import { Application } from 'egg';

export default (app: Application) => {
  const { controller, router } = app;
  router.get('/api/project/list', controller.project.list);
  router.post('/api/project/find', controller.project.find);
  router.post('/api/project/find2', controller.project.find);
};
```

```typescript
// controller/test.ts
import { Controller } from 'egg';

export default class TestController extends Controller {
  public async list() {
    const { ctx } = this;
    const { query } = ctx;
    ctx.body = await ctx.service.project.list({
      pageSize: query.pageSize,
      page: query.page,
    });
  }

  public find() {
    const { ctx } = this;
    const { body } = ctx;
    const { keyword } = body;
    console.log(keyword);
    ctx.body = 'test find ' + ctx.request.href;
  }
}
```

通过 fancy-decorator 插件的修饰器可以简化成(和 java 的 spring-boot 中使用类似 😀):

```typescript
// controller/test.ts
// 如果你使用 RequestMapping 和 ResponseBody, router.js 中的路由配置可以直接省略。
import { Controller } from 'egg';
import {
  RequestMapping,
  ResponseBody,
  RequestMethod,
  RequestParam,
  RequestQuery,
  RequestBody,
} from 'egg-fancy-decorator';

export default class TestController extends Controller {
  /**
   * RequestMapping 简单的方式为方法直接定义个路由
   * ResponseBody 可以简化返回的处理
   */
  @RequestMapping('/api/project/list')
  @ResponseBody
  public async list(
    @RequestParam('pageSize') pageSize: string,
    @RequestParam('page') page: string,
    @RequestParam({ value: 'pageSize', valueType: 'number' }) pageSizeNum: number, // 转换成number
    @RequestQuery() query: any, // 获取所有的query参数
  ) {
    const { ctx } = this;
    console.log(query);
    return await ctx.service.project.list({ pageSize, page });
  }

  /**
   * 一个可以定义多个路由路径或请求的方式
   * method的设置可省略，默认是get的方式
   */
  @RequestMapping({ value: ['/api/project/find', '/api/project/find2'], method: RequestMethod.POST })
  @ResponseBody
  public find(@RequestParam('keyword') keyword: string, @RequestBody() body: any) {
    console.log(keyword);
    console.log('post body:', body);
    const { ctx } = this;
    return 'test find ' + ctx.request.href;
  }
}
```

## 详细配置

请到 [config/config.default.js](config/config.default.js) 查看详细配置项说明。

## 提问交流

请到 [issues](https://github.com/bruce007lee/egg-fancy-decorator/issues) 异步交流。

## License

[MIT](LICENSE)
