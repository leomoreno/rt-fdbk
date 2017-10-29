var should = require('should');
var request = require('supertest');
var server = require('../../../app');

describe('controllers', function() {

  describe('feedback', function() {

    describe('POST /feedback', function() {

      it('should create a new feedback', function(done) {

        request(server)
          .post('/v1/feedback')
          .set('api_key', '1234')
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.should.eql('Hello, stranger!');

            done();
          });
      });

      it('should get a feedback by ID', function(done) {

        request(server)
          .get('/v1/feedback/abc')
          .set('api_key', '1234')
          // .query({ name: 'Scott'})
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.should.eql('Hello, Scott!');

            done();
          });
      });

    });

  });

});
