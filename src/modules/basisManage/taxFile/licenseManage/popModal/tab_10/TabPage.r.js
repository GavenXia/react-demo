/**
 * Created by liurunbin on 2018/1/2.
 */
import React, { Component } from 'react'
import SearchTable from '../SearchTableTansform.react'
import {Button,Modal,message,Card,Icon} from 'antd'
import PopModal from './popModal'
import {request} from 'utils'
import PartTwo from './TabPage2.r'
const getSearchFields = projectId => [
    {
        label:'项目分期',
        type:'asyncSelect',
        fieldName:'stagesId',
        componentProps:{
            url:`/project/stages/${projectId}`,
            fieldTextName:"itemName",
            fieldValueName:"id"
        }
    }
]
const getColumns = context=> [
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
    },
    {
        title: ['权证名称','权证号'],
        dataIndex: ['warrantName','warrantNum'],
    }, {
        title: '权利人',
        dataIndex: 'warrantUser',
    },{
        title: ['宗地面积(m²)','建筑面积(m²)'],
        dataIndex: ['landArea','buildingArea'],
    },{
        title: ['坐落','地号','取得方式','用途'],
        dataIndex: ['position','num','acquireWay','landUse'],
    },{
        title: ['发证日期','登记时间','使用期限'],
        dataIndex: ['issuingDate','boardingTime','limitDate'],
        className:'text-center'
    },{
        title: '项目分期',
        dataIndex: 'stagesName',
    },{
        title: '清算分期',
        dataIndex: 'liquidationStage',
    },{
        title: '备注',
        dataIndex: 'remark',
    }
];

export default class TabPage extends Component{
    state={
        action:undefined,
        opid:undefined,
        visible:false,
        updateKey:Date.now(),
        selectedRowKeys:[],
        titleCertificateId:undefined
    }
    hideModal(){
        this.setState({visible:false});
    }
    update(){
        this.setState({updateKey:Date.now()})
    }
    deleteRecord(record){
        request.delete(`/card/house/ownership/delete/${record.id}`).then(({data}) => {
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
        const {projectId} = this.props;
        return(
            <div style={{padding:"0 15px"}}>
            <Card title="大产证">
            <SearchTable
                searchOption={{
                    fields:getSearchFields(projectId),
                    cardProps:{
                        title:'',
                        bordered:false,
                        extra:null,
                        bodyStyle:{padding:"0px"},
                    }
                }}
                actionOption={{
                    body:(<Button size='small' onClick={()=>{
                        this.setState({visible:true,action:'add',opid:undefined});
                    }}><Icon type="plus" />新增</Button>)
                }}
                tableOption={{
                    columns:getColumns(this),
                    url:`/card/house/ownership/list/${props.projectId}`,
                    scroll:{x:'130%'},
                    key:this.state.updateKey,
                    cardProps:{
                        bordered:false,
                        bodyStyle:{marginLeft:'-2px',padding:'10px'}
                    },
                    rowSelection:{
                        selectedRowKeys:this.state.selectedRowKeys,
                        type:'radio',
                        onChange:selectedRowKeys=>{
                            this.setState({selectedRowKeys,titleCertificateId:(selectedRowKeys&&selectedRowKeys.length>0)?selectedRowKeys[0]:undefined});
                        }
                    }
                }}
            >
            </SearchTable>
            </Card>
               <PopModal
                projectid={props.projectId}
                id={this.state.opid}
                action={this.state.action}
                visible={this.state.visible}
                hideModal={()=>{this.hideModal()}}
                update={()=>{this.update()}}
                ></PopModal>
                {this.state.titleCertificateId && <PartTwo titleCertificateId={this.state.titleCertificateId} updateKey={this.state.updateKey}/>}

            </div>
        )
    }
}
