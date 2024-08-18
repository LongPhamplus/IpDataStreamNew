const db = require('./connectDB')
const moment = require('moment')

var status = {
    'Đang giải quyết': 'status--dang_giai_quyet',
    'Cấp bằng': 'status--cap_bang',
    'Từ chối': 'status--tu_choi',
    'Rút đơn': 'status--rut_don'
}

let myquery = "";
let html = "";
let sameOwnerHtml = '';
let count = 1;
var numberFound = 0;
var searchedData = {}
async function getData(data) {
    sameOwnerHtml = ""
    var cap_bang = false
    html = ""
    count = 1
    myquery = `select * from "nhan_hieu" 
    where lower(so_don) = '${data.so_don}'`
    let result = await db.one(myquery)
    if (result.tinh_trang == 'Cấp bằng') {
        cap_bang = true
    }
    var nhom_san_pham = result.nhom_san_pham
    var dich_vu_html = ''
    nhom_san_pham.forEach((element, index) => {
        dich_vu_html += `<span class="bold">${element}:</span>\n${result.dich_vu_nhom_sp[index]}\n<br>`
    });
    let dai_dien_shcn = `
        <p>${result.dai_dien_shcn.substring(0, result.dai_dien_shcn.indexOf(':'))}</p>
        <p>${result.dai_dien_shcn.substring(result.dai_dien_shcn.indexOf(':') + 1, result.dai_dien_shcn.length)}</p>
    `
    let arr_tttd = result.tttd_ngay
    let tttd_html = ''
    if (arr_tttd) {
        arr_tttd.forEach((element, index) => {
            tttd_html += `
               <div class="grid-style grid-col-3">
                    <div class="grid-item grid-item-border">${result.tttd_noi_dung[index]}</div>
                    <div class="grid-item grid-item-border">${moment(element).format('DD/MM/YYYY')}</div>
                    <div class="grid-item grid-item-border"><a href="#">Download tài liệu</a></div>
               </div>
           `
        })
    }
    let sameOwner = await db.any(`
        select * from "nhan_hieu" where chu_don = $1;
        `, [result.chu_don])
    let numOfProduct = 1;
    sameOwner.forEach((row) => {
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

        sameOwnerHtml += `
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
    searchedData.so_don = (result.so_don) ? result.so_don : ''
    searchedData.tinh_trang = (result.tinh_trang) ? result.tinh_trang : ''
    searchedData.tinh_trang_css = status[result.tinh_trang]
    searchedData.ngay_nop_don = (result.ngay_nop_don) ? moment(result.ngay_nop_don).format('DD/MM/YYYY') : ''
    searchedData.ngay_cong_bo = (result.ngay_cong_bo) ? moment(result.ngay_cong_bo).format('DD/MM/YYYY') : ''
    searchedData.so_bang = (result.so_bang) ? result.so_bang : ''
    searchedData.chu_don = (result.chu_don) ? result.chu_don : ''
    searchedData.dia_chi_chu_don = (result.dia_chi_chu_don) ? result.dia_chi_chu_don : ''
    searchedData.mau_nhan = (result.mau_nhan) ? `/img/products_logo/${result.mau_nhan}.jpg` : ''
    searchedData.mo_ta_nhan_hieu = (result.mo_ta_nhan_hieu) ? result.mo_ta_nhan_hieu : ''
    searchedData.mau_sac = (result.mau_sac_nhan_hieu) ? result.mau_sac_nhan_hieu : ''
    searchedData.nhom_san_pham = (dich_vu_html) ? dich_vu_html : ''
    searchedData.phan_loai_hinh = (result.phan_loai_hinh) ? result.phan_loai_hinh : ''
    searchedData.dai_dien_shcn = (dai_dien_shcn) ? dai_dien_shcn : ''
    searchedData.tttd_html = (tttd_html) ? tttd_html : ''
    return { searchedData, cap_bang, sameOwnerHtml }
}
module.exports = {
    getData: getData
}