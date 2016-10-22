'use strict'

const SpanData = require('@google/cloud-trace/lib/span-data.js')

module.exports = extendSpanData

function extendSpanData () {
  // Existing SpanData public methods
  // - createChildSpanData
  // - addLabel
  // - close

  SpanData.prototype.addLabels = function (labels) {
    const self = this
    labels = labels || {}
    Object.keys(labels).forEach(function (key) {
      const val = labels[key]
      self.addLabel(key, val)
    })
  }
}
