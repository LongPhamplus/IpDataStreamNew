const divContainer = document.querySelector('.select-page')
const pageNumBtn = document.querySelectorAll('.page-box')
let url = window.location.href
let urlParams = new URLSearchParams(window.location.search);
let numfoundDiv = document.querySelector('#numfound')
let pageBoxBtn = document.querySelectorAll('.page-box-container')
let numfound = 1
let hideBox = document.querySelectorAll('.right-box-container')

if (urlParams.get('page') != null) {
    if (urlParams.get('page') == 19 || urlParams.get('page') == 18 || urlParams.get('page') == 20) {
        pageNumBtn.forEach((btn, index) => {
            btn.innerHTML = (index + 17)
        })
    } else {
        pageNumBtn.forEach((btn, index) => {
            btn.innerHTML = (index + parseInt(urlParams.get('page')))
        })
    }
    pageNumBtn.forEach((element) => {
        if (element.innerHTML.trim() == urlParams.get('page')) {
            element.classList.add('box-item-selected')
        }
        else {
            element.classList.remove('box-item-selected')
        }
    })
}

    numfound = parseInt(numfoundDiv.innerHTML.trim())
    console.log(numfound)

pageNumBtn.forEach((element, index) => {
    if (parseInt(element.innerHTML.trim()) - 1 > numfound / 30) {
        pageBoxBtn[index].classList.add('disp-none')
        hideBox.forEach(element => {
            element.classList.add('disp-none')
        })
    }
    else {
        pageBoxBtn[index].classList.remove('disp-none')
    }
})
if (divContainer) {
    const links = divContainer.querySelectorAll('button>div')
    links.forEach(link => {
        link.addEventListener('click', () => {
            let innerHTML = ''
            if (link.innerHTML.search('left') != -1) {
                if (urlParams.get('page') == null || urlParams.get('page' == '1')) {
                    urlParams.set('page', '1')
                }
                innerHTML = (parseInt(urlParams.get('page')) - 1).toString()
                if (innerHTML == '0') innerHTML = '1'
                urlParams.set('page', innerHTML)
            } else if (link.innerHTML.search('right') != -1) {
                if (urlParams.get('page') < 20) {
                    innerHTML = (parseInt(urlParams.get('page')) + 1).toString()
                    urlParams.set('page', innerHTML)
                }
            } else if (link.innerHTML.trim() == 'Đầu') {
                urlParams.set('page', '1')
            } else if (link.innerHTML.trim() == 'Cuối') {
                urlParams.set('page', '20')
            } else {
                urlParams.set('page', link.innerHTML.trim())
            }
            window.location.href = `${window.location.origin}${window.location.pathname}?${urlParams.toString()}`
        })
    })
}