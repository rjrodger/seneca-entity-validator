module.exports = {
  ruleset:[

    {entity:'foo',
     rules:{
       a:{startsWith$:'AAA'}
     }},

    {entity:'zoo/bar',
     rules:{
       b:2
     }},
  ],
  prefs:{
    rules:{
      startsWith$: function(ctxt,cb){
        if( 0 === (''+ctxt.point).indexOf(''+ctxt.rule.spec) ) return cb();
        ctxt.util.fail(ctxt,cb)
      }
    }
  }
}
