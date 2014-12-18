/* Copyright (c) 2014 Richard Rodger */
"use strict";

// mocha entity-validator.test.js


var assert  = require('assert')

var _       = require('underscore')

var seneca  = require('seneca')






describe('entity-validator', function() {

  it('happy', function(fin) {
    var si = seneca()
    si.use('..')

    si.act('role:entity-validator,cmd:add',{
      entity:{name:'foo'},
      rules:{a:1,b:2}
    })

    //console.log(si.actroutes())

    var fooent = si.make$('foo')

    fooent.make$({a:1,b:2}).save$(function(err,out){
      if(err) return fin(err);

      assert.equal(1,out.a)
      assert.equal(2,out.b)

      fooent.make$({a:2,b:2}).save$(function(err,out){
        // console.log('GEETING', JSON.stringify(err))
        assert.equal(err.errortype,'entity-invalid')
        assert.equal(err.valmap.code,'eq$')
        assert.equal(err.valmap.property,'a')
        assert.equal(err.valmap.value,2)
        assert.equal(err.valmap.expected,1)

        fin()
      })
    })
  })


  it('options', function(fin) {
    var si = seneca()
    si.use('..',{ruleset:[
      {entity:'foo',rules:{a:1}},
      {entity:'bar',rules:{b:2}},
    ]})


    var fooent = si.make$('foo')
    var barent = si.make$('bar')

    fooent.make$({a:1}).save$(function(err,out){
      if(err) return fin(err);

      assert.equal(1,out.a)

      barent.make$({b:2}).save$(function(err,out){
        if(err) return fin(err);

        assert.equal(2,out.b)

        fooent.make$({a:2}).save$(function(err,out){
          assert.equal(err.errortype,'entity-invalid')
          assert.equal(err.valmap.code,'eq$')
          assert.equal(err.valmap.property,'a')
          assert.equal(err.valmap.value,2)
          assert.equal(err.valmap.expected,1)

          barent.make$({b:1}).save$(function(err,out){
            assert.equal(err.errortype,'entity-invalid')
            assert.equal(err.valmap.code,'eq$')
            assert.equal(err.valmap.property,'b')
            assert.equal(err.valmap.value,1)
            assert.equal(err.valmap.expected,2)

            fin()
          })
        })
      })
    })
  })

  it('multiErrors', function(fin) {
    var si = seneca()
    si.use('..', {
      ruleset:[
        {entity:'foo',rules:{a:'required$', b:'required$'}}
      ],
      prefs: {
        multiErrors: true
      }
    })

    var fooent = si.make$('foo')

    fooent.make$({a:1,b:2}).save$(function(err,out){
      if(err) return fin(err);

      assert.equal(1,out.a)
      assert.equal(2,out.b)

      fooent.make$({a:1}).save$(function(err,out){

        assert.ok(err.errors)
        assert.equal(err.errors.length,1)
        var validationError = err.errors[0]

        assert.equal(validationError.errortype,'entity-invalid')
        assert.equal(validationError.valmap.code,'required$')
        assert.equal(validationError.valmap.property,'b')
        assert.equal(validationError.valmap.expected,'b')

        fooent.make$({b:2}).save$(function(err, out) {
          assert.ok(err.errors)
          assert.equal(err.errors.length,1)
          var validationError = err.errors[0]

          assert.equal(validationError.errortype,'entity-invalid')
          assert.equal(validationError.valmap.code,'required$')
          assert.equal(validationError.valmap.property,'a')
          assert.equal(validationError.valmap.expected,'a')


          fooent.make$({}).save$(function(err, out) {

            assert.ok(err.errors)

            assert.equal(err.errors.length,2)
            var validationError = err.errors[0]
            assert.equal(validationError.errortype,'entity-invalid')
            assert.equal(validationError.valmap.code,'required$')
            assert.equal(validationError.valmap.property,'a')
            assert.equal(validationError.valmap.expected,'a')

            var validationError = err.errors[1]
            assert.equal(validationError.errortype,'entity-invalid')
            assert.equal(validationError.valmap.code,'required$')
            assert.equal(validationError.valmap.property,'b')
            assert.equal(validationError.valmap.expected,'b')

            fin()
          })
        })
      })
    })
  })


  it('code', function(fin) {
    var si = seneca()
    si.use('..',{
      ruleset:[
        {entity:'foo',rules:{a:{startsWith$:'AAA'}}},
        {entity:'zoo/bar',rules:{b:2}},
      ],
      prefs:{
        rules:{
          startsWith$: function(ctxt,cb){
            if( 0 === (''+ctxt.point).indexOf(''+ctxt.rule.spec) ) return cb();
            ctxt.util.fail(ctxt,cb)
          }
        }
      }
    })


    var fooent = si.make$('foo')

    fooent.make$({a:'AAAzed'}).save$(function(err,out){
      if(err) return fin(err);

      fooent.make$({a:'zed'}).save$(function(err,out){
        assert.ok(err)

        si.act('role:entity-validator,cmd:generate_code',function(err,js){
          if( err ) return fin(err);
          console.log(js)
          fin()
        })
      })
    })
  })


})
