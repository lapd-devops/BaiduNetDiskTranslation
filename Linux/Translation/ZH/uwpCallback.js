/**
 * @file 账号相关操作
 * @author fox
 */

const electron = require('electron');
const {ipcRenderer, remote} = electron;
// 登录成功
function handleNotifyData(data) {
    if (data === 'OnLoginSucceed') {
        // ipcRenderer.sendToHost('success', document.cookie);
    } else {
        ipcRenderer.sendToHost('fail');
    }
}

window.external.notify = handleNotifyData;

const operateCookie = () => {
    const session = remote.session;
    const Cookie = session.defaultSession.cookies;

    const asyncGetCookie = url => {
        url = url || '';
        return new Promise(res => {
            Cookie.get({url}, (err, cookies) => {
                if (err) {
                    return res(false);
                }
                return res(cookies);
            });
        });
    };

    const asyncRemoveCookie = ({url = '', name = ''} = {}) => {
        return new Promise(res => {
            Cookie.remove(url, name, err => {
                if (err) {
                    return res(false);
                }
                return res(true);
            });
        });
    };
    return {asyncGetCookie, asyncRemoveCookie};
};

// 登陆成功后跳转页面触发
ipcRenderer.on('get-cookies', (e, message) => {
    const asyncGetCookie = operateCookie().asyncGetCookie;
    const cookies = asyncGetCookie();
    cookies.then(cookie => {
        if (!cookie || !cookie.length) {
            return ipcRenderer.sendToHost('fail');
        }
        cookie = cookie
            .filter(c =>
                /^\.baidu\.com$|^\.pan\.baidu\.com$|^\.pcs\.baidu\.com$/i.test(
                    c.domain
                )
            )
            .reduce((o, c) => {
                const k = c.name;
                const domain = c.domain;
                if (k !== 'BDUSS' && k !== 'STOKEN') {
                    return o;
                }
                // 只能取psc 或者 pan域下的stoken
                if (k === 'STOKEN') {
                    if (
                        domain !== '.pan.baidu.com'
                        && domain !== '.pcs.baidu.com'
                    ) {
                        return o;
                    }
                }
                return Object.assign(o, {[k]: {...c, url: domain}});
            }, {});
        if (cookie.BDUSS && cookie.STOKEN) {
            ipcRenderer.sendToHost('success', cookie);
        } else {
            ipcRenderer.sendToHost('fail');
        }
    });
});
