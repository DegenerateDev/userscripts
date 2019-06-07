// ==UserScript==
// @name ThePirateBay: Sort Results by Seeds
// @namespace Violentmonkey Scripts
// @match https://*/user/dauphong/*
// @match https://*/browse/*
// @grant none
// ==/UserScript==

// nth-child needs to be 6 in single-view, 3 in double-view
let nth_child = document.querySelector('table thead tr.header').children.length === 4 ? 3 : 6

Array.from(document.querySelectorAll(`table tbody tr td:nth-child(${nth_child})`))
  .map(e => {return {seeds: parseInt(e.textContent), row: e.parentNode}})
  .sort((e1, e2) => e2.seeds - e1.seeds)
  .forEach(({row}) => row.parentNode.appendChild(row))
