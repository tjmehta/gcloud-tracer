const assert = require('assert')
const shimmer = require('shimmer')

const CONST = require('./const')
const createRootSpanData = require('./create-root-span-data')

module.exports = createRootSpanDataForReq

/**
 * Create a trace RootSpanData for a request
 * @param {Request} req
 * @param {Response} res
 * @param {Object} [opts]
 * @param {String} [opts.skipFrames]
 * @return {SpanData} RootSpanData
 */
function createRootSpanDataForReq (req, res, opts) {
  assert(req, 'req is required')
  assert(req, 'res is required')
  opts = opts || {}
  const spanOpts = {
    traceHeader: req.headers[CONST.TRACE_CONTEXT_HEADER_NAME],
    skipFrames: opts.skipFrames || 3
  }
  const span = createRootSpanData(req.url, spanOpts)
  span.addLabels(_parseLabels(req))
  shimmer.wrap(res, 'end', function (end) {
    return function () {
      span.addLabel(CONST.TRACE_LABELS.HTTP_RESPONSE_CODE_LABEL_KEY, this.statusCode)
      span.close()
      return end.apply(this, arguments)
    }
  })
  req.once('aborted', () => {
    span.addLabel(CONST.ERROR_DETAILS_NAME, 'aborted')
    span.addLabel(CONST.ERROR_DETAILS_MESSAGE, 'client aborted the request')
    span.close()
  })
  return span
}

function _parseLabels (req) {
  const proto = req.headers['X-Forwarded-Proto'] || 'http'
  const url = [proto, '://', req.headers.host, req.url].join('')
  const labels = {}
  labels[CONST.TRACE_LABELS.HTTP_METHOD_LABEL_KEY] = req.method
  labels[CONST.TRACE_LABELS.HTTP_URL_LABEL_KEY] = url
  labels[CONST.TRACE_LABELS.HTTP_SOURCE_IP] = req.connection.remoteAddress
  return labels
}
