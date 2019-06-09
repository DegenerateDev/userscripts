// ==UserScript==
// @name 1337x.to: Sort Tables by Seeds Descending
// @namespace Violentmonkey Scripts
// @match https://1337x.to/*
// @icon https://1337x.to/favicon.ico
// @grant none
// ==/UserScript==

[...document.querySelectorAll('.table-list td.seeds')]
  .sort((e1, e2) => parseInt(e2.textContent) - parseInt(e1.textContent))
  .forEach((e) => e.parentNode.parentNode.appendChild(e.parentNode))
