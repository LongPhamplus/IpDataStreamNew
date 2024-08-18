var spToAdvBtn = document.querySelector('.advsearch-btn')
var spSearchBox = document.querySelector('.sp-search-container')
var advSearchBox = document.querySelector('.adv-search-container')
var openAdvandBtn = document.querySelector('.adv-btn')
var smallAdvBox = document.querySelector('.small-advsearch-container')
var searchContainer = document.querySelector('.search-container')
var searchResultContainer = document.querySelector('.search-result-container')
var closeSmallBtn = document.querySelector('.small-close-btn')
var reportBtn = document.querySelector('.report-close-btn')
var reportContainer = document.querySelector('.viewer-report-container')
var openReportBtn = document.querySelector('.report-btn')
var previewBox = document.querySelector('.preview-box')
var openUserListBtn = document.querySelector('.list-open-btn')
var closeUserListBtn = document.querySelector('.list-close-btn')
var adminUserList = document.querySelector('.user-list-container')
var reportList = document.querySelectorAll('.expan-report-container')
var expandReportBtns = document.querySelectorAll('.detail-btn')
var closeReportBtns = document.querySelectorAll('.close-expand-btn')



console.log(reportList, expandReportBtns)
if (openAdvandBtn) {
    openAdvandBtn.addEventListener('click', () => {
        smallAdvBox.classList.remove('disp-none')
    })
}
console.log(openReportBtn)
if (openReportBtn) {
    openReportBtn.addEventListener('click', () => {
        reportContainer.classList.remove('disp-none')
    })
}
window.onclick = (e) => {
    if (e.target == closeSmallBtn) {
        smallAdvBox.classList.add('disp-none')
    }
    if (e.target == reportBtn) {
        reportContainer.classList.add('disp-none')
    }
}
if(spToAdvBtn) {
    spToAdvBtn.addEventListener('click', () => {
        spSearchBox.classList.add('disp-none')
        advSearchBox.classList.remove('disp-none')
    })
}
var previewDoc = document.querySelectorAll('.no-right-click')
document.querySelectorAll('.no-right-click').forEach(img => {
    img.addEventListener('contextmenu', event => {
        event.preventDefault();
    });
});

var previewBtnOpen = document.querySelector('.gg-push-chevron-left')
var previewBtnClose = document.querySelector('.gg-push-chevron-right')

if (openUserListBtn) {
    openUserListBtn.addEventListener('click', () => {
        adminUserList.classList.remove('disp-none')
        openUserListBtn.classList.add('disp-none')
        closeUserListBtn.classList.remove('disp-none')
    })
}
if(closeUserListBtn) {
    closeUserListBtn.addEventListener('click', () => {
        adminUserList.classList.add('disp-none')
        openUserListBtn.classList.remove('disp-none')
        closeUserListBtn.classList.add('disp-none')
    })
}
if (previewBtnOpen) {
    previewBtnOpen.addEventListener('click', () => {
        previewBox.classList.remove('disp-none')
        previewBtnOpen.classList.add('disp-none')
    })
}
if (previewBtnClose) {
    previewBtnClose.addEventListener('click', () => {
        previewBox.classList.add('disp-none')
        previewBtnOpen.classList.remove('disp-none')
    })
}

if (reportList) {
    expandReportBtns.forEach( (item, index) => {
        item.addEventListener('click', () => {
            console.log(reportList[index])
            reportList[index].classList.remove('disp-none')
        })
    })
    closeReportBtns.forEach( (item, index) => {
        item.addEventListener('click', () => {
            console.log(reportList[index])
            reportList[index].classList.add('disp-none')
        })
    })
}