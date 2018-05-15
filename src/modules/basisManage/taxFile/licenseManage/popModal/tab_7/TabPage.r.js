/**
 * Created by liurunbin on 2018/1/2.
 */
import React, { Component } from 'react'
import SearchTable from '../SearchTableTansform.react'
import {Button,Modal,message,Icon} from 'antd'
import PopModal from './popModal'
import {request} from 'utils'
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
        title: '施工许可证编号 ',
        dataIndex: 'licenseKey',
    }, {
        title: ['建设单位','建设位置'],
        dataIndex: ['organization','position'],
    },{
        title: ['项目名称','项目分期'],
        dataIndex: ['projectName','stagesName'],
    },{
        title: ['建设规模(m²)','其中:地上建筑面积(m²)','其中:地下建筑面积(m²)'],
        dataIndex: ['scale','upArea','downArea']
    },{
        title: '合同价格（万元）',
        dataIndex: 'contractPrice',
    },{
        title: ['设计单位','施工单位','监理单位'],
        dataIndex: ['designOrg','buildOrg','supervisionOrg'],
    },{
        title: ['合同开工日期','合同竣工日期'],
        dataIndex: ['startDate','endDate'],
        className:'text-center'
    },{
        title:'取证日期',
        dataIndex:'evidenceDate',
        className:'text-center'
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
        updateKey:Date.now()
    }
    hideModal(){
        this.setState({visible:false});
    }
    update(){
        this.setState({updateKey:Date.now()})
    }
    deleteRecord(record){
        request.delete(`/card/project/build/delete/${record.id}`).then(({data}) => {
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
                    url:`/card/project/build/list/${props.projectId}`,
                    scroll:{x:'100%'},
                    key:this.state.updateKey,
                    cardProps:{
                        bordered:false,
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
