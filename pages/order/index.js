const wxpay = require('../../utils/pay.js')
const WXAPI = require('apifm-wxapi')

Page({
  data: {
    statusType: ['待付款', '待收货', '待评价', '已完成'],
    hasRefund: false,
    currentType: 0,
    tabClass: ['', '', '', '', ''],
    currentOrderList: []
  },
  statusTap: function (e) {
    const curType = e.currentTarget.dataset.index
    this.data.currentType = curType
    this.setData({
      currentType: curType
    })
    let list = []
    const data = wx.getStorageSync('orderData')
    data.map((item) => {
      if (item.status === curType) {
        list.push(item)
      }
    })
    this.setData({
      currentOrderList: list
    })
  },
  cancelOrderTap: function (e) {
    const that = this
    const orderId = e.currentTarget.dataset.id
    wx.showModal({
      title: '确定要取消该订单吗？',
      content: '',
      success: function (res) {
        if (res.confirm) {
          WXAPI.orderClose(wx.getStorageSync('token'), orderId).then(function (
            res
          ) {
            if (res.code == 0) {
              that.onShow()
            }
          })
        }
      }
    })
  },
  toPayTap: function (e) {
    // 防止连续点击--开始
    if (this.data.payButtonClicked) {
      wx.showToast({
        title: '休息一下~',
        icon: 'none'
      })
      return
    }
    this.data.payButtonClicked = true
    setTimeout(() => {
      this.data.payButtonClicked = false
    }, 3000) // 可自行修改时间间隔（目前是3秒内只能点击一次支付按钮）
    // 防止连续点击--结束
    const that = this
    const orderId = e.currentTarget.dataset.id
    let money = e.currentTarget.dataset.money
    const needScore = e.currentTarget.dataset.score
    WXAPI.userAmount(wx.getStorageSync('token')).then(function (res) {
      if (res.code == 0) {
        // 增加提示框
        if (res.data.score < needScore) {
          wx.showToast({
            title: '您的积分不足，无法支付',
            icon: 'none'
          })
          return
        }
        let _msg = '订单金额: ' + money + ' 元'
        if (res.data.balance > 0) {
          _msg += ',可用余额为 ' + res.data.balance + ' 元'
          if (money - res.data.balance > 0) {
            _msg += ',仍需微信支付 ' + (money - res.data.balance) + ' 元'
          }
        }
        if (needScore > 0) {
          _msg += ',并扣除 ' + money + ' 积分'
        }
        money = money - res.data.balance
        wx.showModal({
          title: '请确认支付',
          content: _msg,
          confirmText: '确认支付',
          cancelText: '取消支付',
          success: function (res) {
            if (res.confirm) {
              that._toPayTap(orderId, money)
            } else {
              console.log('用户点击取消支付')
            }
          }
        })
      } else {
        wx.showModal({
          title: '错误',
          content: '无法获取用户资金信息',
          showCancel: false
        })
      }
    })
  },
  _toPayTap: function (orderId, money) {
    const _this = this
    if (money <= 0) {
      // 直接使用余额支付
      WXAPI.orderPay(wx.getStorageSync('token'), orderId).then(function (res) {
        _this.onShow()
      })
    } else {
      wxpay.wxpay('order', money, orderId, '/pages/order/index')
    }
  },
  onLoad: function (options) {
    if (options && options.type) {
      if (options.type == 99) {
        this.setData({
          currentType: options.type
        })
      } else {
        let list = []
        const data = wx.getStorageSync('orderData')
        data.map((item) => {
          if (item.status == options.type) {
            list.push(item)
          }
        })
        this.setData({
          currentOrderList: list,
          currentType: options.type
        })
      }
    }
    this.onShow()
  },
  onReady: function () {
    // 生命周期函数--监听页面初次渲染完成
  },
  getOrderStatistics: function () {
    var that = this
    WXAPI.orderStatistics(wx.getStorageSync('token')).then(function (res) {
      if (res.code == 0) {
        var tabClass = that.data.tabClass
        if (res.data.count_id_no_pay > 0) {
          tabClass[0] = 'red-dot'
        } else {
          tabClass[0] = ''
        }
        if (res.data.count_id_no_transfer > 0) {
          tabClass[1] = 'red-dot'
        } else {
          tabClass[1] = ''
        }
        if (res.data.count_id_no_confirm > 0) {
          tabClass[2] = 'red-dot'
        } else {
          tabClass[2] = ''
        }
        if (res.data.count_id_no_reputation > 0) {
          tabClass[3] = 'red-dot'
        } else {
          tabClass[3] = ''
        }
        if (res.data.count_id_success > 0) {
          //tabClass[4] = "red-dot"
        } else {
          //tabClass[4] = ""
        }

        that.setData({
          tabClass: tabClass
        })
      }
    })
  },
  onShow: function (type) {
    this.doneShow()
  },
  doneShow: function () {
    var that = this
    that.setData({
      orderList: wx.getStorageSync('orderData'),
      logisticsMap: wx.getStorageSync('orderData'),
      goodsMap: wx.getStorageSync('orderData')
    })
  },
  OrderTap: function (e) {
    wx.navigateTo({
      url: '/pages/admin/home/index/index'
    })
  },
  checkCurrentList() {
    let list = []
    const orderList = wx.getStorageSync('orderData')
    orderList.map((item) => {
      if (item.status === this.data.currentType) {
        list.push(item)
      }
    })
    this.setData({
      currentOrderList: list
    })
  },
  goPay: function (e) {
    const orderList = wx.getStorageSync('orderData')
    orderList.map((item) => {
      if (item.goodsId === e.currentTarget.dataset.id) {
        item.status = 1
      }
    })
    wx.setStorageSync('orderData', orderList)
    this.checkCurrentList()
  },
  receivedGoods: function (e) {
    const orderList = wx.getStorageSync('orderData')
    orderList.map((item) => {
      if (item.goodsId === e.currentTarget.dataset.id) {
        item.status = 2
      }
    })
    wx.setStorageSync('orderData', orderList)
    this.checkCurrentList()

  },
  evaluate: function (e) {
    wx.navigateTo({
      url: `/pages/evaluate/index?id=${e.currentTarget.dataset.id}`
    })
  }
})
