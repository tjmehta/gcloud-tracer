'use strict'

const agent = require('./agent.js')

module.exports = rootSpanDataFactory

/**
 * trace root span data factory method
 * @param {Object} opts
 * @param {String} opts.name
 * @param {String} [opts.traceId]
 * @param {String} [opts.parentSpanId]
 * @param {Object} [opts.labels]
 * @param {Number} [opts.skipFrames]
 * @param {String} [opts.spanKind]
 * @return {SpanData} RootSpanData
 */
function rootSpanDataFactory (opts) {
  return agent.createRootSpanData(
    opts.name,
    opts.traceId,
    opts.parentSpanId,
    opts.skipFrames,
    opts.skipFrames
  )
}
