// ==UserScript==
// @name ThePirateBay: Sort Results by Seeds
// @namespace Violentmonkey Scripts
// @match https://*/user/dauphong/*
// @match https://*/browse/*
// @grant none
// ==/UserScript==

let table = document.querySelector('table#searchResult tbody')
let rows = table.querySelectorAll('tr')
let a_rows = Array.from(rows)
a_rows.pop() // remove pager
let table_elems = a_rows.map(row => {
  let tds = row.querySelectorAll('td')
  return {
    e: row,
    s: parseInt(tds[2].textContent,10),
    l: parseInt(tds[3].textContent,10),
    n: row.querySelector('.detName').textContent.trim()
  }
})
console.log(table_elems)
table_elems = table_elems.sort((a, b) => b.s-a.s).forEach(i => table.appendChild(i.e))
