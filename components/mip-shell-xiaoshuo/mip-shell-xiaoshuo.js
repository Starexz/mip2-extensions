/**
 * @file 极速服务 小说shell
 * @author liangjiaying@baidu.com (JennyL)
 * TODO:
 * 1. 可以把继承的方法自己的方法分开
 * 2. 用 JSDoc @private 来标识私有函数
 */

import './mip-shell-xiaoshuo.less'
import Catalog from './catalog' // 侧边栏目录
import Footer from './footer' // 底部控制栏
import {PageStyle, FontSize} from './setting' // 背景色调整，字体大小调整

export default class MipShellXiaoshuo extends window.MIP.builtinComponents.MipShell {
  // 继承基类 shell, 扩展小说shell
  constructor (...args) {
    super(...args)
    this.transitionContainsHeader = false
    // 处理浏览器上下滚动边界，关闭弹性
    // todo: 目前有重复调用问题
    // this._scrollBoundary()
  }

  // 基类方法：绑定页面可被外界调用的事件。
  // 如从跳转后的iframe颜色设置，通知所有iframe和根页面颜色改变
  bindAllEvents () {
    super.bindAllEvents()
    // 初始化所有内置对象
    // 创建模式切换（背景色切换）
    this.pageStyle = new PageStyle()

    // 暴露给外部html的调用方法，显示底部控制栏
    // 使用 on="tap:xiaoshuo-shell.showShellFooter"调用
    this.addEventAction('showShellFooter', function () {
      window.MIP.viewer.page.emitCustomEvent(window.parent, false, {
        name: 'showShellFooter'
      })
    })
    // 暴露给外部html的调用方法, 显示目录侧边栏
    this.addEventAction('showShellCatalog', function () {
      window.MIP.viewer.page.emitCustomEvent(window.parent, false, {
        name: 'showShellCatalog'
      })
    })
    // 功能绑定：背景色切换 使用 on="tap:xiaoshuo-shell.changeMode"调用
    this.addEventAction('changeMode', function (e, theme) {
      window.MIP.viewer.page.broadcastCustomEvent({
        name: 'changePageStyle', data: {theme: theme}
      })
    })

    // 绑定底部弹层控制条拖动事件
    this.addEventAction('showFontAdjust', e => this.fontSize.showFontBar(e))
    // 功能绑定：字体大小切换 使用 on="tap:xiaoshuo-shell.changeFont(bigger)"调用
    this.addEventAction('changeFont', (e, size) => console.log('addEventAction: changeFont'))

    // 绑定弹层点击关闭事件
    if (this.$buttonMask) {
      this.$buttonMask.onclick = this._closeEverything.bind(this)
    }

    // 承接emit事件：所有页面修改页主题 & 字号
    window.addEventListener('changePageStyle', (e, data) => {
      if (e.detail[0] && e.detail[0].theme) {
        // 修改主题
        this.pageStyle.update(e, {theme: e.detail[0].theme})
      } else if (e.detail[0] && e.detail[0].fontSize) {
        // 修改字号
        this.pageStyle.update(e, {fontSize: e.detail[0].fontSize})
      } else {
        // 初始化，从缓存中获取主题和字号apply到页面
        this.pageStyle.update(e)
      }
    })
    // 初始化页面时执行一次背景色+字号初始化
    window.MIP.viewer.page.emitCustomEvent(window, false, {
      name: 'changePageStyle'
    })
  }

  // 基类方法：绑定页面可被外界调用的事件。
  // 如从跳转后的iframe内部emitEvent, 调用根页面的shell bar弹出效果
  bindRootEvents () {
    super.bindRootEvents()
    // 承接emit事件：根页面展示底部控制栏
    window.addEventListener('showShellFooter', (e, data) => {
      this.footer.show(this)
    })
    // 承接emit事件：显示目录侧边栏
    window.addEventListener('showShellCatalog', (e, data) => {
      this.catalog.show(this)
      this.footer.hide()
    })
  }

  // 基类方法：初始化。用于除头部bar之外的元素
  renderOtherParts () {
    super.renderOtherParts()
    // 初始化所有内置对象，包括底部控制栏，侧边栏，字体调整按钮，背景颜色模式切换
    this._initAllObjects()
  }

  // 自有方法：关闭所有元素，包括弹层、目录、设置栏
  _closeEverything (e) {
    // 关闭所有可能弹出的bar
    this.toggleDOM(this.$buttonWrapper, false)
    this.footer.hide()
    this.catalog.hide()
    this.fontSize.hideFontBar()
    // 关闭黑色遮罩
    this.toggleDOM(this.$buttonMask, false)
  }

  // 自有方法：初始化所有内置对象，包括底部控制栏，侧边栏，字体调整按钮，背景颜色模式切换
  _initAllObjects () {
    let configMeta = this.currentPageMeta
    // 创建底部 bar
    this.footer = new Footer(configMeta.footer)
    // 创建目录侧边栏
    this.catalog = new Catalog(configMeta.catalog)
    // 创建字体调整事件
    this.fontSize = new FontSize(document.querySelector('.mip-shell-footer-wrapper .mip-shell-xiaoshuo-control-fontsize'))
    // 绑定 Root shell 字体bar拖动事件
    this.fontSize.bindDragEvent()
  }

  // 基类方法：页面跳转时，解绑当前页事件，防止重复绑定
  unbindHeaderEvents () {
    super.unbindHeaderEvents()
    // 在页面跳转的时候解绑之前页面的点击事件，避免事件重复绑定
    if (this.jumpHandler) {
      // XXX: window.MIP.util.event.deligate 返回了一个方法。再调用这个方法，就是解绑
      this.jumpHandler()
      this.jumpHandler = undefined
    }
  }

  // 基类方法：绑定头部弹层事件。
  bindHeaderEvents () {
    super.bindHeaderEvents()

    let event = window.MIP.util.event
    let me = this

    // 当页面出现跳转时，关闭所有的浮层
    this.jumpHandler = event.delegate(document, '[mip-link]', 'click', function (e) {
      me._closeEverything()
    })
  }

  // 基类方法: 处理头部自定义按钮点击事件，由于没有按钮，置空
  // handleShellCustomButton (buttonName) {
  // 如果后期需要增加bar按钮，增加如下配置：
  // "header": {
  //     "show": true,
  //     "title": "神武天帝",
  //     "buttonGroup": [
  //         {"name": "setting", "text": "设置"},
  //         {"name": "cancel", "text": "取消"}
  //     ]
  // }
  // }

  // 基类方法：页面跳转后shell可刷新
  // refreshShell (...args) {
  //   super.refreshShell(...args)
  // }

  // 基类方法：页面跳转后更新shell
  updateOtherParts () {
    super.updateOtherParts()
    // 重新渲染footer
    this.footer._render(this.currentPageMeta.footer)
  }

  /**
   * 滚动边界处理
   */
  _scrollBoundary () {
    let touchStartEvent
    let {rect, css} = MIP.util
    // 收集body child元素 并进行包裹
    let scrollaBoundaryTouch = document.createElement('div')
    let offsetHeight
    let bodyPaddingTop
    let body = document.body
    let touchTarget
    let stopProFun = e => e.stopPropagation()

    scrollaBoundaryTouch.setAttribute('mip-shell-scrollboundary', true);
    [].slice.call(body.children).forEach(child => {
      if (/^(SCRIPT|IFRAME|MIP-SHELL-INSERVICE|MIP-DATA)/.test(child.nodeName)) {
        return
      }
      scrollaBoundaryTouch.appendChild(child)
    })
    body.appendChild(scrollaBoundaryTouch)

    // 添加事件处理
    scrollaBoundaryTouch.addEventListener('touchstart', e => {
      touchStartEvent = e
      // 内滚 兼容处理
      touchTarget = this.getClosestScrollElement(e.target)
      if (touchTarget) {
        touchTarget.addEventListener('touchmove', stopProFun)
      }
    })

    scrollaBoundaryTouch.addEventListener('touchmove', e => {
      let touchRect = e.targetTouches[0]
      let startTouchReact = touchStartEvent.targetTouches[0]

      // 兼容模式处理
      offsetHeight = document.compatMode === 'BackCompat'
        ? document.body.clientHeight
        : document.documentElement.clientHeight

      bodyPaddingTop = bodyPaddingTop || parseInt(css(body, 'paddingTop'), 10)
      let scrollTop = body.scrollTop || rect.getScrollTop()
      let scrollHeight = rect.getElementRect(scrollaBoundaryTouch).height + bodyPaddingTop

      // 到达顶部时 && 是向下滚动操作
      // 到达底部时 && 并且 向上滚动操作
      let isprevent = (
        touchRect.pageY >= startTouchReact.pageY &&
          touchRect.clientY > startTouchReact.clientY &&
          scrollTop < 5) ||
          (
            touchRect.pageY < startTouchReact.pageY &&
            scrollTop + offsetHeight >= scrollHeight
          )
      if (isprevent) {
        e.preventDefault()
      }
      e.stopPropagation()
    })

    scrollaBoundaryTouch.addEventListener('touchend', () => {
      if (touchTarget) {
        touchTarget.removeEventListener('touchmove', stopProFun)
      }
    })
  }
}