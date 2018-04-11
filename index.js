const gcloudTraceAgent = require('@google-cloud/trace-agent')

const createRootSpanData = require('./lib/create-root-span-data')
const createRootSpanDataForReq = require('./lib/create-root-span-data-for-req')

class GcloudTracer {
  init (config) {
    gcloudTraceAgent.start(config)
  }
  stop () {
    gcloudTraceAgent.stop()
  }
  createRootSpanDataForReq (req, res, opts) {
    return createRootSpanDataForReq(req, res, opts)
  }
  createRootSpanData (name, opts) {
    return createRootSpanData(name, opts)
  }
}

module.exports = new GcloudTracer()
