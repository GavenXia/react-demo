/**
 * Created by liurunbin on 2018/1/11.
 *@Last Modified by: xiaminghua
 * @Last Modified time: 2018-04-28
 *
 */
import React, { Component } from 'react'
import {fMoney,request,getUrlParam} from 'utils'
import {SearchTable,TableTotal} from 'compoments'
import {Button,Icon,message,Modal} from 'antd'
import ManualMatchRoomModal from './addDataModal'
import { withRouter } from 'react-router'
import moment from 'moment';
const transformDataStatus = status =>{
    status = parseInt(status,0)
    if(status===1){
        return '暂存';
    }
    if(status===2){
        return '提交'
    }
    return status
}
const formItemStyle = {
    labelCol:{
        sm:{
            span:10,
        },
        xl:{
            span:8
        }
    },
    wrapperCol:{
        sm:{
            span:14
        },
        xl:{
            span:16
        }
    }
}
const searchFields=(disabled)=> {
    return [
        {
            label: '纳税主体',
            type: 'taxMain',
            fieldName: 'mainId',
            span:6,
            componentProps:{
                disabled,
            },
            formItemStyle,
            fieldDecoratorOptions:{
                initialValue: (disabled && getUrlParam('mainId')) || undefined,
                rules:[
                    {
                        required:true,
                        message:'请选择纳税主体'
                    }
                ]
            },
        },
        {
            label: '开票日期',
            type: 'monthPicker',
            span:6,
            fieldName: 'billingDate',
            componentProps:{
                disabled,
            },
            formItemStyle,
            fieldDecoratorOptions:{
                initialValue: (disabled && moment(getUrlParam('authMonth'), 'YYYY-MM')) || undefined,
                rules:[
                    {
                        required:true,
                        message:'请选择开票月份'
                    }
                ]
            }
        }
    ]
}
const advancedFields =[
  {
      label: '货物名称',
      type: 'input',
      span:6,
      fieldName: 'commodityName',
      formItemStyle,
      fieldDecoratorOptions: {}
  },
  {
      label: '购货单位名称',
      type: 'input',
      span:6,
      fieldName: 'purchaseName',
      formItemStyle,
      fieldDecoratorOptions: {}
  },
  {
      label: '发票号码',
      type: 'input',
      span:6,
      fieldName: 'invoiceNum',
      formItemStyle,
      fieldDecoratorOptions: {}
  },
  {
      label: '税率',
      type: 'numeric',
      span:6,
      fieldName: 'taxRate',
      formItemStyle,
      componentProps: {
          valueType: 'int'
      }
  }
]
const columns = [
    {
        title:'纳税主体',
        dataIndex:'mainName'
    },
    {
        title:'纳税人识别号',
        dataIndex:'purchaseTaxNum'
    },
    {
        title:'购货单位名称',
        dataIndex:'purchaseName'
    },
    {
        title:['发票类型','发票代码','发票号码'],
        dataIndex:['invoiceType','invoiceCode','invoiceNum'],
        render:(text,record)=>{
            let invoiceType=''
            if(record.invoiceType==='s'){
                invoiceType = '专票'
            }
            if(record.invoiceType==='c'){
                invoiceType = '普票'
            }
            return <div>
                     <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#000'}}>{invoiceType}</p>
                     <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#ccc'}}>{record.invoiceCode}</p>
                     <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#ccc'}}>{record.invoiceNum}</p>
                    </div>;
        }
    },
    {
        title:'货物名称',
        dataIndex:'commodityName'
    },
    {
        title:'开票日期',
        dataIndex:'billingDate',
        className:'text-center',
        width:'75px'
    },
    {
        title:['价税合计','金额','税率','税额'],
        dataIndex:['totalAmount','amount','taxRate','taxAmount'],
        render:(text,record)=><div className='table-money'>
                 <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#000'}}>{fMoney(record.totalAmount)}</p>
                 <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#ccc'}}>{fMoney(record.amount)}</p>
                 <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#ccc'}}>{record.taxRate? `${record.taxRate}%`: record.taxRate}</p>
                 <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#ccc'}}>{fMoney(record.taxAmount)}</p>
               </div>

    }
];

class NeedNotMatchInvoices extends Component{
    state={
        visible:false,
        tableKey:Date.now(),
        searchFieldsValues:{

        },
        selectedRowKeys:[],

        searchTableLoading:false,

        /**
         *修改状态和时间
         * */
        dataStatus:'',
        submitDate:'',
        totalSource:undefined,
        advancedFilterShow:false
    }
    toggleModalVisible=visible=>{
        this.setState({
            visible
        })
    }
    refreshTable = ()=>{
        this.setState({
            tableKey:Date.now()
        })
    }
    toggleSearchTableLoading = b =>{
        this.setState({
            searchTableLoading:b
        })
    }
    backOutData = () =>{
        const modalRef = Modal.confirm({
            title: '友情提醒',
            content: '是否要撤销选中的数据？',
            okText: '确定',
            cancelText: '取消',
            onOk:()=>{
                modalRef && modalRef.destroy();
                this.toggleSearchTableLoading(true)
                request.put('/output/invoice/marry/unwanted/revoke',this.state.selectedRowKeys).then(({data})=>{
                    this.toggleSearchTableLoading(false)
                    if(data.code===200){
                        message.success('撤销成功！');
                        this.refreshTable();
                    }else{
                        message.error(`撤销失败:${data.msg}`)
                    }
                }).catch(err=>{
                    this.toggleSearchTableLoading(false)
                })
            },
            onCancel() {
                modalRef.destroy()
            },
        });

    }
    componentDidMount(){
        const {search} = this.props.location;
        if(!!search){
            this.refreshTable()
        }
    }
    fetchResultStatus = ()=>{
        request.get('/output/invoice/collection/listMain',{
            params:this.state.searchFieldsValues
        })
            .then(({data})=>{
                if(data.code===200){
                    this.setState({
                        dataStatus:data.data.status,
                        submitDate:data.data.lastModifiedDate
                    })
                }else{
                    message.error(`列表主信息查询失败:${data.msg}`)
                }
            })
    }
    render(){
        const {visible,tableKey,selectedRowKeys,searchTableLoading,submitDate,dataStatus,totalSource} = this.state;
        const {search} = this.props.location;
        let disabled = !!search;
        return(
            <SearchTable
                style={{
                    marginTop:-16
                }}
                doNotFetchDidMount={true}
                spinning={searchTableLoading}
                searchOption={{
                    fields:searchFields(disabled),
                    getFieldsValues:values=>{
                        this.setState({
                            searchFieldsValues:values
                        })
                    },
                    cardProps:{
                        style:{
                            borderTop:0
                        },
                        className:''
                    }
                }}
                advancedOptions={{
                  fields:advancedFields,
                  cardStyle:{top:"72px"}
                }}
                tableOption={{
                    key:tableKey,
                    pageSize:10,
                    columns:columns,
                    onRowSelect:(selectedRowKeys)=>{
                        this.setState({
                            selectedRowKeys
                        })
                    },
                    onSuccess:(params,data)=>{
                        this.setState({
                            searchFieldsValues:params,
                            hasData:data.length !== 0
                        },()=>{
                            this.fetchResultStatus()
                        })
                    },
                    url:'/output/invoice/marry/unwanted/list',
                    extra:<div>
                        {
                            dataStatus && <div style={{marginRight:30,display:'inline-block'}}>
                                <span style={{marginRight:20}}>状态：<label style={{color:'#f5222d'}}>{
                                    transformDataStatus(dataStatus)
                                }</label></span>
                                {
                                    submitDate && <span>提交时间：{submitDate}</span>
                                }
                            </div>
                        }
                        <Button size="small" style={{marginRight:5}} onClick={()=>this.toggleModalVisible(true)}><Icon type="plus" />新增</Button>
                        <Button size="small" onClick={this.backOutData} disabled={selectedRowKeys.length === 0}><Icon type="rollback" />撤销</Button>
                        <TableTotal totalSource={totalSource} />

                    </div>,
                    onTotalSource: (totalSource) => {
                        this.setState({
                            totalSource
                        })
                    },
                    scroll:{
                        x:'100%'
                    },
                }}
            >
                <ManualMatchRoomModal title="新增信息" refreshTable={this.refreshTable} visible={visible} toggleModalVisible={this.toggleModalVisible} />
            </SearchTable>
        )
    }
}
export default withRouter(NeedNotMatchInvoices)
