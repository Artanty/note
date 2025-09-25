import { Injectable } from "@angular/core";

export const ElementsMap = {
  SELECT__SELECT_ONE: 'gui-select',
  INPUT__RADIO: 'gui-toggle',
  INPUT__TEXT: 'gui-input',
  INPUT__PASSWORD: 'gui-input',
  INPUT__COLOR: 'gui-input-color',
  BUTTON__SUBMIT: 'gui-button',
  BUTTON__BUTTON: 'gui-button',
  DIV__USER_AVATAR: 'au-user-avatar',
}
@Injectable({
  providedIn: 'root',
})
export class GuiService {
  
  public async getCustomElement(elementName: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      
      try {
        if (ElementsMap[elementName as keyof typeof ElementsMap]) {
          const customElementName = ElementsMap[elementName as keyof typeof ElementsMap]
          
          const remoteName = getRemoteNameFromCustomElementName(customElementName)
          if (!isRemoteLoaded(remoteName)) throw new Error('remote ' + remoteName + ' is not loaded');

          const isRegistered = customElements.get(customElementName)
          if (!isRegistered) throw new Error(`${customElementName} is not registered`);

          resolve(customElementName)
        } else {
          throw new Error(`unknown element: ${elementName}`);
        }
      } catch (e) {
        reject(e)
      }
    })
  }
}


export const isRemoteLoaded = (remoteName: string) => {
  // console.log(window)
  const container = (window as any)[remoteName];
  return !!container;
}

export const getRemoteNameFromCustomElementName = (customElementName: string): string => {
  return customElementName.split('-')[0]
}