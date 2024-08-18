const e = require('connect-flash');
const db = require('/Code/Web/IPDataStream/src/config/db/connectDB')
const productData = require('/Code/Web/IPDataStream/src/config/db/productData')
const bcrypt = require('bcrypt')
const moment = require('moment');
const { report, get } = require('../../routers/user.router');


function checkReportProperty(obj) {
    return Object.keys(obj).some(key => key.includes('report'))
}

// Do trong thuộc tính được trả về dưới dạng pro1 pro2 nên sử dụng hàm getArrayFromKey để tạo thành mảng cho vào câu truy vấn dưới dạng '{'abc', 'bcd'}'
function getTextArrayFromKey(obj, property) {
    let resultArr = [];
    for (const [key, value] of Object.entries(obj)) {
        if (key.includes(property)) {
            let text = value.toString().replace(/"/g, '\\"');
            resultArr.push("\"" + text + "\"");
        }
    }
    return resultArr.join(',');
}
function getNumArrayFromKey(obj, property) {
    let resultArr = []
    for (let key in obj) {
        if (obj.hasOwnProperty(key) && key.includes(property)) {
            resultArr.push(obj[key])
        }
    }
    let resutlString = resultArr.join(',')
    return resutlString
}
// hàm lấy email từ dữ liệu submit của editor
function getViewerEmail(obj) {
    for (key in obj) {
        if (obj.hasOwnProperty(key) && key.includes('report')) {
            return obj[key]
        }
    }
}
function diffObjects(obj1, obj2) {
    const diffs = {};

    function findDiff(o1, o2, parentKey = '') {
        const keys1 = Object.keys(o1);
        const keys2 = Object.keys(o2);

        const allKeys = new Set([...keys1, ...keys2]);

        allKeys.forEach(key => {
            const fullKey = parentKey ? `${parentKey}.${key}` : key;

            if (typeof o1[key] === 'object' && o1[key] !== null && typeof o2[key] === 'object' && o2[key] !== null) {
                findDiff(o1[key], o2[key], fullKey);
            } else if (o1[key] !== o2[key] && o2[key]) {
                if (typeof (o2[key]) !== 'object') {
                    diffs[fullKey] = { obj1: o1[key], obj2: o2[key] };
                } else {
                    if (o2[key].length != 0) {
                        diffs[fullKey] = { obj1: o1[key], obj2: o2[key] };
                    }
                }
            }
        });
    }

    findDiff(obj1, obj2);
    return diffs;
}




class UserController {


    login(req, res) {
        res.render('login');
    }

    async register(req, res) {
        let { name, email, password, password2, phonenumber } = req.body

        let err = []

        if (!password || !password2) {
            res.render('register')
        } else {
            if (password.length < 6) {
                err.passErr = '*Mật khẩu nên chứa ít nhất 6 ký tự'
            }
            if (password !== password2) {
                err.pass2Err = '*Mật khẩu không khớp'
            }
            let emailCheck = await db.any(
                `select * from "user"
                where email = $1`,
                [email],
                (err) => {
                    if (err) {
                        throw err
                    }
                }
            )
            if (emailCheck.length > 0) {
                err.emailErr = '*Email đã được sử dụng'
            }
            if (Object.keys(err).length > 0) {
                res.render('register', {
                    err: err,
                    inputData: { name, email, phonenumber }
                })
            } else {
                try {
                    let hashPassword = await bcrypt.hash(password, 10);

                    await db.none(
                        `INSERT INTO "user" (name, email, password, phonenum, role) VALUES ($1, $2, $3, $4, 'viewer')`,
                        [name, email, hashPassword, phonenumber]
                    )
                        .catch(err => {
                            console.error('Sign Up Error: ', err)
                            res.send('Có lỗi xảy ra ở phần đăng kí. Vui lòng thử lại sau.')
                        })
                    res.redirect('login');
                } catch (error) {
                    if (error.code == '23514') {
                        err.phonenumberErr = '*Số điện thoại phải nằm trong khoảng từ 0 đến 9.'
                        res.render('register', {
                            err: err,
                            inputData: { name, email, phonenumber }
                        })
                    }
                }
            }
            // Insert new user
        }
    }

    fogotpass(req, res) {
        res.render('fogotPass')
    }

    async viewer(req, res) {
        try {
            let error = '';
            let user = req.user
            let email = user.email;
            let data = await db.one(`SELECT so_don FROM "user" WHERE email = $1`, [email]);
            if (req.body.add) {
                let donAdd = req.body.add.trim();

                if (data.so_don && data.so_don.length >= 5) {
                    error = '*Đã quá giới hạn có thể lưu. Bạn có muốn tăng giới hạn đơn lưu?';
                } else {
                    let checkduplicate = await db.oneOrNone(`SELECT * FROM "user" WHERE $1 = ANY (so_don) and email = $2`, [donAdd, email]);
                    if (checkduplicate) {
                        error = `*Đã lưu đơn ${donAdd} rồi`;
                    } else {
                        let checkBeforAdd = await db.oneOrNone(`SELECT * FROM "nhan_hieu" WHERE so_don = $1`, [donAdd, email]);
                        if (checkBeforAdd) {
                            await db.none(`
                                UPDATE "user"
                                SET so_don = array_append(so_don, $1)
                                WHERE email = $2;
                            `, [donAdd, email]);
                            // Re-fetch the updated so_don
                            data = await db.one(`SELECT so_don FROM "user" WHERE email = $1`, [email]);
                        } else {
                            error = '*Không tồn tại đơn có số đơn như trên.';
                        }
                    }
                }
            }
            if (req.body.sub) {
                let donSub = req.body.sub.trim();
                let checkBeforSub = await db.oneOrNone(`SELECT * FROM "user" WHERE $1 = ANY (so_don) and email = $2`, [donSub, email]);
                if (checkBeforSub) {
                    await db.none(`
                                UPDATE "user"
                                SET so_don = array_remove(so_don, $1)
                                WHERE email = $2;
                            `, [donSub, email]);
                    data = await db.one(`SELECT so_don FROM "user" WHERE email = $1 `, [email]);
                } else {
                    error = '*Không tồn tại đơn có số đơn như trên.';
                }
            }
            let arrDon = data.so_don;
            let don_luu_html = '';

            if (arrDon) {
                const promises = arrDon.map(item => {
                    if (req.query.so_don == item) {
                        return `<li><a class="num select" href="/user/dashboard/viewer?so_don=${item}">${item}</a></li>`;
                    }
                    return `<li><a class="num" href="/user/dashboard/viewer?so_don=${item}">${item}</a></li>`;
                });

                let thong_tin_dons = await Promise.all(promises);
                don_luu_html = thong_tin_dons.join('');
            }

            let so_don_da_luu = req.query.so_don
            let date = new Date()
            let reportPermission = true
            let checkReport = await db.oneOrNone('select * from "report" where email = $1', [email])
            if (checkReport) {
                reportPermission = false
            } else {
                if (req.body.report_content) {
                    let submitDate = moment(date).format('DD/MM/YYYY hh:mm:ss a')
                    await db.none(`insert into "report" (name, email, report, phonenumber, submitdate, so_don, passtoeditor)
                            values ($1, $2, $3, $4, $5, $6, false)`,
                        [user.name, user.email, req.body.report_content, user.phonenum, submitDate, so_don_da_luu])
                        .then(() => {
                            reportPermission = false
                        })
                        .catch((err) => {
                            console.error('Error: ', err)
                        })
                }
            }
            if (req.query.so_don) {
                let thong_tin_don = await productData.getData(req.query);
                res.render('dashboardViewer', {
                    outputData: thong_tin_don.searchedData,
                    display: true,
                    savedtm: don_luu_html,
                    addErr: error,
                    user: user,
                    sameOwnerHtml: thong_tin_don.sameOwnerHtml,
                    cap_bang: thong_tin_don.cap_bang,
                    reportPermission: reportPermission,
                });
            } else {
                res.render('dashboardViewer', {
                    display: false,
                    savedtm: don_luu_html,
                    addErr: error,
                    user: user,
                    reportPermission: reportPermission,
                });
            }
        } catch (err) {
            console.error('Error: ', err);
            res.status(500).send('Internal Server Error');
        }
    }
    async admin(req, res) {
        try {
            let data = req.body
            let email = data.email
            let permissionHtml = ''

            // Thay đổi quyền của người dùng
            if (email) {
                let permissionList = await db.any(`select * from "user" where lower(email) like '%${email}%'`)
                let id = 0
                if (permissionList) {
                    permissionList.forEach(element => {
                        let role = {
                            admin: '',
                            leader: '',
                            editor: '',
                            viewer: ''
                        }
                        role[`${element.role}`] = 'checked'
                        id++
                        permissionHtml += `
                        <tr>
                            <td><label for="role${id}" class="cursor-pointer"><input id="role${id}" type="checkbox" name="apply${id}" value="${element.email}"></label></td>
                            <td>${element.name}</td>
                            <td>${element.email}</td>
                            <td>${element.phonenum}</td>
                            <td><input type="radio" value="admin" name="role${id}" ${role.admin}></td>
                            <td><input type="radio" value="leader" name="role${id}" ${role.leader}></td>
                            <td><input type="radio" value="editor" name="role${id}" ${role.editor}></td>
                            <td><input type="radio" value="viewer" name="role${id}" ${role.viewer}></td>
                        </tr>
                        `
                    });
                }
            }


            // Cấp đơn chỉnh sửa cho nhân viên
            let staffListHtml = ''
            if (data.staff_email) {
                let staffList = await db.any(`select * from "user" where lower(email) like '%${data.staff_email}%' and role = 'editor';`)
                let id = 0
                if (staffList) {
                    staffList.forEach((element) => {
                        id++
                        staffListHtml += `
                        <tr>
                            <td><label for="editor${id}" class="cursor-pointer"><input id="editor${id}" type="checkbox" name="editor${id}" value="${element.email}"></label></td>
                            <td>${element.name}</td>
                            <td>${element.email}</td>
                            <td>${element.phonenum}</td>
                        </tr>
                        `
                    })

                }
            }

            let editorEmail = ''
            let reportEmail = []
            Object.keys(data).forEach((key) => {
                if (data[key]) {
                    if (key.includes('apply')) {
                        // console.log(key[key.length-1])
                        let authorizationEmail = data[key]
                        let roleId = `role${key.substring(5)}`
                        let permission = data[roleId]

                        db.none(`
                            update "user"
                            set role = $1
                            where email = $2;
                        `, [permission, authorizationEmail])
                            .then()
                            .catch(err => {
                                console.error('Error', err)
                                res.send('Có lỗi xảy ra vui lòng liên hệ admin.')
                            })
                    }

                    if (key.includes('editor')) {
                        editorEmail = data[key]
                    }
                    if (key.includes('report')) {
                        reportEmail.push(data[key])
                    }
                }
            })
            // Kiểm tra trước khi thêm đơn cho editor
            if (reportEmail && editorEmail) {
                reportEmail.forEach(async e => {
                    let checkBeforPass = await db.oneOrNone('select * from "report" where email = $1', [e])
                    console.log(checkBeforPass)
                    if (checkBeforPass && !checkBeforPass.passtoeditor) {
                        await db.none(`
                            update "user"
                            set don_xu_ly = array_append(don_xu_ly, $1)
                            where email = $2;
                        `, [e, editorEmail])
                            .catch(e => {
                                console.error('Lỗi khi thêm report cho editor: ', e)
                            })
                        await db.none(`
                            update "report"
                            set passtoeditor = true
                            where email = $1;
                            `, [e])
                            .catch(e => {
                                console.error('Lỗi khi sửa bỏ report: ', e)
                            })
                    }
                })
            }
            let reportHtml = ''
            let reportFromDb = await db.any(`select * from "report" where passtoeditor = 'false' order by submitdate;`)
            if (reportFromDb) {
                let id = 0
                reportFromDb.forEach((e) => {
                    id++
                    reportHtml += `
                        <div class="report-list-container flex-style margin-bot-16">
                            <label for="${id}" class="flex-style report-checkbox margin-right-16 cursor-pointer">
                            <input type="checkbox" class="cursor-pointer" id="${id}" name="report${id}" value="${e.email}"></label>
                            <div class="report-content font-size-14">
                                <div class="report-header flex-style justify-spbt margin-right-8">
                                    <p>Người dùng <span class="bold">${e.name}</span> với email <span
                                            class="bold">${e.email}</span> | ${e.submitdate}</p>
                                    <div class="detail-btn cursor-pointer">
                                        <i class="gg-more-alt"></i>
                                    </div>
                                </div>
                                <p class="expand-report-text"><span class="bold">Số đơn: </span>${e.so_don}</p>
                                <p class="report-text"><span class="bold">Nội dung: </span>${e.report}</p>
                            </div>
                            <div class="expan-report-container disp-none">
                                <div class="expan-report">
                                    <div class="report-header flex-style justify-spbt margin-right-8">
                                        <p>Người dùng <span class="bold">${e.name}</span> với email <span
                                                class="bold">${e.email}</span> | ${e.submitdate}
                                        </p>
                                        <div class="close-expand-btn cursor-pointer">
                                            <i class="gg-close"></i>
                                        </div>
                                    </div>
                                    <p class="expand-report-text"><span class="bold">Số đơn: </span><br>${e.so_don}</p>
                                    <p class="expand-report-text"><span class="bold">Nội dung: </span><br>${e.report}</p>
                                </div>
                            </div>
                        </div>
                    `
                })
            }
            res.render('dashboardAdmin', {
                userList: permissionHtml,
                staffList: staffListHtml,
                reportContent: reportHtml
            })
        } catch (err) {
            console.error('Error: ', err);
            res.status(500).send('Internal Server Error');
        }

    }
    async leader(req, res) {
        try {
            let tradermarkName = {
                'nhom_san_pham': 'Nhóm sản phẩm',
                'tinh_trang': 'Trạng thái',
                'ngay_nop_don': 'Ngày nộp đơn',
                'so_bang': 'Số bằng',
                'chu_don': 'Chủ đơn',
                'dia_chi_chu_don': 'Địa chỉ chủ đơn',
                'mo_ta_nhan_hieu': 'Mô tả nhãn hiệu',
                'yeu_to_loai_tru': 'Yếu tốt loại trừ',
                'loai_don': 'Loại đơn',
                'nhom_san_pham': 'Nhóm sản phẩm',
                'dich_vu_nhom_sp': 'Dịch vụ nhóm sản phẩm',
                'dai_dien_shcn': 'Đại diện shcn',
                'mau_sac_nhan_hieu': 'Màu sắc nhãn hiệu',
                'phan_loai_hinh': 'Phân loại hình',
                'du_lieu_uu_tien': 'Dữ liệu ưu tiên',
                'tttd_ngay': 'Tiến trình ngày',
                'tttd_noi_dung': 'Tiến trình nội dung',
                'dai_dien_shcn_cb': 'Đại diện shcn sau cấp bằng',
                'ngay_cap_bd': 'Ngày cấp bằng',
                'ngay_cap_kt': 'Ngày hết hạn',
                'mo_ta_nhan_hieu_cb': 'Mô tả nhãn hiệu sau cấp bằng',
                'dich_vu_nhom_sp_cb': 'Dịch vụ nhóm sản phẩm sau cấp bằng',
                'nhom_san_pham_cb': 'Nhóm sản phẩm sau cấp bằng',
                'phan_loai_hinh_cb': 'Phân loại hình cấp bằng'
            }
            let user = req.user
            let listEditor = await db.oneOrNone(`
                select editor_email from "user" 
                where email = $1
            `, [user.email])
            let listEditorHtml = ''
            if (listEditor.editor_email) {
                for (let editor of listEditor.editor_email) {
                    if (req.query.editor === editor) {
                        listEditorHtml += `<a href="?editor=${editor}" class="grid-item-border margin-left-16 select-editor">${editor}</a>`
                    } else {
                        listEditorHtml += `<a href="?editor=${editor}" class="grid-item-border margin-left-16">${editor}</a>`
                    }
                }
            }
            // Hiển thị những report được cấp cho editor tùy chọn
            let reportListData = {
                html: '',
            }
            if (req.query.editor) {
                let reportList = await db.oneOrNone(`
                    select don_xu_ly from "user" 
                    where email = $1;
                `, [req.query.editor])
                if (reportList.don_xu_ly) {
                    for (let report of reportList.don_xu_ly) {
                        let reportData = await db.oneOrNone(`
                            select * from "report"
                            where email = $1
                            and tinh_trang = 'cho';
                        `, [report])
                        if (reportData) {
                            reportListData[reportData.so_don] = reportData
                            reportListData.html += `
                            <div class="report-list-container flex-style margin-bot-16 ">
                                <div class="report-content font-size-14 select-box">
                                    <div class="report-header flex-style justify-spbt margin-right-8">
                                        <p>Người dùng <span class="bold">${reportData.name}</span> với email <span
                                                class="bold">${reportData.email}</span> | ${reportData.submitdate}
                                        </p>
                                        <div class="detail-btn cursor-pointer">
                                            <i class="gg-more-alt"></i>
                                        </div>
                                    </div>
                                    <p class="expand-report-text"><span class="bold">Số đơn: </span><a
                                            href="?editor=${req.query.editor}&don_chinh_sua=${reportData.so_don}">${reportData.so_don}</a>
                                    </p>
                                    <p class="report-text"><span class="bold">Nội dung: </span>${reportData.report}
                                    </p>
                                </div>
                                <div class="expan-report-container disp-none">
                                    <div class="expan-report">
                                        <div class="report-header flex-style justify-spbt margin-right-8">
                                            <p>Editor <span class="bold">${reportData.name}</span> với email <span
                                                    class="bold">${reportData.email}</span> |
                                                ${reportData.submitdate}</p>
                                            <div class="close-expand-btn cursor-pointer">
                                                <i class="gg-close"></i>
                                            </div>
                                        </div>
                                        <p class="expand-report-text"><span class="bold">Số đơn:
                                            </span><br>${reportData.so_don}</p>
                                        <p class="expand-report-text"><span class="bold">Nội dung:
                                            </span><br>${reportData.report}</p>
                                    </div>
                                </div>
                            </div>
                            `
                        }
                    }
                }
            }
            // Tạo thông tin thay đổi
            let editedData = ''
            let editor = {}
            let reportId
            if (req.query.don_chinh_sua) {
                let originalTrademark = await db.oneOrNone(`
                    select * from "nhan_hieu"
                    where so_don = $1;
                `, [req.query.don_chinh_sua])
                let editedTrademark = await db.oneOrNone(`
                    select * from "nhan_hieu_edit"
                    where so_don = $1;     
                `, [req.query.don_chinh_sua])
                console.log(editedTrademark)
                let nhom_san_pham_arr = []
                let dich_vu_nhom_sp_arr = []
                if (originalTrademark && editedTrademark) {
                    let diffDetail = diffObjects(originalTrademark, editedTrademark)
                    for (let key in diffDetail) {
                        if (key.includes('nhom_san_pham.')) {
                            nhom_san_pham_arr.push(diffDetail[key])
                        } else if (key.includes('dich_vu_nhom_sp.')) {
                            dich_vu_nhom_sp_arr.push(diffDetail[key])
                        } else if (tradermarkName[key]) {
                            if (diffDetail[key].obj1) {
                                editedData += `
                                <br>
                                <p><span class="bold">${tradermarkName[key]}:</span></p>
                                    <div class="grid-style grid-col-1-1">
                                        <div class="grid-item-border">${diffDetail[key].obj1}</div>
                                        <div class="grid-item-border">${diffDetail[key].obj2}</div>
                                    </div>
                                `
                            } else {
                                editedData += `
                                <br>
                                <p><span class="bold">${tradermarkName[key]}:</span></p>
                                    <div class="grid-style grid-col-1-1">
                                        <div class="grid-item-border"></div>
                                        <div class="grid-item-border">${diffDetail[key].obj2}</div>
                                    </div>
                                `
                            }
                        }
                    }
                }
                if (nhom_san_pham_arr.length != 0) {
                    editedData += `
                        <br><p class="bold">Dịch vụ nhóm sản phẩm:</p>
                    `
                    for (let key of nhom_san_pham_arr) {
                        editedData += `
                            <div class="grid-style grid-col-1-1">
                                <div class="grid-item-border">${key.obj1}</div>
                                <div class="grid-item-border">${key.obj2}</div>
                            </div>
                        `
                    }
                }
                if (dich_vu_nhom_sp_arr.length != 0) {
                    editedData += `
                        <br><p class="bold">Dịch vụ nhóm sản phẩm:</p>
                    `
                    for (let key of dich_vu_nhom_sp_arr) {
                        editedData += `
                        <div class="grid-style grid-col-1-1">
                            <div class="grid-item-border">${key.obj1}</div>
                            <div class="grid-item-border">${key.obj2}</div>
                        </div>
                        `
                    }
                }
                if (req.query.don_chinh_sua) {
                    reportId = req.query.don_chinh_sua
                }
                // Thêm thông tin người dùng
                editor = await db.oneOrNone(`
                    select * from "user"
                    where email = $1;
                `, [req.query.editor])
                editor.submitDate = editedTrademark.submit_date
            }


            // Thông qua hay từ chối đơn
            if (req.body.action) {
                let date = new Date()
                date = moment(date).format('DD/MM/YYYY hh:mm:ss a')
                let viewer = await db.one(`
                    select * from "report"
                    where so_don = $1;
                `, [req.query.so_don])
                let editor = await db.one(`
                    select * from "user"
                    where $1 = any (don_xu_ly);
                `, [viewer.email])
                if (req.body.action === 'thong_qua') {
                    await db.none(`
                        insert into "submit_history" (viewer, email, phonenumber, editor, leader_submit_date, report, leader, so_don)
                        values ($1, $2, $3, $4, $5, $6, $7, $8)
                    `, [viewer.name, viewer.email, viewer.phonenumber, editor.email, date, viewer.report, req.user.email, req.query.so_don])
                    await db.none(`
                        delete from "report"
                        where email = $1;
                    `, [viewer.email])
                    await db.none(`
                        delete from "nhan_hieu_edit"
                        where so_don = $1;
                    `, [req.query.so_don])
                    await db.none(`
                        update "user" 
                        set don_xu_ly = array_remove(don_xu_ly, $1)
                        where email = $2;
                    `, [viewer.email, editor.email])
                } else if (req.body.action === 'tu_choi') {
                    await db.none(`
                        update "report"
                        set 
                            tinh_trang = 'tu_choi',
                            ly_do_tu_choi = $1
                        where
                            email = $2;
                    `, [req.body.ly_do, viewer.email])
                        .catch(err => {
                            console.error(err)
                        })
                    await db.none(`
                        delete from "nhan_hieu_edit"
                        where so_don = $1;
                    `, [req.query.so_don])
                }
            }


            res.render('dashboardLeader', {
                editorList: listEditorHtml,
                reportList: reportListData,
                editedData: editedData,
                editor: editor,
                reportData: reportListData[reportId],
                don_chinh_sua: req.query.don_chinh_sua,
            })
        } catch (err) {
            console.error(err)
            res.send('Có lỗi xảy ra vui lòng liên hệ admin.')
        }
    }
    async editor(req, res) {
        try {
            let data = req.query;
            let viewerEmail = getViewerEmail(req.body) // lưu email của viewer người đưa ra report 
            let email = req.user.email;
            let reportHtml = '';

            // Lấy thông tin báo cáo từ cơ sở dữ liệu
            let reportFromDb = await db.oneOrNone(`
                SELECT don_xu_ly FROM "user"
                WHERE email = $1;
            `, [email]);
            // In ra màn hình danh sách report
            if (reportFromDb && reportFromDb.don_xu_ly) {
                let id = 0;
                for (const e of reportFromDb.don_xu_ly) {
                    let reportList = await db.oneOrNone('SELECT * FROM "report" WHERE email = $1', [e]);
                    if (reportList && reportList.tinh_trang !== 'cho') {
                        id++;
                        let deny = (reportList.tinh_trang === 'tu_choi') ? 'deny' : ''
                        let deny_reason = (reportList.tinh_trang === 'tu_choi') ? `<p class="red-color"><span class="bold">Lý do từ chối: </span>${reportList.ly_do_tu_choi}</p>` : '';
                        reportHtml += `
                            <div class="report-list-container flex-style margin-bot-16">
                                <label for="${id}" class="flex-style report-checkbox margin-right-16 cursor-pointer">
                                    <input type="checkbox" class="cursor-pointer" id="${id}" name="report${id}" value="${reportList.email}">
                                </label>
                                <div class="report-content font-size-14 ${deny}">
                                    <div class="report-header flex-style justify-spbt margin-right-8">
                                        <p>Người dùng <span class="bold">${reportList.name}</span> với email <span class="bold">${reportList.email}</span> | ${reportList.submitdate}</p>
                                        <div class="detail-btn cursor-pointer">
                                            <i class="gg-more-alt"></i>
                                        </div>
                                    </div>
                                    <p class="expand-report-text"><span class="bold">Số đơn: </span><a href="/user/dashboard/editor?so_don_thay_doi=${reportList.so_don}&viewer=${reportList.email}">${reportList.so_don}</a></p>
                                    <p class="report-text"><span class="bold">Nội dung: </span>${reportList.report}</p>
                                </div>
                                <div class="expan-report-container disp-none">
                                    <div class="expan-report">
                                        <div class="report-header flex-style justify-spbt margin-right-8">
                                            <p>Người dùng <span class="bold">${reportList.name}</span> với email <span class="bold">${reportList.email}</span> | ${reportList.submitdate}</p>
                                            <div class="close-expand-btn cursor-pointer">
                                                <i class="gg-close"></i>
                                            </div>
                                        </div>
                                        <p class="expand-report-text"><span class="bold">Số đơn: </span><br>${reportList.so_don}</p>
                                        <p class="expand-report-text"><span class="bold">Nội dung: </span><br>${reportList.report}</p>
                                        ${deny_reason}
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                }
            }
            // Hiển thị dữ liệu để sửa đơn
            let outputData = {};
            if (data.so_don_thay_doi) {
                let thong_tin_don = await db.oneOrNone(`SELECT * FROM "nhan_hieu" WHERE so_don = $1`, [data.so_don_thay_doi.trim()]);
                if (thong_tin_don) {
                    var nhom_san_pham = thong_tin_don.nhom_san_pham;
                    var dich_vu_html = '';

                    if (nhom_san_pham) {
                        nhom_san_pham.forEach((element, index) => {
                            dich_vu_html += `
                                <textarea name="danh_muc_${index}">${element}</textarea>
                                <textarea name="san_pham_${index}">${thong_tin_don.dich_vu_nhom_sp[index]}</textarea>
                                <br>
                           `;
                        });
                    }
                    var nhom_san_pham_cb = thong_tin_don.nhom_san_pham_cb;
                    var dich_vu_cb_html = '';

                    if (nhom_san_pham_cb) {
                        nhom_san_pham_cb.forEach((element, index) => {
                            dich_vu_cb_html += `
                                <textarea name="danh_muc_cb${index}">${element}</textarea>
                                <textarea name="san_pham_cb${index}">${thong_tin_don.dich_vu_nhom_sp[index]}</textarea>
                                <br>
                           `;
                        });
                    }
                    let dai_dien_shcn = `
                        <textarea name="dai_dien_shcn" class="grid-item">${thong_tin_don.dai_dien_shcn.substring(0, thong_tin_don.dai_dien_shcn.indexOf(':'))}</textarea>
                        <textarea name="dai_dien_shcn_dc" class="grid-item">${thong_tin_don.dai_dien_shcn.substring(thong_tin_don.dai_dien_shcn.indexOf(':') + 1, thong_tin_don.dai_dien_shcn.length)}</textarea>
                    `;

                    let tttd_html = '';
                    let arr_tttd = thong_tin_don.tttd_ngay;
                    if (arr_tttd) {
                        arr_tttd.forEach((element, index) => {
                            tttd_html += `
                            <div class="grid-style grid-col-3">
                                <textarea name="tttd_noi_dung${index}" class="grid-item grid-item-border">${thong_tin_don.tttd_noi_dung[index]}</textarea>
                                <textarea name="tttd_ngay${index}" class="grid-item grid-item-border">${moment(element).format('DD/MM/YYYY')}</textarea>
                            </div>
                        `;
                        });
                    }

                    outputData = {
                        so_don: thong_tin_don.so_don,
                        tinh_trang: thong_tin_don.tinh_trang,
                        tinh_trang_css: thong_tin_don.tinh_trang,
                        ngay_nop_don: moment(thong_tin_don.ngay_nop_don).format('DD/MM/YYYY'),
                        so_bang: thong_tin_don.so_bang,
                        chu_don: thong_tin_don.chu_don,
                        dia_chi_chu_don: thong_tin_don.dia_chi_chu_don,
                        mau_nhan: `/img/products_logo/${thong_tin_don.mau_nhan}.jpg`,
                        mo_ta_nhan_hieu: thong_tin_don.mo_ta_nhan_hieu,
                        mau_sac: thong_tin_don.mau_sac_nhan_hieu,
                        nhom_san_pham: dich_vu_html,
                        phan_loai_hinh: thong_tin_don.phan_loai_hinh,
                        dai_dien_shcn: dai_dien_shcn,
                        tttd_html: tttd_html,
                        nhom_san_pham_cb: dich_vu_cb_html,
                        phan_loai_hinh_cb: thong_tin_don.phan_loai_hinh_cb,
                    };
                }
            }

            let trademarkEditedData = req.body;

            // Câu lệnh để thêm đơn hoặc sửa đơn của editer submit cho leader kiểm tra
            if (trademarkEditedData && checkReportProperty(trademarkEditedData)) {
                let tttd_ngay = getTextArrayFromKey(trademarkEditedData, 'tttd_ngay');
                let tttd_noi_dung = getTextArrayFromKey(trademarkEditedData, 'tttd_noi_dung');
                let nhom_san_pham = getNumArrayFromKey(trademarkEditedData, 'danh_muc');
                let dich_vu_nhom_sp = getTextArrayFromKey(trademarkEditedData, 'san_pham');
                let dich_vu_nhom_sp_sb = getTextArrayFromKey(trademarkEditedData, 'san_pham_cb');
                let nhom_san_pham_cb = getTextArrayFromKey(trademarkEditedData, 'danh_muc_cb');
                let submit_date = new Date()
                submit_date = moment(submit_date).format('DD/MM/YYYY hh:mm:ss a')

                let queryInsertToLeader = `
                    INSERT INTO "nhan_hieu_edit" (tinh_trang, so_don, ngay_nop_don, so_bang, chu_don, dia_chi_chu_don,
                        mo_ta_nhan_hieu, yeu_to_loai_tru, nhom_san_pham, dich_vu_nhom_sp, dai_dien_shcn, mau_sac_nhan_hieu, 
                        phan_loai_hinh, tttd_ngay, tttd_noi_dung, dai_dien_shcn_cb, ngay_cap_bd, ngay_cap_kt, mo_ta_nhan_hieu_cb,
                        nhom_san_pham_cb, dich_vu_nhom_sp_cb, phan_loai_hinh_cb, submit_date)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23);
                `;
                let queryUpdateToLeader = `
                UPDATE "nhan_hieu_edit"
                SET
                    tinh_trang = $1,
                    ngay_nop_don = $3,
                    so_bang = $4,
                    chu_don = $5,
                    dia_chi_chu_don = $6,
                    mo_ta_nhan_hieu = $7,
                    yeu_to_loai_tru = $8,
                    nhom_san_pham = $9,
                    dich_vu_nhom_sp = $10,
                    dai_dien_shcn = $11,
                    mau_sac_nhan_hieu = $12,
                    phan_loai_hinh = $13,
                    tttd_ngay = $14,
                    tttd_noi_dung = $15,
                    dai_dien_shcn_cb = $16,
                    ngay_cap_bd = $17,
                    ngay_cap_kt = $18,
                    mo_ta_nhan_hieu_cb = $19,
                    nhom_san_pham_cb = $20,
                    dich_vu_nhom_sp_cb = $21,
                    phan_loai_hinh_cb = $22,
                    submit_date = $23
                WHERE
                    so_don = $2;
                `

                let shcn_input = ''
                if (trademarkEditedData.dai_dien_shcn) {
                    shcn_input = trademarkEditedData.dai_dien_shcn + ':' + trademarkEditedData.dai_dien_shcn_dc
                }
                let values = [
                    trademarkEditedData.tinh_trang, trademarkEditedData.so_don,
                    trademarkEditedData.ngay_nop_don, trademarkEditedData.so_bang, trademarkEditedData.chu_don,
                    trademarkEditedData.dia_chi_chu_don, trademarkEditedData.mo_ta_nhan_hieu, trademarkEditedData.yeu_to_loai_tru,
                    `{${nhom_san_pham}}`, `{${dich_vu_nhom_sp}}`, shcn_input,
                    trademarkEditedData.mau_sac_nhan_hieu, trademarkEditedData.phan_loai_hinh, `{${tttd_ngay}}`,
                    `{${tttd_noi_dung}}`, trademarkEditedData.dai_dien_shcn_cb, trademarkEditedData.ngay_cap_bd,
                    trademarkEditedData.ngay_cap_kt, trademarkEditedData.mo_ta_nhan_hieu_cb, `{${nhom_san_pham_cb}}`,
                    `{${dich_vu_nhom_sp_sb}}`, trademarkEditedData.phan_loai_hinh_cb, submit_date
                ];
                // Nếu từ chối thì update không thì sẽ insert tức chưa tồn tại đơn thì mới insert
                let currentReport = await db.oneOrNone('SELECT * FROM "report" WHERE email = $1', [viewerEmail]); // Lấy ra report đang chọn để kiểm tra
                if (currentReport && currentReport.tinh_trang === 'tu_choi') {

                    await db.none(queryUpdateToLeader, values)
                        .catch(err => {
                            console.error(err);
                        });
                } else {
                    await db.none(queryInsertToLeader, values)
                        .catch(err => {
                            console.error(err);
                        });
                }
                await db.none(`
                    update "report"
                    set tinh_trang = 'cho'
                    where email = $1
                `, [viewerEmail])
            }

            res.render('dashboardEditor', {
                reportContent: reportHtml,
                outputData: outputData,
            });

        } catch (err) {
            console.error('Error: ', err);
            res.send('Có lỗi xảy ra, vui lòng thử lại sau.');
        }

    }
    logout(req, res) {
        req.logout(function (err) {
            if (err) { return next(err); }
            res.redirect('login');
        });
    }
}

module.exports = new UserController