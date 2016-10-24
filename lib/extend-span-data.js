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

  shimmer.wrap(SpanData.prototype, 'addLabel', function (addLabel) {
    return function () {
      if (this.span.endTime) {
        // don't allow addLabel after close..
        return
      }
      return addLabel.apply(this, arguments)
    }
  })

  shimmer.wrap(SpanData.prototype, 'close', function (close) {
    return function () {
      const config = this.agent.config()
      if (!config.enabled || (this.isRoot && ~config.ignoreUrls.indexOf(this.span.name.toLowerCase()))) {
        return
      }
      if (this.span.endTime) {
        // don't allow close twice..
        return
      }
      return close.apply(this, arguments)
    }
  })

  SpanData.prototype.toHeader = function () {
    return agent.generateTraceContext(this, this.agent.config().enabled)
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
