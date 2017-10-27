const autoprefixer = require('autoprefixer')
const precss = require('precss')

module.exports = [
  precss(),
  autoprefixer({
    "browsers": ["> 1%"],
    "remove": false
  })
]