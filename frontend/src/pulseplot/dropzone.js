/**
    @file DropZone JS.

    @author Christian W. Zuckschwerdt <zany@triq.net>
    @copyright Christian W. Zuckschwerdt, 2019
    @license
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.
*/

/* eslint no-console: "off" */

import { selector } from './utils.js'

export class DropZone {
  constructor (elementOrSelector, fileLoader) {
    elementOrSelector = elementOrSelector || '#dropZone'
    elementOrSelector = selector(elementOrSelector)

    // https://css-tricks.com/drag-and-drop-file-uploading/
    this.dropZone = elementOrSelector
    this.fileLoader = fileLoader
    this.inputEls = []
    this.dragEnteredEls = []

    window.addEventListener('dragenter', this)
    window.addEventListener('dragleave', this)
    window.addEventListener('dropleave', this)

    const events = ['dragenter', 'dragover', 'dragleave', 'drop']
    events.forEach(evt => this.dropZone.addEventListener(evt, this, false))
  }

  addInput (elementOrSelector) {
    elementOrSelector = elementOrSelector || '#inputfile'
    elementOrSelector = selector(elementOrSelector)

    elementOrSelector.addEventListener('change', this, false)
    this.inputEls.push(elementOrSelector)
  }

  destroy () {
    window.removeEventListener('dragenter', this, false)
    window.removeEventListener('dragleave', this, false)
    window.removeEventListener('dropleave', this, false)

    const events = ['dragenter', 'dragover', 'dragleave', 'drop']
    events.forEach(evt => this.dropZone.removeEventListener(evt, this, false))

    for (const el of this.inputEls) {
      el.removeEventListener('change', this, false)
    }
  }

  allowDrag (e) {
    // ...Test that the item being dragged is a valid one
    e.dataTransfer.dropEffect = 'copy'
    e.preventDefault()
  }

  handleDrop (e) {
    e.preventDefault()
    this.handleFileSelect(e)
  }

  // https://www.html5rocks.com/en/tutorials/file/dndfiles/
  handleFileSelect (evt) {
    evt.stopPropagation()
    evt.preventDefault()

    // const files = evt.dataTransfer.files // FileList object.
    // const files = evt.target.files // FileList object
    const files = ('dataTransfer' in evt) ? evt.dataTransfer.files : evt.target.files

    // files is a FileList of File objects. List some properties.
    for (let i = 0, file; (file = files[i]); i++) {
      // output some info right away?

      // Blob.arrayBuffer() promise isn't generally supported
      // use older FileReader.readAsArrayBuffer()
      const reader = new FileReader()

      // Closure to capture the file information.
      reader.onload = (e) => {
        // Process data
        file.fileBuffer = e.target.result
        // console.log(file.name)

        this.fileLoader(file)
      }

      // Read in the image file as a data URL.
      reader.readAsArrayBuffer(file)
    }
  }

  // events

  handleEvent (e) {
    const handler = e.type
    if (typeof this[handler] === 'function') {
      e.preventDefault()
      return this[handler](e)
    }
  }

  dragenter (e) {
    this.dragEnteredEls.push(e.target)

    document.documentElement.classList.add('dragdrop')
    this.dropZone.classList.add('active')
  }

  dragover (e) {
    this.dropZone.classList.add('hover')
    this.allowDrag(e)
  }

  dragleave (e) {
    const index = this.dragEnteredEls.indexOf(e.target)
    if (index > -1) {
      this.dragEnteredEls.splice(index, 1)
    }
    if (this.dragEnteredEls.indexOf(this.dropZone) < 0) {
      this.dropZone.classList.remove('hover')
    }
    if (this.dragEnteredEls.length === 0) {
      document.documentElement.classList.remove('dragdrop')
      this.dropZone.classList.remove('active')
    }
  }

  dropleave () {
    this.dragEnteredEls.splice(0)
    this.dropZone.classList.remove('hover')
    this.dropZone.classList.remove('active')
    document.documentElement.classList.remove('dragdrop')
  }

  drop (e) {
    const event = new Event('dropleave')
    window.dispatchEvent(event)

    this.handleDrop(e)
  }

  change (e) {
    this.handleFileSelect(e)
  }
}
