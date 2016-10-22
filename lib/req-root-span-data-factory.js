'use strict'

const constants = require('@google/cloud-trace/lib/constants.js')
const TraceLabels = require('@google/cloud-trace/lib/trace-labels.js')

const agent = require('./agent.js')
const rootSpanFactory = require('./root-span-data-factory.js')

module.exports = reqRootSpanDataFactory

/**
 * Create a trace RootSpanData for a request
 * @param {Object} req
 * @param {Number} [skipFrames]
 * @param {String} [spanKind]
 * @return {SpanData} RootSpanData
 */
function reqRootSpanDataFactory (req, skipFrames, spanKind) {
  const ids = _parseIds(req)
  const opts = {
    name: req.url,
    traceId: ids.traceId,
    parentSpanId: ids.parentSpanId,
    labels: _parseLabels(req),
    skipFrames: skipFrames,
    spanKind: spanKind
  }
  return rootSpanFactory(opts)
}

function _parseIds (req) {
  const traceHeader = req.headers[constants.TRACE_CONTEXT_HEADER_NAME]
  return agent.parseContextFromHeader(traceHeader) || {}
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
