require('colors')
const express = require('express')
const webpack = require('webpack')
const noFavicon = require('express-no-favicons')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')
const webpackHotServerMiddleware = require('webpack-hot-server-middleware')
const clientConfig = require('../webpack/client.dev')
const serverConfig = require('../webpack/server.dev')
const clientConfigProd = require('../webpack/client.prod')
const serverConfigProd = require('../webpack/server.prod')
const Loadable = require("react-loadable")
const path = require('path')

const { publicPath } = clientConfig.output
const outputPath = clientConfig.output.path
const DEV = process.env.NODE_ENV === 'development'
const app = express()
app.use(noFavicon())

let isBuilt = false

const done = () =>{
  Loadable.preloadAll().then(() => {
    return !isBuilt &&
    app.listen(3000, () => {
      isBuilt = true
      console.log('BUILD COMPLETE -- Listening @ http://localhost:3000'.magenta)
    })
  });
}

if (DEV) {
  //拆分此处的两个compiler
  //先编译client再编译server,也许就不会编译两次

  const compiler = webpack([clientConfig, serverConfig])
  const clientCompiler = compiler.compilers[0]
  const options = { publicPath, stats: { colors: true } }
  const devMiddleware = webpackDevMiddleware(compiler, options)

  app.use(devMiddleware)
  app.use(webpackHotMiddleware(clientCompiler))
  app.use(webpackHotServerMiddleware(compiler))

  devMiddleware.waitUntilValid(done)
  
}
else {
  webpack([clientConfigProd, serverConfigProd]).run((err, stats) => {
    if(err){
      throw err
    }
    const clientStats = stats.toJson().children[0]
    const serverRender = require('../dist/buildServer/main.js').default

    app.use(publicPath, express.static(outputPath))
    app.use(serverRender({ clientStats }))

    done()
  })
}



