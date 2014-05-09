
var fs = require('fs')

var express    = require('express')
var seneca     = require('seneca')()


seneca
  .use('..',require('./entity-rules.js'))

var app = express()

app.use(seneca.export('web'))



app.use(function(req,res,next){
  var m = /\/(.*)\.js$/.exec( req.url )
  if( m ) {
    fs.readFile(__dirname+'/../node_modules/'+m[1]+'/'+m[1]+'.js', function(err,out){
      if( err ) return next(err);
      res.send(''+out)
    })
  }
  else next()
})

app.use( express.static(__dirname+'/public') )

app.listen(3000)




