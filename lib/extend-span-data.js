'use strict'

const SpanData = require('@google/cloud-trace/lib/span-data.js')
const shimmer = require('shimmer')

const agent = require('./agent.js')

module.exports = extendSpanData

function extendSpanData () {
  // Existing SpanData public methods
  // - createChildSpanData
  // - addLabel
  // - close

  shimmer.wrap(SpanData.prototype, 'close', function (close) {
    return function () {
      if (this.span.endTime) {
        // don't allow close twice..
        return
      }
      return close.apply(this, arguments)
    }
  })

  SpanData.prototype.toHeader = function () {
    return agent.generateTraceContext(this, true)
  }

  SpanData.prototype.addLabels = function (labels) {
    const self = this
    labels = labels || {}
    Object.keys(labels).forEach(function (key) {
      const val = labels[key]
      self.addLabel(key, val)
    })
  }
}
