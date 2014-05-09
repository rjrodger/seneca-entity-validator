/* Copyright (c) 2014 Richard Rodger, MIT License */
"use strict";


var util = require('util')

var _ = require('underscore')

var parambulator = require('parambulator')




module.exports = function( options ) {
  var seneca = this
  var plugin = 'entity-validator'



  options = seneca.util.deepextend({
    prefix: '/entity-validator',
    web:true,
    prefs:{rules:{}}
  },options)
  



  var specmap = {}
  var generated_code = ''


  // actions provided
  seneca.add({ role: plugin, 
               cmd:  'add',

               entity:{
                 required$: true,
               },

               rules: {
                 required$: true,
                 object$:   true,
               },

               prefs: {
                 object$:   true,
               }

             }, 
             cmd_add )


  seneca.add({ role: plugin, 
               cmd:  'generate_code' 
             },
             cmd_generate_code )



  handle_options( options )



  function validator(entitydef, rules, prefs) {
    var entitydefstr = _.reduce(
      seneca.make$(entitydef,{}).canon$({array:true}),
      function(memo,part){
        if(null!=part) { memo.push(part) }
        return memo;
      }, []).join('/')

    var pb = parambulator(rules,prefs)

    specmap[entitydefstr] = {entity:entitydef,rules:rules,prefs:prefs,pb:pb}
    

    return function( args, done ) {
      var seneca = this

      pb.validate(args.ent,function(err){
        if( err ) {
          return done( 
            seneca.fail(
              'entity-invalid',
              { entity:    args.ent,
                code:      err.parambulator.code,
                property:  err.parambulator.property,
                value:     err.parambulator.value,
                expected:  err.parambulator.expected,
                parambulator:parambulator
              }))
        }

        seneca.prior(args,done)
      })
    }
  }



  function cmd_add( args, done ) {
    var seneca = this

    var entitydef = _.extend({},seneca.util.parsecanon(args.entity))
    seneca.add('role:entity,cmd:save',entitydef,validator(entitydef,args.rules,options.prefs))

    done()
  }



  function cmd_generate_code( args, done ) {

    var prefs = ['var prefs={rules:{']
    _.each(options.prefs.rules,function(v,k){
      prefs.push( k+':'+options.prefs.rules[k].toString()+',' )
    })
    prefs.push('}};\n')

    var pb = [prefs.join('\n')]
    _.each( specmap, function(v,k) {
      pb.push( 'v["'+k+'"]=p(' )
      pb.push( JSON.stringify(v.rules) )
      pb.push( ',prefs);\n' )
    })

    var js = [
      ';(function(window){ var v = {}, p = window.parambulator;\n',
      pb.join(''),
      'window.validation = v})(this);'
    ]

    generated_code = js.join('')

    done(null,generated_code)
  }




  function handle_options( options ) {
    _.each(options.ruleset,function(item){
      seneca.act( { role:plugin, cmd:'add', entity:item.entity, rules:item.rules} )
    })
  }


  // web interface
  seneca.act_if(options.web, {role:'web', use:{
    prefix:options.prefix,
    pin:{role:plugin,cmd:'*'},
    map:{
      generate_code: { alias:'rules', GET: function(req,res,next){
        req.seneca.act({role:plugin,cmd:'generate_code'}, function(err,out){
          if( err ) return next(err);

          res.send(out)
        })
      }}
    }
  }})


  return {
    name: plugin
  }
}
