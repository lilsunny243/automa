import browser from 'webextension-polyfill';
import { messageSandbox } from '../helper';
import mustacheReplacer from './mustacheReplacer';

const isFirefox = BROWSER_TYPE === 'firefox';
const isMV2 = browser.runtime.getManifest().manifest_version === 2;

export default async function (str, data, isPopup = true) {
  if (!str || typeof str !== 'string') return '';

  const hasMustacheTag = /\{\{(.*?)\}\}/.test(str);
  if (!hasMustacheTag) {
    return {
      list: {},
      value: str,
    };
  }

  let renderedValue = {};
  const evaluateJS = str.startsWith('!!');

  if (evaluateJS && !isFirefox && (isMV2 || isPopup)) {
    const refKeysRegex =
      /(variables|table|secrets|loopData|workflow|googleSheets|globalData)@/g;
    const strToRender = str.replace(refKeysRegex, '$1.');

    renderedValue = await messageSandbox('blockExpression', {
      str: strToRender,
      data,
    });
  } else {
    let copyStr = `${str}`;
    if (evaluateJS) copyStr = copyStr.slice(2);

    renderedValue = mustacheReplacer(copyStr, data);
  }

  return renderedValue;
}
