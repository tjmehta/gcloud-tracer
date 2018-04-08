const assert = require('assert')

const exists = require('101/exists')
const getTraceAgent = require('@google-cloud/trace-agent').get
const noop = require('101/noop')
const shimmer = require('shimmer')
const spanDataModule = require('@google-cloud/trace-agent/build/src/span-data')
const traceWriter = require('@google-cloud/trace-agent/build/src/trace-writer').traceWriter

const CONST = require('./const.js')
const rootSpanDatasById = require('./root-span-datas-by-id')

const BaseSpanData = spanDataModule.BaseSpanData
const ChildSpanData = spanDataModule.ChildSpanData
const RootSpanData = spanDataModule.RootSpanData
const UNCORRELATED_SPAN = spanDataModule.UNCORRELATED_SPAN
let extended = false

module.exports = extendSpanData

function extendSpanData () {
  if (extended) return
  extended = true

  shimmer.wrap(BaseSpanData.prototype, 'addLabel', function (addLabel) {
    return function () {
      // check if agent is active
      const traceAgent = getTraceAgent()
      if (!traceAgent.isActive()) return
      // don't allow addLabel after close..
      if (this.span.endTime) return
      return addLabel.apply(this, arguments)
    }
  })

  shimmer.wrap(BaseSpanData.prototype, 'endSpan', wrapEndSpan)
  shimmer.wrap(ChildSpanData.prototype, 'endSpan', wrapEndSpan)
  shimmer.wrap(RootSpanData.prototype, 'endSpan', wrapEndSpan)
  function wrapEndSpan (endSpan) {
    return function () {
      // if span is a root span remove it from active root spans
      const isRoot = this.type === CONST.SPAN_TYPE.ROOT
      if (isRoot) delete rootSpanDatasById[this.span.spanId]
      // check if agent is active
      const traceAgent = getTraceAgent()
      if (!traceAgent.isActive()) return
      const config = traceWriter.get().getConfig()
      // check if span is for ignored url
      const spanName = this.span.name.toLowerCase()
      if (isRoot && ~config.ignoreUrls.indexOf(spanName)) return
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
    const rootSpanId = this.type === CONST.SPAN_TYPE.ROOT
      ? this.span.spanId
      : this.rootSpanId
    assert(rootSpanId, 'unknown rootSpanId: ' + rootSpanId)
    let rootSpan = rootSpanDatasById[rootSpanId]
    if (!rootSpan) {
      // uncorrelated root span (lost context) to prevent errors
      rootSpan = UNCORRELATED_SPAN
    }
    skipFrames = skipFrames || 0
    // default trace for uncorrelated root spans
    const spans = []
    spans.push = noop // so pushes don't leak memory..
    const trace = rootSpan.trace || { projectId: '', traceId: null, spans: spans }
    const childSpan = new ChildSpanData(
      trace,       /* Trace object */
      name,        /* Span name */
      rootSpanId,  /* Parent's span ID */
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
