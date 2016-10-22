'use strict'

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
  createRootSpanData: createRootSpanData
}
