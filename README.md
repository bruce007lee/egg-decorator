# egg-decorator

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

- @RequestMapping: use like `@RequestMapping` in `spring-boot`
- @ResponseBody: use like `@ResponseBody` in `spring-boot`

## Install

```bash
$ npm i egg-fancy-decorator --save
```

## Usage

```js
// {app_root}/config/plugin.js
exports.fancyDecorator = {
  enable: true,
  package: 'egg-fancy-decorator',
};
```

## Configuration

```js
// {app_root}/config/config.default.js
exports.fancyDecorator = {};
```

see [config/config.default.js](config/config.default.js) for more detail.

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
    ctx.body = await ctx.service.project.list();
  }

  public find() {
    const { ctx } = this;
    ctx.body = 'test find ' + ctx.request.href;
  }
}
```


A simple useage with fancy-decorator plugin decorator (like spring-boot 😀):

```typescript
// controller/test.ts
// if you use the RequestMapping & ResponseBody, the router config in router.js can be omitted.
import { Controller } from 'egg';
import { RequestMapping, ResponseBody, RequestMethod } from 'egg-fancy-decorator';

export default class TestController extends Controller {

  /**
   * A simpe way to define a router path for a controller method
   */
  @RequestMapping('/api/project/list')
  @ResponseBody
  public async list() {
    const { ctx } = this;
    return await ctx.service.project.list();
  }

  /**
   * You can define multiple router path once
   * set the method for request method and if the method is omitted, default method is GET.
   */
  @RequestMapping({ value: ['/api/project/find', '/api/project/find2'], method: RequestMethod.POST })
  @ResponseBody
  public find() {
    const { ctx } = this;
    return 'test find ' + ctx.request.href;
  }
}
```

## Questions & Suggestions

Please open an issue [here](https://github.com/bruce007lee/egg-fancy-decorator/issues).

## License

[MIT](LICENSE)
