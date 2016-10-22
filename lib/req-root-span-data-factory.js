'use strict'

const assert = require('assert')

const constants = require('@google/cloud-trace/lib/constants.js')
const TraceLabels = require('@google/cloud-trace/lib/trace-labels.js')
const shimmer = require('shimmer')

const rootSpanFactory = require('./root-span-data-factory.js')

module.exports = reqRootSpanDataFactory

/**
 * Create a trace RootSpanData for a request
 * @param {Object} req
 * @param {Number} [skipFrames]
 * @param {String} [spanKind]
 * @return {SpanData} RootSpanData
 */
function reqRootSpanDataFactory (req, res, opts) {
  assert(req, 'req is required')
  assert(req, 'res is required')
  opts = opts || {}
  const allOpts = {
    traceHeader: req.headers[constants.TRACE_CONTEXT_HEADER_NAME],
    skipFrames: opts.skipFrames,
    spanKind: opts.spanKind
  }
  const span = rootSpanFactory(req.url, allOpts)
  span.addLabels(_parseLabels(req))
  shimmer.wrap(res, 'end', function (end) {
    return function () {
      span.close()
      return end.apply(this, arguments)
    }
  })
  return span
}

function _parseLabels (req) {
  const proto = req.headers['X-Forwarded-Proto'] || 'http'
  const url = [proto, '://', req.headers.host, req.url].join()
  const labels = {}
  labels[TraceLabels.HTTP_METHOD_LABEL_KEY] = req.method
  labels[TraceLabels.HTTP_URL_LABEL_KEY] = url
  labels[TraceLabels.HTTP_SOURCE_IP] = req.connection.remoteAddress
  return labels
}
