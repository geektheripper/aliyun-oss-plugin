# Aliyun OSS Plugin

a webpack plugin helps you upload static file to aliyun oss

上传文件到阿里云的 Webpack 插件

# Installation

```shell
yarn add -D aliyun-oss-plugin
npm i -D aliyun-oss-plugin
```

# Configuration

```javascript
const AliyunOSSPlugin = require("aliyun-oss-webpack-plugin")

module.exports = {
  output: {
    publicPath: "https://bucket.oss-region.aliyuncs.com/sub-dir"
  },
  plugins: [
    new AliyunOssPlugin({
      accessKeyId: '<access key id>',
      accessKeySecret: '<access key secret>',
      region: '<region name>',
      bucket: '<bucket name>',
      headers: {
        'Cache-Control': 'max-age=31536000'
      },
      ignore: [
        'robots.txt',
        '**/*.js.map',
        /.*\.html$/,
        function(fileName) {
          return fileName === 'service-worker.js'
        }
      ]
    })
  ]
}
```

Options:

key|type|default|description
-|-|-|-
`accessKeyId`|`String`|-|will read `ALIYUN_OSS_ACCESS_KEY_ID` from enviroment if not set
`accessKeySecret`|`String`|-|will read `ALIYUN_OSS_ACCESS_KEY_SECRET` from enviroment if not set
`region`|`String`|-|will read `ALIYUN_OSS_REGION` from enviroment if not set
`bucket`|`String`|-|will read `ALIYUN_OSS_BUCKET` from enviroment if not set
`headers`|`Object`|-|object http headers
`internal`|`Boolean`|false|upload file using aliyun internal network (if you build project in aliyun same region ecs)
`threads`|`Number`|8|multithread upload threads
`showProgress`|`Boolean`|false|show upload progress
`retries`|`Number`|5|retry times for each file when upload failed
`ignore`|`String` `Regexp` `Function`<br> or array contains above |-|filter some files that not need to upload to oss, `String` will treaded as glob pattern just like the filter rules in `.gitignore`, `Regexp` will match the relative path like 'index.html' and 'js/app.ffffffff.map.js', `Function` will get file name and return a boolean true to filter not need files.


选项:

key|type|default|description
-|-|-|-
`accessKeyId`|`String`|-|如果不指定此参数，将从环境变量 `ALIYUN_OSS_ACCESS_KEY_ID` 中读取
`accessKeySecret`|`String`|-|如果不指定此参数，将从环境变量 `ALIYUN_OSS_ACCESS_KEY_SECRET` 中读取
`region`|`String`|-|如果不指定此参数，将从环境变量 `ALIYUN_OSS_REGION` 中读取
`bucket`|`String`|-|如果不指定此参数，将从环境变量 `ALIYUN_OSS_BUCKET` 中读取
`headers`|`Object`|-|资源的 http 头
`internal`|`Boolean`|false|使用阿里云内网上传 OSS 文件 (使用同地域的阿里云 ECS 构建项目时使用)
`threads`|`Number`|8|多线上传的并发数
`showProgress`|`Boolean`|false|显示上传进度
`retries`|`Number`|5|文件上传失败时的重试次数
`ignore`|`String` `Regexp` `Function`<br> 或者上述类型的数组 |-|筛出不需要上传的文件, `String` 会被当成 glob pattern 处理（类似 `.gitignore` 的匹配规则）, `Regexp` 匹配像 'index.html' 和 'js/app.ffffffff.map.js' 的相对地址, `Function` 会被传入文件相对地址，然后返回布尔值 true 来筛出不需要的文件.
