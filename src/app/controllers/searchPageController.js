const searchData = require('/Code/Web/IPDataStream/src/config/db/searchData')

class SearchPageController {

    async index (req, res) {
        try {
            let output = await searchData.getData(req.query)
            await res.render('searchPage', {
                numfound: output.numberFound,
                dataSearched: output.html,
                data: output.data
            })
        } catch (err) {
            console.log(err)
            res.status(500).send('Internal Server Error')
        }
    }
    
}

module.exports = new SearchPageController