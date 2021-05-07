// pages/pay/index.js
import regeneratorRuntime from '../../lib/runtime/runtime'
import {request, http} from '../../request/index.js'
const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
Page({
  /**
   * 页面的初始数据
   */
  data: {
    address: {},
    curAddressData: {},
    cart: [],
    totalPrice: 0,
    totalNum: 0,
    isNeedLogistics: 0
    // wxlogin: true,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let cart = wx.getStorageSync('cart') || []

    let single = wx.getStorageSync('single') || []

    cart = cart.filter((v) => v.checked)

    // this.setData({ address });
    this.setData({
      isNeedLogistics: 1
    })

    let totalPrice = 0
    let totalNum = 0
    if (single.length > 0) {
      this.setData({
        cart: single,
        totalNum: 1,
        totalPrice: single[0].basicInfo.minPrice
      })
    } else {
      cart.forEach((v) => {
        cart, (totalPrice += v.num * v.basicInfo.minPrice)
        totalNum += v.num
      })
      this.setData({
        cart,
        totalPrice,
        totalNum
      })
    }
    // this.initShippingAddress();
  },

  onShow() {
    this.initShippingAddress()
  },

  async handleOrderPay() {
    // // 1 判断缓存中有没有token
    // const token = wx.getStorageSync("token");
    // // 2 判断
    // if (!token) {
    //   AUTH.login();
    //   return;
    // }
    const that = this
    const order_price = this.data.totalPrice
    const curAddressData = wx.getStorageSync('addressData')
    const cart = this.data.cart
    const orderData = wx.getStorageSync('orderData')
    if (!curAddressData.length) {
      wx.showModal({
        title: '请添加收货地址',
        success(res){
          wx.navigateTo({
            url: '/pages/select-address/index'
          })
        }
      })
     
    } else {
      wx.showModal({
        title: '支付',
        success(res) {
          if (res.confirm) {
            cart.forEach((v) => {
              console.log('v: ', v.num)
              orderData.push({
                goodsId: v.basicInfo.id,
                number: v.num || 1,
                propertyChildIds: '',
                logisticsType: 0,
                detail: v,
                status: 2
              })
            })
            wx.setStorageSync('orderData', orderData)
            setTimeout(() => {
              that.setData({
                cart: [],
                totalPrice: 0,
                totalNum: 0
              })
              wx.setStorageSync('cart', [])
              wx.navigateTo({
                url: '/pages/order/index?type=2'
              })
            }, 2000)
          } else if (res.cancel) {
            cart.forEach((v) =>
              orderData.push({
                goodsId: v.basicInfo.id,
                number: v.num || 1,
                propertyChildIds: '',
                logisticsType: 0,
                detail: v,
                status: 0
              })
            )
            wx.setStorageSync('orderData', orderData)
            setTimeout(() => {
              that.setData({
                cart: [],
                totalPrice: 0,
                totalNum: 0
              })
              wx.setStorageSync('cart', [])
              wx.navigateTo({
                url: '/pages/order/index?type=0'
              })
            }, 2000)
          }
        }
      })
    }

    wx.hideLoading()

    // let postData = {
    //   token: token,
    //   goodsJsonStr: JSON.stringify(goods),
    //   address: consignee_addr.address,
    //   linkMan: consignee_addr.linkMan,
    //   mobile: consignee_addr.mobile,
    //   provinceId: consignee_addr.provinceId,
    //   cityId: consignee_addr.cityId,
    //   code: consignee_addr.code,
    // };
    // await this.CreateOrder(postData);
  },

  async CreateOrder(params) {
    await WXAPI.orderCreate(params).then(function (res) {
      if (res.code != 0) {
        wx.showModal({
          title: '错误',
          content: res.msg,
          showCancel: false
        })
        return
      }
    })
    wx.removeStorageSync('single')
    this.clearPayProduct()
  },

  clearPayProduct() {
    let cartTotal = wx.getStorageSync('cart') || []

    let newCart = cartTotal.filter((val) => val.checked === false)

    wx.setStorageSync('cart', newCart)
  },
  //

  async initShippingAddress() {
    // const res = await WXAPI.defaultAddress(wx.getStorageSync("token"))
    // if (res.code == 0) {

    // } else {
    //   this.setData({
    //     curAddressData: null
    //   });
    // }
    this.setData({
      curAddressData: wx.getStorageSync('addressData')
    })
  },

  addAddress: function () {
    wx.navigateTo({
      url: '/pages/address-add/index'
    })
  },
  selectAddress: function () {
    wx.navigateTo({
      url: '/pages/select-address/index'
    })
  },
  onUnload() {
    wx.removeStorageSync('single')
  }
})
