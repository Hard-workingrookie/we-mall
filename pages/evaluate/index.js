// pages/feedback/index.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 被选中的图片路径 数组
    chooseImgs: [],
    // 文本域的内容
    textVal: '',
    id: ''
  },

  uploadImgs: [],
  onLoad: function (option) {
    this.setData({
      id: option.id
    })
  },
  handleChooseImg() {
    wx.chooseImage({
      count: 9,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (result) => {
        this.setData({
          chooseImgs: [...this.data.chooseImgs, ...result.tempFilePaths]
        })
      },
      fail: () => {},
      complete: () => {}
    })
  },
  handleRemoveImg(e) {
    const {index} = e.currentTarget.dataset
    let {chooseImgs} = this.data
    chooseImgs.splice(index, 1)
    this.setData({
      chooseImgs
    })
  },

  // 文本域的输入事件
  handleTextInput(e) {
    this.setData({
      textVal: e.detail.value
    })
  },
  //提交表
  handleFormSubmit() {
    const {textVal, chooseImgs} = this.data
    if (!textVal.trim()) {
      wx.showToast({
        title: '输入不合法',
        icon: 'none',
        mask: true
      })
      return
    }

    wx.showLoading({
      title: '正在上传中',
      mask: true
    })

    if (chooseImgs.length != 0) {
      this.setData({
        textVal: '',
        chooseImgs: []
      })
    } else {
      // wx.hideLoading();
    }
    wx.hideLoading()
    wx.showToast({
      title: '提交成功',
      icon: 'success',
      mask: true
    })

    let products = wx.getStorageSync('products')
    products.map((item) => {
      if (item.base_info_id == this.data.id) {
        if (!item.evaluate) {
          let list=[textVal]
          item.evaluate=list
        } else {
          item.evaluate.push(textVal)
        }
      }
    })
    console.log('=this.data.id: ', this.data.id);

    const orderList = wx.getStorageSync('orderData')
    orderList.map((item) => {
      if (item.goodsId ==this.data.id) {
        item.status = 3
      }
    })
    wx.setStorageSync('orderData', orderList)
    wx.setStorageSync('products',products)
    wx.navigateBack({
      data: 1
    })
  }
})
