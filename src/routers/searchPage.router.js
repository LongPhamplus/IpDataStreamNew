const express = require('express')
const router = express.Router()

const searchPageController = require('/Code/Web/IPDataStream/src/app/controllers/searchPageController')

router.use('/', searchPageController.index)

module.exports = router