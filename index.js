const http = require('http')
const crypto = require('crypto')
const { exec } = require('child_process')

const config = require('./config.json')
const secret = config.secret
const secretKey = 'x-hub-signature'

const getSignature = (body) => {
  return crypto.createHmac('sha1', secret).update(body).digest('hex')
}

const server = http.createServer((req, res) => {

  const { headers, method, url } = req;

  const errh = (cb) => {
    return (err) => {
      if (err) {
        console.error(err)
      } else if (cb) {
        cb()
      }
    }
  }

  let body = [];
  req
    .on('error', errh)
    .on('data', (chunk) => {
      body.push(chunk);
    })
    .on('end', () => {
      body = Buffer.concat(body).toString();

      if (
        !url.match(config.path) ||
        !headers[secretKey] ||
        headers[secretKey] !== 'sha1=' + getSignature(body)
      ) {
        res.end()
      } else {
        exec(config.cmd, (err, msg) => {
          if (err) {
            console.error(err)
          } else {
            console.log('pull done')
            console.log(msg)
          }
        })
        res.end()
      }
    })
})

server.listen(config.port, () => {
  console.log('github webhook on port:', server.address().port)
})
