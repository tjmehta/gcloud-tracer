const assert = require('assert')

const exists = require('101/exists')
const shimmer = require('shimmer')
const spanDataModule = require('@google-cloud/trace-agent/build/src/span-data')
const traceWriter = require('@google-cloud/trace-agent/build/src/trace-writer').traceWriter

const CONST = require('./const.js')
const rootSpanDatasById = require('./root-span-datas-by-id')

const BaseSpanData = spanDataModule.BaseSpanData
const ChildSpanData = spanDataModule.ChildSpanData
const RootSpanData = spanDataModule.RootSpanData
let extended = false

module.exports = extendSpanData

function extendSpanData () {
  if (extended) return
  extended = true

  shimmer.wrap(BaseSpanData.prototype, 'addLabel', function (addLabel) {
    return function () {
      if (this.span.endTime) {
        // don't allow addLabel after close..
        return
      }
      return addLabel.apply(this, arguments)
    }
  })

  shimmer.wrap(BaseSpanData.prototype, 'endSpan', wrapEndSpan)
  shimmer.wrap(ChildSpanData.prototype, 'endSpan', wrapEndSpan)
  shimmer.wrap(RootSpanData.prototype, 'endSpan', wrapEndSpan)
  function wrapEndSpan (endSpan) {
    return function () {
      const config = traceWriter.get().getConfig()
      const isRoot = this.kind === CONST.SPAN_KIND.ROOT
      if (isRoot) {
        delete rootSpanDatasById[this.span.spanId]
      }

      if (!config.enabled) return
      // check if span is for ignored url
      if (isRoot && ~config.ignoreUrls.indexOf(this.span.name.toLowerCase())) {
        return
      }
      // don't allow endSpan twice..
      if (this.span.endTime) return
      return endSpan.apply(this, arguments)
    }
  }

  // new methods

  BaseSpanData.prototype.addLabels = function (labels) {
    const self = this
    labels = labels || {}
    Object.keys(labels).forEach(function (key) {
      const val = labels[key]
      self.addLabel(key, val)
    })
  }

  BaseSpanData.prototype.addStatusCode = function (statusCode) {
    assert(exists(statusCode), 'statusCode is required')
    return this.addLabel(CONST.TRACE_LABELS.HTTP_RESPONSE_CODE_LABEL_KEY, this.statusCode)
  }

  BaseSpanData.prototype.createChildSpanData = function (name, skipFrames) {
    assert(name, 'name is required')
    const rootSpanId = this.kind === CONST.SPAN_KIND.ROOT
      ? this.span.spanId
      : this.rootSpanId
    assert(rootSpanId, 'unknown rootSpanId: ' + rootSpanId)
    let rootSpan = rootSpanDatasById[rootSpanId]
    if (!rootSpan) {
      console.warn('root span already closed')
      // mock root span to prevent errors..
      rootSpan = {
        trace: { projectId: '', traceId: null, spans: [] }
      }
    }
    skipFrames = skipFrames || 0
    const childSpan = new ChildSpanData(
      rootSpan.trace,       /* Trace object */
      name,                 /* Span name */
      rootSpanId, /* Parent's span ID */
      skipFrames + 1
    )
    childSpan.rootSpanId = rootSpanId
    return childSpan
  }

  // aliases

  BaseSpanData.prototype.close = function () {
    return this.endSpan()
  }

  BaseSpanData.prototype.toHeader = function () {
    return this.getTraceContext()
  }
}
