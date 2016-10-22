'use strict'

const assert = require('assert')

const xor = require('101/xor')

const agent = require('./agent.js')

module.exports = rootSpanDataFactory

/**
 * trace root span data factory method
 * @param {String} name
 * @param {Object} [opts]
 * @param {String} [opts.traceHeader]
 * @param {String} [opts.traceId]
 * @param {String} [opts.parentSpanId]
 * @param {Number} [opts.skipFrames]
 * @param {String} [opts.spanKind]
 * @return {SpanData} RootSpanData
 */
function rootSpanDataFactory (name, opts) {
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
    let parsedHeader = _parseHeader(opts.traceHeader)
    traceId = parsedHeader.traceId
    parentSpanId = parsedHeader.parentSpanId
  }
  return agent.createRootSpanData(
    name,
    traceId,
    parentSpanId,
    opts.skipFrames,
    opts.spanKind
  )
}

function _parseHeader (traceHeader) {
  return agent.parseContextFromHeader(traceHeader) || {}
}
