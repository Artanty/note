import { Injectable, InjectionToken, Renderer2, RendererFactory2 } from '@angular/core';

export const FONT_INITIALIZER_SERVICE = new InjectionToken<FontInitializerService>(
  'FontInitializerService'
);

@Injectable({
  providedIn: 'root',
})
export class FontInitializerService {
  private renderer: Renderer2;
  private webpack_public_path = __webpack_public_path__;
  private initialized = false;

  constructor(
    private rendererFactory: RendererFactory2
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  initializeFonts(): void {
    if (this.initialized) {
      return;
    }
    const baseUrl = this.webpack_public_path + 'assets/typicons/'
    const fontFaceRule = `
      @font-face {
        font-family: "typicons";
        src: url('${baseUrl}typicons.eot') format('embedded-opentype'),
             url('${baseUrl}typicons.woff2') format('woff2'),
             url('${baseUrl}typicons.woff') format('woff'),
             url('${baseUrl}typicons.ttf') format('truetype'),
             url('${baseUrl}typicons.svg') format('svg');
      }
    `;

    const styleElement = this.renderer.createElement('style');
    this.renderer.appendChild(styleElement, this.renderer.createText(fontFaceRule));
    this.renderer.appendChild(document.head, styleElement);
    this.initialized = true; 
  }
}