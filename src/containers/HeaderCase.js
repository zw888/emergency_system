import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'                           // 用来连接redux中reducer中全局数据的

import Header from '../components/Header'
import {Modal, message} from 'antd'
import {updateUmoEventState} from '../actions/umo'
import {updateCommationInformation, resetCommationInformation} from '../actions/call'
import { btnlist } from '../utils/config'

import { sign } from '../api/user'
import { answerCall, findCallUser } from '../api/call'

import { getNowDate, getNowTime } from '../utils/common'

import {hangUpPhone, userLoginACD} from '../utils/umo'

const modalItemStyle = {margin: '8px 0'}

export class HeaderCase extends Component {
  static propTypes = {
  }
  constructor(props) {
    super(props)
    this.timer = null
    this.timer1 = null
    this.state = {
      // 来电弹窗
      callInModalIsShow: false,
      // 拨出
      callOutIsShow: false,
      // 转接
      callOtherIsShow: false,
      callOtherData: [],
      // 队列
      callInListIsShow: false, // 来电通知modal
    }
  }
  // 显示拨出
  callOutShowEvent = () => {
    const {callOutIsShow}  = this.state
    this.setState({
      callOutIsShow: !callOutIsShow
    })
  }
  // 显示转接
  callOtherShowEvent = () => {
    const {callOtherIsShow}  = this.state
    this.setState({
      callOtherIsShow: !callOtherIsShow
    })
  }
  // 显示队列
  callInListShowEvent = () => {
    const {callInListIsShow}  = this.state
    this.setState({
      callInListIsShow: !callInListIsShow
    })
  }
  
  componentWillReceiveProps(props) {
    if(props.umoEventState.onAgentChanged.id !== this.props.umoEventState.onAgentChanged.id) {
      if(props.umoEventState.onAgentChanged.status ==='4') {
        this.props.history.push('/')
      }
    }
    if(props.umoEventState.onCallincome.id !== this.props.umoEventState.onCallincome.id) {
      this.onCallincomeEvent(props.umoEventState.onCallincome)
    }
    if(props.umoEventState.onHookChanged.id !== this.props.umoEventState.onHookChanged.id) {
      this.onHookChangedEvent(props.umoEventState.onHookChanged)
    }
    if(props.umoEventState.onTalked.id !== this.props.umoEventState.onTalked.id) {
      this.onTalkedEvent(props.umoEventState.onTalked)
    }
    if(props.umoEventState.onRingStoped.id !== this.props.umoEventState.onRingStoped.id){
      this.onRingStopedEvent()
    } 
  }
  // callId: '',           // 通话id
  // mibile:'--',          // 号码
  // callDate: '--',       // 来电时间
  // answerDate: '--',     // 接听时间
  // hangupDate: '--',     // 挂断时间
  // callDuration: '--',   // 通话时长
  // callStatus: '--'      // 通话状态

  // 1、接听时回调
  onCallincomeEvent = (data) => {
    const {ano} = data
    // const initCommationInfomation = {
    //   callId: '',           // 通话id
    //   mibile:'--',          // 来电号码
    //   callDate: '--',       // 来电时间
    //   answerDate: '--',     // 接听时间
    //   hangupDate: '--',     // 挂断时间
    //   callDuration: '--',   // 通话时长
    //   callStatus: '--'      // 通话状态
    // }
    //  重置通话概况
    this.props.resetCommationInformation()
    const nowData = getNowDate()
    // 1、 显示电话信息
    // 2、 设置来电时间
    this.updateCommationInformation({
      callDate: nowData, mibile: ano
    })
    this.saveCallHistory()
  }
  // 2、保存通话号码与通话来电时间，获取id
  saveCallHistory = async () => {
    try {
      const {mobile, callDate} = this.props.commationInfomation
      const {data} = await findCallUser({mobile, callDate})
      if(data.code === 0) {
        const {callId} = data.content 
        this.props.updateCommationInformation({
          callId
        })
      }
    } catch (error) {
      throw new Error(error)
    }
 } 

  // 3、挂断时的回调，改变电话状态
  onRingStopedEvent = async () => {
    const {callId} = this.props.commationInfomation
    const nowDate = getNowDate()
    try {
      const {data} = await answerCall({callId, callStatus: 'CALL_FAILURE', hangupDate: nowDate})
      if(data.code === 0) {
        console.log('挂断记录成功')
      }
    } catch (error) {
      throw new Error(error)
    }
    this.props.updateCommationInformation({
      callId, hangupDate: nowDate, callStatus: 'CALL_FAILURE'
    })
  } 
 
  // 4、接听时回调
  onTalkedEvent = async () => {
    const {callId} = this.props.commationInfomation
    const nowDate = getNowDate()
    try {
      const {data} = await answerCall({callId, callStatus: 'CALL_ONLINE', answerDate: nowDate})
      if(data.code === 0) {
        console.log('接听记录成功')
      }
      } catch (error) {
        throw new Error(error)
      }
      this.props.updateCommationInformation({
        callId, answerDate: nowDate, callStatus: 'CALL_FAILURE'
      })
      // 转接的时候会执行两次
  }
  // 5、完成时挂断时回调
  onHookChangedEvent = async ({status}) => {
    if(status === '1') {
      const {callId, callStatus, answerDate} = this.props.commationInfomation
      const nowDate = getNowDate()
      const nowTime = getNowTime()
      const timer = nowTime - getNowTime(answerDate)
      const timerSecond = parseInt(timer/1000)
      if(callStatus !== 'CALL_ONLINE' ) return
      try {
        const {data} = await answerCall({callId, callStatus: 'CALL_HANGUP', hangupDate: nowDate, callDuration: timerSecond})
        if(data.code === 0) {
          console.log('接听记录成功')
        }
      } catch (error) {
        throw new Error(error)
      }
      this.props.updateCommationInformation({
        callId, hangupDate: nowDate, callStatus: 'CALL_HANGUP', callDuration: timerSecond
      })
    }
  }

  componentDidMount() {
    console.log(window.UMO._token)
    if(window.UMO._token) return
    const {userInfo} = this.props
    console.log(userInfo)
    userLoginACD(userInfo, {
      onReadyState: (status)=>{
        console.log(status)
        const {id} = this.props.umoEventState.onReadyState
        this.props.updateUmoEventState({
          onReadyState: {
            id: id+1, 
            status: status
          }
        })
      },
      onCallincome: (ano, bno ,uud) => {
        const {id} = this.props.umoEventState.onCallincome
        this.props.updateUmoEventState({
          onCallincome: {
            id: id+1, 
            ano,
            bno,
            uud
          }
        })
      }, 
      onTalked: (ano, bno ,uud) => {
        const {id} = this.props.umoEventState.onTalked
        this.props.updateUmoEventState({
          onTalked: {
            id: id+1, 
            ano,
            bno,
            uud
          }
        })
      },
      onRingStoped: () => {
        const {id} = this.props.umoEventState.onRingStoped
        this.props.updateUmoEventState({
          onRingStoped: {
            id: id+1
          }
        })
      },
      onHookChanged: (status) => {
        const {id} = this.props.umoEventState.onHookChanged
        console.log(2222222, status)
        this.props.updateUmoEventState({
          onHookChanged: {
            id: id+1,
            status
          }
        })
      },
      onAgentChanged: (status) => {
        const {id} = this.props.umoEventState.onAgentChanged
        this.props.updateUmoEventState({
          onAgentChanged: {
            id: id+1,
            status
          }
        })
      },
      onAsyncFinished: (atype, taskid, ret, desc) => {
        const {id} = this.props.umoEventState.onAsyncFinished
        this.props.updateUmoEventState({
          onAsyncFinished: {
            id: id+1,
            atype,
            taskid,
            ret,
            desc
          }
        })
      },
      onAllBusy: () => {
        const {id} = this.props.umoEventState.onAllBusy
        this.props.updateUmoEventState({
          onAllBusy: {
            id: id+1
          }
        })
      },
      onQuelen: () => {
        const {id} = this.props.umoEventState.onQuelen
        this.props.updateUmoEventState({
          onQuelen: {
            id: id+1
          }
        })
      },
      onSmsincome: (dtime, from, content, slot) => {
        const {id} = this.props.umoEventState.onSmsincome
        this.props.updateUmoEventState({
          onSmsincome: {
            id: id+1,
            dtime,
            from,
            content,
            slot
          }
        })
      }
    }, () => {
      this.setState({
        loading: false
      })
      sessionStorage.setItem('isLogin', true)
      this.props.history.push('/')
    }, (msg) => {
      this.setState({
        loading: false
      })
      message.error( msg || '你输入的账号或域名不正确，请重试...', 5)
    })
  }
  // 登出
  logOutEvent = () => {
    Modal.confirm({
      title: '退出',
      content: '你确定要退出此系统么？',
      okText: '确认',
      cancelText: '取消',
      onOk:()=>{
        window.UMO.exit()
        sessionStorage.clear()
        this.props.history.push('login')
      }
    });
  }
  // 签到
  signEvent = () => {
    const nowData = getNowDate()
    const {userInfo} = this.props
    Modal.confirm({
      title: '签到',
      content:(
        <div>
          <div style={modalItemStyle}>工号： <strong>{userInfo.extNumber||userInfo.userName}</strong></div>
          <div style={modalItemStyle}>姓名： <strong>{userInfo.userName}</strong></div>
          <div style={modalItemStyle}>职位： <strong>{userInfo.userPost}</strong></div>
          <div style={modalItemStyle}>时间： <strong>{nowData}</strong></div>
        </div>
      ),
      okText: '确认',
      cancelText: '取消',
      onOk:()=>{
        sign({userId: userInfo.userName}).then(
          res => {
            const {data} = res
            if(data.code === 0) {
              message.success(data.message)
            } else {
              message.error(data.message)
            }
          }
        ).catch(
          (error) => {
            message.error('接口故障，请重试...')
            throw new Error(error)
          }
        )
        this.props.history.push('/attendance')
      }
    });
  }

  // 挂断
  hangUpEvent = () => {
    Modal.confirm({
      title: '挂断',
      content: '确定要挂断么？',
      okText: '确认',
      cancelText: '取消',
      onOk:()=>{
        hangUpPhone(()=>{
          message.success('操作成功')
        })
      }
    });
  }
  // 拨出
  callOutEvent = () => {
    this.callOutShowEvent()
  }
  // 转接
  callOtherEvent = () => {
    this.callOtherShowEvent()
    // 完成快速转移功能。在通话过程中，将已经连接的呼叫转移到新的目标号码，自己挂机。
    console.log('转接')
    //  呼叫ID,或-1表示当前呼叫, 主叫显示, 目标号码, 用户数据 ,callback
  }
  // 队列
  callQueueEvent = () => {
    // acd 指定的队列号， 为空返回所有 (acd, cb)
   this.callInListShowEvent()
  }
  goToRouter = () => {
    this.props.history.push('/emergency_telegram')
  }
  render() {
    const callinInfo = {
      trainPhone: '18755489161',
      trainDirverName: '左旺',
      trainDirverNames: '张三，老四',
      trainByGroup: '江苏机车三组',
      trainNum: 'A8878fdfdfd',
      trainPosition: '江苏苏州园林',
      trainBreakRuleInfo: '底盘损坏底盘损坏底盘损坏坏底盘损坏底盘损坏底盘损坏'
    }
    const {
      callInModalIsShow,
      callOtherData, callOtherIsShow,
      callOutIsShow, callOutData,
      callInListIsShow,
    } = this.state
    return (
      <Header 
       event = {
        {
          // 注销
          logOutEvent: this.logOutEvent,
          // 签到
          signEvent: this.signEvent,
          // 接听按钮
          callInEvent: this.callInEvent,
          // 挂断按钮
          hangUpEvent: this.hangUpEvent,
          // 听出按钮
          callOutEvent: this.callOutEvent,
          // 保持按钮
          callKeepEvent: this.callKeepEvent,
          // 转接按钮
          callOtherEvent: this.callOtherEvent,
          // 队列按钮
          callQueueEvent: this.callQueueEvent,
          // 显示呼出modal
          callOutShowEvent: this.callOutShowEvent,
          // 显示队列modal
          callInListShowEvent: this.callInListShowEvent,
          // 显示转接modal
          callOtherShowEvent: this.callOtherShowEvent,
          // 部门选择
          handleSelectChange: this.handleSelectChange,
          // 路由跳转
          goToRouter: this.goToRouter, 
        }
       } 
       data = { {
         // 来电信息 来电显示  
         callInModalIsShow, callinInfo,
         // 头部菜单列表
         btnlist, 
         modalItemStyle, 
        //  拨出
         callOutIsShow, callOutData,
        //  转接
         callOtherIsShow, callOtherData,
        //  队列
         callInListIsShow
        } } 
       ></Header>  
    )
  }
}

const mapStateToProps = (state) => ({                  // owProps 是这个容器组件接收的props值，因为在处理时可能要用到他
  umoEventState: state.umoEvent,
  userInfo: state.user,
  commationInfomation: state.commation
})
const mapDispatchToProps = (dispatch) => ({            // 引用全局actions中定义方法
  updateUmoEventState: (umoEventState)=>dispatch(updateUmoEventState(umoEventState)),
  updateCommationInformation: (commationInfo) => dispatch(updateCommationInformation(commationInfo)),
  resetCommationInformation: ()=>dispatch(resetCommationInformation())
})


export default withRouter(connect(mapStateToProps, mapDispatchToProps)(HeaderCase))