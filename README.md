# gcloud-trace
Custom Google Cloud StackDriver tracing client w/out monkey patching

# Installation
```bash
npm i --save gcloud-trace
```

# Usage
#### Configure google trace options:
https://github.com/GoogleCloudPlatform/cloud-trace-nodejs
https://github.com/GoogleCloudPlatform/cloud-trace-nodejs/blob/a1650a414c153f68f904909f3bba1d9ae73270da/config.js
```js
const trace  = require('gcloud-trace')
// initialize trace w/ options
trace.init(opts)
```

#### Glossary
Each bar line in the chart below is a `SpanData`.
The first bar is the `RootSpanData`. `SpanData`'s have `name`s and have `labels` (reference properties).
![Trace Details Example](https://cloud.google.com/trace/images/trace_details.png)

#### Custom trace RootSpanData
```js
const trace  = require('gcloud-trace')
trace.init(opts)

const spanName = 'root trace span'
const spanData = trace.createRootSpanData(spanName, {
  // traceId & parentSpanId -OR- traceHeader is required
  // parent trace span info
  traceId: 'continuingFromAnotherService',
  parentSpanId: 'continuingFromAnotherService',
  // traceHeader - spanData.toHeader() will return a traceHeader string to trace across services
  traceHeader: 'traceId/parentSpanId;o=1',
  // optional options:
  // remove frames from stack trace for span
  // like if you wrap this library w/ your own helper/util
  skipFrames: 1
})
// ... see span data usage below
```

#### Custom trace RootSpanData for a request
```js
// spanName will be the url path
// parent span info (traceId and parentSpanId) are extracted from req.headers[trace.HEADER_NAME]
// request info labels are automatically added to the span
const spanData = trace.createReqRootSpanData(req, res, {
  // optional options:
  // remove frames from stack trace for span
  // like if you wrap this library w/ your own helper/util
  skipFrames: 1
})
// ... see span data usage below
```

#### SpanData methods
```js
// add trace span labels
spanData.addLabels('foo', 'bar')
// add trace span properties
spanData.addLabels({
  foo: 'bar'
})
// end trace span time and report to stackdriver
spanData.close()
```

#### Create a child SpanData
```js
const spanName = 'childSpanName'
spanData.createChildSpanData(spanName) // same optional opts..
```

### Maintain trace across services
client.js
```js
const trace = require('gcloud-trace')
trace.start()
//...
const traceHeader = spanData.toHeader()
const headers = {}
headers[trace.HEADER_NAME] = traceHeader
http.request({
  hostname: 'foo.foo',
  port: 80,
  path: '/bar',
  headers: headers
}).end()
```
server.js
```js
const trace = require('gcloud-trace')
trace.start()

http.createServer(function (req, res) {
  const rootSpan = trace.createReqRootSpanData(req, res)
  const timeoutSpan = rootSpan.createChildSpanData('timeout')
  setTimeout(function () {
    timeoutSpan.end() // not required, will auto end with root span..
    res.writeHead(200)
    rootSpan.end() // not required, will auto-end w/ res
    res.end()
  }, 100)
}).listen(80)
```

### Maintain trace non-http across services
client.js
```js
//...
const traceHeader = spanData.toHeader()
rpc({
  operation: 'foo',
  traceHeader: traceHeader,
  payload: { bar: 'qux' }
}, cb)
```
server.js
```js
const trace =
rpcServer(function (data) {
  const payload = data.payload
  const rootSpan = createRootSpan(data.operation, {
    traceHeader: data.traceHeader
  })
  // ...
})
```

# License
MIT
