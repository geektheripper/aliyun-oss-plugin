const url = require('url')

const OSS = require('ali-oss')
const minimatch = require('minimatch')
const cliProgress = require('cli-progress')

const env = process.env

const defaultOption = {
  accessKeyId: '',
  accessKeySecret: '',
  region: '',
  bucket: '',
  headers: {},
  internal: false,
  threads: 8,
  showProgress: false,
  retries: 5,
  ignore: () => {},
}

function readEnvOptions() {
  const envOptions = {}
  if (env.ALIYUN_OSS_ACCESS_KEY_ID)       envOptions.accessKeyId     = env.ALIYUN_OSS_ACCESS_KEY_ID
  if (env.ALIYUN_OSS_ACCESS_KEY_SECRET)   envOptions.accessKeySecret = env.ALIYUN_OSS_ACCESS_KEY_SECRET
  if (env.ALIYUN_OSS_REGION)              envOptions.region          = env.ALIYUN_OSS_REGION
  if (env.ALIYUN_OSS_BUCKET)              envOptions.bucket          = env.ALIYUN_OSS_BUCKET
  if (env.ALIYUN_OSS_INTERNAL === 'true') envOptions.internal        = env.ALIYUN_OSS_INTERNAL
  return envOptions
}

function filterGenerater(rule) {
  switch (Object.prototype.toString.call(rule)) {
    case '[object String]':
      return f => minimatch(f, rule)
    case '[object RegExp]':
      return f => rule.test(f)
    case '[object Function]':
      return rule
    default:
      throw new Error('ignore rule must be string, regexp, function or an array contains above types')
  }
}

function AliyunOssPlugin(options) {
  const envOptions = readEnvOptions()

  this.options = Object.assign({}, defaultOption, envOptions, options)

  const { accessKeyId, accessKeySecret, region, bucket, ignore } = this.options

  if (!(accessKeyId && accessKeySecret && region && bucket)) {
    throw new Error('to use ali-oss, accessKeyId, accessKeySecret, region, bucket must be set');
  }

  this.ossClient = new OSS({ region, accessKeyId, accessKeySecret, bucket })

  const ignoreRules = Array.isArray(ignore) ? ignore : [ignore]
  const ignoreFilters = ignoreRules.map(filterGenerater)

  this.filesFilter = function(fileName) {
    for (const filter of ignoreFilters) {
      if (filter(fileName)) { return false }
    }
    return true
  }
}

AliyunOssPlugin.prototype.apply = function(compiler) {
  const { headers, threads, retries, showProgress } = this.options
  const ossClient = this.ossClient
  const filesFilter = this.filesFilter

  compiler.hooks.emit.tapAsync('AliyunOssPlugin', function(compilation, callback) {
    const publicPath = url.parse(compiler.options.output.publicPath)
    if (!(publicPath.protocol && publicPath.hostname)) {
      return callback(new Error('`output.publicPath` must be set to a complete url like `https://some-domain.com/path/to/somedir`'));
    }

    const filesPool = Object.keys(compilation.assets).filter(filesFilter)
    let activeWorkers = 0
    let uploadFailedFiles = []

    const progressBar = showProgress && new cliProgress.Bar({}, cliProgress.Presets.legacy)

    showProgress && progressBar.start(filesPool.length, 0)

    function uploadWorkDone() {
      showProgress && progressBar.stop()

      if (uploadFailedFiles.length) {
        console('AliyunOssPlugin Upload Failed, the following files not upload:')
        uploadFailedFiles.forEach(f => console.log(f))
        callback(new Error('aliyun oss upload failed'))
        return
      }

      callback()
    }

    async function upload(file) {
      const target = url.resolve(url.format(publicPath), file)
      const key = url.parse(target).pathname
      const source = compilation.assets[file].source()
      const body = Buffer.isBuffer(source) ? source : new Buffer(source, 'utf8')
      
      headers ? await ossClient.put(key, body, { headers }) : await ossClient.put(key, body)
    }

    async function worker() {
      const file = filesPool.pop()
      showProgress && progressBar.increment()

      if (!file) {
        activeWorkers -= 1
        if (activeWorkers === 0) uploadWorkDone()
        return
      }

      let retry = retries
      let success = false

      while (retry-- > 0 && !success) {
        try {
          await upload(file)
          success = true
        } catch (e) {
          console.error(e)
        }
      }

      if (!success) {
        uploadFailedFiles.push(file)
      }

      setTimeout(worker, 0)
    }

    for (let i = 0; i < threads; i++) {
      activeWorkers += 1
      setTimeout(worker, 0)
    }
  })
}

module.exports = AliyunOssPlugin
