const assert = require('assert')

const parseContextFromHeader = require('@google-cloud/trace-agent/build/src/util')
const RootSpanData = require('@google-cloud/trace-agent/build/src/span-data').RootSpanData
const xor = require('101/xor')

// extend span data
require('./extend-span-data')()

module.exports = createRootSpanData

/**
 * trace root span data factory method
 * @param {String} name
 * @param {Object} [opts]
 * @param {String} [opts.traceHeader]
 * @param {String} [opts.traceId]
 * @param {String} [opts.parentSpanId]
 * @param {Number} [opts.skipFrames]
 * @return {SpanData} RootSpanData
 */
function createRootSpanData (name, opts) {
  opts = opts || {}
  if (opts.traceHeader || opts.traceId) {
    assert(xor(opts.traceHeader, opts.traceId), '"traceHeader" and "traceId" cannot be specified together')
  }
  if (opts.traceHeader || opts.parentSpanId) {
    assert(xor(opts.traceHeader, opts.parentSpanId), '"traceHeader" and "parentSpanId" cannot be specified together')
  }
  let traceId = opts.traceId
  let parentSpanId = opts.parentSpanId
  if (opts.traceHeader) {
    let parsedHeader = parseContextFromHeader(opts.traceHeader)
    traceId = parsedHeader.traceId
    parentSpanId = parsedHeader.parentSpanId
  }
  const rootSpanData = new RootSpanData(
    { projectId: '', traceId: traceId, spans: [] },
    name,
    parentSpanId,
    opts.skipFrames || 2
  )
  return rootSpanData
}
