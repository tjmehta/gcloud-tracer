'use strict'

const http = require('http')

const expect = require('chai').expect
const request = require('supertest')
const sinon = require('sinon')
const TraceWriter = require('@google-cloud/trace-agent/build/src/trace-writer').TraceWriter

const trace = require('../')
const rootSpanDatasById = require('../lib/root-span-datas-by-id')
const createRootSpanDataForReq = trace.createRootSpanDataForReq
// required env
process.env.GCLOUD_PROJECT = 'test'
// init trace..
trace.init()

describe('functional tests', function () {
  describe('tracing a request', function () {
    beforeEach(function () {
      sinon.stub(TraceWriter.prototype, 'writeSpan')
    })
    afterEach(function () {
      TraceWriter.prototype.writeSpan.restore()
    })

    it('should be able to create spans for a request', function (done) {
      const self = this
      const server = http.createServer(function (req, res) {
        try {
          const rootSpan = self.rootSpanData = createRootSpanDataForReq(req, res)
          // async thing..
          process.nextTick(function () {
            try {
              const childSpan = self.childSpanData = rootSpan.createChildSpanData('yolo')
              childSpan.addLabels({ foo: 'bar' })
              // async thing..
              process.nextTick(function () {
                try {
                  rootSpan.addLabels({ close: 'close' })
                  childSpan.close()
                  rootSpan.close()
                } catch (err) { done(err) }
              })
              // respond success status
              res.writeHead(200)
              res.end()
            } catch (err) { done(err) }
          })
        } catch (err) { done(err) }
      })
      request(server)
        .get('/')
        .expect(200)
        .end(function (err) {
          if (err) { return done(err) }
          sinon.assert.calledOnce(TraceWriter.prototype.writeSpan)
          sinon.assert.calledWith(TraceWriter.prototype.writeSpan, self.rootSpanData.trace)
          expect(self.rootSpanData.trace.spans).to.deep.equal([
            self.rootSpanData.span,
            self.childSpanData.span
          ])
          expect(Object.keys(rootSpanDatasById).length).to.equal(0)
          done()
        })
    })
  })
})
