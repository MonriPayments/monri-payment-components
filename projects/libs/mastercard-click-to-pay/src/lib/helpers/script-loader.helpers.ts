export const loadScript = (src: string, type?: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    if (type) script.type = type;
    script.onload = () => resolve();
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

export const loadStylesheet = (href: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.href = href;
    link.rel = 'stylesheet';
    link.onload = () => resolve();
    link.onerror = reject;
    document.head.appendChild(link);
  });
};

export const getScriptDomain = (environment: string): string =>
  environment === 'production'
    ? 'https://src.mastercard.com'
    : 'https://sandbox.src.mastercard.com';

export const loadMastercardScript = (environment: string, srcDpaId: string, locale: string): Promise<void> =>
  loadScript(
    `${getScriptDomain(environment)}/srci/integration/2/lib.js?srcDpaId=${srcDpaId}&locale=${locale}`
  );

export const loadMastercardUIStyle = (): Promise<void> =>
  loadStylesheet(
    'https://src.mastercard.com/srci/integration/components/src-ui-kit/src-ui-kit.css'
  );

export const loadMastercardUIScript = (): Promise<void> =>
  loadScript(
    'https://src.mastercard.com/srci/integration/components/src-ui-kit/src-ui-kit.esm.js',
    'module'
  );