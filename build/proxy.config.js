const host = 'https://stable.fingerapp.cn'

const proxy = {
  '/manage/*': {
    target: host,
    secure: false,
    auth: '10000001000:123456',
  }
}
module.exports = proxy
