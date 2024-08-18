const express = require('express')
const router = express.Router()

const searchResultController = require('/Code/Web/IPDataStream/src/app/controllers/searchResultController')

router.use('/', searchResultController.index)

module.exports = router