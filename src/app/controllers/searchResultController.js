const productData = require('/Code/Web/IPDataStream/src/config/db/productData')
const db = require('/Code/Web/IPDataStream/src/config/db/connectDB')

class SearchResultController {

    async index(req, res) {
        try {
            let result = await productData.getData(req.query);
            let addingCheck = true;
            let err = '';

            if (!req.user || !req.user.email) {
                await res.render('searchResult', {
                    outputData: result.searchedData,
                    cap_bang: result.cap_bang,
                    page: result.page,
                });

            } else {

                let email = req.user.email;
                if (req.query.don_luu) {
                    let checkMaximum = await db.one('SELECT so_don FROM "user" WHERE email = $1', [email]);

                    if (checkMaximum.so_don && checkMaximum.so_don.length >= 5) {
                        err = '*Đã quá giới hạn có thể lưu. Bạn cần tăng giới hạn đơn lưu.';
                    } else {
                        let checkBeforAdd = await db.oneOrNone('SELECT * FROM "user" WHERE $1 = ANY (so_don) and email = $2', [req.query.don_luu, email]);

                        if (checkBeforAdd) {
                            addingCheck = true;
                            err = `*Đã lưu đơn ${req.query.don_luu} rồi.`;
                        } else {
                            await db.none(`
                                UPDATE "user"
                                SET so_don = array_append(so_don, $1)
                                WHERE email = $2;
                            `, [req.query.don_luu, email]);
                            addingCheck = false;
                        }
                    }
                }
                await res.render('searchResult', {
                    outputData: result.searchedData,
                    cap_bang: result.cap_bang,
                    page: result.page,
                    addingCheck: addingCheck,
                    addingErr: err,
                });
            }


        } catch (err) {
            console.error('Error:', err);
            res.status(500).send('Internal Server Error');
        }
    }

}

module.exports = new SearchResultController