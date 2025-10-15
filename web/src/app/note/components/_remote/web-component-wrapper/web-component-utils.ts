export async function waitForWebComponent(tagName: string, timeout = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (customElements.get(tagName)) {
      resolve();
      return;
    }

    const interval = setInterval(() => {
      if (customElements.get(tagName)) {
        clearInterval(interval);
        resolve();
      }
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      reject(new Error(`Web component ${tagName} not found`));
    }, timeout);
  });
}