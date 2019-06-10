// ==UserScript==
// @name ThePirateBay: Hide HD-RIP Torrents
// @namespace Violentmonkey Scripts
// @match https://thepiratebay.org/*
// @grant none
// ==/UserScript==

// html body main.container div.row div.col-9.page-content.home div.featured-list div.table-list-wrap table.table-list.table.table-responsive.table-striped tbody tr td.coll-1.name a
((window) => {
  const BLOCKED_KEYWORDS = ['hdrip', 'hd-rip', 'hdts', 'hd-ts', 'hdcam'].map(v => v.toLowerCase())
  
  let name_elems = [...document.querySelectorAll('table tbody tr td')]
  name_elems
    .filter(e => {
      for (kwd of BLOCKED_KEYWORDS) {if (e.textContent.toLowerCase().includes(kwd)) return true}
      return false
    })
    .forEach(e => e.parentNode.remove())
})(window)
