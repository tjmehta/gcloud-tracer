'use strict'

const constants = require('@google/cloud-trace/lib/constants.js')
const TraceLabels = require('@google/cloud-trace/lib/trace-labels.js')

const agent = require('./lib/agent.js')
const extendSpanData = require('./lib/extend-span-data.js')
const createRootSpanDataForReq = require('./lib/req-root-span-data-factory.js')
const createRootSpanData = require('./lib/root-span-data-factory.js')

module.exports = {
  init: function (opts) {
    agent.start(opts)
    extendSpanData()
  },
  createRootSpanDataForReq: createRootSpanDataForReq,
  createRootSpanData: createRootSpanData,
  HEADER_NAME: constants.TRACE_CONTEXT_HEADER_NAME,
  constants: constants,
  TraceLabels: TraceLabels
}
