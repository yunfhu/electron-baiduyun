const {
    BrowserWindow,
    session,
    shell
} = require('electron');
const path = require('path');
const CssInjector = require('../js/css-injector');

class MainController {
    constructor() {
        this.init()
    }

    init() {
        this.window = new BrowserWindow({
            show: false,
            width: 400,
            height: 400,
            frame: true,
            autoHideMenuBar: true,
            resizable: false,
            icon: path.join(__dirname, '../../assets/icons/512x512.png'),
            webPreferences: { webSecurity: false }
        })
       

        this.window.loadURL('https://pan.baidu.com/?lang=zh_CN')

        this.window.webContents.on('dom-ready', () => {
            this.window.webContents.insertCSS(CssInjector.login)
            this.window.webContents.insertCSS(CssInjector.main)
            this.addFontAwesomeCDN()
            this.changeTitle()
            this.addToggleContactElement()
            this.addUnreadMessageListener()
            this.loginReDraw()
            this.show()
        })

        // triggering when user try to close the play window.
        this.window.on('close', (e) => {
            if (this.window.isVisible()) {
                e.preventDefault()
                this.window.hide()
            }
        })

        this.window.webContents.on('new-window', this.openInBrowser)

        session.defaultSession.webRequest.onCompleted({urls: [
        ]},
            (details) => this.handleRequest(details)
        )
    }

    show() {
        this.window.show()
        this.window.focus()
    }

    toggle() {
        if (this.window.isFocused()) {
            this.window.hide()
        } else {
            this.show()
        }
    }

    openInBrowser(e, url) {
        e.preventDefault()
        // if the url start with a wechat redirect url, get the real url, decode and open in external browser
        let redirectUrl = url
        if (url.startsWith('https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxcheckurl?requrl=')) {
            const redirectRegexp = /https:\/\/wx\.qq\.com\/cgi-bin\/mmwebwx-bin\/webwxcheckurl\?requrl=(.*)&skey.*/g
            redirectUrl = decodeURIComponent(redirectRegexp.exec(url)[1])
        }
        shell.openExternal(redirectUrl)
    }

    handleRequest(details) {
        details.url.startsWith('https://pan.baidu.com/api/report/user')&&this.login()
        details.url.startsWith('https://pan.baidu.com/disk/cmsdata?do=piece')&&this.logout()
    }

    login() {
        this.window.hide()
        this.window.setSize(1000, 600, true)
        this.window.setResizable(true)
        this.window.show()
    }

    logout() {
        this.window.setSize(400, 400, true)
    }

    addFontAwesomeCDN() {
        this.window.webContents.executeJavaScript(`
            let faLink = document.createElement('link');
            faLink.setAttribute('rel', 'stylesheet');
            faLink.type = 'text/css';
            faLink.href = 'https://use.fontawesome.com/releases/v5.0.13/css/all.css';
            faLink.integrity = 'sha384-DNOHZ68U8hZfKXOrtjWvjxusGo9WQnrNx2sqG0tfsghAvtVlRW3tvkXWZh58N9jp';
            faLink.crossOrigin = 'anonymous';
            document.head.appendChild(faLink);
        `)
    }

    changeTitle() {
        this.window.webContents.executeJavaScript(`
            document.title = '百度网盘,让美好永远陪伴';
            new MutationObserver(mutations => {
                if (document.title !== '百度网盘,让美好永远陪伴') {
                    document.title = '百度网盘,让美好永远陪伴';
                }
            }).observe(document.querySelector('title'), {childList: true});
        `)
    }

    /*inject login div css */
    loginReDraw(){
        this.window.webContents.executeJavaScript(`
            let loginsdkv4=document.querySelector("#login-container > div.login-main > .login-sdk-v4");
            loginsdkv4.style.cssText = 'width: 100%;height: 100%;position: fixed;vertical-align: top';
            let loginmain=document.querySelector("#login-container > div.login-main");
            loginmain.style.cssText = 'width: 1100px;height: 0;top: 0';
        `)
    }

    addUnreadMessageListener() {
        this.window.webContents.executeJavaScript(`
            new MutationObserver(mutations => {
                let unread = document.querySelector('.icon.web_wechat_reddot');
                let unreadImportant = document.querySelector('.icon.web_wechat_reddot_middle');
                let unreadType = unreadImportant ? 'important' : unread ? 'minor' : 'none';
                require('electron').ipcRenderer.send('updateUnread', unreadType);
            }).observe(document.querySelector('.chat_list'), {subtree: true, childList: true});
        `)
    }

    addToggleContactElement() {
        this.window.webContents.executeJavaScript(`
            let toggleButton = document.createElement('i');
            toggleButton.className = 'toggle_contact_button fas fa-angle-double-left';
            toggleButton.onclick = () => {
                toggleButton.classList.toggle('mini');
                document.querySelector('.panel').classList.toggle('mini');
            };
            let titleBar = document.querySelector('.header');
            titleBar.appendChild(toggleButton);
        `)   
    }
}

module.exports = MainController