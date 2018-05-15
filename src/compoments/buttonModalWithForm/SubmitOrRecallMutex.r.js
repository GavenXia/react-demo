
import React,{Component} from 'react'
import {message,Button,Icon,Modal} from 'antd'
import PropTypes from 'prop-types'
import {request} from 'utils'

export default class SubmitOrRecallMutex extends Component {
  static propTypes={
      paramsType:PropTypes.string,
      restoreStr:PropTypes.string,
      buttonSize:PropTypes.string,
      toggleSearchTableLoading:PropTypes.func,
      refreshTable:PropTypes.func,
      buttonOptions:PropTypes.array,
      modalOptions:PropTypes.shape({
          title:PropTypes.string
      })
  }
  static defaultProps={
      paramsType:"object",
      restoreStr:"revoke",
      buttonSize:"small",
      modalOptions:{
          title:'友情提醒'
      },
      buttonOptions:[
        {
          text:"提交",
          icon:"check",
          handleType:"submit",
          style:{marginRight:"5px"},
          disabled:true
        },{
          text:"撤回提交",
          icon:"rollback",
          handleType:"restore",
          style:{},
          disabled:true
        }
      ]
  }
    handleClickActions = action =>{
        let actionText,
            actionUrl=this.props.url;
        switch (action){
            case 'submit':
                actionText='提交';
                actionUrl=`${actionUrl}/submit`;

                break;
            case 'restore':
                actionText='撤回';
                actionUrl=`${actionUrl}/${this.props.restoreStr}`;
                break;
            default:
                break;
        }
        this.handleTip(actionUrl,actionText,action)
    }

    handleRequest=(actionUrl,actionText)=>{
      const {mainId,receiveMonth} = this.props.searchFieldsValues;
      let url,params;
      if(this.props.paramsType==="string"){
        url=`${actionUrl}/${mainId}/${receiveMonth}`
        params={}
      }else{
        url=`${actionUrl}`;
        params=this.props.searchFieldsValues
      }

      this.props.toggleSearchTableLoading&&this.props.toggleSearchTableLoading(true)

      request.post(url,params)
          .then(({data})=>{
              this.props.toggleSearchTableLoading&&this.props.toggleSearchTableLoading(false)
              if(data.code===200){
                  message.success(`${actionText}成功！`);
                  this.props.refreshTable();
              }else{
                  message.error(`${actionText}失败:${data.msg}`)
              }
          }).catch(err=>{
          this.props.toggleSearchTableLoading&&this.props.toggleSearchTableLoading(false)
      })
    }

    handleTip=(actionUrl,actionText,type)=>{
        const modalRef = Modal.confirm({
            title: this.props.modalOptions.title,
            content:type==="submit"?'是否确定提交？':'是否确定撤销提交？',
            okText: '确定',
            okType: 'danger',
            cancelText: '取消',
            onOk:()=>{
              this.handleRequest(actionUrl,actionText)
            },
            onCancel() {
                modalRef.destroy()
            },
        });
    }

    render(){
      const {hasParam,buttonSize,dataStatus,buttonOptions}=this.props;
      const disabled0 =!(hasParam && (parseInt(dataStatus,0) === 1));
      const disabled1 =!(hasParam && (parseInt(dataStatus,0) === 2))

      return(
        <div style={{display:"inline-block"}}>
        {
           buttonOptions.map((item,index)=>(
            <Button
              key={index}
              size={buttonSize}
              style={item.style}
              disabled={index===0?disabled0:disabled1}
               onClick={()=>{this.handleClickActions(item.handleType)}}>
                <Icon type={item.icon} />
                  {item.text}
            </Button>
          ))
        }
        </div>
      )
    }
}
