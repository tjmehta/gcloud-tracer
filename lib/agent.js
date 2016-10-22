'use strict'

const assert = require('assert')

const noop = require('101/noop')
const gcloudCommon = require('@google/cloud-diagnostics-common')
const gcloudTraceCLS = require('@google/cloud-trace/lib/cls')
const gcloudTraceHooks = require('@google/cloud-trace/lib/hooks/index')
const gcloudTrace = require('@google/cloud-trace')
const gcloudTraceAgent = require('@google/cloud-trace/lib/trace-agent.js')

// note: this is not an actual "agent" process, it's just a central class
function Agent () {
  this.started = false
  this._agent = null
}

/**
 * if not started, start the google-cloud trace agent
 * @param  {Object} opts google cloud trace options
 */
Agent.prototype.start = function (opts) {
  if (this.started) { return }
  this.started = true
  // disable all cls before start..
  Object.keys(gcloudTraceCLS).forEach(function (key) {
    gcloudTraceCLS[key] = noop
  })
  // disable all trace auto hooks before start..
  gcloudTraceHooks.activate = noop
  // init gcloud trace agent
  // hack: cast opts
  opts = opts || {}
  gcloudTrace.start(opts)
  // init another agent to return
  const logger = gcloudCommon.logger.create(opts.logLevel, '@google/cloud-trace')
  this._agent = gcloudTraceAgent.get(opts, logger)
  return this._agent
}

/**
 * inherited methods by composition..
 */
Agent.prototype.createRootSpanData = function () {
  assert(this._agent, 'agent is not initialized')
  return this._agent.createRootSpanData.apply(this._agent, arguments)
}
Agent.prototype.generateTraceContext = function () {
  assert(this._agent, 'agent is not initialized')
  return this._agent.generateTraceContext.apply(this._agent, arguments)
}
Agent.prototype.parseContextFromHeader = function () {
  assert(this._agent, 'agent is not initialized')
  return this._agent.parseContextFromHeader.apply(this._agent, arguments)
}

// singleton
module.exports = new Agent()
