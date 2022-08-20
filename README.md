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

Some useful decorator for egg framework

- @ResponseBody: Use like `@ResponseBody` in `spring-boot`
- @ResponseJson: Similar `@RequestBody`, will convert response to format json
- @RequestMapping: Use like `@RequestMapping` in `spring-boot`
- @RequestParam: Use like `@RequestParam` in `spring-boot`
- @RequestQuery: Use for get parameter in query
- @RequestBody: Use for get parameter in post body

## Install

```bash
$ npm i egg-fancy-decorator --save
```

## Configuration

- Modify `tsconfig.json`, enable decorates for typescript

```json
// add compilerOptions for enable decorates
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

- Modify `{app_root}/config/plugin.js`

```js
// {app_root}/config/plugin.js
exports.fancyDecorator = {
  enable: true,
  package: 'egg-fancy-decorator',
};
```

## Example

Orignal egg router & controller useage:

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

A simple useage with fancy-decorator plugin decorator (like spring-boot 😀):

```typescript
// controller/test.ts
// if you use the RequestMapping & ResponseBody, the router config in router.js can be omitted.
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
   * A simpe way to define a router path for a controller method
   */
  @RequestMapping('/api/project/list')
  @ResponseBody
  public async list(
    @RequestParam('pageSize') pageSize: string,
    @RequestParam('page') page: string,
    @RequestParam({ value: 'pageSize', valueType: 'number' }) pageSizeNum: number, // Cast to number
    @RequestQuery() query: any, // Get all query parameters
  ) {
    const { ctx } = this;
    console.log(query);
    return await ctx.service.project.list({ pageSize, page });
  }

  /**
   * You can define multiple router path once
   * set the method for request method and if the method is omitted, default method is GET.
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

## Questions & Suggestions

Please open an issue [here](https://github.com/bruce007lee/egg-fancy-decorator/issues).

## License

[MIT](LICENSE)
