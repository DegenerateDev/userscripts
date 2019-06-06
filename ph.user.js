// ==UserScript==
// @name Pornhub.com: Stuff
// @namespace Violentmonkey Scripts
// @match https://www.pornhub.com/*
// @grant none
// ==/UserScript==

// todo:
// - add button to set video to "done" in queue
// - add button to set playlist to "done" in queue

// sort playlist descending
(() => {
  let viewCountToInt = (vc) => {
    let base = parseFloat(vc)
    let mult = vc.slice(-1)
    if (mult === 'K') return base * 1000
    if (mult === 'M') return base * 1000000
    return base
  }
  let addedToMinutes = (added_str) => {
    let time = parseInt(added_str, 10)
    // 9 hours ago, hours->minutes
    if (added_str.includes('hour')) return time*60
    // Yesterday
    else if (added_str.includes('Yesterday')) return 24*60
    // 3 weeks ago, weeks->days->hours->minutes
    else if (added_str.includes('week')) return time*7*24*60
    // 6 days ago, days->hours->minutes
    else if (added_str.includes('day')) return time*24*60
    // 3 months ago, month->days->hours->minutes
    else if (added_str.includes('month')) return time*30.5*24*60
    // 2 years ago, year->days->hours->minutes
    else if (added_str.includes('year')) return time*365*24*60
    else return time
  }
  let htmlToElem = (html) => {
    let template = document.createElement('template')
    template.innerHTML = html.trim()
    return template.content.firstChild
  }
  let parseVidBlock = (vidblockelem) => {
    let o = {}
    o.elem = vidblockelem
    console.log(o.elem)

    o.views = o.elem.querySelector('.views var')
    if (o.views) o.views = o.views.textContent
    if (o.views) o.views = viewCountToInt(o.views)
    
    o.rating = o.elem.querySelector('.rating-container .value')
    if (o.rating) o.rating = parseInt(o.rating.textContent, 10)

    o.title = o.elem.querySelector('.title').textContent.trim()
    o.vkey = o.elem.getAttribute('_vkey')
    o.url = o.elem.querySelector('a').getAttribute('href')
    o.duration = o.elem.querySelector('.duration').textContent
    o.thumb = o.elem.querySelector('.linkVideoThumb img') ? o.elem.querySelector('.linkVideoThumb img').getAttribute('src') : undefined
    o.preview = o.elem.querySelector('.linkVideoThumb img') ? o.elem.querySelector('.linkVideoThumb img').getAttribute('data-mediabook') : undefined
    o.added = o.elem.querySelector('var.added').textContent
    o.added_minutes = addedToMinutes(o.added)
    o.views_per_minute = o.views / o.added_minutes

    return o
  }
  let createVidBlockElem = (viddata) => {
    let el = htmlToElem(`<li class="videoblock videoBox">
    <div class="wrap">
      <div class="phimage">
        <div class="img fade videoPreviewBg fadeUp">
          <a class="linkVideoThumb img" href="${viddata.url}">
            <video loop class="" src="${viddata.preview}" width=206 height=116></video>
          </a>
          <div class="marker-overlays js-noFade">
            <var class="duration">${viddata.duration}</var>
          </div>
        </div>
      </div>
      <div class="thumbnail-info-wrapper clearfix">
        <span class="title"><a href="${viddata.url}" title="${viddata.title}">${viddata.title}</a></span>
        <div class="videoDetailsBlock">
          <span class="views"><var>${viddata.views}</var></span>
          <div class="rating-container up">
            <div class="main-sprite icon"></div>
            <div class="value">${viddata.rating}%</div>
          </div>
        </div>
      </div>
    </div>
    </li>`)
    let vid = el.querySelector('video')
    el.addEventListener('mouseover', () => vid.play())
    el.addEventListener('mouseout', () => vid.pause())
    //vid.oncanplay = vid.play
    vid.playbackRate = 1.25
    let wrap = el.querySelector('div.wrap')
    wrap.style.width = "206px"
    wrap.style.height = "178px"
    wrap.style.display = "inline-block"
    el.querySelector('.title a').addEventListener('click', (e) => { window.open(viddata.url); e.preventDefault() }, false)
    return el
  }
  
  // display added information in videoblocks
  var style = document.createElement("style");
  document.head.appendChild(style);
  style.sheet.insertRule("var.added { display: inline !important; }", 0);

  let url = window.location.toString()

  let bc = {}
  bc.channel = new BroadcastChannel('phuserscript')
  bc.myID = (new Date()).getTime()
  bc.myURL = url
  bc.sendMessage = (typ, msg) => bc.channel.postMessage({ type: typ, message: msg, srcURL: bc.myURL, srcID: bc.myID })
  bc.callbacks = []
  bc.addCallback = (cb) => bc.callbacks.push(cb)
  bc.channel.onmessage = ev => bc.callbacks.forEach(cb => cb(ev.data))

  let addVideoButtons = (vidblockelem) => {
    let parsed = parseVidBlock(vidblockelem)
    let deetselem = vidblockelem.querySelector('.videoDetailsBlock')
    let queuebutton = htmlToElem('<button>+</button>')
    queuebutton.onclick = () => bc.sendMessage('addvidqueue', {...parsed, elem: undefined})
    deetselem.appendChild(queuebutton)
  }

  bc.sendMessage('joined')

  // root page
  if (url === 'https://www.pornhub.com/userscript') {
    bc.addCallback(e => console.log(e))

    let b = document.body
    b.innerHTML = '<div></div>'
    
    // videos should store everything we know about the video
    // plus videos it recommends
    // plus the videos that recommend it
    // plus the playlists that contain it
    let videos = {}

    // playlists should store an array of videos each contains
    let playlists = {}
    
    // vid_queue should store a list of videos marked to be viewed
    let vid_queue = []
    b.appendChild(htmlToElem('<h2>VidQueue</h2>'))
    let vidlistelem = htmlToElem('<ul class="videos"></ul>')
    b.appendChild(vidlistelem)
    
    let renderVidQueue = () => {
      vidlistelem.innerHTML = ''
      vid_queue.forEach(vkey => {
        let elem = createVidBlockElem(videos[vkey])
        let but = htmlToElem('<button>-</button>')
        but.addEventListener('click', () => {
          vid_queue = vid_queue.filter(that_vkey => that_vkey !== vkey)
          renderVidQueue()
        })
        elem.querySelector('.videoDetailsBlock').appendChild(but)
        vidlistelem.appendChild(elem)
      })
    }
    
    // pl_queue should store a list of playlists marked to be viewed
    let pl_queue = []
    b.appendChild(htmlToElem('<h2>PlaylistQueue</h2>'))
    let pllistelem = htmlToElem('<ul class="videos user-playlist playlist-listingSmall"></ul>')

    bc.addCallback(e => {
      if (e.type === 'videos') {}
      else if (e.type === 'playlists') {}
      else if (e.type === 'error') {
        let el = htmlToElem('<div><b>Error:</b> ' + e.message + '</div>')
        el.style.color = 'red'
        b.appendChild(el)
      }
      else if (e.type === 'addvidqueue') {
        let data = e.message
        let vkey = data.vkey
        videos[vkey] = data
        if (!vid_queue.includes(vkey)) {
          vid_queue.push(vkey)
          renderVidQueue()
          //let el = createVidBlockElem(data)
          //vidlistelem.appendChild(el)
        }
      }
      else if (e.type === 'addplqueue') {}
      else if (e.type === 'getseenvids') {}
      else if (e.type === 'getseenpls') {}
      else {} // unknown?
    })

    // done with root page
    return
  }
  
  // kill self if we're opened in another window
  bc.addCallback(e => {
    if (e.type === 'joined') {
      if (e.srcURL === url) {
        document.body.innerHTML = 'deduplicated'
      }
    }
  })
  
  let nextButton = document.querySelector('li.page_next a')
  if (nextButton) document.addEventListener('keydown', (ev) => {if (ev.keyCode == 39) {window.location.href = nextButton.getAttribute('href')}})
  let prevButton = document.querySelector('li.page_previous a')
  if (prevButton) document.addEventListener('keydown', (ev) => {if (ev.keyCode == 37) {window.location.href = prevButton.getAttribute('href')}})
  
  // playlist page
  if (url.includes('/playlist/') && 0) {
    // sort by views descending
    let d = document
    let ul = d.querySelector('ul#videoPlaylist')
    let li = [...ul.querySelectorAll('li.videoblock')]
    videos = videos.map(parseVidBlock)
    // do sort
    videos = videos.sort((a,b) => b.views_per_minute - a.views_per_minute) // views per minute descending
    videos.forEach(o => o.elem.parentNode.appendChild(o.elem))
    videos.forEach(o => addVideoButtons(o.elem))

    // must clear elems because they cannot be sent over broadcast
    let data = li.map(l => { return {...l, elem: undefined} })
    bc.sendMessage({ type: 'videos', message: data })
  } else {
    // other page?
    bc.sendMessage('error', url + ' = unknown page?' )
    let d = document
    
    // remove annoying banner section
    let sme = d.querySelector('.sniperModeEngaged')
    if (sme) sme.parentNode.removeChild(sme)
    
    let li = [...document.querySelectorAll('.videoblock')]
    let videos = li = li.map(parseVidBlock)
    //console.log(videos)
    // do sort
    videos = videos.sort((a,b) => b.views_per_minute - a.views_per_minute) // views per minute descending
    videos.forEach(o => o.elem.parentNode.appendChild(o.elem))
    
    // customize
    //videos = videos.map(v => { return {...v, old_elem: v.elem, elem: createVidBlockElem(v)}})
    //videos.forEach(o => o.old_elem.parentNode.replaceChild(o.elem, o.old_elem))
    
    //videos.forEach(o => addVideoButtons(o.elem))
    videos.forEach(o => { if (!localStorage.getItem(o.vkey)) o.elem.style.backgroundColor = 'green' })
    //videos.forEach(o => o.elem.style.backgroundColor = 'red')
    // data must be undefined to serialize
    let data = li.map(l => { return {...l, elem: undefined} })
    data.forEach(d => localStorage.setItem(d.vkey, JSON.stringify({...(localStorage.getItem(d.vkey) ? JSON.parse(localStorage.getItem(d.vkey)) : {}), ...d})))
    bc.sendMessage('videos', data)
  }
})()


// master page is root
// other pages have buttons to click
// add playlist to queue (from a video page)
// add video to queue (from playlist or recommendations list)
// use master page as jumping off point
// clicking on master page marks it complete
// 1. iterate all videos added, repeat until exhausted
// 2. iterate all playlists added, return to 1
// allow save state

// let bc = new BroadcastChannel('aidschannel')
// bc.onmessage = (ev => console.log(ev))
// bc.postMessage('hello world')
