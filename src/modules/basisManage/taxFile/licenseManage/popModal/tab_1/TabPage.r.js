/**
 * Created by liurunbin on 2018/1/2.
 */
import React, { Component } from 'react'
import {Button,Modal,message,Icon} from 'antd'
import SearchTable from '../SearchTableTansform.react'
import PopModal from './popModal'
import {request,fMoney} from 'utils'
const getColumns = context=>[
    {
        title:'操作',
        render(text, record, index){
            return(
                <span>
                <a style={{margin:"0 5px"}} onClick={()=>{
                    context.setState({visible:true,action:'modify',opid:record.id});
                }}>编辑</a>
                <a style={{margin:"0 5px"}} onClick={()=>{
                    context.setState({visible:true,action:'look',opid:record.id});
                }}>查看</a>
                <span style={{
                    color:'#f5222d',
                    cursor:'pointer'
                }} onClick={()=>{
                    const modalRef = Modal.confirm({
                        title: '友情提醒',
                        content: '该删除后将不可恢复，是否删除？',
                        okText: '确定',
                        okType: 'danger',
                        cancelText: '取消',
                        onOk:()=>{
                            context.deleteRecord(record)
                            modalRef && modalRef.destroy();
                        },
                        onCancel() {
                            modalRef.destroy()
                        },
                    });
                }}>
                    删除
                </span>
                </span>
            );
        },
        fixed:'left',
        width:'100px',
        dataIndex:'action'
    },{
        title: ['合同编号','宗地编号'],
        dataIndex: ['contractNum','parcelNum'],
    }, {
        title: ['出让人','受让人'],
        dataIndex: ['transferor','assignee'],
    },{
        title: ['项目类型','宗地位置'],
        dataIndex: ['projectType','position'],
    },{
        title: ['建筑面积','土地面积'],
        dataIndex: ['coveredArea','landArea'],
    },{
        title: ['土地年限','容积率'],
        dataIndex: ['landAgeLimit','plotRatio'],
    },{
        title: '土地价款',
        dataIndex: 'landPrice',
        render:text=>fMoney(text),
        className:'table-money'
    },{
        title: '取得方式',
        dataIndex: 'acquireWay',
    },{
        title: '合同签订日期',
        className:'text-center',
        dataIndex: 'signingDate',
    }
];

export default class TabPage extends Component{
    state={
        action:undefined,
        opid:undefined,
        visible:false,
        updateKey:Date.now()
    }
    hideModal(){
        this.setState({visible:false});
    }
    update(){
        this.setState({updateKey:Date.now()})
    }
    deleteRecord(record){
        request.post(`/contract/land/delete/${record.id}`).then(({data}) => {
            if (data.code === 200) {
                message.success('删除成功', 4);
                this.setState({updateKey:Date.now()});
            } else {
                message.error(data.msg, 4);
            }
        })
        .catch(err => {
            message.error(err.message);
            this.setState({loading:false});
            this.hideModal();
        })
    }
    componentWillReceiveProps(props){
        if(props.updateKey !== this.props.updateKey){
            this.setState({updateKey:props.updateKey});
        }
    }
    render(){
        const props = this.props;
        return(
            <div style={{padding:"0 15px"}}>
            <SearchTable
                actionOption={{
                    body:(<Button size='small' onClick={()=>{
                        this.setState({visible:true,action:'add',opid:undefined});
                    }}><Icon type="plus" />新增</Button>)
                }}
                searchOption={undefined}
                tableOption={{
                    columns:getColumns(this),
                    url:`/contract/land/list/${props.projectId}`,
                    scroll:{x:'100%'},
                    key:this.state.updateKey,
                    cardProps:{
                        bordered:false
                    }
                }}
            >
            </SearchTable>
            <PopModal
                projectid={props.projectId}
                id={this.state.opid}
                action={this.state.action}
                visible={this.state.visible}
                hideModal={()=>{this.hideModal()}}
                update={()=>{this.update()}}
                ></PopModal>
            </div>
        )
    }
}
