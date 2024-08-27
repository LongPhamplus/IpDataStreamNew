const db = require('./connectDB')
const moment = require('moment')

let status = {
    'Đang giải quyết': 'status--dang_giai_quyet',
    'Cấp bằng': 'status--cap_bang',
    'Từ chối': 'status--tu_choi',
    'Rút đơn': 'status--rut_don'
}

let myquery = "";
let html = "";
let count = 1;
let numberFound = 0;
async function getData(data) {
    let page = '1'
    myquery = ``
    html = ""
    count = 1
    let check = false
    if (data) {
        for (let key in data) {
            if (data.hasOwnProperty(key)) {
                if (data[key] != '' && check == false) {
                    check = true
                    myquery = `select * from nhanhieu 
                    where`
                }
                if (key == 'page') {
                    page = data[key]
                    continue
                }
                if (key == 'cong-khai') {
                    myquery += `and lower(loai_don) = 'cong_khai' `
                    continue
                }
                if (key == 'cong-bo') {
                    myquery += `and lower(loai_don) = 'cong_bo' `
                    continue
                }
                if (data[key] != '' && check == true) {
                    data[key] = data[key].toLocaleLowerCase()
                    if (myquery[myquery.length - 1] != 'e') myquery += ' and '
                    let name = key, content = data[key].trim()
                    if (content[0] >= '0' && content[0] <= '9') {
                        if (name == "ten_nhan_hieu") {
                            name = "so_don"
                        }
                    }
                    // console.log(name, '\n', content)
                    myquery += ` lower(${name.toString()}) like '%${content.trim()}%' `
                }
            }
        }
        page = parseInt(page)
        let toPage = (page * 30 - 30 > 0) ? page * 30 - 30 : 1
        if (myquery != '') {
            numberFound = await db.any(myquery, [true])
            numberFound = numberFound.length
            if (numberFound < 30) {
                myquery += 'limit 30'
            } else {
                myquery += `limit 30 offset ${toPage}`
            }
            try {
                let dataconnect = await db.any(myquery, [true])
                let numOfProduct = (page) * 30 - 29
                dataconnect.forEach((row) => {
                    if (row.dai_dien_shcn != null) {
                        row.dai_dien_shcn = row.dai_dien_shcn.substring(0, row.dai_dien_shcn.indexOf(':'))
                    }
                    dateFromDB = row.ngay_nop_don
                    let nhom_san_pham = ''
                    row.nhom_san_pham.forEach((item, index) => {
                        nhom_san_pham += `<span>${item}</span>`
                        if (index != row.nhom_san_pham.length - 1) {
                            nhom_san_pham += ', '
                        }
                    })
                    reformat = moment(dateFromDB).format('DD/MM/YYYY')

                    html += `
                                <tr>
                                    <td style="width: 30px;word-wrap: break-word;">${numOfProduct++}</td>
                                    <td style="width: 150px;word-wrap: break-word;" class="img-container"><img class="logo-trademark"
                                            src="/img/products_logo/${row.mau_nhan}.jpg" alt=""></td>
                                    <td style="width: 250px;word-wrap: break-word;">${row.mo_ta_nhan_hieu}</td>
                                    <td style="width: 30px;word-wrap: break-word;">${nhom_san_pham}</td>
                                    <td style="width: 150px;word-wrap: break-word;"><span class="${status[row.tinh_trang]}">${row.tinh_trang}</span></td>
                                    <td style="width: 30px;word-wrap: break-word;">${reformat}</td>
                                    <td style="width: 100px;word-wrap: break-word;"><a href="/trademark?so_don=${row.so_don}">${row.so_don}</a></td>
                                    <td>${row.dai_dien_shcn}</td>
                                </tr>
                            `;
                })

            } catch (err) {
                console.log(err)
            }
        }
    }
    return { numberFound, html, data }
}
module.exports = {
    getData: getData
}