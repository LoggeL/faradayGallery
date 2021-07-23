const prefix = 'https://cdn.discordapp.com/attachments/838682121975234571'
let currentPage = 1
let initialLoad = true
let maxPages

const pagination = document.querySelector('.pagination')
const pageInput = pagination.querySelector('input')

// Loads pagination
fetch('../pageCount').then(response => response.json().then(pages => {
    maxPages = pages
    pagination.querySelector('span').innerText = maxPages
    pageInput.setAttribute('min', 1)
    pageInput.setAttribute('max', maxPages)
    pageInput.value = currentPage
}))

pageInput.onchange = e => {
    if (e.target.value > maxPages) e.target.value = maxPages
    if (e.target.value < 1) e.target.value = 1
    changePage(e.target.value)
}

pagination.firstElementChild.onclick = e => {
    if (currentPage == 1) return
    changePage(currentPage - 1)
}

pagination.lastElementChild.onclick = e => {
    if (currentPage == maxPages) return
    changePage(currentPage + 1)
}

function changePage(page) {
    pagination.lastElementChild.className = ''
    pagination.firstElementChild.className = ''
    console.log(page)
    currentPage = page
    pageInput.value = currentPage
    if (page == 1) pagination.firstElementChild.className = 'disabled'
    else if (page == maxPages) pagination.lastElementChild.className = 'disabled'
    popuplateGallery()
}

popuplateGallery()

function popuplateGallery() {
    fetch('../data?page=' + currentPage).then(response => response.json().then(pictures => {
        document.getElementById('gallery').innerHTML = ''

        const ul = document.createElement('ul')
        const loadCount = pictures.length
        let count = 0

        const progress = document.getElementById('progress-in')
        const percentage = document.getElementById('percentage')
        function doCount() {
            count++
            percentage.innerHTML = Math.round(count / loadCount * 100) + '% (' + count + '/' + loadCount + ')'
            progress.style.width = Math.round(count / loadCount * 100) + '%'
            if (count >= loadCount) {
                setTimeout(() => {
                    const preloader = document.getElementById('preloader')
                    preloader.style.opacity = 0
                    setTimeout(() => preloader.remove(), 1000)
                    initialLoad = false
                }, 1000)
            }
        }

        for (let i = 0; i < pictures.length; i++) {

            if (i >= loadCount) break

            const picture = pictures[i]
            const li = document.createElement('li')

            const a = document.createElement('a')
            const video = document.createElement('video')
            const preloadImg = document.createElement('img')
            preloadImg.className = 'preload'
            preloadImg.style.opacity = '1'
            const shadow = document.createElement('div')
            shadow.className = 'shadow'
            const text = document.createElement('div')
            text.className = 'imageInfo'
            text.innerText = picture.name.split('_').splice(1).join(' ')
            li.onclick = () => {
                const vid = li.querySelector('video')
                const playBtn = li.querySelector('.playButtonWrapper')
                if (playBtn) playBtn.remove()
                vid.style.opacity = 1
                setTimeout(() => {
                    vid.play()
                }, 1000)
            }

            const newTab = document.createElement('div')
            newTab.className = 'newTab'

            const newTabImageLink = document.createElement('a')
            newTabImageLink.href = `${prefix}/${picture.imgKey}/${picture.name}.jpg`
            newTabImageLink.target = '_blank'

            const newTabImage = document.createElement('img')
            newTabImage.src = 'show-img.svg'
            newTabImage.className = 'newTabImage'
            newTabImage.title = 'Open Image in new tab'
            newTabImage.alt = 'Open Image in new tab'

            const newTabVideoLink = document.createElement('a')
            newTabVideoLink.href = `${prefix}/${picture.vidKey}/${picture.name}.mp4`
            newTabVideoLink.target = '_blank'

            const newTabVideo = document.createElement('img')
            newTabVideo.src = 'show-vid.svg'
            newTabVideo.className = 'newTabImage'
            newTabVideo.title = 'Download Video'
            newTabVideo.alt = 'Download Video'

            newTabVideoLink.append(newTabVideo)
            newTab.append(newTabVideoLink)

            newTabImageLink.append(newTabImage)
            newTab.append(newTabImageLink)

            const playButtonWrapper = document.createElement('div')
            playButtonWrapper.className = 'playButtonWrapper'

            const playButton = document.createElement('img')
            playButton.src = 'play.svg'

            playButtonWrapper.append(playButton)
            a.append(playButtonWrapper)

            const newTabShadow = document.createElement('div')
            newTabShadow.className = 'newTabShadow'
            a.append(newTabShadow)

            video.setAttribute('src', `${prefix}/${picture.vidKey}/${picture.name}.mp4`)
            video.setAttribute('preload', 'none')
            video.setAttribute('poster', `${prefix}/${picture.imgKey}/${picture.name}.jpg`)

            preloadImg.onload = () => {
                preloadImg.style['background-image'] = `url('${prefix}/${picture.imgKey}/${picture.name}.jpg')`
                if (initialLoad) doCount()
            }

            preloadImg.onerror = () => {
                if (initialLoad) doCount()
                preloadImg.parentElement.parentElement.remove()
                return
            }
            preloadImg.src = `${prefix}/${picture.imgKey}/${picture.name}.jpg`

            a.append(newTab)
            a.append(video)
            a.append(preloadImg)
            a.append(text)
            a.append(shadow)
            li.append(a)
            ul.append(li)
        }
        document.getElementById('gallery').append(ul)
    }))
}