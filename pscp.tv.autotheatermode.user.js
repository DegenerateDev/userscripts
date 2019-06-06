// ==UserScript==
// @name Pscp.tv: Set Theater Mode Automatically
// @namespace Violentmonkey Scripts
// @match https://www.pscp.tv/w/\*
// @grant none
// @run-at document-start
// @inject-into content
// ==/UserScript==

(function() {
    'use strict';
    let waitFor = () => {
        let e = document.querySelector('.TheaterMode')
        if (e) {document.querySelector('.TheaterMode').parentNode.parentNode.parentNode.click()}
        else { setTimeout(waitFor, 2000) }
    }
    waitFor()
})();
