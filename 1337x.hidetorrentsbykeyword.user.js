// ==UserScript==
// @name 1337x.to: Hide Torrents By Keywords
// @namespace Violentmonkey Scripts
// @match https://1337x.to/*/
// @grant none
// ==/UserScript==

// html body main.container div.row div.col-9.page-content.home div.featured-list div.table-list-wrap table.table-list.table.table-responsive.table-striped tbody tr td.coll-1.name a
((window) => {
  const BLOCKED_KEYWORDS = ['hdrip', 'hd-rip'].map(v => v.toLowerCase())
  
  let name_elems = [...document.querySelectorAll('.table-list td.name')]
  name_elems
    .filter(e => {
      for (kwd of BLOCKED_KEYWORDS) {if (e.textContent.toLowerCase().includes(kwd)) return true}
      return false
    })
    .forEach(e => e.parentNode.remove())
})(window)
