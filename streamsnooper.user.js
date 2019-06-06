// ==UserScript==
// @name Streamsnooper: Autoreload & Sort by Views/Time
// @namespace Violentmonkey Scripts
// @match https://streamsnooper.com/all-*
// @grant none
// @version 0.1
// ==/UserScript==
z = (function(){
  let data = {}
  data.streams = {}
  data.sortMode = 'VPT'
  
  let parseHTML = (html) => {
    let e = document.createElement('div');
    e.innerHTML = html.trim();
    return e
  }
  let parseStreamElem = (e) => {
    let split = e.querySelector('.live-stream-stats').textContent.split(' ')
    let views = parseInt(split[2], 10)
    let time_amt = parseInt(split[0], 10)
    let time_unit = split[1].replace(',','')
    let time = 0
    if (time_unit.includes('min')) time = time_amt*60
    else if (time_unit.includes('hour')) time = time_amt*60*60
    else if (time_unit.includes('day')) time = time_amt*24*60*60
    else if (time_unit.includes('week')) time = time_amt*7*24*60*60
    else time = time_amt
    let views_per_time = views/time
    let img = e.querySelector('img')
    let id = img.getAttribute('data-id')
    let url = `https://www.pscp.tv/w/${id}`
    let img_url = img.getAttribute('src')
    let desc = e.querySelector('.live-stream-description').textContent
    let user = e.querySelector('.live-stream-title > a').textContent
    return {views, time, time_unit, time_amt, views_per_time, id, url, img_url, desc, user}
  }
  let parseStreamElems = doc => [].slice.call(doc.querySelectorAll('.live-stream')).map(parseStreamElem)

  let generateStreamElemHTML = ({ url, img_url, user, desc, time_amt, time_unit, views, id }) => {
    return `
<li class="live-stream">
  <a rel="nofollow" target="_blank" href="${url}"><img src="${img_url}" alt="${user} live stream on Periscope.tv" data-id="${id}" width="200" height="135"></a>
  <div class="thumbnail_label thumbnail_label_site">PERISCOPE.TV</div>
  <div class="live-stream-details">
    <div class="live-stream-title"><a rel="nofollow" target="_blank" href="${url}">${user}</a><span class="count">&nbsp;</span></div>
    <ul class="live-stream-description"><li>${desc}</li></ul>
    <ul class="live-stream-stats"><li>${time_amt} ${time_unit}, ${views} viewers.</li></ul>
  </div>
</li>`
  }
  let generateStreamElem = (data) => {
    let elem = parseHTML(generateStreamElemHTML(data)).firstChild
    let as = [].slice.call(elem.querySelectorAll('a'))
    as.forEach(a => {
      a.onclick = (ev) => {
        window.open(data.url, '_blank', 'status=no,location=no,menubar=no,toolbar=no,width=320,height=568')
        return false
      }
    })
    return elem
  }
  
  let sortByTime = (arr) => arr.slice(0).sort((s1, s2) => s1.time-s2.time)
  let sortByViews = (arr) => arr.slice(0).sort((s1, s2) => s2.views-s1.views)
  let sortByVPT = (arr) => arr.slice(0).sort((s1, s2) => s2.views_per_time-s1.views_per_time)
  
  let render = () => {
    let sorted_streams = sortByVPT(Object.keys(data.streams).map(i => data.streams[i]))
      //.map(generateStreamElem)
    let ul = document.querySelector('.live-stream-list')
    ul.innerHTML = ''
    sorted_streams.slice(0,100).forEach(s => {
      let new_elem = generateStreamElem(s)
      if (s.elem === undefined || s.elem && s.elem.innerHTML !== new_elem.innerHTML) {
        s.elem = new_elem
        console.log('generating',s.id)
      }

      ul.appendChild(s.elem)
    })
    console.log(sorted_streams)
  }
  
  let updateAll = async() => {
    let urls = [
      'https://streamsnooper.com/all-top-250-periscope-livestreams-page-1.html',
      'https://streamsnooper.com/all-rising-250-periscope-livestreams-page-1.html',
      'https://streamsnooper.com/all-newest-250-periscope-livestreams-page-1.html',
      'https://streamsnooper.com/all-random-250-periscope-livestreams-page-1.html'
    ]
    // track updated streams in order to drop unupdated streams
    let updated_streams = []
    // ensure current view is rendered
    render()
    for (var i = 0; i < urls.length; i++) {
      let url = urls[i]
      console.log('fetching', url)
      let resp = await fetch(url)
      let body = await resp.text()
      let doc = parseHTML(body.trim())
      let stream_elems = parseStreamElems(doc)
      stream_elems.forEach(elem => {
        data.streams[elem.id] = {...data.streams[elem.id], updated: +(new Date())}
        data.streams[elem.id] = {...data.streams[elem.id], ...elem}
        updated_streams.push(elem.id)
      })
      // re-render for this url's data
      render()
    }
    // prune all old streams
    let new_streams = {}
    updated_streams.forEach(i => new_streams[i] = data.streams[i])
    data.streams = new_streams
    // re-render for prune operation
    render()
    return data.streams
  }
  let menu = document.querySelector('.dropdown-menu-wrapper')
  let refreshButton = parseHTML('<div class="dropdown-menu"><button class="dropdown-menu-button">Refresh</button></div>').firstChild
  refreshButton.querySelector('button').onclick = updateAll
  menu.appendChild(refreshButton)

  updateAll()
  return { updateAll, data, render }
})()
