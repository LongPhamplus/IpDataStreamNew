const express = require('express')
const router = express.Router()

const homeController = require('/Code/Web/IPDataStream/src/app/controllers/homeController')

router.use('/', homeController.index)

module.exports = router