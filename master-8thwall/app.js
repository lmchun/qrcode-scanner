// Copyright (c) 2022 8th Wall, Inc.
//
// app.js is the main entry point for your 8th Wall app. Code here will execute after head.html
// is loaded, and before body.html is loaded.

import './index.css'

import {qrprocessPipelineModule, qrdisplayPipelineModule} from './qr'

const onxrloaded = () => {
  // Add a canvas to the document for our xr scene.
  document.body.insertAdjacentHTML('beforeend', require('./main.html'))

  const canvas = document.getElementById('camerafeed')

  XR8.addCameraPipelineModules([  // Add camera pipeline modules.
    // Existing pipeline modules.
    XR8.CameraPixelArray.pipelineModule({luminance: true, maxDimension: 640}),  // Provides pixels.
    XR8.GlTextureRenderer.pipelineModule(),  // Draws the camera feed.
    window.LandingPage.pipelineModule(),  // Detects unsupported browsers and gives hints.
    XRExtras.FullWindowCanvas.pipelineModule(),  // Modifies the canvas to fill the window.
    XRExtras.Loading.pipelineModule(),  // Manages the loading screen on startup.
    XRExtras.RuntimeError.pipelineModule(),  // Shows an error image on runtime error.
    // Custom pipeline modules.
    qrprocessPipelineModule(),  // Scans the image for QR Codes
    qrdisplayPipelineModule(),  // Displays the result of QR Code scanning.
  ])

  // Request camera permissions and run the camera.
  XR8.run({
    canvas,
    allowedDevices: XR8.XrConfig.device().MOBILE,
  })
}

XRExtras.Loading.showLoading({onxrloaded})  // Show loading screen.
